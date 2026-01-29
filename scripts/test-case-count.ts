#!/usr/bin/env node
/**
 * Test script to retrieve total case count from FogBugz
 * Usage: npm run explore -- --script test-case-count
 *        Or: ts-node scripts/test-case-count.ts [--query "filter"]
 */

import dotenv from 'dotenv';
import { FogBugzApi } from '../src/api';

dotenv.config();

const FOGBUGZ_URL = process.env.FOGBUGZ_URL;
const FOGBUGZ_API_KEY = process.env.FOGBUGZ_API_KEY;

if (!FOGBUGZ_URL || !FOGBUGZ_API_KEY) {
  console.error('Error: FOGBUGZ_URL and FOGBUGZ_API_KEY must be set in environment variables or .env file');
  process.exit(1);
}

async function testCaseCount(): Promise<void> {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let query = '';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--query' || args[i] === '-q') {
      query = args[++i];
    }
  }

  console.log('='.repeat(60));
  console.log('FogBugz Case Count Test');
  console.log('='.repeat(60));
  console.log(`FogBugz URL: ${FOGBUGZ_URL}`);
  if (query) {
    console.log(`Query: ${query}`);
  }
  console.log('='.repeat(60));
  console.log('');

  try {
    const api = new FogBugzApi({
      baseUrl: FOGBUGZ_URL!,
      apiKey: FOGBUGZ_API_KEY!
    });

    console.log('Fetching case counts...');
    console.log('');

    // Test 1: Get all cases (no filter)
    console.log('[Test 1] All cases (no filter):');
    const allCases = await api.searchCases({
      q: 'OrderBy:ixBug',
      cols: ['ixBug'],
      max: 100000
    });
    console.log(`  Total: ${allCases.length}`);
    if (allCases.length > 0) {
      console.log(`  First Case ID: ${allCases[0].ixBug}`);
      console.log(`  Last Case ID: ${allCases[allCases.length - 1].ixBug}`);
    }
    console.log('');

    // Test 2: Get cases with custom query if provided
    let filteredCases: typeof allCases | null = null;
    if (query) {
      console.log(`[Test 2] Cases with query "${query}":`);
      filteredCases = await api.searchCases({
        q: `${query} OrderBy:ixBug`,
        cols: ['ixBug'],
        max: 100000
      });
      console.log(`  Total: ${filteredCases.length}`);
      if (filteredCases.length > 0) {
        console.log(`  First Case ID: ${filteredCases[0].ixBug}`);
        console.log(`  Last Case ID: ${filteredCases[filteredCases.length - 1].ixBug}`);
      }
      console.log('');
    }

    // Test 3: Sample batch (first 500)
    console.log('[Test 3] Sample batch (first 500 cases):');
    const batchCases = await api.searchCases({
      q: 'OrderBy:ixBug',
      cols: ['ixBug'],
      max: 500
    });
    console.log(`  Retrieved: ${batchCases.length}`);
    if (batchCases.length > 0) {
      console.log(`  First Case ID: ${batchCases[0].ixBug}`);
      console.log(`  Last Case ID: ${batchCases[batchCases.length - 1].ixBug}`);
      
      // Show ID gaps if any
      let gaps = 0;
      for (let i = 1; i < batchCases.length; i++) {
        if (batchCases[i].ixBug !== batchCases[i - 1].ixBug + 1) {
          gaps++;
        }
      }
      if (gaps > 0) {
        console.log(`  Note: Found ${gaps} gaps in case numbering (cases may have been deleted)`);
      }
    }
    console.log('');

    // Test 4: Check if sort is working
    console.log('[Test 4] Verifying sort order:');
    let isSorted = true;
    for (let i = 1; i < Math.min(allCases.length, 100); i++) {
      if (allCases[i].ixBug < allCases[i - 1].ixBug) {
        isSorted = false;
        break;
      }
    }
    console.log(`  Cases are sorted ascending by ID: ${isSorted ? 'YES' : 'NO'}`);
    console.log('');

    console.log('='.repeat(60));
    console.log('Summary:');
    console.log(`  Total available cases: ${allCases.length}`);
    if (query) {
      console.log(`  Cases matching filter: ${filteredCases?.length || 0}`);
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the test
testCaseCount().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
