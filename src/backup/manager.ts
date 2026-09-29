import fs from 'fs';
import path from 'path';
import { FogBugzApi } from '../api';

/**
 * State tracking for backup operations
 */
export interface BackupState {
  lastRunTimestamp: string;
  totalCasesProcessed: number;
  lastCaseIdProcessed?: number;
  totalWikisProcessed?: number;
}

/**
 * Result of a case download operation
 */
export interface CaseDownloadResult {
  caseId: number;
  status: 'downloaded' | 'skipped' | 'error';
  message: string;
  attachmentCount?: number;
}

export interface WikiDownloadResult {
  wikiId: number;
  status: 'downloaded' | 'skipped' | 'error';
  message: string;
  articleCount?: number;
  attachmentCount?: number;
}

/**
 * Centralized backup management logic for FogBugz cases
 */
export class BackupManager {
  private api: FogBugzApi;
  private backupDir: string;
  private stateFilePath: string;

  constructor(api: FogBugzApi, backupDir: string) {
    this.api = api;
    this.backupDir = backupDir;
    this.stateFilePath = path.join(backupDir, 'backup-state.json');
  }

  /**
   * Initialize the backup directory with safety defaults
   */
  async initialize(): Promise<void> {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    // Create .gitignore to prevent accidental commits
    const gitignorePath = path.join(this.backupDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, '*\n', 'utf-8');
    }

    // Initialize state file if it doesn't exist
    if (!fs.existsSync(this.stateFilePath)) {
      const initialState: BackupState = {
        lastRunTimestamp: new Date().toISOString(),
        totalCasesProcessed: 0,
        totalWikisProcessed: 0,
      };
      fs.writeFileSync(this.stateFilePath, JSON.stringify(initialState, null, 2), 'utf-8');
    }
  }

  /**
   * Read the current backup state
   */
  readState(): BackupState | null {
    if (!fs.existsSync(this.stateFilePath)) {
      return null;
    }
    const content = fs.readFileSync(this.stateFilePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Update the backup state
   */
  updateState(updates: Partial<BackupState>): void {
    const currentState = this.readState() || {
      lastRunTimestamp: new Date().toISOString(),
      totalCasesProcessed: 0,
      totalWikisProcessed: 0,
    };

    const newState: BackupState = {
      ...currentState,
      ...updates,
      lastRunTimestamp: new Date().toISOString()
    };

    fs.writeFileSync(this.stateFilePath, JSON.stringify(newState, null, 2), 'utf-8');
  }

  /**
   * Download a single case with all its data
   */
  async downloadCase(caseId: number): Promise<CaseDownloadResult> {
    try {
      // Search for the specific case with all required columns
      const cases = await this.api.searchCases({
        q: caseId.toString(),
        cols: ['ixBug', 'sTitle', 'sStatus', 'sPriority', 'sProject', 'sArea', 'sFixFor', 'dtLastUpdated', 'events'],
        max: 1
      });

      if (!cases || cases.length === 0) {
        return {
          caseId,
          status: 'error',
          message: `Case ${caseId} not found`
        };
      }

      const caseData = cases[0];
      const caseFolderPath = path.join(this.backupDir, `case-${caseId}`);
      const metadataPath = path.join(caseFolderPath, 'metadata.json');

      // Check if case already exists and hasn't been updated
      if (fs.existsSync(metadataPath)) {
        const existingMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        if (existingMetadata.dtLastUpdated === caseData.dtLastUpdated) {
          return {
            caseId,
            status: 'skipped',
            message: `Case ${caseId} unchanged since last backup`
          };
        }
      }

      // Create case folder
      if (!fs.existsSync(caseFolderPath)) {
        fs.mkdirSync(caseFolderPath, { recursive: true });
      }

      // Save case metadata
      fs.writeFileSync(metadataPath, JSON.stringify(caseData, null, 2), 'utf-8');

      // Download attachments from events
      let attachmentCount = 0;
      if (caseData.events && Array.isArray(caseData.events)) {
        for (const event of caseData.events) {
          if (event.rgAttachments && Array.isArray(event.rgAttachments)) {
            for (const attachment of event.rgAttachments) {
              try {
                attachmentCount++;
                const filename = this.sanitizeFilename(
                  `${event.ixBugEvent}_${attachment.sFileName || 'attachment'}`
                );
                const attachmentPath = path.join(caseFolderPath, filename);

                // Construct authenticated download URL
                const downloadUrl = this.buildAttachmentUrl(attachment.sURL);
                await this.api.downloadFile(downloadUrl, attachmentPath);
              } catch (error) {
                console.error(`Error downloading attachment for case ${caseId}:`, error);
              }
            }
          }
        }
      }

      return {
        caseId,
        status: 'downloaded',
        message: `Successfully backed up case ${caseId}`,
        attachmentCount
      };

    } catch (error) {
      return {
        caseId,
        status: 'error',
        message: `Error backing up case ${caseId}: ${error}`
      };
    }
  }

  /** Download all currently visible articles in a wiki. */
  async downloadWiki(wikiId: number): Promise<WikiDownloadResult> {
    try {
      const articles = await this.api.listArticles(wikiId);
      let downloadedArticles = 0;
      let skippedArticles = 0;
      let attachmentCount = 0;

      for (const articleSummary of articles) {
        const article = await this.api.viewArticle(articleSummary.ixWikiPage);
        const articleFolderPath = path.join(
          this.backupDir,
          'wikis',
          `wiki-${wikiId}`,
          `article-${article.ixWikiPage}`
        );
        const metadataPath = path.join(articleFolderPath, 'metadata.json');

        if (fs.existsSync(metadataPath)) {
          const existingMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          if (existingMetadata.nRevision !== undefined &&
              article.nRevision !== undefined &&
              existingMetadata.nRevision === article.nRevision) {
            skippedArticles++;
            continue;
          }
        }

        fs.mkdirSync(articleFolderPath, { recursive: true });
        fs.writeFileSync(metadataPath, JSON.stringify(article, null, 2), 'utf-8');

        const attachments = this.getWikiAttachments(article);
        for (const attachment of attachments) {
            if (!attachment.sURL) continue;
            try {
              const filename = this.sanitizeFilename(attachment.sFileName || 'attachment');
              await this.api.downloadFile(
                this.buildAttachmentUrl(attachment.sURL),
                path.join(articleFolderPath, filename)
              );
              attachmentCount++;
            } catch (error) {
              console.error(`Error downloading wiki attachment for article ${article.ixWikiPage}:`, error);
            }
          }

        downloadedArticles++;
      }

      const status = downloadedArticles > 0 || skippedArticles === 0 ? 'downloaded' : 'skipped';
      return {
        wikiId,
        status,
        message: `Wiki ${wikiId}: ${downloadedArticles} article(s) downloaded, ${skippedArticles} skipped`,
        articleCount: downloadedArticles + skippedArticles,
        attachmentCount,
      };
    } catch (error: any) {
      return {
        wikiId,
        status: 'error',
        message: `Error backing up wiki ${wikiId}: ${error.message}`,
      };
    }
  }

  /** Download all visible wikis. */
  async downloadWikis(): Promise<WikiDownloadResult[]> {
    const wikis = await this.api.listWikis();
    const results: WikiDownloadResult[] = [];
    for (const wiki of wikis) {
      results.push(await this.downloadWiki(wiki.ixWiki));
    }
    return results;
  }

  /**
   * Build an authenticated attachment download URL
   */
  private buildAttachmentUrl(sURL: string): string {
    return this.api.getAuthenticatedFileUrl(sURL);
  }

  private getWikiAttachments(article: any): Array<{ sFileName?: string; sURL?: string }> {
    const attachments = Array.isArray(article.attachments) ? article.attachments : [];
    const knownUrls = new Set(attachments.map((attachment: any) => attachment.sURL).filter(Boolean));
    const body = typeof article.sBody === 'string' ? article.sBody : '';
    const embeddedUrls = body.match(/(?:src|href)\s*=\s*["']([^"']*pgWikiAttachment[^"']*)["']/gi) || [];

    for (const match of embeddedUrls) {
      const urlMatch = match.match(/["']([^"']+)["']$/);
      const url = urlMatch?.[1];
      if (url && !knownUrls.has(url)) {
        knownUrls.add(url);
        attachments.push({
          sURL: url,
          sFileName: decodeURIComponent(url.split('fileName=')[1]?.split('&')[0] || 'attachment'),
        });
      }
    }

    return attachments;
  }

  /**
   * Sanitize a filename for safe filesystem storage
   */
  private sanitizeFilename(filename: string): string {
    // Remove or replace unsafe characters
    return filename
      .replace(/[<>:"|?*]/g, '_')
      .replace(/\.\./g, '_')
      .replace(/\\/g, '_')
      .replace(/\//g, '_');
  }
}
