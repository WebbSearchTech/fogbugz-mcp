# Source Control

## Overview

The Source Control commands in the FogBugz JSON API allow you to integrate your version control system with FogBugz, associating code check-ins with specific cases. This integration provides traceability between code changes and issue tracking, making it easier to understand which code changes were made to address specific bugs or features.

## Available Commands

### 1. Associating a Check-in with a Case

To associate a new check-in with a given FogBugz case, use the `newCheckin` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `newCheckin` |
| `token` | string | API authentication token |
| `ixBug` | integer | ID of the case to associate the check-in with |
| `sFile` | string | The name of the file being checked in |
| `sPrev` | string | The pre-checkin revision number |
| `sNew` | string | The post-checkin revision number |
| `ixRepository` | integer | The ID of the source control repository in which this file is located |
| `sRepo` | string | *Deprecated*. In versions of FogBugz before 7.0, this field indicated the file's repository. Included for backwards-compatibility. Do not use with new repositories. |

#### Example Request

```json
{
  "cmd": "newCheckin",
  "token": "your_api_token",
  "ixBug": 123,
  "sFile": "src/api/jsonapi.js",
  "sPrev": "12345",
  "sNew": "12346",
  "ixRepository": 2
}
```

#### Example Response

```json
{
  "data": {
    "checkin": {
      "ixCVS": 789,
      "ixBug": 123,
      "sFile": "src/api/jsonapi.js",
      "sPrev": "12345",
      "sNew": "12346",
      "sRepo": "",
      "ixRepository": 2
    }
  }
}
```

### 2. Listing Check-ins for a Case

To list all of the check-ins that have been associated with a specific case, use the `listCheckins` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listCheckins` |
| `token` | string | API authentication token |
| `ixBug` | integer | ID of the case to list check-ins for |

#### Example Request

```json
{
  "cmd": "listCheckins",
  "token": "your_api_token",
  "ixBug": 123
}
```

#### Example Response

```json
{
  "data": {
    "checkins": [
      {
        "ixCVS": 789,
        "ixBug": 123,
        "sFile": "src/api/jsonapi.js",
        "sPrev": "12345",
        "sNew": "12346",
        "sRepo": "",
        "ixRepository": 2
      },
      {
        "ixCVS": 790,
        "ixBug": 123,
        "sFile": "src/api/jsonapi.test.js",
        "sPrev": "5678",
        "sNew": "5679",
        "sRepo": "",
        "ixRepository": 2
      }
    ]
  }
}
```

## Check-in Fields

Each check-in contains the following elements:

| Field | Description |
|-------|-------------|
| `ixCVS` | Unique ID for this check-in |
| `ixBug` | Case ID this check-in is associated with |
| `sFile` | Name of the file that was checked in |
| `sPrev` | Pre-checkin revision number |
| `sNew` | Post-checkin revision number |
| `sRepo` | Repository identifier (deprecated) |
| `ixRepository` | Repository ID |

## Integration with Source Control Systems

FogBugz can integrate with various source control systems:

1. You can use the FogBugz API to associate check-ins from any version control system with FogBugz cases
2. For deeper integration with specific source control systems, FogBugz provides additional tools and plugins
3. When using Kiln (formerly FogCreek's version control system), the integration is even more seamless

## Usage Notes

1. When referencing cases in commit messages, you can include case numbers (e.g., "Fix for case #123") to have the check-in automatically associated with that case in some integrations.
2. For custom source control integrations, you can use webhook triggers to call the `newCheckin` API endpoint when code is committed.
3. The `sRepo` parameter is deprecated and included only for backwards compatibility with older FogBugz versions. Always use the `ixRepository` parameter for new integrations.
4. When viewing a case in the FogBugz UI, all associated check-ins will be displayed in the case history, providing a comprehensive view of both the issue and its resolution.
5. For the best integration experience, consider using FogBugz webhooks in combination with the source control API to automate the connection between code commits and case tracking.
