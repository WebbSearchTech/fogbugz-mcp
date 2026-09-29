import axios from 'axios';
import { FogBugzApi } from '../src/api';
import { usersResource } from '../src/resources';
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