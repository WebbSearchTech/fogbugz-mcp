# Filters

FogBugz has three kinds of filters:
- Built-in filters like "My Cases" and the main Inbox (for email)
- Private filters saved by users
- Shared filters created by administrators for all users

## XML API

In the XML API, you can list filters and set the current filter with these commands:

### Listing Filters

```
http://www.example.com/api.asp?cmd=listFilters&token=24dsg34lok43un23
```

Response:
```xml
<response>
  <filters>
    <filter type="builtin" sFilter="ez349">My Cases</filter>
    <filter type="saved" sFilter="304">Cases I should have closed months ago</filter>
    <filter type="shared" sFilter="98" status="current">Customer Service Top 10</filter>
  </filters>
</response>
```

### Setting the Current Filter

```
http://www.example.com/api.asp?cmd=setCurrentFilter&sFilter=402&token=24dsg34lok43un23
```

Response (purposefully empty):
```xml
<response></response>
```

## JSON API Equivalent

The JSON API provides equivalent functionality for working with filters:

### Listing Filters

#### Request

```json
{
  "cmd": "listFilters",
  "token": "your_api_token"
}
```

#### Response

```json
{
  "data": {
    "filters": [
      {
        "type": "builtin",
        "sFilter": "ez349",
        "name": "My Cases"
      },
      {
        "type": "saved",
        "sFilter": "304",
        "name": "Cases I should have closed months ago"
      },
      {
        "type": "shared",
        "sFilter": "98",
        "name": "Customer Service Top 10",
        "status": "current"
      }
    ]
  },
  "errors": [],
  "warnings": []
}
```

### Setting the Current Filter

#### Request

```json
{
  "cmd": "setCurrentFilter",
  "token": "your_api_token",
  "sFilter": "98"
}
```

#### Response

```json
{
  "data": {},
  "errors": [],
  "warnings": []
}
```

## Filter Types

- `type` is "builtin", "saved", or "shared"
- `sFilter` is an opaque string internal to FogBugz that you can pass back to `setCurrentFilter`
- Zero or one of the filters may have the `status="current"` attribute indicating the user's current filter

## Example with curl

```bash
# List all filters
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "listFilters",
    "token": "your_api_token"
}'

# Set the current filter
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "setCurrentFilter",
    "token": "your_api_token",
    "sFilter": "98"
}'
```

## Example with JavaScript

```javascript
const axios = require('axios');

// List all available filters
async function listFilters(apiUrl, token) {
  try {
    const response = await axios.post(apiUrl, {
      cmd: 'listFilters',
      token: token
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data.filters;
  } catch (error) {
    console.error('Error listing filters:', error.response?.data || error.message);
    return null;
  }
}

// Set the current filter
async function setCurrentFilter(apiUrl, token, sFilter) {
  try {
    const response = await axios.post(apiUrl, {
      cmd: 'setCurrentFilter',
      token: token,
      sFilter: sFilter
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.status === 200 && !response.data.errors?.length;
  } catch (error) {
    console.error('Error setting filter:', error.response?.data || error.message);
    return false;
  }
}
```

## Notes

1. Built-in filters are always present and include "My Cases" and sometimes the main Inbox for email
2. The list of filters is returned in the same order that users see in the FogBugz user interface
3. The JSON API response format includes an array of filter objects instead of the XML structure
4. Currently built-in filters won't be listed as "current" even if you are looking at one
5. The response for `setCurrentFilter` is purposefully empty (just an empty data object) in the JSON API
