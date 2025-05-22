import axios from 'axios';
import { FogBugzApi } from '../src/api';

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
});