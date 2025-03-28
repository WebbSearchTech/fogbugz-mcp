# General Rules for API Requests

## XML API

In the XML API, the following rules apply:

1. Requests can use either GET or POST methods. If submitting files, you must use POST with `enctype="multipart/form-data"`.
2. All arguments are name/value pairs in the GET or POST request.
   ```
   http://www.example.com/api.asp?token=24dsg34lok43un23&cmd=new&sTitle=New%20Case&sEvent=something
   ```
3. FogBugz is based exclusively in UTF-8 encoding.
4. All dates should be in [ISO 8601](http://en.wikipedia.org/wiki/ISO_8601) UTC format, e.g., `2013-01-21T14:24:06Z`.
5. All API requests must have:
   - A `cmd` argument indicating what you want to do.
   - A `token` argument from a logon session (except for the `cmd=logon` command).
6. The response is a valid XML file in UTF-8 format with an outer `<response>` tag.
7. If the first child node is `<error>`, something went wrong.
8. If the token is not supplied or is invalid, you'll get error code 3: `<response><error code="3">Not logged on</error></response>`
9. All requests should be [URL encoded](http://en.wikipedia.org/wiki/Percent-encoding).

## JSON API Equivalent

The JSON API follows these rules:

1. **Request Method**:
   - Only POST requests are supported
   - For file submissions, use `multipart/form-data` with a `json` field containing the payload

2. **Parameter Format**:
   - Use a JSON object in the request body instead of name/value pairs
   ```json
   {
     "cmd": "new",
     "token": "your_api_token",
     "sTitle": "New Case",
     "sEvent": "Something happened"
   }
   ```

3. **List Parameters**:
   - XML API uses comma-separated strings: `cols=sTitle,sStatus`
   - JSON API uses arrays: `"cols": ["sTitle", "sStatus"]`

4. **Value Types**:
   - Fields starting with `ix` (e.g., `ixBug`) accept and return integer values
   - Fields starting with `f` (e.g., `fAdministrator`) accept and return boolean values (true/false)
   - Dates should still be in ISO 8601 UTC format, e.g., `2023-05-21T14:24:06Z`

5. **Encoding**:
   - UTF-8 encoding is still used

6. **Response Format**:
   - Responses are structured JSON objects
   - The main data is in the `data` property
   - Errors are returned in an `errors` array
   ```json
   {
     "data": { /* response data */ },
     "errors": [
       {
         "message": "Error message",
         "detail": "Additional details",
         "code": "error_code"
       }
     ],
     "warnings": [],
     "meta": { /* additional metadata */ },
     "errorCode": null,
     "maxCacheAge": null
   }
   ```

7. **Authentication**:
   - Similar to the XML API, all requests (except `logon`) must include a valid token

### Example: Searching for Cases

```json
// Request
{
  "cmd": "search",
  "token": "your_api_token",
  "q": "status:\"Active\"",
  "cols": ["ixBug", "sTitle", "sStatus"],
  "max": 2
}

// Response
{
  "data": {
    "count": 2,
    "totalHits": 18,
    "cases": [
      {
        "operations": ["edit", "assign", "resolve", "email"],
        "ixBug": 18,
        "sTitle": "Compile XML API Documentation into Single Markdown Document",
        "sStatus": "Active"
      },
      {
        "operations": ["edit", "assign", "resolve", "email"],
        "ixBug": 17,
        "sTitle": "API Test Case",
        "sStatus": "Active"
      }
    ]
  },
  "errors": [],
  "warnings": []
}
```

### Example with curl

```bash
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "search",
    "token": "your_api_token",
    "q": "status:\"Active\"",
    "cols": ["ixBug", "sTitle", "sStatus"],
    "max": 2
}'
```

### Example with JavaScript

```javascript
const axios = require('axios');

async function searchCases(apiUrl, token, query, columns, maxResults) {
  try {
    const response = await axios.post(apiUrl, {
      cmd: 'search',
      token: token,
      q: query,
      cols: columns,
      max: maxResults
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data.cases;
  } catch (error) {
    console.error('Error searching cases:', error.response?.data || error.message);
    return null;
  }
}
```

## Key Differences

1. XML API allows both GET and POST requests, but JSON API only allows POST requests.
2. XML API uses name/value pairs in the URL or request body, while JSON API uses a structured JSON object.
3. XML API uses comma-separated strings for lists, while JSON API uses arrays.
4. XML API returns XML responses, while JSON API returns structured JSON objects.
5. In the JSON API, error information is returned in an `errors` array, rather than as an `<error>` element.
