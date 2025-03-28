# Views

## XML API

In the XML API, you can view details of various entities using specific commands:

- `viewProject`: Display information about a project
- `viewArea`: Display information about an area
- `viewPerson`: Display information about a person
- `viewFixFor`: Display information about a milestone
- `viewCategory`: Display information about a category
- `viewPriority`: Display information about a priority
- `viewStatus`: Display information about a status
- `viewMailbox`: Display information about a mailbox
- `viewTemplate`: Display information about a template

Each command requires specific parameters to identify the entity.

## JSON API Equivalent

The JSON API provides the same commands for viewing specific entity details, using a JSON request format.

### 1. View a Project

#### Request

```json
{
  "cmd": "viewProject",
  "token": "your_api_token",
  "ixProject": 5
}
```

Alternatively, you can use the project name:

```json
{
  "cmd": "viewProject",
  "token": "your_api_token",
  "sProject": "My Project"
}
```

#### Response

```json
{
  "data": {
    "project": {
      "ixProject": 5,
      "sProject": "My Project",
      "ixPersonOwner": 2,
      "fInbox": false,
      "fDeleted": false,
      "sPublicSubmitEmail": ""
    }
  },
  "errors": [],
  "warnings": []
}
```

### 2. View an Area

#### Request

```json
{
  "cmd": "viewArea",
  "token": "your_api_token",
  "ixArea": 8
}
```

Alternatively, you can use the area name and project:

```json
{
  "cmd": "viewArea",
  "token": "your_api_token",
  "sArea": "Frontend",
  "ixProject": 5
}
```

#### Response

```json
{
  "data": {
    "area": {
      "ixArea": 8,
      "sArea": "Frontend",
      "ixProject": 5,
      "ixPersonOwner": 3,
      "nType": 0,
      "cDoc": 0,
      "fDeleted": false
    }
  },
  "errors": [],
  "warnings": []
}
```

### 3. View a Person

#### Request

```json
{
  "cmd": "viewPerson",
  "token": "your_api_token",
  "ixPerson": 3
}
```

Alternatively, you can use the email address:

```json
{
  "cmd": "viewPerson",
  "token": "your_api_token",
  "sEmail": "user@example.com"
}
```

If no person is specified, returns information about the currently logged-in user:

```json
{
  "cmd": "viewPerson",
  "token": "your_api_token"
}
```

#### Response

```json
{
  "data": {
    "person": {
      "ixPerson": 3,
      "sFullName": "Jane Smith",
      "sEmail": "user@example.com",
      "sPhone": "555-1234",
      "fAdministrator": false,
      "fCommunity": false,
      "fVirtual": false,
      "fDeleted": false,
      "sHomepage": "https://example.com",
      "sLocale": "en-us",
      "sLanguage": "en-us",
      "sTimeZoneKey": "Eastern Standard Time",
      "sSnippetKey": "`",
      "ixBugWorkingOn": 0,
      "nType": 0
    }
  },
  "errors": [],
  "warnings": []
}
```

### 4. View a Milestone (FixFor)

#### Request

```json
{
  "cmd": "viewFixFor",
  "token": "your_api_token",
  "ixFixFor": 4
}
```

Alternatively, you can use the milestone name and project:

```json
{
  "cmd": "viewFixFor",
  "token": "your_api_token",
  "sFixFor": "Version 1.0",
  "ixProject": 5
}
```

#### Response

```json
{
  "data": {
    "fixfor": {
      "ixFixFor": 4,
      "sFixFor": "Version 1.0",
      "fInactive": false,
      "dt": "2023-12-31T00:00:00Z",
      "ixProject": 5,
      "dtStart": "2023-06-01T00:00:00Z",
      "sStartNote": "Development begins after resources are allocated",
      "setixFixForDependency": ""
    }
  },
  "errors": [],
  "warnings": []
}
```

### 5. View a Category

#### Request

```json
{
  "cmd": "viewCategory",
  "token": "your_api_token",
  "ixCategory": 1
}
```

#### Response

```json
{
  "data": {
    "category": {
      "ixCategory": 1,
      "sCategory": "Bug",
      "sPlural": "Bugs",
      "ixStatusDefault": 2,
      "fIsScheduleItem": false,
      "fDeleted": false,
      "iOrder": 1,
      "nIconType": 1,
      "ixAttachmentIcon": 0,
      "ixStatusDefaultActive": 1
    }
  },
  "errors": [],
  "warnings": []
}
```

### 6. View a Priority

#### Request

```json
{
  "cmd": "viewPriority",
  "token": "your_api_token",
  "ixPriority": 1
}
```

#### Response

```json
{
  "data": {
    "priority": {
      "ixPriority": 1,
      "sPriority": "Must Fix"
    }
  },
  "errors": [],
  "warnings": []
}
```

### 7. View a Status

#### Request

```json
{
  "cmd": "viewStatus",
  "token": "your_api_token",
  "ixStatus": 2
}
```

Alternatively, you can use the status name and category:

```json
{
  "cmd": "viewStatus",
  "token": "your_api_token",
  "sStatus": "Resolved (Fixed)",
  "ixCategory": 1
}
```

#### Response

```json
{
  "data": {
    "status": {
      "ixStatus": 2,
      "sStatus": "Resolved (Fixed)",
      "ixCategory": 1,
      "fWorkDone": true,
      "fResolved": true,
      "fDuplicate": false,
      "fDeleted": false,
      "iOrder": 0
    }
  },
  "errors": [],
  "warnings": []
}
```

### 8. View a Mailbox

#### Request

```json
{
  "cmd": "viewMailbox",
  "token": "your_api_token",
  "ixMailbox": 1
}
```

#### Response

```json
{
  "data": {
    "mailbox": {
      "ixMailbox": 1,
      "sEmail": "\"Support\" <support@example.com>",
      "sEmailUser": "\"Jane Smith\" <support@example.com>",
      "sTemplate": "-- \nSincerely,\nSupport Team"
    }
  },
  "errors": [],
  "warnings": []
}
```

### 9. View a Template

#### Request

```json
{
  "cmd": "viewTemplate",
  "token": "your_api_token",
  "ixTemplate": 1
}
```

#### Response

```json
{
  "data": {
    "template": {
      "sTemplate": "Default Template",
      "sBodyHTML": "...(HTML content)...",
      "sBodyCSS": "...(CSS content)...",
      "nRevision": 3,
      "fReadOnly": false,
      "fDefault": true
    }
  },
  "errors": [],
  "warnings": []
}
```

## Example with curl

```bash
# View a project
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "viewProject",
    "token": "your_api_token",
    "ixProject": 5
}'

# View the current user
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "viewPerson",
    "token": "your_api_token"
}'
```

## Example with JavaScript

```javascript
const axios = require('axios');

// Generic function to view an entity
async function viewEntity(apiUrl, token, entityType, identifier) {
  try {
    // Map entity types to commands and parameter names
    const cmdMap = {
      'project': { cmd: 'viewProject', idParam: 'ixProject', nameParam: 'sProject' },
      'area': { cmd: 'viewArea', idParam: 'ixArea', nameParam: 'sArea' },
      'person': { cmd: 'viewPerson', idParam: 'ixPerson', nameParam: 'sEmail' },
      'milestone': { cmd: 'viewFixFor', idParam: 'ixFixFor', nameParam: 'sFixFor' },
      'category': { cmd: 'viewCategory', idParam: 'ixCategory', nameParam: null },
      'priority': { cmd: 'viewPriority', idParam: 'ixPriority', nameParam: null },
      'status': { cmd: 'viewStatus', idParam: 'ixStatus', nameParam: 'sStatus' },
      'mailbox': { cmd: 'viewMailbox', idParam: 'ixMailbox', nameParam: null },
      'template': { cmd: 'viewTemplate', idParam: 'ixTemplate', nameParam: null }
    };
    
    if (!cmdMap[entityType]) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }
    
    const { cmd, idParam, nameParam } = cmdMap[entityType];
    const params = { cmd, token };
    
    // If identifier is a number, use it as an ID; otherwise, use it as a name
    if (typeof identifier === 'number') {
      params[idParam] = identifier;
    } else if (typeof identifier === 'string' && nameParam) {
      params[nameParam] = identifier;
    } else if (identifier === undefined) {
      // For viewPerson with no identifier, it returns the current user
      if (entityType !== 'person') {
        throw new Error(`An identifier is required for ${entityType}`);
      }
    } else {
      throw new Error(`Invalid identifier for ${entityType}: ${identifier}`);
    }
    
    // Additional parameters for entities that require them
    if (entityType === 'area' && typeof identifier === 'string') {
      params.ixProject = additionalParams.ixProject;
    } else if (entityType === 'status' && typeof identifier === 'string') {
      params.ixCategory = additionalParams.ixCategory;
    } else if (entityType === 'milestone' && typeof identifier === 'string') {
      params.ixProject = additionalParams.ixProject;
    }
    
    const response = await axios.post(apiUrl, params, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Map response property names based on entity type
    const responsePropertyMap = {
      'milestone': 'fixfor',
      'status': 'status',
      'project': 'project',
      'area': 'area',
      'person': 'person',
      'category': 'category',
      'priority': 'priority',
      'mailbox': 'mailbox',
      'template': 'template'
    };
    
    const propertyName = responsePropertyMap[entityType];
    return response.data.data[propertyName];
  } catch (error) {
    console.error(`Error viewing ${entityType}:`, error.response?.data || error.message);
    return null;
  }
}

// Example usage
async function getProjectDetails(apiUrl, token, projectId) {
  return await viewEntity(apiUrl, token, 'project', projectId);
}

async function getCurrentUser(apiUrl, token) {
  return await viewEntity(apiUrl, token, 'person');
}
```

## Notes

1. The JSON API view commands return detailed information about specific entities.
2. Most entities can be identified by either ID or name.
3. Some commands (like `viewArea` with a name) require additional parameters to uniquely identify the entity.
4. The `viewPerson` command without an identifier returns information about the currently logged-in user.
5. The response format uses a consistent structure with a `data` object containing the entity information.
6. The property name in the response matches the entity type (e.g., `project`, `area`, `person`, etc.).
7. These commands are useful for retrieving detailed information about specific entities when you already know their IDs or names.
