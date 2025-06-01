import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { resources, initializeAllResources } from '../src/resources';

// Ensure environment variables are loaded from the .env file
dotenv.config();

// Use the actual values from the .env file
const FOGBUGZ_API_KEY = process.env.FOGBUGZ_API_KEY || '';
const FOGBUGZ_BASE_URL = process.env.FOGBUGZ_URL || '';
const FOGBUGZ_API_ENDPOINT = `${FOGBUGZ_BASE_URL}/f/api/0/jsonapi`;

if (!FOGBUGZ_API_KEY || !FOGBUGZ_BASE_URL) {
  console.error('Error: Missing FogBugz API configuration in environment variables.');
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

// Add resource tests for usersResource and tagsResource
async function demoUsersResource() {
  console.log('\n==== Users Resource ====');

  // Initialize the users resource
  console.log('Initializing users resource...');
  await resources.users.initialize?.();

  // Fetch users
  console.log('Fetching users...');
  const users = await resources.users.fetch();

  // Print the fetched users
  console.log('Fetched users:', users);
}

async function demoTagsResource() {
  console.log('\n==== Tags Resource ====');

  // Initialize the tags resource
  console.log('Initializing tags resource...');
  await resources.tags.initialize?.();

  // Fetch tags
  console.log('Fetching tags...');
  const tags = await resources.tags.fetch();

  // Print the fetched tags
  console.log('Fetched tags:', tags);
}

// List of API endpoints to test
const apiTests = [
  {
    name: 'View Resource Contents',
    fn: async () => {
      console.log('\n==== Resource Contents Summary ====');

      const users = await resources.users.fetch();
      const projects = await resources.projects.fetch();
      const milestones = await resources.milestones.fetch();
      const areas = await resources.areas.fetch();
      let priorities = await resources.priorities.fetch();
      const tags = await resources.tags.fetch();
      const categories = await resources.categories.fetch();
      const statuses = await resources.statuses.fetch();

      // If priorities are empty, make a raw API call to fetch them
      if (priorities.length === 0) {
        console.warn('Priorities resource is empty. Making a raw API call to listPriorities.');
        try {
          const response = await axios.post(`${FOGBUGZ_API_ENDPOINT}`, {
            cmd: 'listPriorities',
            token: FOGBUGZ_API_KEY,
          });
          if (response.data && response.data.data && response.data.data.priorities) {
            priorities = response.data.data.priorities;
            console.log('Fetched priorities via raw API call:', priorities);
          } else {
            console.error('Raw API call to listPriorities returned an invalid structure.');
          }
        } catch (error: any) {
          console.error('Error during raw API call to listPriorities:', error.message);
        }
      }

      //If users are empty, make a raw API call to viewPeople
      if (users.length === 0) {
        console.warn('Users resource is empty. Making a raw API call to viewPeople.');
        try {
          const response = await axios.post(`${FOGBUGZ_API_ENDPOINT}`, {
            cmd: 'viewPeople',
            token: FOGBUGZ_API_KEY,
          });
          if (response.data && response.data.data && response.data.data.people) {
            users.push(...response.data.data.people);
            console.log('Fetched users via raw API call:', users);
          } else {
            console.error('Raw API call to viewPeople returned an invalid structure.');
          }
        } catch (error: any) {
          console.error('Error during raw API call to viewPeople:', error.message);
        }
      }

      //if projects are empty, make a raw API call to listProjects
      if (projects.length === 0) {
        console.warn('Projects resource is empty. Making a raw API call to listProjects.');
        try {
          const response = await axios.post(`${FOGBUGZ_API_ENDPOINT}`, {
            cmd: 'listProjects',
            token: FOGBUGZ_API_KEY,
          });
          if (response.data && response.data.data && response.data.data.projects) {
            projects.push(...response.data.data.projects);
            console.log('Fetched projects via raw API call:', projects);
          } else {
            console.error('Raw API call to listProjects returned an invalid structure.');
          }
        } catch (error: any) {
          console.error('Error during raw API call to listProjects:', error.message);
        }
      }

      //if milestones are empty, make a raw API call to listMilestones
      if (milestones.length === 0) {
        console.warn('Milestones resource is empty. Making a raw API call to listMilestones.');
        try {
          for (const project of projects) {
            const response = await axios.post(`${FOGBUGZ_API_ENDPOINT}`, {
              cmd: 'listFixFors',
              token: FOGBUGZ_API_KEY,
              ixProject: project.id,
            });
            if (response.data && response.data.data && response.data.data.fixfors) {
              //milestones.push(...response.data.data.fixfors);
              console.log(`Fetched milestones for project ${project.name} via raw API call:`, response.data.data.fixfors[0]);
            } else {
              console.error(`Raw API call to listMilestones for project ${project.name} returned an invalid structure.`);
            }
          }
        } catch (error: any) {
          console.error('Error during raw API call to listMilestones:', error.message);
        }
      }

      //if areas are empty, make a raw API call to listAreas
      if (areas.length === 0) {
        console.warn('Areas resource is empty. Making a raw API call to listAreas.');
        try {
          for (const project of projects) {
            const response = await axios.post(`${FOGBUGZ_API_ENDPOINT}`, {
              cmd: 'listAreas',
              token: FOGBUGZ_API_KEY,
              ixProject: project.id,
            });
            if (response.data && response.data.data && response.data.data.areas) {
             // areas.push(...response.data.data.areas);
              console.log(`Fetched areas for project ${project.name} via raw API call:`, response.data.data.areas[0]);
            } else {
              console.error(`Raw API call to listAreas for project ${project.name} returned an invalid structure.`);
            }
          }
        } catch (error: any) {
          console.error('Error during raw API call to listAreas:', error.message);
        }
      }

      console.log('Users:', users.length);
      console.log('Projects:', projects.map(project => project.name).join(', '));

      console.log('Milestones by Project:');
      for (const project of projects) {
        const projectMilestones = milestones.filter(milestone => milestone.projectId === project.id);
        console.log(`  ${project.name}: ${projectMilestones.length} milestones`);
      }

      console.log('Areas by Project:');
      for (const project of projects) {
        const projectAreas = areas.filter(area => area.projectId === project.id);
        console.log(`  ${project.name}: ${projectAreas.length} areas`);
      }

      console.log('Priorities:', priorities.length);
      console.log('Tags:', tags.length);
      console.log('Categories:', categories.length);
      console.log('Statuses:', statuses.length);
    },
  },
  { name: 'Get Current User', fn: async () => await callFogBugzApi('viewPerson') },
  {
    name: 'Search Cases (Recent)',
    fn: async () => await callFogBugzApi('search', {
      q: 'status:active',
      cols: ['ixBug', 'sTitle', 'sStatus', 'sPriority', 'sProject', 'sArea', 'sFixFor', 'sPersonAssignedTo'],
      max: 5,
    }),
  },
  {
    name: 'Create Test Case',
    fn: async () => {
      console.log('Searching for existing test cases...');
      const existingCases = await callFogBugzApi('search', { q: '"API Test Case"', max: 1 });

      if (existingCases.data.cases && existingCases.data.cases.length > 0) {
        console.log('Test case already exists. Skipping creation.');
        return;
      }

      console.log('No existing test case found. Creating a new one...');
      await callFogBugzApi('new', {
        sTitle: 'API Test Case - ' + new Date().toISOString(),
        sEvent: 'This is a test case created by the FogBugz MCP API explorer.',
        sProject: 'Inbox',
        sArea: 'Not Spam',
        ixPriority: 3,
      });
    },
  },
];

// Initialize the Resources module before running tests
async function initializeResources() {
  console.log('🔄 Initializing all resources...');
  await resources.users.initialize?.();
  await resources.projects.initialize?.();
  await resources.tags.initialize?.();
  console.log('✅ Resources initialized.');
}

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
  (async () => {
    try {
      console.log('🔄 Initializing all resources...');
      await initializeAllResources();
      console.log('✅ All resources initialized.');

      await runApiTests();
    } catch (error) {
      console.error('Fatal error during initialization:', error);
      process.exit(1);
    }
  })();
}

// Export functions for use in other scripts
export {
  callFogBugzApi,
  createTestCase
};