# API Version and Location

## XML API

In the XML API, you first need to access the `api.xml` endpoint to get information about the API version and the URL to use for subsequent requests:

```
[FogBugz URL]/api.xml
```

This returns an XML response with version information and the URL to use for all further API calls:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<response>
  <version>2</version>
  <minversion>1</minversion>
  <url>api.asp?</url>
</response>
```

## JSON API Equivalent

The JSON API works differently than the XML API:

- There is no specific endpoint to check the API version.
- The JSON API endpoint is always: `https://[FogBugz URL]/f/api/0/jsonapi`
- All requests should be made as POST requests with a JSON payload.

To verify your connection to the API, you can use the `logon` command with your API token:

```json
{
  "cmd": "logon",
  "token": "your_api_token"
}
```

This will return a response like:

```json
{
  "data": {
    "token": "your_api_token"
  },
  "errors": [],
  "warnings": [],
  "meta": {
    "jsdbInvalidator": "oqSCNVtakkS4vDgwjPiD_Q2",
    "clientVersionAllowed": {
      "min": 822909000,
      "max": 822909000
    }
  },
  "errorCode": null,
  "maxCacheAge": null
}
```

### Example with curl

```bash
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "logon",
    "token": "your_api_token"
}'
```

### Example with JavaScript

```javascript
const axios = require('axios');

async function verifyApiConnection(apiToken) {
  try {
    const response = await axios.post('https://example.fogbugz.com/f/api/0/jsonapi', {
      cmd: 'logon',
      token: apiToken
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Connection Verified:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Connection Failed:', error.response?.data || error.message);
    throw error;
  }
}
```

## Key Differences from XML API

1. The JSON API uses a single, consistent endpoint for all requests (`/f/api/0/jsonapi`).
2. There is no separate command to check the API version.
3. All requests must be sent as POST requests with a JSON payload.
4. The response format is JSON instead of XML.
5. Error messages are returned in an `errors` array in the response.
