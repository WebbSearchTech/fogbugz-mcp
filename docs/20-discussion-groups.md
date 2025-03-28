# Discussion Groups

## Overview
FogBugz includes discussion group functionality that allows teams to communicate about topics not directly related to specific cases. The JSON API provides commands to list discussion groups, view discussions, and access specific discussion topics.

## Available Commands

### 1. List Discussion Groups
Retrieves all discussion groups visible to the current user.

#### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listDiscussGroups` |

#### Example Request
```json
{
  "cmd": "listDiscussGroups",
  "token": "your_api_token"
}
```

#### Example Response
```json
{
  "data": {
    "discussions": [
      {
        "sFullName": "Development Team",
        "sURL": "https://example.fogbugz.com/?DevTeam",
        "sTagLineHTML": "Discussion group for development team topics",
        "ixDiscussGroup": 1
      },
      {
        "sFullName": "Customer Service",
        "sURL": "https://example.fogbugz.com/?CustomerService",
        "sTagLineHTML": "Customer service communications",
        "ixDiscussGroup": 2
      }
    ]
  }
}
```

### 2. List Discussion Topics
Retrieves all topics within a specific discussion group, optionally filtered by month and year.

#### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listDiscussion` |
| `ixDiscussGroup` | integer | ID of the discussion group to view |
| `fFull` | integer | *Optional*. Format of the topic list: 1 for all posts, 2 for main topics only (default) |
| `m` | integer | *Optional*. Month to filter by (1-12) |
| `y` | integer | *Optional*. Year to filter by (e.g., 2025) |

#### Example Request
```json
{
  "cmd": "listDiscussion",
  "token": "your_api_token",
  "ixDiscussGroup": 1,
  "fFull": 1
}
```

#### Example Response
```json
{
  "data": {
    "discussion": {
      "sFullName": "Development Team",
      "sURL": "https://example.fogbugz.com/?DevTeam",
      "sTagLineHTML": "Discussion group for development team topics",
      "topics": [
        {
          "post": {
            "ixDiscussTopic": 4,
            "ixDiscussTopicParent": 0,
            "sHeadline": "Weekly Status Meeting",
            "sFullName": "John Smith",
            "sURL": "",
            "dt": "2025-03-25T14:39:47Z",
            "sPost": "Let's discuss the agenda for our weekly status meeting.",
            "fModerator": true,
            "fAuthorized": true
          }
        },
        {
          "post": {
            "ixDiscussTopic": 5,
            "ixDiscussTopicParent": 4,
            "sHeadline": "Re: Weekly Status Meeting",
            "sFullName": "Jane Doe",
            "sURL": "",
            "dt": "2025-03-25T15:24:30Z",
            "sPost": "I'd like to add project X to the agenda.",
            "fModerator": false,
            "fAuthorized": true
          }
        }
      ]
    }
  }
}
```

### 3. View a Specific Discussion Topic
Retrieves a specific discussion topic and all of its replies.

#### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listDiscussTopic` |
| `ixDiscussTopic` | integer | ID of the discussion topic to view |

#### Example Request
```json
{
  "cmd": "listDiscussTopic",
  "token": "your_api_token",
  "ixDiscussTopic": 4
}
```

#### Example Response
```json
{
  "data": {
    "topic": {
      "posts": [
        {
          "ixDiscussTopic": 4,
          "ixDiscussTopicParent": 0,
          "sHeadline": "Weekly Status Meeting",
          "sFullName": "John Smith",
          "sURL": "",
          "dt": "2025-03-25T14:39:47Z",
          "sPost": "Let's discuss the agenda for our weekly status meeting.",
          "fModerator": true,
          "fAuthorized": true
        },
        {
          "ixDiscussTopic": 5,
          "ixDiscussTopicParent": 4,
          "sHeadline": "Re: Weekly Status Meeting",
          "sFullName": "Jane Doe",
          "sURL": "",
          "dt": "2025-03-25T15:24:30Z",
          "sPost": "I'd like to add project X to the agenda.",
          "fModerator": false,
          "fAuthorized": true
        }
      ]
    }
  }
}
```

## Field Descriptions
| Field | Description |
|-------|-------------|
| `ixDiscussGroup` | Unique identifier for a discussion group |
| `sFullName` | Name of the discussion group or poster |
| `sURL` | URL to access the discussion group directly |
| `sTagLineHTML` | HTML-formatted description or tagline for the discussion group |
| `ixDiscussTopic` | Unique identifier for a discussion topic (post) |
| `ixDiscussTopicParent` | ID of the parent post (0 for top-level posts) |
| `sHeadline` | Title or headline of the post |
| `dt` | Date and time when the post was made |
| `sPost` | Content of the post |
| `fModerator` | Whether the poster is a moderator |
| `fAuthorized` | Whether the poster is authorized |

## Usage Notes
1. Discussion groups provide a way to organize team communications about general topics that may not be tied to specific cases.
2. The top-level posts in a discussion group are those with `ixDiscussTopicParent` set to 0.
3. Replies to a post have the `ixDiscussTopicParent` field set to the ID of the post they're replying to.
4. The `fFull` parameter in the `listDiscussion` command allows you to control whether you see only main topics (top-level posts) or all posts including replies.
5. You can filter discussions by month and year to view historical discussions.
6. The API doesn't provide methods to create new discussion groups or posts—these operations need to be performed through the FogBugz UI.
7. When viewing a specific topic with `listDiscussTopic`, all replies to that topic are included in the response.
