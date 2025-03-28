# Working Schedule

## Overview

The Working Schedule commands in the FogBugz JSON API allow you to access and modify a person's working schedule, calculate dates based on working hours, and manage project time allocations. These features are essential for resource planning, workload balancing, and accurate time estimation.

## Available Commands

### 1. Listing Working Schedules

To retrieve the working schedule for a particular person, use the `listWorkingSchedule` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listWorkingSchedule` |
| `token` | string | API authentication token |
| `ixPerson` | integer | Optional. Person ID to get working schedule for. If omitted, returns the working schedule for the logged-in user. If set to 1, returns the site-wide working schedule. |

#### Example Request

```json
{
  "cmd": "listWorkingSchedule",
  "token": "your_api_token",
  "ixPerson": 5
}
```

#### Example Response

```json
{
  "data": {
    "workingSchedule": {
      "ixPerson": 5,
      "nHoursPerDay": 8,
      "nWorkdayStarts": 9,
      "nWorkdayEnds": 17,
      "fHasLunch": true,
      "nLunchStarts": 12,
      "hrsLunchLength": 0.5,
      "dtLastUpdated": "2023-07-28T15:22:14Z",
      "rgWorkDays": {
        "sunday": false,
        "monday": true,
        "tuesday": true,
        "wednesday": true,
        "thursday": true,
        "friday": true,
        "saturday": false
      }
    }
  }
}
```

### 2. Calculating Dates from Working Hours

To calculate a date by adding a specific number of working hours to a given date, use the `wsDateFromHours` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `wsDateFromHours` |
| `token` | string | API authentication token |
| `ixPerson` | integer | Optional. Person ID to use working schedule from. If omitted, uses the logged-in user's schedule. |
| `hrs` | number | Number of working hours to add to the date |
| `dt` | string | UTC date to start from (ISO 8601 format) |

#### Example Request

```json
{
  "cmd": "wsDateFromHours",
  "token": "your_api_token",
  "hrs": 16,
  "dt": "2023-07-28T14:00:00Z"
}
```

#### Example Response

```json
{
  "data": {
    "dt": "2023-08-01T14:00:00Z"
  }
}
```

### 3. Listing Per-Project Time Allocations

To list the protected project time allocations for a person, use the `listProjectPercentTime` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listProjectPercentTime` |
| `token` | string | API authentication token |
| `ixPerson` | integer | Optional. Person ID to get project time allocations for. If omitted, returns data for the logged-in user. |

#### Example Request

```json
{
  "cmd": "listProjectPercentTime",
  "token": "your_api_token"
}
```

#### Example Response

```json
{
  "data": {
    "projectpercenttimes": [
      {
        "m_nPercentLast": 0,
        "ixProjectPercentTime": 3,
        "ixPerson": 5,
        "ixProject": 7,
        "nPercent": 25
      },
      {
        "m_nPercentLast": 0,
        "ixProjectPercentTime": 8,
        "ixPerson": 5,
        "ixProject": 9,
        "nPercent": 15
      }
    ],
    "nPercentTimeAllOtherProjects": 60
  }
}
```

### 4. Adding Project Protection

To allocate a percentage of a person's time to a specific project, use the `addProjectPercentTime` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `addProjectPercentTime` |
| `token` | string | API authentication token |
| `ixProject` | integer | Project ID to protect |
| `nPercent` | integer | Percentage of time to allocate to this project (0-100) |

#### Example Request

```json
{
  "cmd": "addProjectPercentTime",
  "token": "your_api_token",
  "ixProject": 7,
  "nPercent": 25
}
```

#### Example Response

```json
{
  "data": {
    "projectpercenttime": {
      "m_nPercentLast": 0,
      "ixProjectPercentTime": 12,
      "ixPerson": 5,
      "ixProject": 7,
      "nPercent": 25
    },
    "nPercentTimeAllOtherProjects": 75
  }
}
```

### 5. Editing Project Protection

To modify an existing project time allocation, use the `editProjectPercentTime` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `editProjectPercentTime` |
| `token` | string | API authentication token |
| `ixProjectPercentTime` | integer | ID of the project time allocation to modify |
| `nPercent` | integer | New percentage of time to allocate (0-100) |

#### Example Request

```json
{
  "cmd": "editProjectPercentTime",
  "token": "your_api_token",
  "ixProjectPercentTime": 12,
  "nPercent": 30
}
```

#### Example Response

```json
{
  "data": {
    "projectpercenttime": {
      "m_nPercentLast": 25,
      "ixProjectPercentTime": 12,
      "ixPerson": 5,
      "ixProject": 7,
      "nPercent": 30
    },
    "nPercentTimeAllOtherProjects": 70
  }
}
```

### 6. Removing Project Protection

To remove a project time allocation, use the `deleteProjectPercentTime` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `deleteProjectPercentTime` |
| `token` | string | API authentication token |
| `ixProjectPercentTime` | integer | ID of the project time allocation to remove |

#### Example Request

```json
{
  "cmd": "deleteProjectPercentTime",
  "token": "your_api_token",
  "ixProjectPercentTime": 12
}
```

#### Example Response

```json
{
  "data": {
    "projectpercenttimes": [
      {
        "m_nPercentLast": 0,
        "ixProjectPercentTime": 8,
        "ixPerson": 5,
        "ixProject": 9,
        "nPercent": 15
      }
    ],
    "nPercentTimeAllOtherProjects": 85
  }
}
```

## Working Schedule Fields

The working schedule contains the following elements:

| Field | Description |
|-------|-------------|
| `ixPerson` | Person ID who owns this schedule |
| `nHoursPerDay` | Number of hours in a workday actually devoted to work |
| `nWorkdayStarts` | Military hour when workday starts (e.g., 9 for 9:00 AM) |
| `nWorkdayEnds` | Military hour when workday ends (e.g., 17 for 5:00 PM) |
| `fHasLunch` | Boolean indicating whether time off for lunch is factored in |
| `nLunchStarts` | Military hour when lunch starts |
| `hrsLunchLength` | Number of hours for lunch break |
| `dtLastUpdated` | Date when the schedule was last modified |
| `rgWorkDays` | Object containing boolean values for each day of the week, indicating whether it's a workday |

## Project Time Allocation Fields

The project time allocations contain the following elements:

| Field | Description |
|-------|-------------|
| `ixProjectPercentTime` | Unique ID for this time allocation |
| `ixPerson` | Person ID this allocation applies to |
| `ixProject` | Project ID this allocation applies to |
| `nPercent` | Percentage of time allocated to this project (0-100) |
| `m_nPercentLast` | Previous percentage value before the most recent change |
| `nPercentTimeAllOtherProjects` | Percentage available for all unprotected projects |

## Usage Notes

1. Project time allocations help ensure that a person's time is properly distributed across important projects
2. The sum of all project allocations cannot exceed 100%
3. The system automatically calculates `nPercentTimeAllOtherProjects` as 100% minus the sum of all protected projects
4. When using `wsDateFromHours`, the system respects the working schedule, including working days and hours
5. For example, adding 8 hours to Friday at 4:00 PM would result in Monday at 3:00 PM (assuming Monday-Friday workweek)
