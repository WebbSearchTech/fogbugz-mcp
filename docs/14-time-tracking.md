# Time Tracking

## Overview

The Time Tracking commands in the FogBugz JSON API allow you to start and stop timing work on cases, import time intervals that already occurred, and retrieve time interval information. This functionality is essential for tracking hours spent on cases, billing, and analyzing resource allocation.

## Available Commands

### 1. Starting Work on a Case

To start working on a case and charge time to it (start the stopwatch), use the `startWork` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `startWork` |
| `token` | string | API authentication token |
| `ixBug` | integer | ID of the case to start working on |

#### Example Request

```json
{
  "cmd": "startWork",
  "token": "your_api_token",
  "ixBug": 123
}
```

#### Example Response

```json
{
  "data": {
    "ixBug": 123
  }
}
```

### 2. Stopping Work

To stop working on everything (stop the stopwatch), use the `stopWork` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `stopWork` |
| `token` | string | API authentication token |

#### Example Request

```json
{
  "cmd": "stopWork",
  "token": "your_api_token"
}
```

#### Example Response

```json
{
  "data": {}
}
```

### 3. Importing a Time Interval

To import a time interval that already happened, use the `newInterval` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `newInterval` |
| `token` | string | API authentication token |
| `ixBug` | integer | ID of the case to charge time to |
| `dtStart` | string | Start time of the interval (ISO 8601 UTC format) |
| `dtEnd` | string | End time of the interval (ISO 8601 UTC format) |

#### Example Request

```json
{
  "cmd": "newInterval",
  "token": "your_api_token",
  "ixBug": 123,
  "dtStart": "2023-07-28T13:00:00Z",
  "dtEnd": "2023-07-28T15:30:00Z"
}
```

#### Example Response

```json
{
  "data": {
    "interval": {
      "ixInterval": 456,
      "ixBug": 123,
      "dtStart": "2023-07-28T13:00:00Z",
      "dtEnd": "2023-07-28T15:30:00Z"
    }
  }
}
```

### 4. Listing Time Intervals

To list all non-deleted time intervals for a user, use the `listIntervals` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listIntervals` |
| `token` | string | API authentication token |
| `ixPerson` | integer | Optional. Person ID to list intervals for. If omitted, lists intervals for the logged-in user. If set to 1, lists intervals for all users (administrators only). |
| `ixBug` | integer | Optional. If provided, only returns intervals for this case. |
| `dtStart` | string | Optional. If provided, only returns intervals that start on or after this date (ISO 8601 UTC format). |
| `dtEnd` | string | Optional. If provided, only returns intervals that start on or before this date (ISO 8601 UTC format). |

#### Example Request

```json
{
  "cmd": "listIntervals",
  "token": "your_api_token",
  "ixBug": 123,
  "dtStart": "2023-07-01T00:00:00Z",
  "dtEnd": "2023-07-31T23:59:59Z"
}
```

#### Example Response

```json
{
  "data": {
    "intervals": [
      {
        "ixBug": 123,
        "ixInterval": 456,
        "dtStart": "2023-07-28T13:00:00Z",
        "dtEnd": "2023-07-28T15:30:00Z",
        "sTitle": "Implement JSON API documentation",
        "ixPerson": 5
      },
      {
        "ixBug": 123,
        "ixInterval": 457,
        "dtStart": "2023-07-29T09:15:00Z",
        "dtEnd": "2023-07-29T11:45:00Z",
        "sTitle": "Implement JSON API documentation",
        "ixPerson": 5
      }
    ]
  }
}
```

## Time Interval Fields

Each time interval contains the following elements:

| Field | Description |
|-------|-------------|
| `ixInterval` | Unique ID for this time interval |
| `ixBug` | Case ID this interval is associated with |
| `dtStart` | Start time of the interval (ISO 8601 UTC format) |
| `dtEnd` | End time of the interval (ISO 8601 UTC format) |
| `sTitle` | Title of the associated case |
| `ixPerson` | Person ID this interval belongs to |

## Usage Notes

1. The `startWork` command automatically stops any currently active time interval before starting a new one.
2. When you use `stopWork`, it stops the currently active interval without starting a new one.
3. Use `newInterval` for importing time that was spent outside of FogBugz (e.g., manually tracking time or importing from other systems).
4. Time intervals contribute to the `hrsElapsed` field on cases, which tracks total time spent.
5. Only administrators can view time intervals for users other than themselves.
6. Time intervals can be used for billing, reporting, and resource allocation analysis.
7. The `listIntervals` command supports filtering by person, case, and date range, making it flexible for various reporting needs.

## Permissions

1. Any user can view their own time intervals.
2. Only administrators can view time intervals for other users by setting `ixPerson` to another user's ID or to 1 (all users).
3. Users need appropriate permissions to start work on and add intervals to cases.
