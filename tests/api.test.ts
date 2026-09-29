import axios from 'axios';
import { FogBugzApi } from '../src/api';
import { usersResource } from '../src/resources';
import { createWikiArticle, editWikiArticle, uploadWikiAttachment } from '../src/commands';
import { jest } from '@jest/globals';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('FogBugzApi', () => {
  const mockConfig = {
    baseUrl: 'https://test.fogbugz.com',
    apiKey: 'test-api-key'
  };
  
  let api: FogBugzApi;
  
  beforeEach(() => {
    api = new FogBugzApi(mockConfig);
    jest.clearAllMocks();
  });
  
  it('should initialize correctly', () => {
    expect(api).toBeInstanceOf(FogBugzApi);
  });
  
  it('should get current user', async () => {
    // Mock response
    mockAxios.post.mockResolvedValueOnce({
      data: {
        data: {
          person: {
            ixPerson: 1,
            sPerson: 'Test User',
            sEmail: 'test@example.com'
          }
        }
      }
    });
    
    const user = await api.getCurrentUser();
    
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://test.fogbugz.com/f/api/0/jsonapi',
      {
        cmd: 'viewPerson',
        token: 'test-api-key'
      },
      expect.any(Object)
    );
    
    expect(user).toEqual({
      ixPerson: 1,
      sPerson: 'Test User',
      sEmail: 'test@example.com'
    });
  });
  
  it('should create a case', async () => {
    // Mock response
    mockAxios.post.mockResolvedValueOnce({
      data: {
        data: {
          case: {
            ixBug: 123,
            sTitle: 'Test Case',
            sPriority: 'Normal',
            sStatus: 'Active'
          }
        }
      }
    });
    
    const caseParams = {
      sTitle: 'Test Case',
      sEvent: 'Test description'
    };
    
    const result = await api.createCase(caseParams);
    
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://test.fogbugz.com/f/api/0/jsonapi',
      {
        cmd: 'new',
        token: 'test-api-key',
        ...caseParams
      },
      expect.any(Object)
    );
    
    expect(result).toEqual({
      ixBug: 123,
      sTitle: 'Test Case',
      sPriority: 'Normal',
      sStatus: 'Active'
    });
  });
  
  it('should handle API errors', async () => {
    // Mock error response
    mockAxios.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { errors: [{ message: 'Invalid token' }] }
      }
    });
    
    await expect(api.getCurrentUser()).rejects.toThrow('FogBugz API Error');
  });

  it('should list wikis', async () => {
    mockAxios.post.mockResolvedValueOnce({
      data: { data: { wikis: [{ ixWiki: 1, sWiki: 'Documentation' }] } }
    });

    await expect(api.listWikis()).resolves.toEqual([{ ixWiki: 1, sWiki: 'Documentation' }]);
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://test.fogbugz.com/f/api/0/jsonapi',
      { cmd: 'listWikis', token: 'test-api-key' },
      expect.any(Object)
    );
  });

  it('should list and view wiki articles without changing HTML', async () => {
    mockAxios.post
      .mockResolvedValueOnce({
        data: { data: { articles: [{ ixWikiPage: 5, sHeadline: 'Guide' }] } }
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            wikipage: {
              ixWikiPage: 5,
              sHeadline: 'Guide',
              sBody: '<p><img src="default.asp?pg=pgWikiAttachment"></p>',
              nRevision: 2,
            }
          }
        }
      });

    await expect(api.listArticles(1)).resolves.toEqual([{ ixWikiPage: 5, sHeadline: 'Guide' }]);
    await expect(api.viewArticle(5, 2)).resolves.toEqual({
      ixWikiPage: 5,
      sHeadline: 'Guide',
      sBody: '<p><img src="default.asp?pg=pgWikiAttachment"></p>',
      nRevision: 2,
    });
    expect(mockAxios.post).toHaveBeenNthCalledWith(
      2,
      'https://test.fogbugz.com/f/api/0/jsonapi',
      { cmd: 'viewArticle', token: 'test-api-key', ixWikiPage: 5, nRevision: 2 },
      expect.any(Object)
    );
  });

  it('should build authenticated URLs for wiki attachments', () => {
    expect(api.getAuthenticatedFileUrl('default.asp?pg=download&x=1&amp;sTicket=old')).toBe(
      'https://test.fogbugz.com/default.asp?pg=download&x=1&token=test-api-key'
    );
  });

  it('should create wiki articles with FogBugz HTML unchanged', async () => {
    const params = {
      ixWiki: 4,
      sHeadline: 'CPC notes',
      sBody: '<p><a class="vb" href="default.asp?W63">CPC Thesauri</a></p>',
      sTags: 'cpc,thesaurus',
    };
    mockAxios.post.mockResolvedValueOnce({
      data: { data: { article: { ixWikiPage: 145, sHeadline: params.sHeadline } } }
    });

    await expect(api.createArticle(params)).resolves.toEqual({ ixWikiPage: 145, sHeadline: 'CPC notes' });
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://test.fogbugz.com/f/api/0/jsonapi',
      { cmd: 'newArticle', token: 'test-api-key', ...params },
      expect.any(Object)
    );
  });

  it('should normalize the live newArticle wikipage response', async () => {
    mockAxios.post.mockResolvedValueOnce({
      data: { data: { wikipage: { ixWikiPage: 146 } } }
    });

    await expect(api.createArticle({ ixWiki: 4, sHeadline: 'Live shape', sBody: '<p>Text</p>' })).resolves.toEqual({
      ixWikiPage: 146,
      sHeadline: 'Live shape',
    });
  });

  it('should edit only the specified wiki article fields', async () => {
    const params = { ixWikiPage: 145, sBody: '<p>Updated HTML</p>', sComment: 'Clarified steps' };
    mockAxios.post.mockResolvedValueOnce({
      data: { data: { article: { ixWikiPage: 145 } } }
    });

    await expect(api.updateArticle(params)).resolves.toEqual({ ixWikiPage: 145 });
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://test.fogbugz.com/f/api/0/jsonapi',
      { cmd: 'editArticle', token: 'test-api-key', ...params },
      expect.any(Object)
    );
  });

  it('should accept the live empty wikipage edit response', async () => {
    mockAxios.post.mockResolvedValueOnce({
      data: { data: { wikipage: '' } }
    });

    await expect(api.updateArticle({ ixWikiPage: 145, sBody: '<p>Changed</p>' })).resolves.toEqual({ ixWikiPage: 145 });
  });

  it('should upload a wiki file as multipart form data', async () => {
    const file = require('path').join(__dirname, '../README.md');
    mockAxios.post.mockResolvedValueOnce({
      data: { data: { sFileName: 'guide.png', sURL: 'default.asp?pg=pgDownload&amp;pgType=pgWikiAttachment' } }
    });

    await expect(api.uploadWikiFile(4, file)).resolves.toEqual({
      sFileName: 'guide.png',
      sURL: 'default.asp?pg=pgDownload&amp;pgType=pgWikiAttachment',
    });
    const [, form, config] = mockAxios.post.mock.calls[0];
    expect(form).toBeInstanceOf(require('form-data'));
    expect((form as any)._streams.join('')).toContain('name="File1"');
    expect((form as any)._streams.join('')).toContain('wikiFileUpload');
    expect((form as any)._streams.join('')).toContain('"ixWiki":4');
    expect((config as any).headers['content-type']).toContain('multipart/form-data');
    for (const stream of (form as any)._streams) {
      if (stream && typeof stream.destroy === 'function') stream.destroy();
    }
  });

  it('should normalize the live wiki upload response into an attachment URL', async () => {
    const file = require('path').join(__dirname, '../README.md');
    mockAxios.post.mockResolvedValueOnce({
      data: { data: { upfiles: { upfile: { ixAttachment: 13942 } } } }
    });

    await expect(api.uploadWikiFile(3, file)).resolves.toEqual({
      sFileName: 'README.md',
      sURL: 'default.asp?pg=pgDownload&pgType=pgWikiAttachment&ixAttachment=13942&sFileName=README.md',
    });
    const [, form] = mockAxios.post.mock.calls[0];
    for (const stream of (form as any)._streams) {
      if (stream && typeof stream.destroy === 'function') stream.destroy();
    }
  });
});

describe('usersResource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize and fetch users', async () => {
    // Mock the API response
    const mockUsers = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    const apiMock = jest.spyOn(usersResource, 'initialize').mockImplementation(async () => {
      usersResource.fetch = async () => mockUsers;
    });

    // Check if initialize exists and call it
    if (usersResource.initialize) {
      await usersResource.initialize();
    }

    // Fetch the users
    const users = await usersResource.fetch();

    // Assertions
    expect(apiMock).toHaveBeenCalled();
    expect(users).toEqual(mockUsers);
  });
});

describe('wiki article MCP handlers', () => {
  it('creates an article with HTML and normalized tags', async () => {
    const createArticle = jest.fn().mockResolvedValue({ ixWikiPage: 77, sHeadline: 'Guide' });
    const result = JSON.parse(await createWikiArticle(
      { createArticle } as any,
      { wikiId: 4, headline: 'Guide', body: '<p>line one<br>line two</p>', tags: ['cpc', 'help'] }
    ));

    expect(createArticle).toHaveBeenCalledWith({
      ixWiki: 4,
      sHeadline: 'Guide',
      sBody: '<p>line one<br>line two</p>',
      sTags: 'cpc,help',
    });
    expect(result.articleId).toBe(77);
  });

  it('skips a body update when only LF/CRLF endings differ', async () => {
    const updateArticle = jest.fn();
    const viewArticle = jest.fn().mockResolvedValue({ sBody: '<p>first\r\nsecond</p>' });
    const result = JSON.parse(await editWikiArticle(
      { viewArticle, updateArticle } as any,
      { articleId: 77, body: '<p>first\nsecond</p>' }
    ));

    expect(result.unchanged).toBe(true);
    expect(result.message).toContain('only by line endings');
    expect(updateArticle).not.toHaveBeenCalled();
  });

  it('omits a line-ending-only body change when another field changes', async () => {
    const updateArticle = jest.fn().mockResolvedValue({ ixWikiPage: 77, sHeadline: 'Renamed' });
    const viewArticle = jest.fn().mockResolvedValue({ sHeadline: 'Existing', sBody: '<p>first\rsecond</p>' });

    await editWikiArticle(
      { viewArticle, updateArticle } as any,
      { articleId: 77, headline: 'Renamed', body: '<p>first\nsecond</p>' }
    );

    expect(updateArticle).toHaveBeenCalledWith({ ixWikiPage: 77, sHeadline: 'Renamed' });
  });

  it('requires a content field for article edits', async () => {
    const updateArticle = jest.fn();
    const result = JSON.parse(await editWikiArticle(
      { updateArticle } as any,
      { articleId: 77, revisionComment: 'No actual content change' }
    ));

    expect(result.error).toContain('at least one field');
    expect(updateArticle).not.toHaveBeenCalled();
  });

  it('includes the existing headline when editing without one', async () => {
    const updateArticle = jest.fn().mockResolvedValue({ ixWikiPage: 77, sHeadline: 'Current title' });
    const viewArticle = jest.fn().mockResolvedValue({
      sHeadline: 'Current title',
      sBody: '<p>Old text</p>',
    });

    const result = JSON.parse(await editWikiArticle(
      { viewArticle, updateArticle } as any,
      { articleId: 77, body: '<p>New text</p>' }
    ));

    expect(updateArticle).toHaveBeenCalledWith({
      ixWikiPage: 77,
      sBody: '<p>New text</p>',
      sHeadline: 'Current title',
    });
    expect(result.error).toBeUndefined();
  });

  it('returns escaped relative image and link snippets after upload', async () => {
    const uploadWikiFile = jest.fn().mockResolvedValue({
      sFileName: 'CPC & charts.png',
      sURL: 'default.asp?pg=download&amp;fileName=CPC.png',
    });
    const result = JSON.parse(await uploadWikiAttachment(
      { uploadWikiFile } as any,
      { wikiId: 4, filePath: 'CPC.png' }
    ));

    expect(result.sURL).toContain('default.asp?pg=download');
    expect(result.htmlImage).toBe('<img src="default.asp?pg=download&amp;fileName=CPC.png" alt="CPC &amp; charts.png">');
    expect(result.htmlLink).toBe('<a href="default.asp?pg=download&amp;fileName=CPC.png">CPC &amp; charts.png</a>');
    expect(result.htmlImage).not.toContain('token=');
  });
});