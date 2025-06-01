# Designing an MCP Server for FogBugz Issue Management

## Introduction  
This report outlines the design of a **Model Context Protocol (MCP)** server for integrating FogBugz issue tracking with Large Language Models (LLMs). The goal is to enable an LLM (via the MCP framework) to create and modify FogBugz cases, attach screenshots, assign cases, list a user's cases, retrieve issue links, and search for issues. We will leverage FogBugz’s API (using the JSON interface where possible) and structure the server similarly to existing MCP servers. The server will be implemented in TypeScript, packaged for use via `npx` (no installation required), and will accept a FogBugz API token (and site URL) as runtime arguments for authentication.

## Overview of the Model Context Protocol (MCP)  
The **Model Context Protocol** is an open standard (JSON-RPC-based) that allows tools and data sources to be exposed to AI assistants in a standardized way ([Tools – Model Context Protocol Specification](https://spec.modelcontextprotocol.io/specification/2024-11-05/server/tools/#:~:text=The%20Model%20Context%20Protocol%20,includes%20metadata%20describing%20its%20schema)). An MCP server defines a set of **tools** – each identified by a unique name and input/output schema – that an AI model can discover and invoke. These tools represent actions or queries the model can perform (e.g. creating an issue, assigning an issue, etc.). The MCP framework handles listing available tools and calling them via JSON messages. In practice, an MCP server uses a standardized SDK or schema to: 

- **List its tools** to the client (LLM) on request, describing each tool’s purpose and parameters.  
- **Execute tool calls** when the LLM requests an action, performing the necessary API calls and returning results.  

MCP servers typically run as separate processes that communicate with the AI client (e.g. Claude) over STDIO or another transport ([servers/src/slack/index.ts at main · modelcontextprotocol/servers · GitHub](https://github.com/modelcontextprotocol/servers/blob/main/src/slack/index.ts#:~:text=const%20server%20%3D%20new%20Server)) ([servers/src/slack/index.ts at main · modelcontextprotocol/servers · GitHub](https://github.com/modelcontextprotocol/servers/blob/main/src/slack/index.ts#:~:text=CallToolRequestSchema%2C)). This design ensures a clear separation of concerns and security (tools can be gated or moderated by the host application) ([Tools – Model Context Protocol Specification](https://spec.modelcontextprotocol.io/specification/2024-11-05/server/tools/#:~:text=%E2%9A%A0%EF%B8%8F)). We will build our FogBugz MCP server using the official TypeScript MCP SDK, similar to reference servers (e.g. Slack or GitHub integrations). This allows us to start the server with a simple command (e.g. using `npx` for Node packages ([Example Servers - Model Context Protocol](https://modelcontextprotocol.io/examples#:~:text=TypeScript,npx))) and have it adhere to MCP’s expected request/response patterns.

## FogBugz API Overview and Considerations  
FogBugz provides a rich API for nearly all issue-tracking operations. FogBugz offers both an XML API and a JSON API. **We will use the JSON API** whenever possible for convenience. Notably, *the JSON API supports the same commands and parameters as the XML API* ([FogBugz API: Listing, Searching and Viewing Cases - FogBugz Support](https://fogbugz.kayako.com/article/55766-fogbugz-api-listing-searching-and-viewing-cases#:~:text=FogBugz%20supports%20both%20XML%20API,JSON%20API%20using%C2%A0the%20same%20parameters)), but returns data in JSON format instead of XML. This means we can follow the FogBugz API documentation (which often focuses on XML examples) and simply request JSON output. 

Key points about the FogBugz API and how we’ll use it:

- **Authentication:** FogBugz uses an API token (`token`) for authentication on each request. We assume the user will supply a valid token (and the FogBugz base URL for their instance) to our server. No separate login command is needed if a token is provided. We will pass the token with each API call (e.g., `token=<APIToken>`). 

- **Endpoint:** For FogBugz On Demand (hosted FogBugz), the JSON API endpoint is typically `https://YourFogBugzSite/f/api/0/jsonapi` ([Using JSON with the FogBugz API](https://support.fogbugz.com/hc/en-us/articles/360011343853-Using-JSON-with-the-FogBugz-API#:~:text=Information,Only%20POST)). All commands will be POSTed to this single endpoint with appropriate parameters. (On older/self-hosted FogBugz, the endpoint might be `api.asp` with a `&fmt=json` parameter, but the `/f/api/0/jsonapi` is the modern usage.)

- **Commands and Parameters:** FogBugz API commands are specified via a `cmd` parameter (e.g., `cmd=new` to create a case, `cmd=search` to query cases, etc.). We will use the following FogBugz commands in our tools:
  - `cmd=new` – Create a new case (with various fields and optional file attachments) ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%20%20,dtDue)).
  - `cmd=edit` – Edit an existing case’s fields (e.g. project, milestone, etc.).
  - `cmd=assign` – Assign a case to a person (can also be done via `cmd=edit` with assignment field).
  - `cmd=search` – Search for cases using a query string (or list cases in a filter) ([FogBugz API: Listing, Searching and Viewing Cases - FogBugz Support](https://fogbugz.kayako.com/article/55766-fogbugz-api-listing-searching-and-viewing-cases#:~:text=%2A%20%60cmd%3DlistCases%60%20,needs%20a%20search%20criteria)).
  - (Additionally, FogBugz has `cmd=listCases` for filter-based listing and others, but `search` covers our needs for queries and listing by user.)

- **FogBugz Case Fields:** When creating or editing a case, we can set numerous fields. Important ones for our purposes include:
  - **Title:** `sTitle` – the case title (short description) ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%20%20,dtDue)).
  - **Project:** specify by name `sProject` or ID `ixProject` ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%20%20,dtDue)).
  - **Area:** specify by name `sArea` or ID `ixArea` (area within a project) ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%20%20,dtDue)).
  - **Milestone (FixFor):** specify by name `sFixFor` or ID `ixFixFor` (the target fix version/milestone) ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%20%20,dtDue)).
  - **Category:** `sCategory` or `ixCategory` (e.g. Bug, Feature, Inquiry, etc.).
  - **Priority:** `sPriority` or `ixPriority` (numerical priority level) ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%20%20,dtDue)).
  - **Assignee:** `sPersonAssignedTo` or `ixPersonAssignedTo` (the person responsible for the case) ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%20%20,dtDue)).
  - These parameters can be provided with `cmd=new` to set initial values, or with `cmd=edit`/`assign` to change them on existing cases. If a field is omitted in an edit, it remains unchanged ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=,)).

- **Attachments:** FogBugz allows file attachments (e.g. screenshots) on cases. To attach files via the API, the request must be a **multipart/form-data POST**. The API expects file fields named `File1`, `File2`, etc., and an extra field `nFileCount` indicating the number of files ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=,create%20a%20new%20case%20would)). If `nFileCount` is missing, only the first file may be processed ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=need%20an%20additional%20argument%20nFileCount,create%20a%20new%20case%20would)). In our design, when the LLM provides a path or content for a screenshot, the MCP server will read that file and include it in the multipart request. (Under the hood, we’ll likely use Node’s `FormData` or a similar library to construct the multipart request with the image bytes.) For example, creating a case with one attachment would involve fields: `cmd=new`, `token=<token>`, `sTitle="Example"`, etc., plus `File1=@/path/to/image.png` and `nFileCount=1` ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=,create%20a%20new%20case%20would)).

- **Search Queries:** The FogBugz `search` command accepts a `q` parameter with the same syntax as the FogBugz web UI search box ([FogBugz API: Listing, Searching and Viewing Cases - FogBugz Support](https://fogbugz.kayako.com/article/55766-fogbugz-api-listing-searching-and-viewing-cases#:~:text=,12%2C25%2C556)). This is very powerful: you can search by keywords, by specific fields, or by using advanced search axes. For instance:
  - `q=assignedto:"Alice Smith"` – finds cases assigned to Alice Smith ([Searching in FogBugz, Syntax and the Search Axis (the Ultimate Guide for Complex FogBugz Searches) - FogBugz Support](https://support.fogbugz.com/article/53555-searching-in-fogbugz-syntax-and-the-search-axis-the-ultimate-guide-for-complex-fogbugz-searches#:~:text=by%20removing%20the%20spaces%20e,see%20what%20values%20are%20listed)).
  - `q=project:"My Project" priority:1` – finds high-priority cases in "My Project".
  - `q=1234` – (just a number) finds the case with ID 1234, or any text “1234” if no case has that ID (the search guide explains how numeric queries work).
  - We can combine terms with AND/OR or other operators as supported by FogBugz’s search syntax ([Searching in FogBugz, Syntax and the Search Axis (the Ultimate Guide for Complex FogBugz Searches) - FogBugz Support](https://support.fogbugz.com/article/53555-searching-in-fogbugz-syntax-and-the-search-axis-the-ultimate-guide-for-complex-fogbugz-searches#:~:text=,Tester%201%20or%20Tester%202)) ([Searching in FogBugz, Syntax and the Search Axis (the Ultimate Guide for Complex FogBugz Searches) - FogBugz Support](https://support.fogbugz.com/article/53555-searching-in-fogbugz-syntax-and-the-search-axis-the-ultimate-guide-for-complex-fogbugz-searches#:~:text=by%20removing%20the%20spaces%20e,see%20what%20values%20are%20listed)). Our MCP server’s search tool will simply accept a raw query string and send it to FogBugz; the heavy lifting of parsing that query is done by FogBugz itself. (We will likely specify some default columns to retrieve so that the results include useful info like case ID, title, status, etc.)

- **Case Links:** To get a direct link to a FogBugz case, one can construct the URL using the case ID. On FogBugz, a simple format is:  
  **`https://YourFogBugzSite/default.asp?<CaseID>`** ([Getting the public access URL for a FogBugz case that was emailed in - Stack Overflow](https://stackoverflow.com/questions/35280951/getting-the-public-access-url-for-a-fogbugz-case-that-was-emailed-in#:~:text=Construct%20url%20links%20like%20this,asp%3FinsertCaseNumberHere)).  
  For example, if your FogBugz base URL is `https://example.fogbugz.com` and a case number is 42, the URL `https://example.fogbugz.com/default.asp?42` will bring up that case in the web UI (for an authenticated user). We will use this format to provide direct links. *(Note:* FogBugz also has "public" view URLs via a ticket token (`sTicket` field), but those are only needed for sharing with people who don’t have accounts ([Getting the public access URL for a FogBugz case that was emailed in - Stack Overflow](https://stackoverflow.com/questions/35280951/getting-the-public-access-url-for-a-fogbugz-case-that-was-emailed-in#:~:text=According%20to%20this%20answer%20https%3A%2F%2Fstackoverflow,using%20the%20following%20api%20call)). Here we assume the user just needs the internal link which requires login.)*

## Dynamic Data Handling and MCP Resources

The dynamic resource management system in `src/resources.ts` has been implemented to efficiently handle frequently changing FogBugz entities. This system includes:

1. **Resource Types:**
   - Defined TypeScript types for entities such as `Priority`, `Category`, and `Status`.
   - These types ensure type safety and clarity when interacting with FogBugz data.

2. **In-Memory Cache:**
   - The `cache` object stores arrays of entities like users, projects, and priorities.
   - Nested structures are used for dependent data, such as areas grouped by project ID.

3. **Proactive Initialization:**
   - On server startup, the `initialize` method populates the cache with essential resources.
   - Dependent resources are fetched dynamically when their parent resources are initialized.

4. **Resource Interface:**
   - A generic `Resource<T>` interface defines methods for `initialize` and `fetch`.
   - This interface standardizes how resources are managed and accessed.

5. **Integration with `FogBugzApi`:**
   - The `FogBugzApi` client provides methods like `listPeople` and `listProjects` to fetch data.
   - These methods are used during resource initialization to populate the cache.

6. **Tool Integration:**
   - Tools in `src/commands/tools.ts` leverage the cached resources for efficient data access.
   - For example, the `createCaseTool` uses the `projects` resource to validate project names before creating a case.

## MCP Tools Design for FogBugz Integration  
Based on the requirements, we will define a set of MCP tools, each corresponding to a specific FogBugz operation. Below is a mapping of each desired functionality to the tool name and underlying FogBugz API call (summarized in a table, and then detailed in text):

| **MCP Tool**            | **FogBugz API Command(s)**                 | **Purpose**                                                 |
|-------------------------|-------------------------------------------|-------------------------------------------------------------|
| `fogbugz_create_case`   | `cmd=new` (JSON API) + multipart if files  | Create a new FogBugz case with given title, description, etc., optionally attaching screenshot(s). Sets project, area, milestone, priority, etc., as provided. |
| `fogbugz_update_case`   | `cmd=edit` (or `assign`)                   | Update an existing case’s fields (project, area, milestone, priority, etc.). Could also be used for reassigning if not handled by separate tool. |
| `fogbugz_assign_case`   | `cmd=assign` (or `cmd=edit` with assignee) | Assign an existing case to a specified user. This will typically add an “assigned to X” event in FogBugz. |
| `fogbugz_list_my_cases` | `cmd=search&q=assignedto:"User Name"`      | List cases assigned to a given user. (User name or ID will be provided as input, and we construct a search query.) |
| `fogbugz_search_cases`  | `cmd=search&q=<query>`                     | General issue search using an arbitrary query string (keywords or FogBugz search syntax). Returns cases matching the query. |
| `fogbugz_get_case_link` | *No API call* (string construction)        | Given a case ID, return the direct URL link to view that case in FogBugz. |

Now we’ll discuss each of these tools in more detail, including input/output and how they will be implemented using FogBugz’s API:

### 1. `fogbugz_create_case` – Creating a New Case (with optional screenshot)  
**Description:** Creates a new FogBugz case in a specified project/area, with a title and optional description. Can set fields like milestone (FixFor), priority, etc. If a screenshot or file path is provided, the tool will attach that file to the case. 

**Inputs:** We define the input schema to include:
- `title` (string, required): The case title (short description).  
- `description` (string, optional): Initial detail for the case (FogBugz calls this the event text – we can use the `sEvent` parameter for this initial comment).  
- `project` (string, optional): Project name (or an ID) where to create the case.  
- `area` (string, optional): Area name (or ID) within the project.  
- `milestone` (string, optional): Milestone (FixFor) name or ID.  
- `priority` (number or string, optional): Priority level or name.  
- `assignee` (string, optional): Person to assign the case to (can be full name or FogBugz user ID/email).  
- `attachmentPath` (string, optional): Path to an attachment file (e.g. a screenshot image) accessible to the server.

**FogBugz API usage:** This tool will perform an HTTP POST to the FogBugz API with `cmd=new` and the provided fields. For example, we will include `sTitle=...`, `sProject=...`, etc., in the request body ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%20%20,dtDue)). If `attachmentPath` is provided, we will use multipart form data: include the file as `File1` and set `nFileCount=1` ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=,create%20a%20new%20case%20would)). FogBugz will respond with a JSON object containing the new case’s details (including its case ID, which is usually in a field like `ixBug`). We will parse this response to confirm success and extract the case ID and any other relevant info.

**Output:** On success, we can return a message or structured result such as: “Created case 123: ‘Title...’ in Project XYZ.” For the MCP response, we might output a JSON with the new case ID and perhaps the direct URL. Since MCP expects a content payload, we might return a text content containing a JSON string, for example: 

```json
{ "caseId": 123, "caseURL": "https://example.fogbugz.com/default.asp?123" }
``` 

wrapped as a JSON string (so the LLM can easily read it) ([servers/src/slack/index.ts at main · modelcontextprotocol/servers · GitHub](https://github.com/modelcontextprotocol/servers/blob/main/src/slack/index.ts#:~:text=)). This gives the model the case identifier to refer to later and a link if needed.

**Implementation notes:** In code, we will likely use Node’s `fetch` API or axios to make the POST request. For instance, using `fetch` with `FormData` if there's an attachment:

```typescript
// Pseudocode for create case with attachment
const form = new FormData();
form.append('cmd', 'new');
form.append('token', fogbugzToken);
form.append('sTitle', args.title);
if (args.description) form.append('sEvent', args.description);
if (args.project) form.append('sProject', args.project);
// ... (append other fields similarly)
if (args.attachmentPath) {
    form.append('File1', fs.createReadStream(args.attachmentPath));
    form.append('nFileCount', '1');
}
const response = await fetch(`${fogbugzBaseURL}/f/api/0/jsonapi`, { method: 'POST', body: form });
const resultJson = await response.json();
```

We would then check `resultJson` for success or error. If an error occurred, FogBugz typically returns an `"error"` object in JSON (or an `<error>` in XML) which we would propagate as an MCP tool error.

### 2. `fogbugz_update_case` – Updating Case Fields (Project/Area/Milestone/Priority)  
**Description:** Updates the properties of an existing case. This can be used to change the project, area, milestone, priority, etc., of a case after it’s been created (or to add those if not set initially). Essentially, this is a generalized edit tool. (In many cases, we may not need a separate tool if `create_case` already sets fields, but this is useful for re-categorizing or updating as a separate step.)

**Inputs:** 
- `caseId` (number or string, required): The FogBugz case number (ID) to update.
- Any combination of the optional fields: `project`, `area`, `milestone`, `priority`, `assignee` (though for assignment we have a dedicated tool, it could be handled here too), etc., similar to the create inputs.

**FogBugz API usage:** We will call `cmd=edit` with `ixBug=<caseId>` and include any fields that need to change ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%3E%3E%20%20%20,ixArea%20%28or%20sArea)) ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%20%20,dtDue)). For example, if the user wants to change the milestone, we include `sFixFor="New Milestone"`. If only one field is provided, only that field is changed (the API leaves other fields untouched for omitted parameters) ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=,)). We can also attach a note via `sEvent` if we want to record a reason for the change, though that’s optional. The FogBugz response will indicate success and return the updated case info (case details after edit).

**Output:** A confirmation that the case was updated. For example, “Case 123 updated: priority set to 2 (High).” We might return the updated fields or the whole case data as JSON text content. 

**Implementation:** Very similar to `create_case` but no multipart unless we also wanted to attach a new file (not in requirements). Likely we’ll only handle text field updates here via a simple form POST (e.g., using URL-encoded form or JSON payload). Example snippet:

```typescript
const params = new URLSearchParams();
params.append('cmd', 'edit');
params.append('token', fogbugzToken);
params.append('ixBug', args.caseId.toString());
if (args.project) params.append('sProject', args.project);
// ... and so on for area, fixFor, priority, etc.
const resp = await fetch(`${fogbugzBaseURL}/f/api/0/jsonapi`, { method: 'POST', body: params });
const result = await resp.json();
```

Afterwards, check for errors in `result`. We’d construct the response content similarly to `create_case`.

### 3. `fogbugz_assign_case` – Assigning a Case to a User  
**Description:** Assigns an existing case to a specific user. This is essentially a specialized update focused on the “Assigned To” field, but it’s common enough to merit its own tool for clarity. Assigning a case in FogBugz will generate an event (e.g. “assigned to Bob by Alice”).

**Inputs:** 
- `caseId` (required): The case number to assign.
- `assignee` (required): The user to assign to. This could be given as a FogBugz user’s full name (as it appears in FogBugz) or possibly their email or user ID. FogBugz’s API allows specifying assignees by name (`sPersonAssignedTo`) or user ID (`ixPersonAssignedTo`) ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%20%20,dtDue)). We will likely accept a name or email and find the matching user.

**FogBugz API usage:** We can use either `cmd=assign` or `cmd=edit` for this. In practice, `cmd=assign` is essentially the same as `edit` but intended specifically for changing the assignee. According to FogBugz documentation, both accept the same parameters for setting fields ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%3E%3E%20%20%20,ixArea%20%28or%20sArea)) ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%20%20,dtDue)). We might use `cmd=assign` for semantic clarity. The request will include `ixBug=<caseId>` and `sPersonAssignedTo=<Name>` (or `ixPersonAssignedTo=<ID>`). If using name, it must match exactly how FogBugz recognizes the user (e.g., “Jane Doe”). We could also consider caching or retrieving the list of persons via `cmd=listPeople`, but that may not be necessary if we assume correct input or use email which is unique.

**Output:** A confirmation, e.g. “Case 123 is now assigned to Alice Smith.” We might include the case ID and the new assignee in the result. The FogBugz API response to an assign will be the updated case details (new assignee reflected in `sPersonAssignedTo`).

**Implementation:** This is a straightforward POST similar to the edit case. Example:

```typescript
const params = new URLSearchParams();
params.append('cmd', 'assign');
params.append('token', fogbugzToken);
params.append('ixBug', caseId);
params.append('sPersonAssignedTo', assigneeName);
const res = await fetch(`${fogbugzBaseURL}/f/api/0/jsonapi`, { method: 'POST', body: params });
const result = await res.json();
```

We would check if `result` shows the assignment took effect (or handle an error if, say, the name was not recognized). On success, form a text response.

### 4. `fogbugz_list_my_cases` – Viewing Issues Assigned to a User  
**Description:** Retrieves a list of open cases assigned to a specific user. This helps an LLM (or user via LLM) query “what issues are assigned to Alice?” or “show my open issues”.

**Inputs:** 
- `assignee` (optional): The user whose cases to view. If omitted, we could default to the token’s user (if the API token is tied to a specific user, `assignedto:me` could be used, but FogBugz search supports “assignedto:me” as a relative term if the token is associated with a user context). However, for generality, we’ll expect a name or identifier.

**FogBugz API usage:** We will use `cmd=search` with a query like `assignedto:"User Name"` ([Searching in FogBugz, Syntax and the Search Axis (the Ultimate Guide for Complex FogBugz Searches) - FogBugz Support](https://support.fogbugz.com/article/53555-searching-in-fogbugz-syntax-and-the-search-axis-the-ultimate-guide-for-complex-fogbugz-searches#:~:text=,given%20value%C2%A0or%20in%20a%20range)). As noted, FogBugz’s search query syntax uses quotes around names that contain spaces ([Searching in FogBugz, Syntax and the Search Axis (the Ultimate Guide for Complex FogBugz Searches) - FogBugz Support](https://support.fogbugz.com/article/53555-searching-in-fogbugz-syntax-and-the-search-axis-the-ultimate-guide-for-complex-fogbugz-searches#:~:text=Using%20quotes)). Our server will take the provided name and construct `q=assignedto:"${name}"`. We also might add a filter like `status:active` if we only want open issues, depending on requirements (the user didn’t specify, but “view issues assigned to X” likely implies open/pending issues, not closed ones; we could make that part of the query or leave it to the user’s query input).

We should request relevant columns in the search API call. By default, FogBugz might return only basic fields. We can specify `cols` (columns) in the search request ([FogBugz API: Listing, Searching and Viewing Cases - FogBugz Support](https://fogbugz.kayako.com/article/55766-fogbugz-api-listing-searching-and-viewing-cases#:~:text=)). For example, `cols=ixBug,sTitle,sPriority,sStatus` to get the case ID, title, priority, and status for each result. The API returns a list of cases matching the query (up to a limit). We have to parse the JSON structure – likely an array of cases.

**Output:** A list of cases (probably as a text or JSON array). For readability to the user, we might format the output as a brief list such as:
- Case 101: Fix login page bug (Priority 2, Active)
- Case 202: Update docs for API (Priority 4, Active)  
and so on. 

In the MCP response, we could return this as a single text block (the LLM can digest it), or as structured JSON content. Perhaps a simple text list is fine. (The tool can still return it as `content: [{type: "text", text: "..."}]` in JSON form for the protocol ([servers/src/slack/index.ts at main · modelcontextprotocol/servers · GitHub](https://github.com/modelcontextprotocol/servers/blob/main/src/slack/index.ts#:~:text=)).)

**Implementation:** This involves constructing the query and parsing results:

```typescript
const query = assigneeName ? `assignedto:"${assigneeName}"` : 'assignedto:"' + myName + '"';
const params = new URLSearchParams({ cmd: 'search', token: fogbugzToken, q: query });
params.append('cols', 'ixBug,sTitle,sStatus,sPriority');
const res = await fetch(`${fogbugzBaseURL}/f/api/0/jsonapi`, { method: 'POST', body: params });
const result = await res.json();
// result might contain something like { cases: [ { ixBug: 101, sTitle: "Fix login...", sStatus: "Active", ixPriority: 2, ...}, ... ] }
```

We then format the `result.cases` array into a user-friendly list for output.

*(Note:* FogBugz’s search will respect the user’s permissions associated with the token. Also, if `assigneeName` doesn’t match any user, the search will just return 0 cases rather than an error.)

### 5. `fogbugz_search_cases` – Searching for Issues by Query  
**Description:** Allows arbitrary search queries on FogBugz cases. This is a general tool where the user (or the LLM on their behalf) can specify any search term, and FogBugz will return matching cases. This could be keyword search or using advanced syntax to filter by project, status, etc.

**Inputs:** 
- `query` (required): The search query string. This can be simple keywords (e.g. `"authentication bug"`), a case number or list of numbers, or a structured query with field operators (e.g. `project:"Website" status:Active "login error"`). It’s essentially whatever one would type into the FogBugz search bar.

**FogBugz API usage:** We call `cmd=search&q=<query>` ([FogBugz API: Listing, Searching and Viewing Cases - FogBugz Support](https://fogbugz.kayako.com/article/55766-fogbugz-api-listing-searching-and-viewing-cases#:~:text=)). As with the previous tool, we will likely append a `cols` parameter to get needed fields. If the query is blank or not provided (shouldn’t happen if required), FogBugz would return the current filter’s cases ([FogBugz API: Listing, Searching and Viewing Cases - FogBugz Support](https://fogbugz.kayako.com/article/55766-fogbugz-api-listing-searching-and-viewing-cases#:~:text=,cases%20in%20your%20current%20filter)), but we’ll assume the query is given. We need to ensure proper encoding of the query string (URL encode spaces, quotes, etc.). Using `URLSearchParams` or similar will handle that.

**Output:** A list of cases matching the query, similar to the output of `list_my_cases`. If many results are found, FogBugz might cap them (FogBugz API has a limit of 100,000 results for search ([FogBugz API: Listing, Searching and Viewing Cases - FogBugz Support](https://fogbugz.kayako.com/article/55766-fogbugz-api-listing-searching-and-viewing-cases#:~:text=Both%20can%20be%20used%20for,this%20limit%20cannot%20be%20increased)), which we won’t hit in normal use). We can format the top results with their ID and title, or provide a count. This tool’s output could be quite large if the query is broad, so we might implement some safety (like default `max` results parameter if needed – FogBugz’s `search` supports a `max` param for number of results ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%3E%20%3E%3E%3E%20max%20,if%20you%20want%20them%20all))). We could expose an optional limit in the tool input schema (e.g. `limit: 50`). 

**Implementation:** Similar to the list cases by assignee, but using the free-form query provided:

```typescript
const params = new URLSearchParams({ cmd: 'search', token: fogbugzToken, q: userQuery });
params.append('cols', 'ixBug,sTitle,sStatus,sPriority');
params.append('max', '50');  // for example, limit to 50 results
const res = await fetch(fogbugzURL, { method: 'POST', body: params });
const result = await res.json();
// parse result.cases array...
```

Then format the results into a response.

### 6. `fogbugz_get_case_link` – Retrieving a Direct Case URL  
**Description:** Returns the direct URL for a given FogBugz case. This is a simple utility tool – given a case ID, it constructs the link that a user (or the AI) can use to reference the case.

**Inputs:** 
- `caseId` (required): The FogBugz case number.

**FogBugz API usage:** None (not needed). We can generate the URL directly. However, we might optionally verify the case exists by doing a light API call (e.g., `cmd=view` or a targeted `search` for that case ID). But this isn’t strictly required; if we trust that the case ID is valid (perhaps obtained from a previous operation), we can just format the URL.

**Output:** The URL string, e.g., `https://example.fogbugz.com/default.asp?123` ([Getting the public access URL for a FogBugz case that was emailed in - Stack Overflow](https://stackoverflow.com/questions/35280951/getting-the-public-access-url-for-a-fogbugz-case-that-was-emailed-in#:~:text=Construct%20url%20links%20like%20this,asp%3FinsertCaseNumberHere)). We will likely return this as plain text content. The user can click it or the LLM can include it in its answer to the end-user. 

**Implementation:** Very straightforward string concatenation using the base URL passed to the server and the case ID. For completeness, we might store the base URL (ensuring it ends with a slash or not appropriately) when the server starts, and then do:

```typescript
const link = `${fogbugzBaseURL}/default.asp?${caseId}`;
```

and return that.

## Server Structure and Implementation (TypeScript)  
With the tools defined, we will now outline the structure of the TypeScript MCP server and provide example code snippets. The implementation will leverage the MCP TypeScript SDK for creating the server and handling STDIO communication.

**Project File Structure (proposed):**  
```
mcp-fogbugz-server/
├── package.json
├── src/
│   ├── index.ts        (Main entry: defines tools and starts the server)
│   ├── fogbugzApi.ts   (Helper module for calling FogBugz API, optional for clarity)
│   └── types.ts        (Type definitions for tool inputs/outputs, if needed)
├── tsconfig.json
└── README.md           (Documentation on usage)
```  
- **package.json:** Will include the package name (e.g. `"@modelcontextprotocol/server-fogbugz"` if following the naming convention) and a `bin` field so that running `npx -y @modelcontextprotocol/server-fogbugz` invokes our script. For example: `"bin": { "mcp-fogbugz": "dist/index.js" }`. This allows the MCP client to launch our server via npx.  
- **src/index.ts:** This is the core of the server. Here we will parse command-line arguments, configure the MCP server, define the tools (with their metadata and execution logic), and start listening for requests.  
- **src/fogbugzApi.ts:** This would contain functions like `createCase(params)`, `editCase(params)`, `searchCases(query)`, etc., which make the actual HTTP calls to FogBugz. This separation keeps the tool logic cleaner. We might use `node-fetch` or the built-in `fetch` if available, along with `FormData` for file uploads.  
- **src/types.ts:** We can define interface types for our tool input arguments and FogBugz API responses to keep things type-safe.

**Initializing the MCP Server:** We use the MCP SDK’s Server and Transport classes. For example:

```typescript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { CallToolRequest, ListToolsRequest } from "@modelcontextprotocol/sdk/types";

const fogbugzUrl = process.argv[2];    // e.g. "https://example.fogbugz.com"
const fogbugzToken = process.argv[3];  // API token string

if (!fogbugzUrl || !fogbugzToken) {
    console.error("Usage: mcp-fogbugz <FogBugzBaseURL> <APIToken>");
    process.exit(1);
}

// Instantiate the MCP server with STDIO transport
const server = new Server({ name: "FogBugz MCP Server", version: "1.0.0" }, { capabilities: { tools: {} } }, new StdioServerTransport());
```

Here we take the first two command-line args as the FogBugz base URL and token. If not provided, we exit with an error message. This fulfills the requirement that the server can be invoked via npx with an API key argument (and we include base URL as well, since that’s needed to know where to send API calls). For example, a user could run: 

```shell
npx -y @modelcontextprotocol/server-fogbugz https://mycompany.fogbugz.com CCECOGMBRTPJLFUVFUAAGZCEIEYAC2
``` 

and the server will start with those credentials (no prior installation needed, just one command). *Alternatively*, the base URL could be hardcoded or derived from the token in some cases, but accepting it as an argument makes the tool flexible for any FogBugz instance.

**Defining Tools Metadata:** Using the MCP SDK, we create tool definitions as JavaScript objects. Each tool will have a `name`, `description`, and an `inputSchema` (and optionally `outputSchema`) describing the parameters. We may also include example usage in the description to guide the LLM. For instance, for `fogbugz_create_case`:

```typescript
const createCaseTool: Tool = {
  name: "fogbugz_create_case",
  description: "Create a new FogBugz case with a title, description, etc. (Optionally attach an image file.)",
  inputSchema: {
    type: "object",
    properties: {
      title:      { type: "string", description: "Title or summary of the issue" },
      description:{ type: "string", description: "Detailed description of the issue", optional: true },
      project:    { type: "string", description: "Project name for the case", optional: true },
      area:       { type: "string", description: "Area name within the project", optional: true },
      milestone:  { type: "string", description: "Milestone (FixFor) name", optional: true },
      priority:   { type: ["number","string"], description: "Priority (number or name)", optional: true },
      assignee:   { type: "string", description: "Person to assign the case to", optional: true },
      attachmentPath: { type: "string", description: "Path to an image to attach", optional: true }
    },
    required: ["title"]
  }
};
```

We would do similar definitions for the other tools (`fogbugz_update_case`, `fogbugz_assign_case`, etc.), each with appropriate input schemas. (The Linear MCP server’s README provides a good analogy for how tools and their inputs can be documented ([GitHub - jerhadf/linear-mcp-server: A server that integrates Linear's project management system with the Model Context Protocol (MCP) to allow LLMs to interact with Linear.](https://github.com/jerhadf/linear-mcp-server#:~:text=1.%20,Linear%20issues)) ([GitHub - jerhadf/linear-mcp-server: A server that integrates Linear's project management system with the Model Context Protocol (MCP) to allow LLMs to interact with Linear.](https://github.com/jerhadf/linear-mcp-server#:~:text=%2A%20%60priority%60%20%28number%2C%200,Search%20issues%20with%20flexible%20filtering)).)

**Handling Tool Execution:** After defining all tools, we register handlers for MCP requests. The MCP server will receive two main types of requests: one to list available tools, and one to call a specific tool. The SDK provides schemas for these (e.g., `ListToolsRequestSchema` and `CallToolRequestSchema`). We set up something like:

```typescript
// Register the tools list
server.setRequestHandler(ListToolsRequest, async () => {
    return { tools: [ createCaseTool, updateCaseTool, assignCaseTool, listMyCasesTool, searchCasesTool, getCaseLinkTool ] };
});

// Register the tool invocation handler
server.setRequestHandler(CallToolRequest, async (req: CallToolRequest) => {
    try {
        const { name, arguments: args } = req.params;
        switch (name) {
            case "fogbugz_create_case":
                // call FogBugz API to create case
                const newCase = await FogBugzAPI.createCase(args, fogbugzUrl, fogbugzToken);
                return { content: [{ type: "text", text: JSON.stringify(newCase) }] };
            case "fogbugz_update_case":
                // call FogBugzAPI.editCase
                await FogBugzAPI.editCase(args, fogbugzUrl, fogbugzToken);
                return { content: [{ type: "text", text: `Case ${args.caseId} updated.` }] };
            case "fogbugz_assign_case":
                // call FogBugzAPI.assignCase
                await FogBugzAPI.assignCase(args.caseId, args.assignee, fogbugzUrl, fogbugzToken);
                return { content: [{ type: "text", text: `Case ${args.caseId} assigned to ${args.assignee}.` }] };
            case "fogbugz_list_my_cases":
                const cases = await FogBugzAPI.searchCases(`assignedto:"${args.assignee}"`, fogbugzUrl, fogbugzToken);
                // Format cases into a list string:
                const listText = cases.map(c => `#${c.ixBug}: ${c.sTitle} (${c.sStatus})`).join("\n");
                return { content: [{ type: "text", text: listText }] };
            case "fogbugz_search_cases":
                const found = await FogBugzAPI.searchCases(args.query, fogbugzUrl, fogbugzToken);
                // similar formatting as above
                // ...
                break;
            case "fogbugz_get_case_link":
                const link = `${fogbugzUrl}/default.asp?${args.caseId}`;
                return { content: [{ type: "text", text: link }] };
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        console.error("Error executing tool:", error);
        // Return an error response per MCP spec
        throw error;  // (The MCP SDK will handle packaging this as a JSON-RPC error)
    }
});
```

In the above pseudocode, `FogBugzAPI` is a hypothetical module (`fogbugzApi.ts`) that contains async functions for each operation, abstracting the HTTP calls. For example, `FogBugzAPI.createCase(args, url, token)` would implement the logic described earlier for `cmd=new`. We convert the results into the appropriate format for returning to the MCP client. We return content as text containing JSON or human-readable info as needed. 

Notice how we wrap the result in `content: [{ type: "text", text: ... }]` – this is because the MCP protocol expects the tool response in a content payload (which can be text, image, or other types) ([servers/src/slack/index.ts at main · modelcontextprotocol/servers · GitHub](https://github.com/modelcontextprotocol/servers/blob/main/src/slack/index.ts#:~:text=)). We choose text here (even if it’s JSON text) for simplicity, as done in the Slack server (it JSON-stringifies the response from Slack API) ([servers/src/slack/index.ts at main · modelcontextprotocol/servers · GitHub](https://github.com/modelcontextprotocol/servers/blob/main/src/slack/index.ts#:~:text=)). In the future, the MCP might support directly returning structured objects, but currently the safest way is to send it as a text that the LLM can parse.

Finally, we start the server’s event loop (if not already started). In many examples, simply instantiating the Server with StdioTransport and setting handlers is enough; the SDK might automatically begin reading STDIN for requests. If not, we would call something like `server.start()`.

**Example Usage Flow:**  
Once this server is running (e.g., launched by Claude or manually via npx), the LLM can list available tools. The MCP framework will call our `ListToolsRequest` handler, and we’ll return the definitions for `fogbugz_create_case`, `fogbugz_assign_case`, etc. The LLM can then choose to invoke them. For instance, if the user says *“Create a FogBugz ticket for the login bug and assign it to Alice”*, the LLM might call `fogbugz_create_case` with `title="Login fails for valid users"`, `description="Steps to reproduce... etc"`, `assignee="Alice Smith"`, etc. Our server executes that, and returns perhaps `{"caseId": 101, "caseURL": "https://.../default.asp?101"}` as a JSON text. The LLM sees that and can then reply to the user: *“I’ve created case #101 and assigned it to Alice. Here’s the link: ...”*. This illustrates the end-to-end integration.

## Testing and Deployment  
**Testing the MCP Server:** During development, we can test the FogBugz integration logic in isolation by using a FogBugz API sandbox or a test account. FogBugz’s API sandbox (if available) or a trial FogBugz On Demand instance could be used. We would write unit tests for `fogbugzApi.ts` functions, mocking HTTP responses for creating, editing, searching, etc., to ensure our parsing logic works. We could also run the server locally and simulate MCP requests. Anthropic provides an MCP CLI tool (e.g., `mcp-cli` or `mcp-get`) that can send test requests to an MCP server ([Example Servers - Model Context Protocol](https://modelcontextprotocol.io/examples#:~:text=Additional%20resources)). This would allow us to manually call our tools:
- e.g., send a JSON RPC request to call `fogbugz_create_case` with some arguments and observe the output. 

Integration testing with Claude (or another MCP client) is also important: we’d add our server to Claude Desktop’s config (as shown in the MCP docs, adding an entry with `command: "npx", args: ["-y", "@modelcontextprotocol/server-fogbugz", "<URL>", "<TOKEN>"]`) ([Example Servers - Model Context Protocol](https://modelcontextprotocol.io/examples#:~:text=,filesystem%22%2C%20%22%2Fpath%2Fto%2Fallowed%2Ffiles)) ([Example Servers - Model Context Protocol](https://modelcontextprotocol.io/examples#:~:text=,%7D)). Then we can interact using natural language to ensure the LLM properly understands the tool definitions and that the entire loop (user → LLM → MCP tool → FogBugz API → tool result → LLM → user) works as expected.  

**Publishing:** To share this server with others (or internally), we will publish the package to npm. We should pick a name consistent with community servers, e.g. `@modelcontextprotocol/server-fogbugz` (if contributing to the MCP community) or another scope if private. Before publishing:
- Transpile TypeScript to JavaScript (commonly via `tsc` or a bundler) so that the package ships a `dist/index.js` that is referenced by the `bin` in package.json.
- Ensure all dependencies (like `node-fetch` if used, or the MCP SDK) are in package.json. 
- Write a README with usage instructions, examples of tool usage, and any setup needed (such as where to get the FogBugz API token). Also include a note about security (the FogBugz token should be treated like a password).

Once published, users (or the Claude app) can run it with a simple npx command as shown. This aligns with how other MCP servers are distributed – **TypeScript-based servers can be invoked directly via npx** ([Example Servers - Model Context Protocol](https://modelcontextprotocol.io/examples#:~:text=TypeScript,npx)), making them easy to plug into different environments.

## Conclusion  
By following the MCP framework and FogBugz API capabilities, we have designed a comprehensive MCP server that allows LLMs to manage FogBugz issues. We mapped each required feature to FogBugz API calls and created corresponding MCP tools, with careful attention to input/output schemas and usage of FogBugz’s JSON API for efficiency. The server will handle creating cases (with file attachments via multipart upload) ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=,create%20a%20new%20case%20would)), setting and updating case fields ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%20%20,dtDue)), assigning cases to users, listing a user’s open issues, constructing direct issue links, and performing arbitrary searches on cases. 

Throughout, we leveraged FogBugz’s robust API (which provides programmatic access to almost everything you can do in the web UI ([[EM][Draft] FogBugz XML API_ Introduction[uploaded].md](file://file-RyLaruq2eRTYjBZiEUzW7S#:~:text=The%20FogBugz%20API%20makes%20it,and%20your%20other%20systems%20seamless))) and MCP’s standardized tool interface to ensure the integration is both powerful and easy for an AI to use. By structuring the server similarly to existing examples (like the Slack MCP server) and packaging it for one-command execution, it should be straightforward to deploy and use in practice. 

With proper testing and documentation in place, this new FogBugz MCP server will enable scenarios such as an AI assistant auto-filing bug reports with screenshots, triaging and assigning incoming issues to the correct developer, or answering user queries about the state of the project’s bugs – all through the FogBugz system, mediated by the MCP tool interface. 

**Sources:**

- FogBugz API supports both XML and JSON formats with the same commands ([FogBugz API: Listing, Searching and Viewing Cases - FogBugz Support](https://fogbugz.kayako.com/article/55766-fogbugz-api-listing-searching-and-viewing-cases#:~:text=FogBugz%20supports%20both%20XML%20API,JSON%20API%20using%C2%A0the%20same%20parameters)).  
- FogBugz `cmd=new` and `cmd=edit` allow setting case fields like title, project, area, milestone, etc. ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=%3E%3E%20%20%20,dtDue)).  
- File attachments require multipart form data and an `nFileCount` parameter ([

	FogBugz 7.0 Online Documentation - FogBugz XML API version 7

](https://webapps-support.ccts.uic.edu/help/topics/advanced/API.html#:~:text=,create%20a%20new%20case%20would)).  
- FogBugz `cmd=search` uses the same query syntax as the web UI (e.g., `assignedto:"Name"` for assignee) ([FogBugz API: Listing, Searching and Viewing Cases - FogBugz Support](https://fogbugz.kayako.com/article/55766-fogbugz-api-listing-searching-and-viewing-cases#:~:text=,12%2C25%2C556)) ([Searching in FogBugz, Syntax and the Search Axis (the Ultimate Guide for Complex FogBugz Searches) - FogBugz Support](https://support.fogbugz.com/article/53555-searching-in-fogbugz-syntax-and-the-search-axis-the-ultimate-guide-for-complex-fogbugz-searches#:~:text=,given%20value%C2%A0or%20in%20a%20range)).  
- Constructing a direct case URL can be done via `default.asp?<CaseID>` on the FogBugz site ([Getting the public access URL for a FogBugz case that was emailed in - Stack Overflow](https://stackoverflow.com/questions/35280951/getting-the-public-access-url-for-a-fogbugz-case-that-was-emailed-in#:~:text=Construct%20url%20links%20like%20this,asp%3FinsertCaseNumberHere)).  
- Model Context Protocol allows exposing tools for LLMs; each tool has a name and schema and can be invoked by the model ([Tools – Model Context Protocol Specification](https://spec.modelcontextprotocol.io/specification/2024-11-05/server/tools/#:~:text=The%20Model%20Context%20Protocol%20,includes%20metadata%20describing%20its%20schema)).  
- MCP servers (TypeScript) can be distributed via npm and run with `npx` easily ([Example Servers - Model Context Protocol](https://modelcontextprotocol.io/examples#:~:text=TypeScript,npx)).