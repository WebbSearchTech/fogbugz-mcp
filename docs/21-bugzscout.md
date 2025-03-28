# BugzScout

## Overview
BugzScout is a tool for automatic crash reporting in applications. It allows applications to automatically report crashes to FogBugz, which creates or updates cases based on unique crash signatures. The JSON API provides commands to list BugzScout cases, create new ones, and update existing ones.

## Available Commands

### 1. List BugzScout Cases
Retrieves information about BugzScout cases with a specific crash signature.

#### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listScoutCase` |
| `sScoutDescription` | string | Description that uniquely identifies a crash signature (limited to 255 characters) |

#### Example Request
```json
{
  "cmd": "listScoutCase",
  "token": "your_api_token",
  "sScoutDescription": "crash in CMyClass.GetData() at line 125 - version 2.5.44"
}
```

#### Example Response
```json
{
  "data": {
    "case": {
      "ixBug": 5184,
      "sScoutMessage": "Please update to the latest version of the application.",
      "fScoutStopReporting": false,
      "sScoutDescription": "crash in CMyClass.GetData() at line 125 - version 2.5.44",
      "dtLastOccurrence": "2025-03-25T19:54:58Z"
    }
  }
}
```

### 2. Creating a BugzScout Case
To create a new BugzScout case, use the standard case creation command (`new`) with BugzScout-specific fields.

#### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `new` |
| `sTitle` | string | Title for the case |
| `sScoutDescription` | string | Unique identifier for the crash (limited to 255 characters) |
| `sScoutMessage` | string | *Optional*. Message to display to users when this crash occurs |
| `sEvent` | string | Description of the crash, can include stack trace information |
| `ixProject` | integer | Project ID where the case should be created |
| `ixArea` | integer | Area ID within the project |
| `fScoutStopReporting` | boolean | *Optional*. Set to `1` to stop recording occurrences of this crash (default: `0`) |

#### Example Request
```json
{
  "cmd": "new",
  "token": "your_api_token",
  "sTitle": "Application crash in data processing module",
  "sScoutDescription": "crash in DataProcessor.processRecord() at line 217 - version 3.1.2",
  "sScoutMessage": "The development team has been notified of this issue and is working on a fix.",
  "sEvent": "User was processing a large data file when the application crashed.\nStack trace: DataProcessor.processRecord() at line 217",
  "ixProject": 5,
  "ixArea": 8,
  "fScoutStopReporting": 0
}
```

#### Example Response
```json
{
  "data": {
    "case": {
      "ixBug": 5185
    }
  }
}
```

### 3. Updating a BugzScout Case
To update an existing BugzScout case, use the standard case editing command (`edit`) with BugzScout-specific fields.

#### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `edit` |
| `ixBug` | integer | Case ID to update |
| `sScoutMessage` | string | *Optional*. New message to display to users when this crash occurs |
| `fScoutStopReporting` | boolean | *Optional*. Set to `1` to stop recording occurrences of this crash, `0` to continue |

#### Example Request
```json
{
  "cmd": "edit",
  "token": "your_api_token",
  "ixBug": 5184,
  "sScoutMessage": "This issue has been resolved in version 3.1.3. Please update your application.",
  "fScoutStopReporting": 1
}
```

#### Example Response
```json
{
  "data": {}
}
```

### 4. Searching for BugzScout Cases
To search for BugzScout cases, use the standard search command and include BugzScout-specific fields in the columns.

#### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `search` |
| `q` | string | Search query (can be empty to get all cases) |
| `cols` | string | Include BugzScout fields: `sScoutDescription`, `sScoutMessage`, `fScoutStopReporting`, `dtLastOccurrence` |

#### Example Request
```json
{
  "cmd": "search",
  "token": "your_api_token",
  "q": "",
  "cols": "ixBug,sTitle,sScoutDescription,sScoutMessage,fScoutStopReporting,dtLastOccurrence"
}
```

#### Example Response
```json
{
  "data": {
    "cases": [
      {
        "ixBug": 5184,
        "sTitle": "Application crashes when processing large files",
        "sScoutDescription": "crash in CMyClass.GetData() at line 125 - version 2.5.44",
        "sScoutMessage": "This issue has been resolved in version 3.1.3. Please update your application.",
        "fScoutStopReporting": true,
        "dtLastOccurrence": "2025-03-25T19:54:58Z"
      }
    ]
  }
}
```

## Field Descriptions
| Field | Description |
|-------|-------------|
| `sScoutDescription` | A unique identifier for a specific crash or issue (limited to 255 characters) |
| `sScoutMessage` | Message to display to users when this crash occurs |
| `fScoutStopReporting` | Boolean indicating whether to stop recording occurrences of this crash |
| `dtLastOccurrence` | Date and time when this crash was last reported |

## Usage Notes
1. BugzScout is designed for automatic crash reporting in applications. When an application crashes, it can report the crash to FogBugz using the BugzScout API.
2. The `sScoutDescription` field is crucial for identifying unique crash signatures. When a crash occurs with a signature (sScoutDescription) that matches an existing case, FogBugz increments the occurrence counter rather than creating a duplicate case.
3. You can configure whether to continue or stop recording occurrences of a specific crash using the `fScoutStopReporting` field.
4. The `sScoutMessage` field can be used to provide end users with information about the crash, such as whether the issue is known, if there are workarounds, or if an update is available.
5. When using the `listScoutCase` command, you must provide an `sScoutDescription` to find cases with a matching crash signature.
6. BugzScout cases are regular FogBugz cases with additional fields, so they can be assigned, resolved, and closed like any other case.
7. The `dtLastOccurrence` field indicates when the crash was most recently reported, which can help prioritize which issues to fix first.
