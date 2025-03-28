import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const FOGBUGZ_API_KEY = process.env.FOGBUGZ_API_KEY || '';
const FOGBUGZ_BASE_URL = process.env.FOGBUGZ_URL || 'https://vyoma.fogbugz.com';
const FOGBUGZ_API_ENDPOINT = `${FOGBUGZ_BASE_URL}/f/api/0/jsonapi`;

if (!FOGBUGZ_API_KEY) {
  console.error('Error: FOGBUGZ_API_KEY not found in environment variables');
  process.exit(1);
}

interface FogBugzJsonPayload {
  cmd: string;
  token: string;
  nFileCount?: number;
  q?: string;
  cols?: string[] | string;
  max?: number;
  [key: string]: any;
}

// Helper function to make API requests to FogBugz
async function callFogBugzApi(cmd: string, params: Record<string, any> = {}, files: Record<string, string> = {}) {
  console.log(`\n🔍 Calling FogBugz API command: ${cmd}`);
  
  try {
    let response;
    
    // Convert string cols to array format as required by JSON API
    if (params.cols && typeof params.cols === 'string') {
      params.cols = params.cols.split(',');
    }
    
    // If we have files, use multipart/form-data with a json field
    if (Object.keys(files).length > 0) {
      const form = new FormData();
      
      // Create the JSON payload
      const jsonPayload: FogBugzJsonPayload = {
        cmd,
        token: FOGBUGZ_API_KEY,
        ...params
      };
      
      // Add file count to the JSON payload
      let fileCount = 0;
      Object.entries(files).forEach(([fieldName, filePath]) => {
        if (fs.existsSync(filePath)) {
          form.append(fieldName, fs.createReadStream(filePath));
          fileCount++;
        } else {
          console.warn(`⚠️ File not found: ${filePath}`);
        }
      });
      
      if (fileCount > 0) {
        jsonPayload.nFileCount = fileCount;
      }
      
      // Add the JSON payload as a string field named 'json'
      form.append('json', JSON.stringify(jsonPayload));
      
      response = await axios.post(FOGBUGZ_API_ENDPOINT, form, {
        headers: {
          ...form.getHeaders(),
        },
      });
    } else {
      // Regular JSON for standard requests
      const jsonPayload: FogBugzJsonPayload = {
        cmd,
        token: FOGBUGZ_API_KEY,
        ...params
      };
      
      response = await axios.post(FOGBUGZ_API_ENDPOINT, jsonPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    console.log('✅ Response Status:', response.status);
    console.log('📦 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error calling FogBugz API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

// List of API endpoints to test
const apiTests = [
  { name: 'Get Current User', fn: async () => await callFogBugzApi('viewPerson') },
  { name: 'List Projects', fn: async () => await callFogBugzApi('listProjects') },
  { name: 'List Areas', fn: async () => await callFogBugzApi('listAreas') },
  { name: 'List Milestones', fn: async () => await callFogBugzApi('listFixFors') },
  { name: 'List People', fn: async () => await callFogBugzApi('listPeople') },
  { name: 'List Priorities', fn: async () => await callFogBugzApi('listPriorities') },
  { 
    name: 'Search Cases (Recent)', 
    fn: async () => await callFogBugzApi('search', { 
      q: 'status:active', 
      cols: ['ixBug', 'sTitle', 'sStatus', 'sPriority', 'sProject', 'sArea', 'sFixFor', 'sPersonAssignedTo'], 
      max: 5 
    }) 
  },
  {
    name: 'Create Test Case',
    fn: async () => await callFogBugzApi('new', {
      sTitle: 'API Test Case - ' + new Date().toISOString(),
      sEvent: 'This is a test case created by the FogBugz MCP API explorer.',
      sProject: 'Inbox',
      sArea: 'Not Spam',
      ixPriority: 3
    })
  }
];

// Main function to run API tests
async function runApiTests() {
  console.log('🔶 FogBugz API Explorer 🔶');
  console.log(`Base URL: ${FOGBUGZ_BASE_URL}`);
  
  // Get command line args if any
  const args = process.argv.slice(2);
  const testIndex = args.length > 0 ? parseInt(args[0], 10) : -1;
  
  if (isNaN(testIndex) || testIndex < 0 || testIndex >= apiTests.length) {
    // Run all tests
    console.log('\n⚡ Running all API tests...\n');
    
    for (let i = 0; i < apiTests.length; i++) {
      const test = apiTests[i];
      console.log(`\n🧪 Test ${i}: ${test.name}`);
      try {
        await test.fn();
      } catch (error) {
        console.error(`❌ Test ${i} (${test.name}) failed`);
      }
    }
  } else {
    // Run specific test
    const test = apiTests[testIndex];
    console.log(`\n⚡ Running test: ${test.name}\n`);
    try {
      await test.fn();
    } catch (error) {
      console.error(`❌ Test failed: ${test.name}`);
    }
  }
}

// Create a test case (example, not in default tests)
async function createTestCase(title: string, description: string, screenshotPath?: string) {
  const params: Record<string, any> = {
    sTitle: title,
    sEvent: description,
  };
  
  const files: Record<string, string> = {};
  if (screenshotPath) {
    files['File1'] = screenshotPath;
  }
  
  return await callFogBugzApi('new', params, files);
}

// Entry point
if (require.main === module) {
  runApiTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export functions for use in other scripts
export {
  callFogBugzApi,
  createTestCase
}; 