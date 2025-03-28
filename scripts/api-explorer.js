#!/usr/bin/env node

/**
 * FogBugz JSON API Explorer
 * 
 * This script demonstrates and tests the FogBugz JSON API equivalents
 * of the XML API functionality.
 */

const axios = require('axios');
require('dotenv').config();

// Configuration from environment variables
const API_KEY = process.env.FOGBUGZ_API_KEY;
const FOGBUGZ_URL = process.env.FOGBUGZ_URL;
const API_ENDPOINT = `${FOGBUGZ_URL}/f/api/0/jsonapi`;

// Helper function to make API requests
async function makeApiRequest(cmd, params = {}) {
  try {
    const payload = {
      cmd,
      token: API_KEY,
      ...params
    };
    
    console.log(`\n🚀 Making request: ${cmd}`);
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(API_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success!');
    return response.data;
  } catch (error) {
    console.log('❌ Error:');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
}

// Function to print JSON response nicely
function printResponse(data) {
  console.log('\nResponse:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\n-----------------------------------');
}

// Ensure we're logged in before running any demo
async function ensureLoggedIn() {
  console.log('\n🔑 Ensuring we are logged in...');
  const result = await makeApiRequest('logon');
  if (result && result.data && result.data.token) {
    console.log('✅ Successfully logged in with token.');
    return true;
  }
  console.log('❌ Failed to log in. Continuing without authentication...');
  console.log('Note: Some API calls may fail due to authentication issues.');
  return false;
}

// Demonstrate Views functionality
async function demoViews() {
  if (!(await ensureLoggedIn())) return;
  
  console.log('\n==== Views ====');
  console.log('\nThe FogBugz JSON API provides commands to view specific entities:');
  
  // First, list some projects to get an ID to view
  console.log('\n1. List projects to get an ID to view:');
  const projectsResult = await makeApiRequest('listProjects');
  printResponse(projectsResult);
  
  // View a specific project
  let projectId = null;
  if (projectsResult && projectsResult.data && projectsResult.data.projects && projectsResult.data.projects.length > 0) {
    projectId = projectsResult.data.projects[0].ixProject;
    
    console.log(`\n2. View specific project with ID ${projectId} (cmd=viewProject):`);
    const viewProjectResult = await makeApiRequest('viewProject', {
      ixProject: projectId
    });
    printResponse(viewProjectResult);
    
    // List areas to get an ID to view
    console.log(`\n3. List areas in project ${projectId} to get an ID to view:`);
    const areasResult = await makeApiRequest('listAreas', {
      ixProject: projectId
    });
    printResponse(areasResult);
    
    // View a specific area if we have any
    if (areasResult && areasResult.data && areasResult.data.areas && areasResult.data.areas.length > 0) {
      const areaId = areasResult.data.areas[0].ixArea;
      
      console.log(`\n4. View specific area with ID ${areaId} (cmd=viewArea):`);
      const viewAreaResult = await makeApiRequest('viewArea', {
        ixArea: areaId
      });
      printResponse(viewAreaResult);
    } else {
      console.log('\n4. No areas found to view.');
    }
  } else {
    console.log('\n2. No projects found to view.');
  }
  
  // View a specific person (current user)
  console.log('\n5. View current user (cmd=viewPerson):');
  const viewPersonResult = await makeApiRequest('viewPerson');
  printResponse(viewPersonResult);
  
  // List priorities to get an ID to view
  console.log('\n6. List priorities to get an ID to view:');
  const prioritiesResult = await makeApiRequest('listPriorities');
  printResponse(prioritiesResult);
  
  // View a specific priority if we have any
  if (prioritiesResult && prioritiesResult.data && prioritiesResult.data.priorities && prioritiesResult.data.priorities.length > 0) {
    const priorityId = prioritiesResult.data.priorities[0].ixPriority;
    
    console.log(`\n7. View specific priority with ID ${priorityId} (cmd=viewPriority):`);
    const viewPriorityResult = await makeApiRequest('viewPriority', {
      ixPriority: priorityId
    });
    printResponse(viewPriorityResult);
  } else {
    console.log('\n7. No priorities found to view.');
  }
  
  console.log('\nNote: The JSON API provides additional view commands for other entity types.');
}

// Main function to run the demos
async function main() {
  console.log('============================================');
  console.log('FogBugz JSON API Explorer');
  console.log('============================================');
  
  if (!API_KEY || !FOGBUGZ_URL) {
    console.error('Error: Missing API_KEY or FOGBUGZ_URL in .env file');
    process.exit(1);
  }
  
  console.log(`Using FogBugz URL: ${FOGBUGZ_URL}`);
  
  // Run the demo functions
  // Comment out any demo you don't want to run
  // await demoApiVersionAndLocation();
  // await demoLoggingOn();
  // await demoGeneralRules();
  // await demoLoggingOff();
  // await demoFilters();
  // await demoListingViewingCases();
  // await demoEditingCases();
  // await demoLists();
  // await demoCreating();
  // await demoEditingPerson();
  // await demoViews();
  // await demoMilestoneDependencies();
  // await demoWorkingSchedule();
  // await demoTimeTracking();
  // await demoSourceControl();
  // await demoTags();
  // await demoReleaseNotes();
  // await demoMilestones();
  // await demoWikis();
  // await demoDiscussionGroups();
  await demoBugzScout();
  
  console.log('\n✨ Completed API Explorer demonstration');
}

// Demonstrate Milestone Dependencies functionality
async function demoMilestoneDependencies() {
  if (!(await ensureLoggedIn())) return;
  
  console.log('\n==== Milestone Dependencies ====');
  console.log('\nThe FogBugz JSON API provides commands to create and remove milestone dependencies:');
  
  // First, list milestones to get IDs to work with
  console.log('\n1. List milestones (cmd=listFixFors):');
  const milestonesResult = await makeApiRequest('listFixFors');
  printResponse(milestonesResult);
  
  // Check if we have at least 2 milestones to create a dependency between
  if (milestonesResult && milestonesResult.data && milestonesResult.data.fixfors && milestonesResult.data.fixfors.length >= 2) {
    const milestone1 = milestonesResult.data.fixfors[0].ixFixFor;
    const milestone2 = milestonesResult.data.fixfors[1].ixFixFor;
    
    // Create a dependency
    console.log(`\n2. Create a dependency: Milestone ${milestone1} depends on Milestone ${milestone2} (cmd=addFixForDependency):`);
    console.log(`   Note: This is a demonstration. The actual request will be commented out to prevent creating unwanted dependencies.`);
    
    // Commented out to prevent creating unwanted dependencies
    /* 
    const addDependencyResult = await makeApiRequest('addFixForDependency', {
      ixFixFor: milestone1,
      ixFixForDependsOn: milestone2
    });
    printResponse(addDependencyResult);
    */
    
    // Instead, show what the request would look like
    console.log('\n   Example request payload:');
    console.log(JSON.stringify({
      cmd: 'addFixForDependency',
      token: 'API_TOKEN',
      ixFixFor: milestone1,
      ixFixForDependsOn: milestone2
    }, null, 2));
    
    // Remove a dependency
    console.log(`\n3. Remove a dependency (cmd=deleteFixForDependency):`);
    console.log(`   Note: This is a demonstration. The actual request will be commented out to prevent removing existing dependencies.`);
    
    // Commented out to prevent removing existing dependencies
    /*
    const deleteDependencyResult = await makeApiRequest('deleteFixForDependency', {
      ixFixFor: milestone1,
      ixFixForDependsOn: milestone2
    });
    printResponse(deleteDependencyResult);
    */
    
    // Instead, show what the request would look like
    console.log('\n   Example request payload:');
    console.log(JSON.stringify({
      cmd: 'deleteFixForDependency',
      token: 'API_TOKEN',
      ixFixFor: milestone1,
      ixFixForDependsOn: milestone2
    }, null, 2));
    
  } else {
    console.log('\n2. Not enough milestones found to demonstrate dependencies (need at least 2).');
  }
  
  console.log('\nNote: Milestone dependencies allow you to specify that one milestone must be completed before another can begin.');
}

// Demonstrate Working Schedule functionality
async function demoWorkingSchedule() {
  if (!(await ensureLoggedIn())) return;
  
  console.log('\n==== Working Schedule ====');
  console.log('\nThe FogBugz JSON API provides commands to manage working schedules and project time allocations:');
  
  // List working schedule for current user
  console.log('\n1. List working schedule for current user (cmd=listWorkingSchedule):');
  const workingScheduleResult = await makeApiRequest('listWorkingSchedule');
  printResponse(workingScheduleResult);
  
  // Calculate a future date based on working hours
  console.log('\n2. Calculate a date by adding working hours (cmd=wsDateFromHours):');
  const currentDate = new Date().toISOString();
  const hoursToAdd = 16; // Two standard workdays
  
  const wsDateResult = await makeApiRequest('wsDateFromHours', {
    dt: currentDate,
    hrs: hoursToAdd
  });
  printResponse(wsDateResult);
  
  // List per-project time allocations
  console.log('\n3. List per-project time allocations (cmd=listProjectPercentTime):');
  const percentTimeResult = await makeApiRequest('listProjectPercentTime');
  printResponse(percentTimeResult);
  
  // Project protection examples
  console.log('\n4. Project protection operations:');
  
  // Find a project to use as an example
  const projectsResult = await makeApiRequest('listProjects');
  if (projectsResult && projectsResult.data && projectsResult.data.projects && projectsResult.data.projects.length > 0) {
    const projectId = projectsResult.data.projects[0].ixProject;
    
    console.log(`\n   4.1. Add project protection (cmd=addProjectPercentTime):`);
    console.log(`   Note: This is a demonstration. The actual request will be commented out to prevent modifying allocations.`);
    
    // Show what the request would look like
    console.log('\n   Example request payload:');
    console.log(JSON.stringify({
      cmd: 'addProjectPercentTime',
      token: 'API_TOKEN',
      ixProject: projectId,
      nPercent: 25 // Allocate 25% of time to this project
    }, null, 2));
    
    console.log(`\n   4.2. Edit project protection (cmd=editProjectPercentTime):`);
    console.log(`   Note: This is a demonstration. The actual request would need an ixProjectPercentTime value.`);
    
    // Show what the request would look like
    console.log('\n   Example request payload:');
    console.log(JSON.stringify({
      cmd: 'editProjectPercentTime',
      token: 'API_TOKEN',
      ixProjectPercentTime: 123, // This would be an actual ID from listProjectPercentTime
      nPercent: 30 // Change allocation to 30%
    }, null, 2));
    
    console.log(`\n   4.3. Delete project protection (cmd=deleteProjectPercentTime):`);
    console.log(`   Note: This is a demonstration. The actual request would need an ixProjectPercentTime value.`);
    
    // Show what the request would look like
    console.log('\n   Example request payload:');
    console.log(JSON.stringify({
      cmd: 'deleteProjectPercentTime',
      token: 'API_TOKEN',
      ixProjectPercentTime: 123 // This would be an actual ID from listProjectPercentTime
    }, null, 2));
    
  } else {
    console.log('\n   No projects found to demonstrate project protection operations.');
  }
  
  console.log('\nNote: Working schedule operations allow you to manage work hours, calculate dates based on working time, and protect projects by specifying time allocations.');
}

// Demonstrate Time Tracking functionality
async function demoTimeTracking() {
  if (!(await ensureLoggedIn())) return;
  
  console.log('\n==== Time Tracking ====');
  console.log('\nThe FogBugz JSON API provides commands to manage time tracking:');
  
  // Search for a case we can use for time tracking examples
  console.log('\n1. Search for a case to use for time tracking examples:');
  const casesResult = await makeApiRequest('search', {
    q: '',  // Empty search to get all visible cases
    cols: 'ixBug,sTitle',
    max: 1   // Just get one case
  });
  printResponse(casesResult);
  
  // Check if we found a case
  let caseId = null;
  if (casesResult && casesResult.data && casesResult.data.cases && casesResult.data.cases.length > 0) {
    caseId = casesResult.data.cases[0].ixBug;
    
    // Start working on a case
    console.log(`\n2. Start working on case #${caseId} (cmd=startWork):`);
    console.log(`   Note: This is a demonstration. The actual request will be commented out to avoid affecting time tracking records.`);
    
    // Show what the request would look like
    console.log('\n   Example request payload:');
    console.log(JSON.stringify({
      cmd: 'startWork',
      token: 'API_TOKEN',
      ixBug: caseId
    }, null, 2));
    
    // Stop working on everything
    console.log('\n3. Stop working on all cases (cmd=stopWork):');
    console.log(`   Note: This is a demonstration. The actual request will be commented out to avoid affecting time tracking records.`);
    
    // Show what the request would look like
    console.log('\n   Example request payload:');
    console.log(JSON.stringify({
      cmd: 'stopWork',
      token: 'API_TOKEN'
    }, null, 2));
    
    // Import a time interval
    console.log('\n4. Import a time interval (cmd=newInterval):');
    console.log(`   Note: This is a demonstration. The actual request will be commented out to avoid creating new time intervals.`);
    
    // Calculate start and end dates for the example
    const now = new Date();
    const startDate = new Date(now.getTime() - (60 * 60 * 1000)); // 1 hour ago
    const endDate = now;
    
    // Show what the request would look like
    console.log('\n   Example request payload:');
    console.log(JSON.stringify({
      cmd: 'newInterval',
      token: 'API_TOKEN',
      ixBug: caseId,
      dtStart: startDate.toISOString(),
      dtEnd: endDate.toISOString()
    }, null, 2));
    
    // List time intervals
    console.log('\n5. List time intervals (cmd=listIntervals):');
    const intervalsResult = await makeApiRequest('listIntervals');
    printResponse(intervalsResult);
    
  } else {
    console.log('\n2. No cases found to demonstrate time tracking operations.');
  }
  
  console.log('\nNote: Time tracking operations allow you to manage work intervals, start and stop the stopwatch, and track time spent on cases.');
}

// Demonstrate Source Control functionality
async function demoSourceControl() {
  if (!(await ensureLoggedIn())) return;
  
  console.log('\n==== Source Control ====');
  console.log('\nThe FogBugz JSON API provides commands to associate source control check-ins with cases:');
  
  // Search for a case to associate with check-ins
  console.log('\n1. Search for a case to associate with source control check-ins:');
  const casesResult = await makeApiRequest('search', {
    q: '',  // Empty search to get all visible cases
    cols: 'ixBug,sTitle',
    max: 1   // Just get one case
  });
  printResponse(casesResult);
  
  // Check if we found a case
  let caseId = null;
  if (casesResult && casesResult.data && casesResult.data.cases && casesResult.data.cases.length > 0) {
    caseId = casesResult.data.cases[0].ixBug;
    
    // Associate a new check-in with a case
    console.log(`\n2. Associate a new check-in with case #${caseId} (cmd=newCheckin):`);
    console.log(`   Note: This is a demonstration. The actual request will be commented out to avoid creating check-in records.`);
    
    // Example check-in details
    const sampleFile = 'src/api/jsonapi.js';
    const prevRevision = '12345';
    const newRevision = '12346';
    const repoId = 2;
    
    // Show what the request would look like
    console.log('\n   Example request payload:');
    console.log(JSON.stringify({
      cmd: 'newCheckin',
      token: 'API_TOKEN',
      ixBug: caseId,
      sFile: sampleFile,
      sPrev: prevRevision,
      sNew: newRevision,
      ixRepository: repoId
    }, null, 2));
    
    // List check-ins associated with a case
    console.log(`\n3. List check-ins associated with case #${caseId} (cmd=listCheckins):`);
    
    const checkinsResult = await makeApiRequest('listCheckins', {
      ixBug: caseId
    });
    printResponse(checkinsResult);
    
  } else {
    console.log('\n2. No cases found to demonstrate source control operations.');
  }
  
  console.log('\nNote: Source control commands allow you to associate code check-ins with cases, providing traceability between code changes and issue tracking.');
}

// Demonstrate Tags functionality
async function demoTags() {
  if (!(await ensureLoggedIn())) return;
  
  console.log('\n==== Tags ====');
  console.log('\nThe FogBugz JSON API provides commands to list and manage tags (only available with FogBugz 8.2+):');
  
  // List all tags
  console.log('\n1. List all tags visible to the current user (cmd=listTags):');
  const tagsResult = await makeApiRequest('listTags');
  printResponse(tagsResult);
  
  // Search for cases with a specific tag
  if (tagsResult && tagsResult.data && tagsResult.data.tags && tagsResult.data.tags.length > 0) {
    // Extract a tag name from the response to search for
    const tagName = tagsResult.data.tags[0].sTag;
    
    console.log(`\n2. Search for cases with tag '${tagName}':`);
    const tagSearchResult = await makeApiRequest('search', {
      q: `tag:"${tagName}"`,
      cols: 'ixBug,sTitle,tags'
    });
    printResponse(tagSearchResult);
    
    // Demonstrate adding and removing tags using edit case
    console.log('\n3. Adding and removing tags:');
    console.log('   Tags can be added or removed using the edit case command with the sTags parameter.');
    console.log('   Example: To add tag1 and tag2 to a case while removing all other tags:');
    
    // Show what the request would look like
    console.log('\n   Example request payload for adding tags:');
    console.log(JSON.stringify({
      cmd: 'edit',
      token: 'API_TOKEN',
      ixBug: 123,
      sTags: 'tag1,tag2'
    }, null, 2));
    
  } else {
    console.log('\n2. No tags found in the system to demonstrate tag search.');
  }
  
  console.log('\nNote: Tags provide a flexible way to categorize and filter cases in FogBugz beyond the standard project/area/milestone fields.');
}

// Demonstrate BugzScout functionality
async function demoBugzScout() {
  if (!(await ensureLoggedIn())) return;
  
  console.log('\n==== BugzScout ====');
  console.log('\nThe FogBugz JSON API provides commands to manage BugzScout cases:');
  
  // 1. List BugzScout cases
  console.log('\n1. List BugzScout cases (cmd=listScoutCase):');
  const scoutCasesResult = await makeApiRequest('listScoutCase', {
    sScoutDescription: 'crash in CMyClass.GetData() at line 125 - version 2.5.44' // Example scout description
  });
  printResponse(scoutCasesResult);
  
  // 2. Creating a new BugzScout case (demonstration)
  console.log('\n2. Creating a new BugzScout case:');
  console.log('   Note: This is a demonstration. The actual request uses cmd=new with BugzScout-specific parameters.');
  
  console.log('\n   Example request payload for creating a BugzScout case:');
  console.log(JSON.stringify({
    cmd: 'new',
    token: 'API_TOKEN',
    sTitle: 'Application crash in data processing module',
    sScoutDescription: 'crash in DataProcessor.processRecord() at line 217 - version 3.1.2',
    sScoutMessage: 'The development team has been notified of this issue and is working on a fix.',
    sEvent: 'User was processing a large data file when the application crashed.\
Stack trace: DataProcessor.processRecord() at line 217',
    ixProject: 5, // Project ID (replace with actual value)
    ixArea: 8,    // Area ID (replace with actual value)
    fScoutStopReporting: 0 // Continue to record occurrences (0=continue, 1=stop)
  }, null, 2));
  
  // 3. Search for BugzScout cases
  console.log('\n3. Search for cases and check for BugzScout fields:');
  const scoutSearchResult = await makeApiRequest('search', {
    q: '',  // Empty search to get all visible cases
    cols: 'ixBug,sTitle,sScoutDescription,sScoutMessage,fScoutStopReporting,dtLastOccurrence',
    max: 20 // Limit to 20 cases
  });
  printResponse(scoutSearchResult);
  
  // 4. Updating a BugzScout case
  console.log('\n4. Updating a BugzScout case:');
  console.log('   Note: This is a demonstration. The actual request uses cmd=edit with BugzScout-specific parameters.');
  
  console.log('\n   Example request payload for updating a BugzScout case:');
  console.log(JSON.stringify({
    cmd: 'edit',
    token: 'API_TOKEN',
    ixBug: 5184, // Case ID (replace with actual value)
    sScoutMessage: 'This issue has been resolved in version 3.1.3. Please update your application.',
    fScoutStopReporting: 1 // Stop recording occurrences (0=continue, 1=stop)
  }, null, 2));
  
  console.log('\nNote: BugzScout is used for automatic crash reporting in applications.');
  console.log('      The sScoutDescription field is used to identify unique crash signatures.');
  console.log('      When a new crash with the same signature occurs, it increases the occurrence count');
  console.log('      rather than creating duplicate cases.');
}

// Demonstrate Discussion Groups functionality
async function demoDiscussionGroups() {
  if (!(await ensureLoggedIn())) return;
  
  console.log('\n==== Discussion Groups ====');
  console.log('\nThe FogBugz JSON API provides commands to view discussion groups and topics:');
  
  // 1. List all discussion groups
  console.log('\n1. List all discussion groups (cmd=listDiscussGroups):');
  const discussGroupsResult = await makeApiRequest('listDiscussGroups');
  printResponse(discussGroupsResult);
  
  // Check if we have any discussion groups to work with
  if (discussGroupsResult && discussGroupsResult.data && discussGroupsResult.data.discussions && discussGroupsResult.data.discussions.length > 0) {
    const groupId = discussGroupsResult.data.discussions[0].ixDiscussGroup;
    
    // 2. List all topics in a discussion group
    console.log(`\n2. List all topics in discussion group ${groupId} (cmd=listDiscussion):`);
    const discussionResult = await makeApiRequest('listDiscussion', {
      ixDiscussGroup: groupId,
      fFull: 1 // Get all posts including replies
    });
    printResponse(discussionResult);
    
    // 3. Check if there are any topics to view
    if (discussionResult && discussionResult.data && discussionResult.data.discussion && 
        discussionResult.data.discussion.topics && discussionResult.data.discussion.topics.length > 0) {
      
      // Find a topic ID to use
      let topicId = null;
      for (const topic of discussionResult.data.discussion.topics) {
        if (topic.post && topic.post.ixDiscussTopic) {
          topicId = topic.post.ixDiscussTopic;
          break;
        }
      }
      
      if (topicId) {
        // 3. View a specific discussion topic
        console.log(`\n3. View specific discussion topic ${topicId} (cmd=listDiscussTopic):`);
        const topicResult = await makeApiRequest('listDiscussTopic', {
          ixDiscussTopic: topicId
        });
        printResponse(topicResult);
      } else {
        console.log('\n3. Unable to find a valid topic ID in the discussion.');
      }
    } else {
      console.log('\n3. No topics found in this discussion group.');
    }
    
    // 4. Example of filtering topics by month and year
    console.log('\n4. Filter discussion by month and year (cmd=listDiscussion with m and y parameters):');
    console.log('   Note: This example shows how to filter discussions by month (3 = March) and year (2025).');
    
    // Example request
    console.log('\n   Example request payload:');
    console.log(JSON.stringify({
      cmd: 'listDiscussion',
      token: 'API_TOKEN',
      ixDiscussGroup: groupId,
      m: 3, // March
      y: 2025
    }, null, 2));
  } else {
    console.log('\n2. No discussion groups found to demonstrate discussion-specific operations.');
  }
  
  console.log('\nNote: Discussion groups provide a way to organize team communications about general topics');
  console.log('      that may not be tied to specific cases. The API provides read-only access to discussions.');
  console.log('      Creating new discussion groups or posts must be done through the FogBugz UI.');
}

// Demonstrate Wikis functionality
async function demoWikis() {
  if (!(await ensureLoggedIn())) return;
  
  console.log('\n==== Wikis ====');
  console.log('\nThe FogBugz JSON API provides commands to manage wikis, wiki articles, and templates:');
  
  // 1. List all wikis
  console.log('\n1. List all wikis (cmd=listWikis):');
  const wikisResult = await makeApiRequest('listWikis');
  printResponse(wikisResult);
  
  let wikiId = null;
  let wikiFound = false;
  
  // Check if we have any wikis to work with
  if (wikisResult && wikisResult.data && wikisResult.data.wikis && wikisResult.data.wikis.length > 0) {
    wikiId = wikisResult.data.wikis[0].ixWiki;
    wikiFound = true;
    
    // 2. List all articles in a wiki
    console.log(`\n2. List all articles in wiki ${wikiId} (cmd=listArticles):`);
    const articlesResult = await makeApiRequest('listArticles', {
      ixWiki: wikiId
    });
    printResponse(articlesResult);
    
    // 3. View a specific article if available
    if (articlesResult && articlesResult.data && articlesResult.data.articles && articlesResult.data.articles.length > 0) {
      const articleId = articlesResult.data.articles[0].ixWikiPage;
      
      console.log(`\n3. View article ${articleId} (cmd=viewArticle):`);
      const viewArticleResult = await makeApiRequest('viewArticle', {
        ixWikiPage: articleId
      });
      printResponse(viewArticleResult);
      
      // 3.1 List article revisions
      console.log(`\n3.1. List revisions for article ${articleId} (cmd=listRevisions):`);
      const revisionsResult = await makeApiRequest('listRevisions', {
        ixWikiPage: articleId
      });
      printResponse(revisionsResult);
      
      // 3.2 Example of editing an article (demonstration only)
      console.log('\n3.2. Edit an article (cmd=editArticle):');
      console.log('     Note: This is a demonstration. The actual request will be commented out to prevent modifying content.');
      
      // Show what the request would look like
      console.log('\n     Example request payload:');
      console.log(JSON.stringify({
        cmd: 'editArticle',
        token: 'API_TOKEN',
        ixWikiPage: articleId,
        sHeadline: articlesResult.data.articles[0].sHeadline + ' (Updated)',
        sBody: '<p>Updated content for the article.</p>',
        sComment: 'Updated via API demo'
      }, null, 2));
    } else {
      console.log('\n3. No articles found in this wiki to demonstrate article-specific operations.');
    }
  } else {
    console.log('\n2. No wikis found to demonstrate wiki-specific operations.');
    wikiFound = false;
  }
  
  // 4. List templates
  console.log('\n4. List wiki templates (cmd=listTemplates):');
  const templatesResult = await makeApiRequest('listTemplates');
  printResponse(templatesResult);
  
  // Check if we have any templates to work with
  if (templatesResult && templatesResult.data && templatesResult.data.templates && templatesResult.data.templates.length > 0) {
    const templateId = templatesResult.data.templates[0].ixTemplate;
    
    // 4.1 View a specific template
    console.log(`\n4.1. View template ${templateId} (cmd=viewTemplate):`);
    const viewTemplateResult = await makeApiRequest('viewTemplate', {
      ixTemplate: templateId
    });
    printResponse(viewTemplateResult);
    
    // 4.2 List template revisions
    console.log(`\n4.2. List revisions for template ${templateId} (cmd=listTemplateRevisions):`);
    const templateRevisionsResult = await makeApiRequest('listTemplateRevisions', {
      ixTemplate: templateId
    });
    printResponse(templateRevisionsResult);
  } else {
    console.log('\n4.1. No templates found to demonstrate template-specific operations.');
  }
  
  // 5. Create a new wiki (demonstration only)
  console.log('\n5. Create a new wiki (cmd=newWiki):');
  console.log('   Note: This is a demonstration. The actual request will be commented out to prevent creating test wikis.');
  
  // Show what the request would look like
  console.log('\n   Example request payload:');
  console.log(JSON.stringify({
    cmd: 'newWiki',
    token: 'API_TOKEN',
    s: 'Development Guide',
    sTagLineHTML: '<p>Internal documentation for developers</p>'
  }, null, 2));
  
  // 6. Create a new article (demonstration only)
  if (wikiFound) {
    console.log('\n6. Create a new article (cmd=newArticle):');
    console.log('   Note: This is a demonstration. The actual request will be commented out to prevent creating test articles.');
    
    // Show what the request would look like
    console.log('\n   Example request payload:');
    console.log(JSON.stringify({
      cmd: 'newArticle',
      token: 'API_TOKEN',
      ixWiki: wikiId,
      sHeadline: 'API Integration Guide',
      sBody: '<h1>API Integration Guide</h1><p>This guide explains how to integrate with our APIs.</p>',
      sTags: 'api,development,guide'
    }, null, 2));
  } else {
    console.log('\n6. No wiki found to demonstrate article creation.');
  }
  
  // 7. Create a new template (demonstration only)
  console.log('\n7. Create a new template (cmd=newTemplate):');
  console.log('   Note: This is a demonstration. The actual request will be commented out to prevent creating test templates.');
  
  // Show what the request would look like
  console.log('\n   Example request payload:');
  console.log(JSON.stringify({
    cmd: 'newTemplate',
    token: 'API_TOKEN',
    sTemplate: 'Technical Documentation Template',
    sBodyHTML: '<div class="tech-doc">{{content}}</div>',
    sBodyCSS: '.tech-doc { font-family: monospace; }',
    sComment: 'Template for technical documentation',
    fDefault: 0
  }, null, 2));
  
  // 8. File upload (demonstration only)
  if (wikiFound) {
    console.log('\n8. Upload a file to a wiki (cmd=wikiFileUpload):');
    console.log('   Note: This is a demonstration. File uploads require multipart/form-data encoding.');
    console.log('   This cannot be demonstrated in this script but would involve a form upload:');
    console.log(`
    HTML Form Example:
    <form method="post" action="${API_ENDPOINT}" enctype="multipart/form-data">
      <input type="hidden" name="cmd" value="wikiFileUpload" />
      <input type="hidden" name="token" value="your_api_token" />
      <input type="hidden" name="ixWiki" value="${wikiId}" />
      <input type="file" name="File1" />
      <input type="submit" value="Upload" />
    </form>
    `);
  } else {
    console.log('\n8. No wiki found to demonstrate file upload.');
  }
  
  console.log('\nNote: The wiki system in FogBugz provides a collaborative documentation platform.');
  console.log('      Wikis can contain multiple articles, and each article maintains a complete revision history.');
  console.log('      Templates control the appearance and layout of wiki articles.');
}

// Demonstrate Milestones functionality
async function demoMilestones() {
  if (!(await ensureLoggedIn())) return;
  
  console.log('\n==== Milestones ====');
  console.log('\nThe FogBugz JSON API provides commands to manage milestones (also known as FixFors):');
  
  // 1. List all milestones
  console.log('\n1. List all milestones (cmd=listFixFors):');
  const milestonesResult = await makeApiRequest('listFixFors');
  printResponse(milestonesResult);
  
  // 2. View a specific milestone if available
  if (milestonesResult && milestonesResult.data && milestonesResult.data.fixfors && milestonesResult.data.fixfors.length > 0) {
    const milestoneId = milestonesResult.data.fixfors[0].ixFixFor;
    
    console.log(`\n2. View a specific milestone with ID ${milestoneId} (cmd=viewFixFor):`);
    const viewMilestoneResult = await makeApiRequest('viewFixFor', {
      ixFixFor: milestoneId
    });
    printResponse(viewMilestoneResult);

    // 3. List milestones for a specific project
    console.log('\n3. List projects to get a project ID for milestone filtering:');
    const projectsResult = await makeApiRequest('listProjects');
    printResponse(projectsResult);
    
    if (projectsResult && projectsResult.data && projectsResult.data.projects && projectsResult.data.projects.length > 0) {
      const projectId = projectsResult.data.projects[0].ixProject;
      
      console.log(`\n3.1 List milestones for project ${projectId} (cmd=listFixFors with ixProject):`);
      const projectMilestonesResult = await makeApiRequest('listFixFors', {
        ixProject: projectId
      });
      printResponse(projectMilestonesResult);
    } else {
      console.log('\n3.1 No projects found to demonstrate project-specific milestone listing.');
    }
    
    // 4. Create a new milestone (demonstration only)
    console.log('\n4. Create a new milestone (cmd=newFixFor):');
    console.log('   Note: This is a demonstration. The actual request will be commented out to prevent creating test milestones.');
    
    // Get a project ID to use for the example
    let projectId = null;
    if (projectsResult && projectsResult.data && projectsResult.data.projects && projectsResult.data.projects.length > 0) {
      projectId = projectsResult.data.projects[0].ixProject;
    } else {
      projectId = 1; // Default for example
    }
    
    // Show what the request would look like
    console.log('\n   Example request payload for creating a milestone:');
    console.log(JSON.stringify({
      cmd: 'newFixFor',
      token: 'API_TOKEN',
      ixProject: projectId,
      sFixFor: 'Version 2.1',
      dtRelease: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
      dtStart: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      sStartNote: 'Development begins after previous version release',
      fAssignable: 1
    }, null, 2));
    
    // 5. Edit a milestone (demonstration only)
    console.log('\n5. Edit a milestone (cmd=editFixFor):');
    console.log('   Note: This is a demonstration. The actual request will be commented out to prevent modifying existing milestones.');
    
    // Show what the request would look like
    console.log('\n   Example request payload for editing a milestone:');
    console.log(JSON.stringify({
      cmd: 'editFixFor',
      token: 'API_TOKEN',
      ixFixFor: milestoneId,
      sFixFor: milestonesResult.data.fixfors[0].sFixFor + ' (Updated)',
      dtRelease: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString() // 120 days from now
    }, null, 2));
    
    // 6. Milestone dependencies (demonstration only)
    console.log('\n6. Milestone dependencies:');
    
    // Check if we have at least 2 milestones to demonstrate dependencies
    if (milestonesResult.data.fixfors.length >= 2) {
      const milestone1 = milestonesResult.data.fixfors[0].ixFixFor;
      const milestone2 = milestonesResult.data.fixfors[1].ixFixFor;
      
      console.log('\n6.1. Add a milestone dependency (cmd=addFixForDependency):');
      console.log('     Note: This is a demonstration. The actual request will be commented out to prevent creating unwanted dependencies.');
      
      // Show what the request would look like
      console.log('\n     Example request payload:');
      console.log(JSON.stringify({
        cmd: 'addFixForDependency',
        token: 'API_TOKEN',
        ixFixFor: milestone1,
        ixFixForDependsOn: milestone2
      }, null, 2));
      
      console.log('\n6.2. Remove a milestone dependency (cmd=deleteFixForDependency):');
      console.log('     Note: This is a demonstration. The actual request will be commented out to prevent removing existing dependencies.');
      
      // Show what the request would look like
      console.log('\n     Example request payload:');
      console.log(JSON.stringify({
        cmd: 'deleteFixForDependency',
        token: 'API_TOKEN',
        ixFixFor: milestone1,
        ixFixForDependsOn: milestone2
      }, null, 2));
    } else {
      console.log('\n6.1 Not enough milestones found to demonstrate dependencies (need at least 2).');
    }
  } else {
    console.log('\n2. No milestones found to demonstrate milestone-specific operations.');
  }
  
  console.log('\nNote: Milestones (FixFors) are used to group cases for release planning and scheduling.');
  console.log('      Milestone dependencies help establish a sequence for work, ensuring that dependent milestones');
  console.log('      are not started until their prerequisites are completed.');
}

// Demonstrate Release Notes functionality
async function demoReleaseNotes() {
  if (!(await ensureLoggedIn())) return;
  
  console.log('\n==== Release Notes ====');
  console.log('\nThe FogBugz JSON API provides commands to retrieve release notes for cases:');
  
  // Get release notes for cases marked with release notes
  console.log('\n1. Get cases with release notes using search query:');
  const releaseNotesResult = await makeApiRequest('search', {
    q: 'releaseNotes:"*"',  // Search for cases that have release notes
    cols: 'ixBug,sTitle,sReleaseNotes,ixFixFor,sFixFor'
  });
  printResponse(releaseNotesResult);
  
  // Get release notes for a specific milestone
  console.log('\n2. Get release notes for a specific milestone:');
  
  // First, list milestones to get an ID to use
  console.log('\n2.1 First, list milestones to get an ID:');
  const milestonesResult = await makeApiRequest('listFixFors');
  printResponse(milestonesResult);
  
  // Now get release notes for a specific milestone if available
  if (milestonesResult && milestonesResult.data && milestonesResult.data.fixfors && milestonesResult.data.fixfors.length > 0) {
    const milestoneId = milestonesResult.data.fixfors[0].ixFixFor;
    const milestoneName = milestonesResult.data.fixfors[0].sFixFor;
    
    console.log(`\n2.2 Get release notes for milestone: ${milestoneName} (ID: ${milestoneId})`);
    const milestoneReleaseNotesResult = await makeApiRequest('search', {
      q: `fixfor:"${milestoneName}" AND releaseNotes:"*"`,
      cols: 'ixBug,sTitle,sReleaseNotes,ixFixFor,sFixFor'
    });
    printResponse(milestoneReleaseNotesResult);
  } else {
    console.log('\n2.2 No milestones found to demonstrate milestone-specific release notes.');
  }
  
  // Adding release notes to a case
  console.log('\n3. Adding release notes to a case:');
  console.log('Note: This is a demonstration. The actual request would be using cmd=edit with sReleaseNotes parameter.');
  
  console.log('\nExample request to add release notes to a case:');
  console.log(JSON.stringify({
    cmd: 'edit',
    token: 'API_TOKEN',
    ixBug: 123,  // Replace with actual case ID
    sReleaseNotes: 'Fixed an issue where the application would crash when processing large files.'
  }, null, 2));
  
  console.log('\nNote: Release notes are text associated with cases that describe changes made for a version release.');
  console.log('They can be retrieved using search queries that filter for cases with release notes content.');
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
