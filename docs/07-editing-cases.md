# Editing Cases

## XML API

In the XML API, various commands are available for editing cases: `new`, `edit`, `assign`, `resolve`, `reactivate`, `reopen`, `close`, `email`, `reply`, and `forward`.

Each command accepts specific parameters. For example, to create a new case:

```
http://www.example.com/api.asp?cmd=new&token=your_token&sTitle=New%20Case&sEvent=Description
```

## JSON API Equivalent

The JSON API provides the same commands for editing cases, but with a JSON request format.

### 1. Creating a New Case

#### Request

```json
{
  "cmd": "new",
  "token": "your_api_token",
  "sTitle": "New Test Case",
  "sEvent": "This is a description of the new case.",
  "ixProject": 12,
  "ixArea": 15,
  "ixCategory": 1,
  "ixPriority": 3
}
```

#### Response

```json
{
  "data": {
    "case": {
      "ixBug": 123,
      "operations": [
        "edit",
        "assign",
        "resolve",
        "email"
      ]
    }
  },
  "errors": [],
  "warnings": []
}
```

### 2. Editing an Existing Case

#### Request

```json
{
  "cmd": "edit",
  "token": "your_api_token",
  "ixBug": 123,
  "sTitle": "Updated Case Title",
  "sEvent": "Adding a comment with this edit.",
  "ixPriority": 2
}
```

### 3. Assigning a Case

#### Request

```json
{
  "cmd": "assign",
  "token": "your_api_token",
  "ixBug": 123,
  "ixPersonAssignedTo": 5
}
```

Alternatively, you can use name instead of ID:

```json
{
  "cmd": "assign",
  "token": "your_api_token",
  "ixBug": 123,
  "sPersonAssignedTo": "Jane Smith"
}
```

### 4. Resolving a Case

#### Request

```json
{
  "cmd": "resolve",
  "token": "your_api_token",
  "ixBug": 123,
  "ixStatus": 2,
  "sEvent": "Fixed the issue by correcting the configuration."
}
```

### 5. Reopening a Case

#### Request

```json
{
  "cmd": "reopen",
  "token": "your_api_token",
  "ixBug": 123,
  "sEvent": "Reopening because the issue reappeared."
}
```

### 6. Closing a Case

#### Request

```json
{
  "cmd": "close",
  "token": "your_api_token",
  "ixBug": 123,
  "sEvent": "Closing this case as it is no longer relevant."
}
```

### 7. Email-Related Commands

#### Send an Email

```json
{
  "cmd": "email",
  "token": "your_api_token",
  "ixBug": 123,
  "sFrom": "support@yourcompany.com",
  "sTo": "customer@example.com",
  "sSubject": "Regarding your support request",
  "sEvent": "Thank you for your patience. We've looked into the issue and...",
  "sCC": "manager@yourcompany.com",
  "sBCC": "records@yourcompany.com"
}
```

#### Reply to an Email

```json
{
  "cmd": "reply",
  "token": "your_api_token",
  "ixBug": 123,
  "sFrom": "support@yourcompany.com",
  "sTo": "customer@example.com",
  "sEvent": "Here's the follow-up information you requested...",
  "sCC": "team@yourcompany.com"
}
```

#### Forward an Email

```json
{
  "cmd": "forward",
  "token": "your_api_token",
  "ixBug": 123,
  "sFrom": "support@yourcompany.com",
  "sTo": "engineering@yourcompany.com",
  "sEvent": "Please take a look at this customer issue...",
  "ixBugEventAttachment": 456  // ID of the event with attachments to include
}
```

## Common Parameters

Many common parameters can be used across these commands:

| Parameter | Type | Description |
|-----------|------|-------------|
| `ixBug` | Integer | Case ID (required for all commands except `new`) |
| `sTitle` | String | Case title |
| `sEvent` | String | Text description/comment |
| `fRichText` | Boolean | Set to `true` if `sEvent` contains HTML |
| `ixProject` or `sProject` | Integer/String | Project |
| `ixArea` or `sArea` | Integer/String | Area |
| `ixFixFor` or `sFixFor` | Integer/String | Milestone |
| `ixCategory` or `sCategory` | Integer/String | Category |
| `ixPersonAssignedTo` or `sPersonAssignedTo` | Integer/String | Person assigned to |
| `ixPriority` or `sPriority` | Integer/String | Priority level |
| `ixStatus` | Integer | Status (primarily for `resolve`) |
| `dtDue` | String | Due date (ISO 8601 format) |
| `hrsCurrEst` | Number | Current time estimate in hours |
| `dblStoryPts` | Number | Story points |
| `ixBugParent` | Integer | Parent case ID (for subcases) |
| `sTags` | String | Comma-delimited list of tags |

## File Attachments

For file attachments, the JSON API differs from the XML API. You need to use a multipart/form-data POST request with a `json` field containing your command parameters:

```
--boundary
Content-Disposition: form-data; name="json"
Content-Type: application/json

{
  "cmd": "new",
  "token": "your_api_token",
  "sTitle": "New Case with Attachment",
  "sEvent": "This case includes a file attachment.",
  "nFileCount": 1
}
--boundary
Content-Disposition: form-data; name="File1"; filename="example.txt"
Content-Type: text/plain

This is the content of the attached text file.
--boundary--
```

## Example with curl

```bash
# Create a new case
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "new",
    "token": "your_api_token",
    "sTitle": "New Test Case",
    "sEvent": "This is a description of the new case.",
    "ixPriority": 3
}'

# Edit an existing case
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "edit",
    "token": "your_api_token",
    "ixBug": 123,
    "sTitle": "Updated Case Title",
    "sEvent": "Adding a comment with this edit."
}'

# File attachment example
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--form 'json="{\"cmd\":\"new\",\"token\":\"your_api_token\",\"sTitle\":\"Case with Attachment\",\"sEvent\":\"This case has a file attached.\",\"nFileCount\":1}"' \
--form 'File1=@"/path/to/file.txt"'
```

## Example with JavaScript

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Create a new case
async function createNewCase(apiUrl, token, title, description) {
  try {
    const response = await axios.post(apiUrl, {
      cmd: 'new',
      token: token,
      sTitle: title,
      sEvent: description
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data.case;
  } catch (error) {
    console.error('Error creating case:', error.response?.data || error.message);
    return null;
  }
}

// Create a case with file attachment
async function createCaseWithAttachment(apiUrl, token, title, description, filePath) {
  try {
    const form = new FormData();
    
    // Create JSON payload
    const jsonPayload = {
      cmd: 'new',
      token: token,
      sTitle: title,
      sEvent: description,
      nFileCount: 1
    };
    
    // Add JSON payload as string
    form.append('json', JSON.stringify(jsonPayload));
    
    // Add file
    form.append('File1', fs.createReadStream(filePath));
    
    const response = await axios.post(apiUrl, form, {
      headers: {
        ...form.getHeaders()
      }
    });
    
    return response.data.data.case;
  } catch (error) {
    console.error('Error creating case with attachment:', error.response?.data || error.message);
    return null;
  }
}
```

## Notes

1. Unlike the XML API which can use both GET and POST methods, the JSON API only accepts POST requests.
2. The JSON API uses proper boolean values (`true`/`false`) for boolean fields rather than "0"/"1" strings.
3. When working with email commands, it's recommended to set both `sCustomerEmail` and `ixMailbox` on the case.
4. For file attachments, remember to set the `nFileCount` parameter to match the number of files included.
5. When using `ixPersonEditedBy` with `cmd=new`, this sets who opened the case.
6. For custom fields and plugin fields, refer to the FogBugz documentation.
