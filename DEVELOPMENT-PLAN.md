Below is a comprehensive plan that outlines how to build a FogBugz MCP server in TypeScript. This plan covers everything from understanding MCP and the FogBugz API to designing a tool-based interface that an LLM can use. It also includes sample file structures, code examples, and a table mapping MCP commands to FogBugz API endpoints.

---

## 1. Overview

We will create a TypeScript-based MCP server that lets users interact with FogBugz through natural language commands interpreted by an LLM. Users will invoke the server via `npx` while passing their FogBugz API key. The tool-based design follows patterns established by other MCP servers (for example, the [Slack server implementation](https://github.com/modelcontextprotocol/servers/blob/main/src/slack/index.ts)).

---

## 2. Understanding MCP & FogBugz Integration

### MCP (Model Context Protocol)
- **Purpose:** MCP is designed to allow LLMs to interact with external tools by defining standardized tool interfaces.
- **Documentation:** See the [MCP Introduction](https://modelcontextprotocol.io/introduction) for details on how MCP servers are structured and how they interface with LLMs.
- **Usage Pattern:** The servers are typically invoked via `npx` and use a JSON descriptor (such as `mcp.json`) to declare available commands and required parameters.

### FogBugz API
- **API Modes:** FogBugz offers both XML and JSON APIs. In our implementation, we will primarily target the JSON API (as described in your provided documentation) since it supports all needed functionality.
- **Capabilities:** The API allows for creating issues (cases), updating them (for assignments or field changes), searching, and uploading attachments (e.g., screenshots).
- **Image Uploads:** We need to ensure that images are uploaded directly to FogBugz via the appropriate endpoint (likely a multipart/form-data POST).

---

## 3. Functional Requirements

The MCP server should support the following core functions:
- **Create Issue:** Allow creation of new FogBugz cases, including attaching screenshots.
- **Set Metadata:** Specify project, area, milestone, and priority.
- **Assign Issue:** Assign the case to a specific user.
- **List User Issues:** Retrieve cases assigned to a given user.
- **Issue Link:** Retrieve a direct URL for a specific issue.
- **Search Issues:** Query issues based on keywords and filters.

---

## 4. Architecture & Technology Stack

- **Language:** TypeScript
- **HTTP Client:** Use a library such as Axios to handle FogBugz API requests.
- **MCP Integration:** Follow the established patterns from other MCP servers (referencing the [Slack server](https://github.com/modelcontextprotocol/servers/blob/main/src/slack/index.ts)).
- **Packaging:** The code will be hosted publicly (e.g., on GitHub) and callable via `npx`, with the API key provided at runtime.
- **Testing:** Unit tests for each API interaction, integration tests for end-to-end command flow.
- **Documentation:** A README and inline documentation to explain configuration, deployment, and usage.

---

## 5. Detailed Action Plan

### A. Project Setup & File Structure

1. **Initialize a new TypeScript project.**  
   - Create a `package.json` and install dependencies (e.g., `typescript`, `axios`, MCP libraries).

2. **Proposed File Structure:**

   ```
   fogbugz-mcp/
   ├── src/
   │   ├── index.ts          // Entry point and MCP server registration
   │   ├── fogbugz.ts        // FogBugz API client functions
   │   ├── commands/         // Directory for MCP command implementations
   │   │   ├── createIssue.ts
   │   │   ├── assignIssue.ts
   │   │   ├── listUserIssues.ts
   │   │   ├── getIssueLink.ts
   │   │   └── searchIssues.ts
   │   ├── resources.ts      // Dynamic resource management
   │   └── utils/
   │       └── fileUpload.ts  // Helper for handling screenshots upload
   ├── mcp.json              // MCP descriptor file defining commands and parameters
   ├── tsconfig.json         // TypeScript configuration
   └── README.md             // Documentation and usage instructions
   ```

3. **Sample Code Snippet: `src/index.ts`**

   ```typescript
   import { createIssue } from "./commands/createIssue";
   import { assignIssue } from "./commands/assignIssue";
   import { listUserIssues } from "./commands/listUserIssues";
   import { getIssueLink } from "./commands/getIssueLink";
   import { searchIssues } from "./commands/searchIssues";
   import { resources } from "./resources";

   // MCP server registration
   export const commands = {
     createIssue,
     assignIssue,
     listUserIssues,
     getIssueLink,
     searchIssues,
   };

   // Initialize resources on server startup
   async function initializeServer() {
     await Promise.all(Object.values(resources).map(resource => resource.initialize()));
   }

   initializeServer().catch(console.error);
   ```

### B. MCP Integration

1. **Define MCP Descriptor (`mcp.json`):**
   - List each command with descriptions and parameters.
   - Example entry for `createIssue`:
     ```json
     {
       "name": "createIssue",
       "description": "Creates a new FogBugz issue with optional screenshot attachments.",
       "parameters": {
         "title": "string",
         "description": "string",
         "project": "string",
         "area": "string",
         "milestone": "string",
         "priority": "string",
         "assignedTo": "string",
         "screenshotPaths": "string[]" // local paths to screenshots
       }
     }
     ```
2. **LLM Tool-based Interaction:**
   - The MCP server should receive JSON payloads from the LLM and dispatch them to the corresponding command function.
   - Use error handling and logging for a robust interface.

### C. FogBugz API Integration

1. **API Authentication:**
   - Use the FogBugz API key (passed as an argument) for all API calls.
   - Consider wrapping Axios calls to automatically attach the API key.

2. **Handling Endpoints:**
   - **Create Issue:**  
     Use the FogBugz endpoint (e.g., `POST /api/case/new`) to create an issue. Pass fields like project, area, milestone, and priority as parameters.
   - **Update/Assign Issue:**  
     Use an endpoint to update a case (e.g., `POST /api/case/update`) to assign it to a user.
   - **Search Issues & Listing:**  
     Use query endpoints (e.g., `GET /api/case/search`) to filter issues by user or search terms.
   - **Issue Details/Link:**  
     Retrieve details with a GET call (e.g., `GET /api/case/details`) to build a link.
   - **File Uploads:**  
     Use multipart/form-data for attaching images. The `fileUpload.ts` utility can wrap this logic.

3. **Example Code Snippet: `src/fogbugz.ts`**

   ```typescript
   import axios from 'axios';

   const FOGBUGZ_BASE_URL = 'https://yourcompany.fogbugz.com/api';

   export interface FogBugzIssue {
     id: string;
     title: string;
     // other fields...
   }

   // Create a new case
   export async function createFogBugzIssue(apiKey: string, params: any, screenshotPaths?: string[]): Promise<FogBugzIssue> {
     // Construct form data if screenshots are provided
     // (Implementation detail: use a multipart library if needed)
     const response = await axios.post(`${FOGBUGZ_BASE_URL}/case/new`, {
       ...params,
       token: apiKey,
     });
     return response.data;
   }
   ```

### D. Dynamic Resource Management (`src/resources.ts`)

To provide tools with efficient access to frequently changing FogBugz data (like users, projects, areas, milestones, priorities), a dynamic resource management system will be implemented.

*   **A. Define Resource Types and Cache Structure:**
    *   In `src/resources.ts`, define TypeScript interfaces for key FogBugz entities (e.g., `User`, `Project`, `Area`, `Milestone`, `Priority`, `Category`, `Status`) based on the official API documentation.
    *   Establish an in-memory `cache` object. This cache will hold arrays of these entities. For dependent data (like `areas` per `project`), the cache will use nested structures (e.g., `areas: { [projectId: number]: Area[] }`).
*   **B. Implement Generic Resource Interface:**
    *   Define a generic `Resource<T>` interface with `name: string`, an optional `initialize(): Promise<void>` method, and a `fetch(): Promise<T>` method. An optional `refresh(): Promise<void>` can be included for future cache invalidation strategies.
*   **C. Create Specific Resource Instances:**
    *   For each entity type (users, projects, etc.), create an exported constant (e.g., `usersResource: Resource<User[]>`).
    *   Implement the `initialize` method for each resource to call the relevant `FogBugzApi` method (e.g., `api.listPeople()`) and populate the `cache`.
        *   For projects, the `initialize` method will also iterate through fetched projects to populate dependent `areas` and `milestones`.
    *   Implement the `fetch` method to return data from the `cache`.
*   **D. API Client Methods for Lists:**
    *   Ensure the `FogBugzApi` (`src/api/index.ts`) includes methods to list all necessary entities: `listPeople`, `listProjects`, `listAreas` (per project), `listMilestones` (per project), `listPriorities`, `listCategories`, `listStatuses` (per category).
*   **E. Centralized Resource Export:**
    *   Export all defined resource instances in a single `resources` object from `src/resources.ts` for easy import and use elsewhere.
*   **F. Server Initialization Hook:**
    *   The main server logic in `src/index.ts` will be responsible for calling the `initialize()` method of all defined resources upon startup, after the `FogBugzApi` client is configured.

### E. Commands Implementation

For each MCP command, create a corresponding function in the `commands/` directory that uses the FogBugz API client:

- **createIssue.ts:**  
  - Accept parameters (title, description, etc.) and optional screenshot paths.
  - Call `createFogBugzIssue()` and handle file uploads.
- **assignIssue.ts:**  
  - Update an existing issue with an assigned user.
- **listUserIssues.ts:**  
  - Fetch issues filtered by assigned user.
- **getIssueLink.ts:**  
  - Retrieve case details and build the URL.
- **searchIssues.ts:**  
  - Accept a query string and return matching cases.

### F. Testing, Deployment & Documentation

1. **Testing:**
   - Write unit tests for each function using a framework like Jest.
   - Test API interactions by mocking HTTP responses.
2. **Deployment:**
   - Publish the repository on GitHub.
   - Configure it to be executable via `npx` by specifying a proper bin in `package.json`.
3. **Documentation:**
   - Update README.md with installation instructions, configuration (how to pass the API key), usage examples, and troubleshooting tips.
   - Include examples of JSON payloads for each MCP command.

---

## 6. Command-to-API Mapping

Below is a table that maps each supported MCP function to its corresponding FogBugz API action:

| MCP Command       | Description                                        | FogBugz API Action                            | Key Parameters                                      |
|-------------------|----------------------------------------------------|-----------------------------------------------|-----------------------------------------------------|
| **createIssue**   | Creates a new issue with optional screenshot upload| **POST**: `/api/case/new`                     | Title, description, project, area, milestone, priority, attachments (screenshots) |
| **assignIssue**   | Assigns an issue to a specific user                | **POST/PUT**: `/api/case/update`              | Case ID, assigned user                              |
| **listUserIssues**| Retrieves issues assigned to a given user          | **GET**: `/api/case/search` (filter by assigned user)| Assigned user ID or username                      |
| **getIssueLink**  | Retrieves a direct link to an issue                | **GET**: `/api/case/details`                  | Case ID                                             |
| **searchIssues**  | Searches issues using a query                      | **GET**: `/api/case/search`                   | Query string, optional filters                      |

---

## 7. Conclusion & Next Steps

This plan provides a structured approach to building a FogBugz MCP server that meets your requirements:

- **TypeScript** is used to maintain consistency with existing MCP servers.
- **MCP Integration** ensures that LLMs can interact with the tool in a standardized manner.
- **FogBugz API Usage** covers creating, updating, searching, and attaching files (screenshots).
- The project is structured to support easy deployment via `npx` and API key–based authentication, with clear documentation and testing guidelines.

---

## Next Steps

With the FogBugz API client (`src/api/index.ts`), MCP tool definitions (`src/commands/tools.ts`), and the dynamic resource management system (`src/resources.ts`) now structured, the following steps are crucial for completing the FogBugz MCP server:

1.  **Implement Core MCP Server (`src/index.ts`):**
    *   Integrate the official TypeScript MCP SDK.
    *   Implement command-line argument parsing for FogBugz URL and API token.
    *   Initialize the `FogBugzApi` client with these credentials.
    *   **Crucially, call the `initialize()` methods for all resources defined in `src/resources.ts` after API client setup.**
    *   Register all defined MCP tools (from `src/commands/tools.ts`) with the MCP server instance.
    *   Start the server to listen for requests from an MCP client (e.g., over STDIO).

2.  **Develop Command Handlers (`src/commands/index.ts`):**
    *   For each tool defined in `tools.ts`, implement the corresponding command handler function.
    *   These handlers will:
        *   Receive input parameters from the MCP tool invocation.
        *   Utilize methods from the `FogBugzApi` instance to interact with FogBugz.
        *   Leverage the cached data from `resources.ts` for validation, lookups (e.g., converting project name to ID), or providing context.
        *   Handle file attachments for `createCase` and `updateCase` by reading local paths and preparing multipart/form-data requests if necessary.
        *   Format and return results or errors according to the MCP specification and the tool's output schema.

3.  **Implement Robust Error Handling and Logging:**
    *   Integrate a logging library (e.g., Winston, Pino) for structured logging.
    *   Implement comprehensive error handling in API calls, command handlers, and resource initialization, returning appropriate MCP error responses.

4.  **End-to-End Testing:**
    *   Expand unit tests for command handlers and resource interactions.
    *   Conduct integration tests by sending actual MCP requests (e.g., `listTools`, `callTool`) to a running instance of the server and verifying responses and FogBugz interactions.
    *   Test all tools with various valid and invalid inputs.

5.  **Refine File Attachment Logic:**
    *   Ensure the `FogBugzApi`'s `request` method correctly handles `multipart/form-data` when `FileAttachment` objects are provided.
    *   Test attachment uploads thoroughly.

6.  **Finalize Packaging and Distribution (`package.json`, `npx`):**
    *   Configure `package.json` with the correct `bin` entry for `npx` execution.
    *   Ensure all dependencies are correctly listed.
    *   Test running the server via `npx fogbugz-mcp <url> <token>`.
    *   Create a build process (`npm run build`) that outputs a clean, runnable distribution.

7.  **Documentation Updates:**
    *   Update `README.md` with detailed usage instructions, including how to run with `npx`, environment variable setup, and examples of tool usage.
    *   Ensure all tool descriptions and schemas in `tools.ts` are accurate and user-friendly for the LLM.
    *   Document the dynamic resource caching strategy and its implications if relevant for advanced users or contributors.

8.  **Code Cleanup and Review:**
    *   Refactor code for clarity, efficiency, and adherence to best practices.
    *   Remove any placeholder or simulated API calls in `resources.ts` and ensure it uses the actual `FogBugzApi` instance.
