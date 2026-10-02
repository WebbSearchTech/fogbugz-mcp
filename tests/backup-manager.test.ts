import fs from 'fs';
import os from 'os';
import path from 'path';
import { BackupManager } from '../src/backup/manager';

describe('BackupManager wiki backup', () => {
  let backupDir: string;

  beforeEach(() => {
    backupDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogbugz-backup-test-'));
  });

  afterEach(() => {
    fs.rmSync(backupDir, { recursive: true, force: true });
  });

  it('saves each article in its own folder with uniquely named attachments', async () => {
    // viewArticle's wikipage has no ixWikiPage, matching the real API
    const bodies: Record<number, string> = {
      34: '<p><img src="default.asp?pg=pgDownload&amp;pgType=pgWikiAttachment&amp;ixAttachment=7131&amp;sFileName=image.png"></p>' +
          '<p><img src="default.asp?pg=pgDownload&amp;pgType=pgWikiAttachment&amp;ixAttachment=11555&amp;sFileName=image.png"></p>',
      54: '<p><a href="default.asp?pg=pgDownload&amp;pgType=pgWikiAttachment&amp;ixAttachment=6515&amp;sFileName=2018-10-17+(1)%20x.png">x</a></p>',
    };
    const downloaded: string[] = [];
    const api: any = {
      listWikis: jest.fn().mockResolvedValue([{ ixWiki: 1 }]),
      listArticles: jest.fn().mockResolvedValue([{ ixWikiPage: 34 }, { ixWikiPage: 54 }]),
      viewArticle: jest.fn(async (ix: number) => ({ sHeadline: `A${ix}`, sBody: bodies[ix], nRevision: 1, tags: [] })),
      getAuthenticatedFileUrl: jest.fn((url: string) => url),
      downloadFile: jest.fn(async (_url: string, dest: string) => {
        downloaded.push(path.relative(backupDir, dest));
        fs.writeFileSync(dest, 'x');
      }),
    };

    const manager = new BackupManager(api, backupDir);
    const [result] = await manager.downloadWikis();

    expect(result).toMatchObject({ wikiId: 1, status: 'downloaded', articleCount: 2, attachmentCount: 3 });
    expect(downloaded.sort()).toEqual([
      path.join('wikis', 'wiki-1', 'article-34', '11555_image.png'),
      path.join('wikis', 'wiki-1', 'article-34', '7131_image.png'),
      path.join('wikis', 'wiki-1', 'article-54', '6515_2018-10-17 (1) x.png'),
    ]);
    const metadata = JSON.parse(
      fs.readFileSync(path.join(backupDir, 'wikis', 'wiki-1', 'article-34', 'metadata.json'), 'utf-8')
    );
    expect(metadata.ixWikiPage).toBe(34);

    // Unchanged revisions are skipped on the next run
    const [second] = await manager.downloadWikis();
    expect(second).toMatchObject({ status: 'skipped', articleCount: 2, attachmentCount: 0 });
  });
});
