# Creating

## XML API

In the XML API, you can create various entities in FogBugz using specific commands:

- `newProject`: Create a new project
- `newArea`: Create a new area
- `newPerson`: Create a new person
- `newFixFor`: Create a new milestone

Each command accepts specific parameters to configure the entity being created.

## JSON API Equivalent

The JSON API provides the same commands for creating FogBugz entities, using a JSON request format.

### 1. Create a New Project

#### Request

```json
{
  "cmd": "newProject",
  "token": "your_api_token",
  "sProject": "New Project Name",
  "ixPersonPrimaryContact": 2,
  "fAllowPublicSubmit": false,
  "fInbox": false
}
```

#### Response

```json
{
  "data": {
    "project": {
      "ixProject": 5,
      "sProject": "New Project Name",
      "ixPersonOwner": 2,
      "fInbox": false,
      "fDeleted": false
    }
  },
  "errors": [],
  "warnings": []
}
```

### 2. Create a New Area

#### Request

```json
{
  "cmd": "newArea",
  "token": "your_api_token",
  "ixProject": 5,
  "sArea": "New Area Name",
  "ixPersonPrimaryContact": 3
}
```

#### Response

```json
{
  "data": {
    "area": {
      "ixArea": 8,
      "sArea": "New Area Name",
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

### 3. Create a New Person

#### Request

```json
{
  "cmd": "newPerson",
  "token": "your_api_token",
  "sEmail": "user@example.com",
  "sFullname": "John Smith",
  "nType": 0,
  "fActive": true,
  "sPassword": "SecurePassword123",
  "sLocale": "en-us",
  "sLanguage": "en-us",
  "sTimeZoneKey": "Eastern Standard Time",
  "fNotify": true
}
```

#### Response

```json
{
  "data": {
    "person": {
      "ixPerson": 7,
      "sFullName": "John Smith",
      "sEmail": "user@example.com",
      "fAdministrator": false,
      "fCommunity": false,
      "fVirtual": false,
      "fDeleted": false,
      "fNotify": true
    }
  },
  "errors": [],
  "warnings": []
}
```

### 4. Create a New Milestone (FixFor)

#### Request

```json
{
  "cmd": "newFixFor",
  "token": "your_api_token",
  "ixProject": 5,
  "sFixFor": "Version 1.0",
  "dtRelease": "2023-12-31T00:00:00Z",
  "dtStart": "2023-06-01T00:00:00Z",
  "sStartNote": "Development begins after resources are allocated",
  "fAssignable": true
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

## Parameters for Each Command

### newProject

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sProject` | String | Yes | Project title |
| `ixPersonPrimaryContact` | Integer | No | Primary contact for the project |
| `fAllowPublicSubmit` | Boolean | No | Allow public submissions |
| `fInbox` | Boolean | No | Is this an inbox project |

### newArea

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ixProject` | Integer | Yes | Project ID to create area in |
| `sArea` | String | Yes | Area title |
| `ixPersonPrimaryContact` | Integer | No | Primary contact (use -1 for project's contact) |

### newPerson

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sEmail` | String | Yes | Email address |
| `sFullname` | String | Yes | Full name |
| `nType` | Integer | No | User type: 0=normal, 1=admin, 2=community, 3=virtual |
| `fActive` | Boolean | No | Whether the user is active |
| `sPassword` | String | No | Password (random if omitted) |
| `sLocale` | String | No | Locale for date/number formats |
| `sLanguage` | String | No | UI language |
| `sTimeZoneKey` | String | No | Time zone key |
| `sSnippetKey` | String | No | Snippet key |
| `fNotify` | Boolean | No | Whether the user receives notifications |
| `sPhone` | String | No | Phone number |
| `sHomepage` | String | No | Homepage URL |
| `fDeleted` | Boolean | No | Whether the user is inactive |

### newFixFor

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ixProject` | Integer | Yes | Project ID (use -1 for global milestone) |
| `sFixFor` | String | Yes | Milestone name |
| `dtRelease` | String | No | Release date (ISO 8601 format) |
| `dtStart` | String | No | Start date (ISO 8601 format) |
| `sStartNote` | String | No | Start note |
| `fAssignable` | Boolean | No | Whether the milestone is assignable |

## Example with curl

```bash
# Create a new project
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "newProject",
    "token": "your_api_token",
    "sProject": "New Project Name",
    "fInbox": false,
    "fAllowPublicSubmit": false
}'

# Create a new area in a project
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "newArea",
    "token": "your_api_token",
    "ixProject": 5,
    "sArea": "New Area Name",
    "ixPersonPrimaryContact": -1
}'
```

## Example with JavaScript

```javascript
const axios = require('axios');

// Create a new project
async function createProject(apiUrl, token, name, options = {}) {
  try {
    const response = await axios.post(apiUrl, {
      cmd: 'newProject',
      token: token,
      sProject: name,
      fInbox: options.fInbox || false,
      fAllowPublicSubmit: options.fAllowPublicSubmit || false,
      ixPersonPrimaryContact: options.ixPersonPrimaryContact
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data.project;
  } catch (error) {
    console.error('Error creating project:', error.response?.data || error.message);
    return null;
  }
}

// Create a new area in a project
async function createArea(apiUrl, token, projectId, name, primaryContact = -1) {
  try {
    const response = await axios.post(apiUrl, {
      cmd: 'newArea',
      token: token,
      ixProject: projectId,
      sArea: name,
      ixPersonPrimaryContact: primaryContact
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data.area;
  } catch (error) {
    console.error('Error creating area:', error.response?.data || error.message);
    return null;
  }
}

// Create a new person
async function createPerson(apiUrl, token, email, fullName, options = {}) {
  try {
    const response = await axios.post(apiUrl, {
      cmd: 'newPerson',
      token: token,
      sEmail: email,
      sFullname: fullName,
      nType: options.nType || 0,
      fActive: options.fActive !== undefined ? options.fActive : true,
      sPassword: options.sPassword,
      sLocale: options.sLocale,
      sLanguage: options.sLanguage,
      sTimeZoneKey: options.sTimeZoneKey,
      fNotify: options.fNotify !== undefined ? options.fNotify : true
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data.person;
  } catch (error) {
    console.error('Error creating person:', error.response?.data || error.message);
    return null;
  }
}

// Create a new milestone
async function createMilestone(apiUrl, token, projectId, name, options = {}) {
  try {
    const response = await axios.post(apiUrl, {
      cmd: 'newFixFor',
      token: token,
      ixProject: projectId,
      sFixFor: name,
      dtRelease: options.dtRelease,
      dtStart: options.dtStart,
      sStartNote: options.sStartNote,
      fAssignable: options.fAssignable !== undefined ? options.fAssignable : true
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data.fixfor;
  } catch (error) {
    console.error('Error creating milestone:', error.response?.data || error.message);
    return null;
  }
}
```

## Notes

1. The JSON API uses proper boolean values (`true`/`false`) instead of "0"/"1" as in the XML API.
2. All entity creation commands return the created entity's details, including its ID.
3. When creating a person, if you omit the `sPassword` parameter, a random password will be generated.
4. For milestones, you can create a global milestone that isn't tied to a specific project by setting `ixProject` to `-1`.
5. When creating an area, you can use `-1` for the `ixPersonPrimaryContact` parameter to use the project's primary contact.
6. All dates should be in ISO 8601 format (e.g., `2023-12-31T00:00:00Z`).
7. The `nType` parameter for creating a person accepts: 0 for normal user, 1 for administrator, 2 for community user, and 3 for virtual user.
