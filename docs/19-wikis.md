# Wikis

## Overview
The FogBugz Wiki system provides a collaborative documentation platform integrated within FogBugz. The JSON API offers commands to create, edit, and manage wikis, wiki articles, and templates. These commands allow you to programmatically interact with all aspects of the wiki system.

## Available Commands

### 1. Wiki Management

#### 1.1 List Wikis

Lists all wikis visible to the current user.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listWikis` |

##### Example Request
```json
{
  "cmd": "listWikis",
  "token": "your_api_token"
}
```

##### Example Response
```json
{
  "data": {
    "wikis": [
      {
        "ixWiki": 1,
        "sWiki": "Widget Documentation",
        "sTagLineHTML": "<b>Full documentation for CompanyCorp Widgets</b>",
        "ixWikiPageRoot": 1,
        "ixTemplate": 2,
        "fDeleted": false
      },
      {
        "ixWiki": 2,
        "sWiki": "Internal Processes",
        "sTagLineHTML": "Documentation for internal team processes",
        "ixWikiPageRoot": 5,
        "ixTemplate": 1,
        "fDeleted": false
      }
    ]
  }
}
```

#### 1.2 Create a New Wiki

Creates a new wiki.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `newWiki` |
| `s` | string | Title of the new wiki |
| `sTagLineHTML` | string | *Optional*. HTML formatted description for the wiki |
| `ixTemplate` | integer | *Optional*. Template ID to use for the wiki |

##### Example Request
```json
{
  "cmd": "newWiki",
  "token": "your_api_token",
  "s": "API Documentation",
  "sTagLineHTML": "<p>Documentation for our public APIs</p>"
}
```

##### Example Response
```json
{
  "data": {
    "wiki": {
      "ixWiki": 3
    }
  }
}
```

#### 1.3 Edit a Wiki

Updates an existing wiki.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `editWiki` |
| `ixWiki` | integer | ID of the wiki to edit |
| `s` | string | *Optional*. New title for the wiki |
| `sTagLineHTML` | string | *Optional*. New HTML formatted description for the wiki |
| `ixTemplate` | integer | *Optional*. New template ID to use for the wiki |

##### Example Request
```json
{
  "cmd": "editWiki",
  "token": "your_api_token",
  "ixWiki": 3,
  "s": "Public API Documentation",
  "sTagLineHTML": "<p>Documentation for our public and partner APIs</p>"
}
```

##### Example Response
```json
{
  "data": {
    "wiki": {
      "ixWiki": 3
    }
  }
}
```

#### 1.4 Delete a Wiki

Marks a wiki as deleted.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `deleteWiki` |
| `ixWiki` | integer | ID of the wiki to delete |

##### Example Request
```json
{
  "cmd": "deleteWiki",
  "token": "your_api_token",
  "ixWiki": 3
}
```

##### Example Response
```json
{
  "data": {}
}
```

#### 1.5 Undelete a Wiki

Restores a previously deleted wiki.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `undeleteWiki` |
| `ixWiki` | integer | ID of the wiki to undelete |

##### Example Request
```json
{
  "cmd": "undeleteWiki",
  "token": "your_api_token",
  "ixWiki": 3
}
```

##### Example Response
```json
{
  "data": {}
}
```

### 2. Wiki Articles

#### 2.1 List Articles

Lists all articles in a specified wiki.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listArticles` |
| `ixWiki` | integer | ID of the wiki whose articles to list |

##### Example Request
```json
{
  "cmd": "listArticles",
  "token": "your_api_token",
  "ixWiki": 1
}
```

##### Example Response
```json
{
  "data": {
    "articles": [
      {
        "ixWikiPage": 1,
        "sHeadline": "Root Article"
      },
      {
        "ixWikiPage": 3,
        "sHeadline": "Widget Help"
      }
    ]
  }
}
```

#### 2.2 Create a New Article

Creates a new article in a wiki.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `newArticle` |
| `ixWiki` | integer | ID of the wiki to add the article to |
| `sHeadline` | string | Title of the new article |
| `sBody` | string | HTML content of the article |
| `cols` | string | *Optional*. Columns to return about the article |
| `dt` | date | *Optional*. Date of the article (ISO 8601 UTC format) |
| `ixPersonEditedBy` | integer | *Optional*. Person ID who edited the article (admin only) |
| `sTags` | string | *Optional*. Comma-separated list of tags to apply to the article |

##### Example Request
```json
{
  "cmd": "newArticle",
  "token": "your_api_token",
  "ixWiki": 1,
  "sHeadline": "Getting Started",
  "sBody": "<h1>Getting Started with Widgets</h1><p>This guide will help you get started with our widget system.</p>"
}
```

##### Example Response
```json
{
  "data": {
    "article": {
      "ixWikiPage": 5
    }
  }
}
```

#### 2.3 Edit an Article

Updates an existing wiki article.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `editArticle` |
| `ixWikiPage` | integer | ID of the article to edit |
| `sHeadline` | string | *Optional*. New title for the article |
| `sBody` | string | *Optional*. New HTML content for the article |
| `sComment` | string | *Optional*. Revision comment |
| `dt` | date | *Optional*. Date of the edit (ISO 8601 UTC format) |
| `ixPersonEditedBy` | integer | *Optional*. Person ID who edited the article (admin only) |
| `sTags` | string | *Optional*. Comma-separated list of tags to apply to the article |

##### Example Request
```json
{
  "cmd": "editArticle",
  "token": "your_api_token",
  "ixWikiPage": 5,
  "sHeadline": "Getting Started with Widgets",
  "sBody": "<h1>Getting Started with Widgets</h1><p>This guide will help you get started with our widget system.</p><p>Updated with new installation instructions.</p>",
  "sComment": "Added installation instructions"
}
```

##### Example Response
```json
{
  "data": {
    "article": {
      "ixWikiPage": 5
    }
  }
}
```

#### 2.4 View an Article

Retrieves the content of a specific wiki article.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `viewArticle` |
| `ixWikiPage` | integer | ID of the article to view |
| `nRevision` | integer | *Optional*. Specific revision number to view. If omitted, the latest revision is returned. |

##### Example Request
```json
{
  "cmd": "viewArticle",
  "token": "your_api_token",
  "ixWikiPage": 5
}
```

##### Example Response
```json
{
  "data": {
    "wikipage": {
      "sHeadline": "Getting Started with Widgets",
      "sBody": "<h1>Getting Started with Widgets</h1><p>This guide will help you get started with our widget system.</p><p>Updated with new installation instructions.</p>",
      "nRevision": 2,
      "tags": [
        {
          "sTag": "widgets"
        },
        {
          "sTag": "documentation"
        }
      ]
    }
  }
}
```

#### 2.5 List Article Revisions

Lists all revisions of a specific wiki article.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listRevisions` |
| `ixWikiPage` | integer | ID of the article to list revisions for |

##### Example Request
```json
{
  "cmd": "listRevisions",
  "token": "your_api_token",
  "ixWikiPage": 5
}
```

##### Example Response
```json
{
  "data": {
    "revisions": [
      {
        "nRevision": 1,
        "ixPerson": 2,
        "sRemoteIP": "0.0.0.0",
        "sTitle": "Getting Started",
        "sComment": "Initial version",
        "fDiff": false,
        "dt": "2025-03-15T14:24:43Z"
      },
      {
        "nRevision": 2,
        "ixPerson": 2,
        "sRemoteIP": "0.0.0.0",
        "sTitle": "Getting Started with Widgets",
        "sComment": "Added installation instructions",
        "fDiff": false,
        "dt": "2025-03-17T09:14:27Z"
      }
    ]
  }
}
```

### 3. Wiki Templates

#### 3.1 List Templates

Lists all available wiki templates.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listTemplates` |

##### Example Request
```json
{
  "cmd": "listTemplates",
  "token": "your_api_token"
}
```

##### Example Response
```json
{
  "data": {
    "templates": [
      {
        "ixTemplate": 1,
        "sTemplate": "Default Template"
      },
      {
        "ixTemplate": 2,
        "sTemplate": "Documentation Template"
      }
    ]
  }
}
```

#### 3.2 Create a New Template

Creates a new wiki template.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `newTemplate` |
| `sTemplate` | string | Name of the new template |
| `sBodyHTML` | string | HTML content of the template |
| `sBodyCSS` | string | CSS styling for the template |
| `sComment` | string | *Optional*. Comment for the template creation |
| `fDefault` | boolean | *Optional*. Set to 1 to make this the default template |

##### Example Request
```json
{
  "cmd": "newTemplate",
  "token": "your_api_token",
  "sTemplate": "API Documentation Template",
  "sBodyHTML": "<div class=\"api-doc\">{{content}}</div>",
  "sBodyCSS": ".api-doc { font-family: Arial, sans-serif; }",
  "sComment": "Template for API documentation",
  "fDefault": 0
}
```

##### Example Response
```json
{
  "data": {
    "template": {
      "ixTemplate": 3
    }
  }
}
```

#### 3.3 Edit a Template

Updates an existing wiki template.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `editTemplate` |
| `ixTemplate` | integer | ID of the template to edit |
| `sTemplate` | string | *Optional*. New name for the template |
| `sBodyHTML` | string | *Optional*. New HTML content for the template |
| `sBodyCSS` | string | *Optional*. New CSS styling for the template |
| `sComment` | string | *Optional*. Comment about the edit |
| `fDefault` | boolean | *Optional*. Set to 1 to make this the default template |

##### Example Request
```json
{
  "cmd": "editTemplate",
  "token": "your_api_token",
  "ixTemplate": 3,
  "sBodyHTML": "<div class=\"api-doc\"><header>{{header}}</header><div class=\"content\">{{content}}</div></div>",
  "sComment": "Added header section to template"
}
```

##### Example Response
```json
{
  "data": {
    "template": {
      "ixTemplate": 3
    }
  }
}
```

#### 3.4 View a Template

Retrieves details of a specific wiki template.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `viewTemplate` |
| `ixTemplate` | integer | ID of the template to view |
| `nRevision` | integer | *Optional*. Specific revision to view. If omitted, the latest revision is returned. |

##### Example Request
```json
{
  "cmd": "viewTemplate",
  "token": "your_api_token",
  "ixTemplate": 3
}
```

##### Example Response
```json
{
  "data": {
    "template": {
      "sTemplate": "API Documentation Template",
      "sBodyHTML": "<div class=\"api-doc\"><header>{{header}}</header><div class=\"content\">{{content}}</div></div>",
      "sBodyCSS": ".api-doc { font-family: Arial, sans-serif; }",
      "nRevision": 2,
      "fReadOnly": false,
      "fDefault": false
    }
  }
}
```

#### 3.5 List Template Revisions

Lists all revisions of a specific wiki template.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `listTemplateRevisions` |
| `ixTemplate` | integer | ID of the template to list revisions for |

##### Example Request
```json
{
  "cmd": "listTemplateRevisions",
  "token": "your_api_token",
  "ixTemplate": 3
}
```

##### Example Response
```json
{
  "data": {
    "revisions": [
      {
        "nRevision": 1,
        "ixPerson": 2,
        "sRemoteIP": "0.0.0.0",
        "sTitle": "API Documentation Template",
        "sComment": "Template for API documentation",
        "fDiff": false,
        "dt": "2025-03-15T14:24:43Z"
      },
      {
        "nRevision": 2,
        "ixPerson": 2,
        "sRemoteIP": "0.0.0.0",
        "sTitle": "API Documentation Template",
        "sComment": "Added header section to template",
        "fDiff": false,
        "dt": "2025-03-17T09:14:27Z"
      }
    ]
  }
}
```

#### 3.6 Delete a Template

Deletes a wiki template.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `deleteTemplate` |
| `ixTemplate` | integer | ID of the template to delete |

##### Example Request
```json
{
  "cmd": "deleteTemplate",
  "token": "your_api_token",
  "ixTemplate": 3
}
```

##### Example Response
```json
{
  "data": {}
}
```

### 4. File Uploads

#### 4.1 Wiki File Upload

Uploads a file to a wiki.

##### Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `cmd` | string | `wikiFileUpload` |
| `ixWiki` | integer | ID of the wiki to upload the file to |
| `File1` | file | The file to upload (requires multipart/form-data encoding) |

##### Example Request
A multipart/form-data POST request containing:
```
--boundary
Content-Disposition: form-data; name="cmd"

wikiFileUpload
--boundary
Content-Disposition: form-data; name="token"

your_api_token
--boundary
Content-Disposition: form-data; name="ixWiki"

1
--boundary
Content-Disposition: form-data; name="File1"; filename="image.png"
Content-Type: image/png

[Binary file data here]
--boundary--
```

##### Example Response
```json
{
  "data": {
    "sFileName": "image.png",
    "sURL": "default.asp?pg=pgDownload&pgType=pgWikiAttachment&ixWikiPage=1&sPart=1&fileName=image.png"
  }
}
```

## Field Descriptions
| Field | Description |
|-------|-------------|
| `ixWiki` | Unique identifier for a wiki |
| `sWiki` | Title of the wiki |
| `sTagLineHTML` | HTML-formatted description of the wiki |
| `ixWikiPageRoot` | ID of the root article page for the wiki |
| `ixTemplate` | ID of the template used by the wiki |
| `fDeleted` | Whether the wiki is deleted |
| `ixWikiPage` | Unique identifier for a wiki article |
| `sHeadline` | Title of a wiki article |
| `sBody` | HTML content of a wiki article |
| `nRevision` | Revision number |
| `ixPerson` | ID of the person who made the edit |
| `sComment` | Comment about a revision |
| `dt` | Date and time of an edit |
| `ixTemplate` | Unique identifier for a wiki template |
| `sTemplate` | Name of a template |
| `sBodyHTML` | HTML content of a template |
| `sBodyCSS` | CSS styling for a template |
| `fReadOnly` | Whether a template can be modified |
| `fDefault` | Whether a template is the default for new wikis |

## Usage Notes
1. When creating or editing wikis, articles, or templates, only include the parameters you want to change. Omitted parameters will retain their existing values.
2. Wiki articles use HTML formatting for content. Make sure your HTML is properly formatted and escaped in JSON requests.
3. The root article is created automatically when you create a new wiki.
4. Article revisions are maintained automatically. Each edit creates a new revision that can be accessed later.
5. Templates control the appearance and layout of wiki articles.
6. File uploads require multipart/form-data encoding and cannot be submitted as simple JSON.
7. You can apply tags to articles to help with organization and categorization.
8. Deleting a wiki does not permanently remove it—it can be restored using the undeleteWiki command.
9. To view a specific version of an article or template, use the nRevision parameter with the viewArticle or viewTemplate commands.
