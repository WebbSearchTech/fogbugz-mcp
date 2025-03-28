# Milestones

## Overview
Milestones (also known as FixFors in FogBugz terminology) are used to group cases together for release planning and scheduling. The FogBugz JSON API provides commands to list, view, create, and edit milestones, as well as manage dependencies between them.

## Available Commands

### 1. List Milestones
Retrieves all milestones visible to the current user.

#### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listFixFors` |
| `ixProject` | integer | *Optional*. Only list milestones for this project. Default behavior is to list all milestones. |
| `ixFixFor` | integer | *Optional*. If listing all milestones, will include this milestone even if it's unassignable (i.e. inactive). |
| `fIncludeDeleted` | boolean | *Optional*. Set to 1 to include inactive milestones (i.e. those marked unassignable). Default: 0. |
| `fIncludeReallyDeleted` | boolean | *Optional*. Set to 1 to include completely deleted milestones (i.e. no longer viewable or assignable). Default: 0. |

#### Example Request
```json
{
  "cmd": "listFixFors",
  "token": "your_api_token"
}
```

#### Example Response
```json
{
  "data": {
    "fixfors": [
      {
        "ixFixFor": 1,
        "sFixFor": "Undecided",
        "fDeleted": 0,
        "dt": null,
        "dtStart": null,
        "sStartNote": null,
        "setixFixForDependency": [],
        "ixProject": null,
        "sProject": null
      },
      {
        "ixFixFor": 2,
        "sFixFor": "Version 2.0",
        "fDeleted": 0,
        "dt": "2025-03-15T00:00:00Z",
        "dtStart": "2025-01-01T00:00:00Z",
        "sStartNote": "Development starts after hardware arrives",
        "setixFixForDependency": [{"ixFixFor": 3}],
        "ixProject": 5,
        "sProject": "Mobile App"
      }
    ]
  }
}
```

### 2. View a Specific Milestone
Retrieves detailed information about a specific milestone.

#### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `viewFixFor` |
| `ixFixFor` | integer | The ID of the milestone to view |
| Or | | |
| `sFixFor` | string | Milestone name |
| `ixProject` | integer | Required when using `sFixFor` |

#### Example Request
```json
{
  "cmd": "viewFixFor",
  "token": "your_api_token",
  "ixFixFor": 2
}
```

#### Example Response
```json
{
  "data": {
    "fixfor": {
      "ixFixFor": 2,
      "sFixFor": "Version 2.0",
      "fInactive": false,
      "dt": "2025-03-15T00:00:00Z",
      "ixProject": 5,
      "dtStart": "2025-01-01T00:00:00Z",
      "sStartNote": "Development starts after hardware arrives",
      "setixFixForDependency": [
        {
          "ixFixFor": 3
        }
      ]
    }
  }
}
```

### 3. Create a New Milestone
Creates a new milestone in the system.

#### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `newFixFor` |
| `ixProject` | integer | *Required*. Project ID for the milestone. Set to -1 for a global milestone. |
| `sFixFor` | string | *Required*. Title of the new milestone. |
| `dtRelease` | date | *Optional*. Target release date for the milestone (ISO 8601 UTC format). |
| `dtStart` | date | *Optional*. Start date for the milestone (ISO 8601 UTC format). |
| `sStartNote` | string | *Optional*. Notes about the start conditions. |
| `fAssignable` | boolean | *Optional*. Whether cases can be assigned to this milestone. Default is 1 (true). |

#### Example Request
```json
{
  "cmd": "newFixFor",
  "token": "your_api_token",
  "ixProject": 5,
  "sFixFor": "Version 2.1",
  "dtRelease": "2025-06-30T00:00:00Z",
  "dtStart": "2025-04-01T00:00:00Z",
  "sStartNote": "Development begins after Version 2.0 release",
  "fAssignable": 1
}
```

#### Example Response
```json
{
  "data": {
    "ixFixFor": 6
  }
}
```

### 4. Edit an Existing Milestone
Updates details of an existing milestone. Any optional arguments that are not included will clear the corresponding data from the milestone.

#### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `editFixFor` |
| `ixFixFor` | integer | *Required*. The ID of the milestone to edit. |
| `sFixFor` | string | *Required*. Updated title for the milestone. |
| `dtRelease` | date | *Optional*. Updated target release date (ISO 8601 UTC format). |
| `dtStart` | date | *Optional*. Updated start date (ISO 8601 UTC format). |
| `sStartNote` | string | *Optional*. Updated start notes. |
| `fAssignable` | boolean | *Optional*. Updated assignable status. |

#### Example Request
```json
{
  "cmd": "editFixFor",
  "token": "your_api_token",
  "ixFixFor": 6,
  "sFixFor": "Version 2.1 Beta",
  "dtRelease": "2025-07-15T00:00:00Z"
}
```

#### Example Response
```json
{
  "data": {
    "ixFixFor": 6
  }
}
```

### 5. Milestone Dependencies

#### 5.1 Add a Milestone Dependency

Adds a dependency between two milestones.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `addFixForDependency` |
| `ixFixFor` | integer | ID of the milestone that depends on another. |
| `ixFixForDependsOn` | integer | ID of the milestone that must be completed first. |

##### Example Request
```json
{
  "cmd": "addFixForDependency",
  "token": "your_api_token",
  "ixFixFor": 6,
  "ixFixForDependsOn": 2
}
```

#### 5.2 Delete a Milestone Dependency

Removes a dependency between two milestones.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `deleteFixForDependency` |
| `ixFixFor` | integer | ID of the milestone that no longer depends on another. |
| `ixFixForDependsOn` | integer | ID of the milestone that was previously depended on. |

##### Example Request
```json
{
  "cmd": "deleteFixForDependency",
  "token": "your_api_token",
  "ixFixFor": 6,
  "ixFixForDependsOn": 2
}
```

## Field Descriptions
| Field | Description |
|-------|-------------|
| `ixFixFor` | Unique identifier for the milestone. |
| `sFixFor` | Name of the milestone. |
| `fDeleted` | Whether the milestone is deleted (0=active, 1=deleted). |
| `fInactive` | Whether the milestone is inactive (true=not assignable, false=assignable). |
| `dt` | Target completion date for the milestone. |
| `dtStart` | Start date for the milestone. |
| `sStartNote` | Notes about start conditions or dependencies. |
| `setixFixForDependency` | Array of milestone IDs that this milestone depends on. |
| `ixProject` | Project ID if this is a project-specific milestone, or null for global milestones. |
| `sProject` | Project name if this is a project-specific milestone. |

## Usage Notes
1. The system milestone "Undecided" (usually with ID 1) is a special milestone that cannot be modified or deleted.
2. When creating project-specific milestones, ensure the specified project exists.
3. To create a global milestone (available to all projects), set `ixProject` to -1 when creating the milestone.
4. When editing a milestone, any optional fields that are not included will be cleared (set to null or default value).
5. Milestone dependencies help establish a sequence for work—cases in a dependent milestone shouldn't be started until the milestone it depends on is completed.
6. Dependencies can form chains: if Milestone A depends on B, and B depends on C, then A indirectly depends on C.
7. The API will prevent circular dependencies (e.g., A depends on B, and B depends on A).
8. Milestones can be used with Evidence-Based Scheduling to forecast completion dates.
