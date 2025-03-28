# Tags

## Overview

The Tags functionality in the FogBugz JSON API allows you to list all the available tags attached to cases or wikis that are visible to the current user. This feature is only available with FogBugz 8.2 and later versions. Tags provide a flexible way to categorize and organize cases beyond the standard project, area, and milestone classifications.

## Available Commands

### 1. Listing Tags

To list all tags visible to the current user, use the `listTags` command:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listTags` |
| `token` | string | API authentication token |

#### Example Request

```json
{
  "cmd": "listTags",
  "token": "your_api_token"
}
```

#### Example Response

```json
{
  "data": {
    "tags": [
      {
        "ixTag": 4,
        "sTag": "beta",
        "cTagUses": 12
      },
      {
        "ixTag": 7,
        "sTag": "documentation",
        "cTagUses": 5
      },
      {
        "ixTag": 9,
        "sTag": "ui-improvement",
        "cTagUses": 8
      }
    ]
  }
}
```

### 2. Searching for Cases with Specific Tags

To search for cases with specific tags, use the `search` command with a tag-specific query:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `search` |
| `token` | string | API authentication token |
| `q` | string | Search query using the `tag:` operator (e.g., `tag:"documentation"`) |
| `cols` | string | Optional. Comma-separated list of columns to return for each case |

#### Example Request

```json
{
  "cmd": "search",
  "token": "your_api_token",
  "q": "tag:\"documentation\"",
  "cols": "ixBug,sTitle,tags"
}
```

#### Example Response

```json
{
  "data": {
    "cases": [
      {
        "ixBug": 123,
        "sTitle": "Update API documentation for new features",
        "tags": [
          {
            "tag": "documentation"
          },
          {
            "tag": "api"
          }
        ]
      },
      {
        "ixBug": 456,
        "sTitle": "Create user guide for mobile app",
        "tags": [
          {
            "tag": "documentation"
          },
          {
            "tag": "mobile"
          }
        ]
      }
    ]
  }
}
```

### 3. Adding and Removing Tags

To add or remove tags from a case, use the `edit` command with the `sTags` parameter:

```
POST /f/api/0/jsonapi
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `edit` |
| `token` | string | API authentication token |
| `ixBug` | integer | ID of the case to modify |
| `sTags` | string | Comma-delimited list of all tags that should be associated with the case. Any existing tags not included in this list will be removed. |

#### Example Request

```json
{
  "cmd": "edit",
  "token": "your_api_token",
  "ixBug": 123,
  "sTags": "documentation,api,high-priority"
}
```

#### Example Response

```json
{
  "data": {
    "case": {
      "ixBug": 123,
      "tags": [
        {
          "tag": "documentation"
        },
        {
          "tag": "api"
        },
        {
          "tag": "high-priority"
        }
      ],
      // ... other case fields
    }
  }
}
```

## Tag Fields

Each tag contains the following elements:

| Field | Description |
|-------|-------------|
| `ixTag` | Unique ID for this tag |
| `sTag` | The tag name (text) |
| `cTagUses` | Number of times this tag is used across all cases and wikis |

## Working with Tags

### Searching with Tags

The search functionality in FogBugz supports several tag-specific operators:

1. `tag:"tag name"` - Find cases with the exact tag
2. `tag-has:word` - Find cases with tags containing the word
3. Multiple tag searches can be combined with AND and OR operators

### Modifying Tags

When editing a case, the `sTags` parameter completely replaces the existing tags. To preserve existing tags while adding new ones:

1. First, retrieve the current tags using a search or view operation
2. Append the new tags to the existing list
3. Submit the complete list with the `edit` command

### Best Practices for Tags

1. Use consistent tag naming conventions to avoid tag proliferation
2. Combine tags with standard FogBugz filtering for powerful querying
3. Consider using tag prefixes (e.g., `priority:high`, `comp:ui`) for better organization
4. Tags are case-insensitive in FogBugz - "API" and "api" are considered the same tag

## Using Tags in the JSON API

1. When retrieving cases with the `cols` parameter, include `tags` to get the tag information
2. Tag searches can be combined with other search criteria (e.g., `tag:"documentation" AND project:"API"`)
3. Remember that modifying tags with the `sTags` parameter replaces all existing tags, so include any tags you want to preserve
4. The `listTags` command provides a convenient way to see all available tags in the system
