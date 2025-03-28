# Release Notes

## Overview
Release notes are text descriptions associated with cases that document changes, bug fixes, or new features included in a software release. The FogBugz JSON API allows you to retrieve cases with release notes content, as well as add or update release notes for cases.

## Available Commands

### 1. Retrieving Cases with Release Notes
You can use the `search` command with specific query parameters to retrieve cases that have release notes.

#### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `search` |
| `q` | string | Search query (e.g., `releaseNotes:"*"` to find cases with release notes) |
| `cols` | string | Comma-separated list of columns to include in results, including `sReleaseNotes` |

#### Example Request
```json
{
  "cmd": "search",
  "token": "your_api_token",
  "q": "releaseNotes:\"*\"",
  "cols": "ixBug,sTitle,sReleaseNotes,ixFixFor,sFixFor"
}
```

#### Example Response
```json
{
  "data": {
    "cases": [
      {
        "ixBug": 1234,
        "sTitle": "Add export functionality to reports",
        "sReleaseNotes": "Reports can now be exported to CSV format",
        "ixFixFor": 42,
        "sFixFor": "Version 2.0"
      },
      {
        "ixBug": 1235,
        "sTitle": "Fix performance issue in search",
        "sReleaseNotes": "Improved search performance by 50%",
        "ixFixFor": 42,
        "sFixFor": "Version 2.0"
      }
    ],
    "count": 2
  }
}
```

### 2. Filtering Release Notes by Milestone

#### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `search` |
| `q` | string | Search query combining milestone and release notes (e.g., `fixfor:"Version 2.0" AND releaseNotes:"*"`) |
| `cols` | string | Comma-separated list of columns to include in results |

#### Example Request
```json
{
  "cmd": "search",
  "token": "your_api_token",
  "q": "fixfor:\"Version 2.0\" AND releaseNotes:\"*\"",
  "cols": "ixBug,sTitle,sReleaseNotes,ixFixFor,sFixFor"
}
```

### 3. Adding or Updating Release Notes

To add or update release notes for a case, use the `edit` command with the `sReleaseNotes` parameter.

#### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `edit` |
| `ixBug` | integer | Case ID to update |
| `sReleaseNotes` | string | Release notes text to add or update |

#### Example Request
```json
{
  "cmd": "edit",
  "token": "your_api_token",
  "ixBug": 1234,
  "sReleaseNotes": "Fixed an issue where the application would crash when processing large files."
}
```

## Field Descriptions
| Field | Description |
|-------|-------------|
| `sReleaseNotes` | Text content of the release notes for a case |

## Usage Notes
1. Release notes are typically used to document changes that end users or customers need to know about in a new software release.
2. When retrieving cases with release notes, always include the `sReleaseNotes` field in your `cols` parameter.
3. You can use the search query syntax to find cases with specific content in release notes, e.g., `releaseNotes:"performance"`.
4. When generating release notes for a milestone, filter by both the milestone and the presence of release notes content.
5. The FogBugz UI displays release notes in a specialized view when viewing release notes for a milestone.
