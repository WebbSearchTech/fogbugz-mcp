# Milestone Dependencies

## Overview

Milestone dependencies allow you to create relationships between milestones (fixfors), specifying that one milestone must be completed before another can begin. This functionality is useful for project planning and scheduling.

## Available Commands

The FogBugz JSON API provides two commands for managing milestone dependencies:

### 1. Creating a Dependency

To create a dependency (one milestone depends on another milestone), use the `addFixForDependency` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `addFixForDependency` |
| `token` | string | API authentication token |
| `ixFixFor` | integer | ID of the milestone that depends on another |
| `ixFixForDependsOn` | integer | ID of the milestone that must be completed first |
| `ixProject` | integer | (Optional) ID of the project the milestones belong to |

#### Example Request

```json
{
  "cmd": "addFixForDependency",
  "token": "your_api_token",
  "ixFixFor": 10,
  "ixFixForDependsOn": 7,
  "ixProject": 1
}
```

#### Response

If successful, the API returns an empty response object:

```json
{
  "data": {}
}
```

### 2. Removing a Dependency

To remove an existing dependency between milestones, use the `deleteFixForDependency` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `deleteFixForDependency` |
| `token` | string | API authentication token |
| `ixFixFor` | integer | ID of the milestone that depends on another |
| `ixFixForDependsOn` | integer | ID of the milestone that was required to be completed first |
| `ixProject` | integer | (Optional) ID of the project the milestones belong to |

#### Example Request

```json
{
  "cmd": "deleteFixForDependency",
  "token": "your_api_token",
  "ixFixFor": 10,
  "ixFixForDependsOn": 7,
  "ixProject": 1
}
```

#### Response

If successful, the API returns an empty response object:

```json
{
  "data": {}
}
```

## Managing Milestone Dependencies

When working with milestone dependencies:

1. You can establish and manage dependency chains (e.g., Milestone C depends on Milestone B, which depends on Milestone A)
2. The user interface will show visual indications of these dependencies
3. Dependencies can be used by the scheduling system to calculate projected completion dates

## Viewing Dependencies

To see dependencies for a milestone, use the `viewFixFor` command, which will include a `setixFixForDependency` element in the response containing the IDs of milestones that this milestone depends on.

## Error Handling

If you attempt to create a circular dependency (e.g., A depends on B, B depends on C, C depends on A), the API will return an error code 25 ("Violates fixfor execution order").
