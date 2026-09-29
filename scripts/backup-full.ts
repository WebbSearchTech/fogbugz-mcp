#!/usr/bin/env node
import dotenv from 'dotenv';
import { FogBugzApi } from '../src/api';
import { BackupManager } from '../src/backup/manager';
import path from 'path';

// Load environment variables
dotenv.config();

const FOGBUGZ_URL = process.env.FOGBUGZ_URL;
const FOGBUGZ_API_KEY = process.env.FOGBUGZ_API_KEY;

if (!FOGBUGZ_URL || !FOGBUGZ_API_KEY) {
  console.error('Error: FOGBUGZ_URL and FOGBUGZ_API_KEY must be set in environment variables or .env file');
  process.exit(1);
}

interface BackupOptions {
  outputDir: string;
  maxCases?: number;
  query?: string;
  openedAfter?: string;
  editedBefore?: string;
  countOnly?: boolean;
}

async function runBackup(options: BackupOptions): Promise<void> {
  const { outputDir, maxCases = 50, query = '', openedAfter, editedBefore, countOnly } = options;

  console.log('='.repeat(60));
  if (countOnly) {
    console.log('FogBugz Case Count Utility');
  } else {
    console.log('FogBugz Full Backup Utility');
  }
  console.log('='.repeat(60));
  if (!countOnly) {
    console.log(`Output Directory: ${outputDir}`);
  }
  if (query) console.log(`Query Filter: ${query}`);
  console.log('='.repeat(60));
  console.log('');

  // Ensure environment variables are set
  if (!FOGBUGZ_URL || !FOGBUGZ_API_KEY) {
    throw new Error('FOGBUGZ_URL and FOGBUGZ_API_KEY must be set');
  }

  // Initialize API client
  const api = new FogBugzApi({
    baseUrl: FOGBUGZ_URL,
    apiKey: FOGBUGZ_API_KEY
  });

  // Initialize backup manager
  const backupManager = new BackupManager(api, outputDir);
  await backupManager.initialize();

  // Read current state
  const state = backupManager.readState();
  console.log('Current Backup State:');
  console.log(`  Last Run: ${state?.lastRunTimestamp || 'Never'}`);
  console.log(`  Total Cases Processed: ${state?.totalCasesProcessed || 0}`);
    if (openedAfter) {
      console.log(`  Resuming from date: ${openedAfter}`);
    }
  if (editedBefore) {
    console.log(`  Backing up changes before: ${editedBefore}`);
  }
  console.log('');

  // Build search query
  let searchQuery = query;
  
  // Add date-based filter if resuming from a specific opened date
  if (openedAfter) {
    searchQuery = `${searchQuery} opened:"${openedAfter}.."`.trim();
    console.log(`  Date filter applied: opened:"${openedAfter}.."`);
  }

  // Add date-based filter for edited-before (backfill changes in reverse chronological order)
  if (editedBefore) {
    searchQuery = `${searchQuery} edited:"..${editedBefore}"`.trim();
  }
  
  // Sort by case ID ASCENDING (oldest/lowest ID first) for consistent pagination
  // Use ixBug instead of opened because it's more stable (unique, never changes)
  if (!searchQuery.includes('OrderBy:')) {
    searchQuery = `${searchQuery} OrderBy:ixBug`.trim();
  }

  console.log(`Fetching cases... (Query: "${searchQuery || 'all'}")`);
  
  // Fetch cases to backup (FogBugz returns results in default order)
  // Include dtOpened to enable date-based pagination for subsequent batches
  const cases = (await api.searchCases({
    q: searchQuery,
    cols: ['ixBug', 'sTitle', 'dtLastUpdated', 'dtOpened'],
    max: maxCases
  })) || [];

  // If countOnly mode, just report and exit
  if (countOnly) {
    console.log(`Total cases matching query: ${cases.length}`);
    if (query) {
      console.log(`Query: ${query}`);
    }
    console.log('');
    return;
  }

  if (!cases || cases.length === 0) {
    console.log('No cases found to backup; continuing with wikis.');
  }

  console.log(`Found ${cases.length} cases to process.`);
  console.log('');

  // Process each case
  let processed = 0;
  let downloaded = 0;
  let skipped = 0;
  let errors = 0;
  let lastCaseId = 0;
  const firstCaseId = cases[0]?.ixBug ?? 0;

  for (const caseInfo of cases) {
    const caseId = caseInfo.ixBug;
    lastCaseId = caseId;
    
    process.stdout.write(`[${processed + 1}/${cases.length}] Processing Case ${caseId}... `);
    
    const result = await backupManager.downloadCase(caseId);
    
    if (result.status === 'downloaded') {
      downloaded++;
      console.log(`✓ Downloaded (${result.attachmentCount || 0} attachments)`);
    } else if (result.status === 'skipped') {
      skipped++;
      console.log('⊘ Skipped (unchanged)');
    } else {
      errors++;
      console.log(`✗ Error: ${result.message}`);
    }
    
    processed++;
  }

  console.log('');
  console.log('Backing up wikis...');
  const wikiResults = await backupManager.downloadWikis();
  const wikiDownloaded = wikiResults.filter(result => result.status === 'downloaded').length;
  const wikiSkipped = wikiResults.filter(result => result.status === 'skipped').length;
  const wikiErrors = wikiResults.filter(result => result.status === 'error').length;
  const wikiArticles = wikiResults.reduce((total, result) => total + (result.articleCount || 0), 0);
  const wikiAttachments = wikiResults.reduce((total, result) => total + (result.attachmentCount || 0), 0);
  console.log(`Wikis: ${wikiDownloaded} downloaded, ${wikiSkipped} skipped, ${wikiErrors} errors`);
  console.log(`Wiki articles: ${wikiArticles}; attachments: ${wikiAttachments}`);

  // Update state
  backupManager.updateState({
    totalCasesProcessed: (state?.totalCasesProcessed || 0) + processed,
    lastCaseIdProcessed: lastCaseId,
    totalWikisProcessed: (state?.totalWikisProcessed || 0) + wikiResults.length
  });

  console.log('');
  console.log('='.repeat(60));
  console.log('Backup Complete');
  console.log('='.repeat(60));
  if (firstCaseId && lastCaseId) {
    console.log(`Case Range: ${firstCaseId} -> ${lastCaseId}`);
  }
  console.log(`Total Processed: ${processed}`);
  console.log(`  Downloaded: ${downloaded}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  
  if (cases.length === maxCases) {
    console.log('');
    console.log('⚠️  Maximum case limit reached.');
    const lastCase = cases[cases.length - 1];
    if (lastCase.dtOpened) {
      console.log(`[PAGINATION] Last case opened: ${lastCase.dtOpened}`);
      console.log(`[PAGINATION] Next batch: npm run backup -- --output "${outputDir}" --max ${maxCases} --opened-after "${lastCase.dtOpened}"`);
    }
    if (lastCase.dtLastUpdated) {
      console.log(`[PAGINATION] Last case edited: ${lastCase.dtLastUpdated}`);
      console.log(`[PAGINATION] Next batch (changes): npm run backup -- --output "${outputDir}" --max ${maxCases} --edited-before "${lastCase.dtLastUpdated}" --query "OrderBy:\"-Edited\""`);
    }
  }
  
  console.log('='.repeat(60));
}

// Parse command line arguments
function parseArgs(): BackupOptions {
  const args = process.argv.slice(2);
  const options: BackupOptions = {
    outputDir: ''
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--output' || arg === '-o') {
      options.outputDir = args[++i];
    } else if (arg === '--max' || arg === '-m') {
      options.maxCases = parseInt(args[++i], 10);
    } else if (arg === '--query' || arg === '-q') {
      options.query = args[++i];
    } else if (arg === '--opened-after' || arg === '-oa') {
      options.openedAfter = args[++i];
    } else if (arg === '--edited-before' || arg === '-eb') {
      options.editedBefore = args[++i];
    } else if (arg === '--count-only' || arg === '-c') {
      options.countOnly = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('FogBugz Full Backup Utility');
      console.log('');
      console.log('Usage: npm run backup -- --output <dir> [options]');
      console.log('  -o, --output <dir>     Output directory (REQUIRED for backup)');
      console.log('  -m, --max <num>        Maximum cases per run (default: 50)');
      console.log('  -q, --query <query>    FogBugz search query filter');
      console.log('  -oa, --opened-after <date>  Start from cases opened after this ISO 8601 date/time');
      console.log('  -eb, --edited-before <date> Backfill changes before this ISO 8601 date/time');
      console.log('  -c, --count-only       Only report total case count (no download)');
      console.log('  -h, --help             Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  npm run backup -- --count-only                                   # Get total count');
      console.log('  npm run backup -- --count-only --query "status:active"           # Count active cases');
      console.log('  npm run backup -- --output ./my-backup                           # Start backup');
      console.log('  npm run backup -- --output ./my-backup --max 100                 # Larger batch');
      console.log('  npm run backup -- --output ./my-backup --query "status:active" --max 25');
      process.exit(0);
    }
  }

  // Windows PowerShell can mangle/strip embedded double-quote characters when
  // marshaling argv to a child process (even calling node.exe directly, not
  // just through the npm.cmd/npx.cmd batch shims). FogBugz query values that
  // need literal quotes - e.g. edited:"2026-05-14T19:35:13Z.." - can arrive
  // with the quotes stripped, which breaks parsing on the embedded colons.
  // As a reliable workaround, allow the query to be passed via an
  // environment variable instead: env vars are passed to child processes
  // as raw strings with no argv escaping involved, so quotes always survive.
  if (process.env.FOGBUGZ_QUERY_OVERRIDE) {
    options.query = process.env.FOGBUGZ_QUERY_OVERRIDE;
  }

  return options;
}

// Main execution
(async () => {
  try {
    const options = parseArgs();
    
    if (!options.outputDir) {
      console.error('Usage:');
      console.error('  npm run backup -- --output <dir> [options]');
      console.error('  npm run backup -- --count-only [--query <query>]');
      console.error('');
      console.error('Options:');
      console.error('  -o, --output <dir>     Output directory (REQUIRED for backup)');
      console.error('  -m, --max <num>        Maximum cases per run (default: 50)');
      console.error('  -q, --query <query>    FogBugz search query filter');
      console.error('  -oa, --opened-after <date>  Start from cases opened after this ISO 8601 date/time');
      console.error('  -eb, --edited-before <date> Backfill changes before this ISO 8601 date/time');
      console.error('  -c, --count-only       Only report total case count (no download)');
      console.error('  -h, --help             Show this help message');
      console.error('');
      process.exit(1);
    }
    
    await runBackup(options);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
