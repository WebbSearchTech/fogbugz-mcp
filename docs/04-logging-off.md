# Logging Off

## XML API

In the XML API, you can log off to invalidate your session token with the following request:

```
http://www.example.com/api.asp?cmd=logoff&token=24dsg34lok43un23
```

The response will be empty:

```xml
<response></response>
```

After logging off, the token will no longer be valid for future requests.

## JSON API Equivalent

The JSON API provides a similar `logoff` command to invalidate a token:

### Request

```json
{
  "cmd": "logoff",
  "token": "your_api_token"
}
```

### Response

```json
{
  "data": {},
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

After logging off, the token will be invalidated and cannot be used for subsequent API requests.

### Example with curl

```bash
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "logoff",
    "token": "your_api_token"
}'
```

### Example with JavaScript

```javascript
const axios = require('axios');

async function logoff(apiUrl, token) {
  try {
    const response = await axios.post(apiUrl, {
      cmd: 'logoff',
      token: token
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Successfully logged off');
    return true;
  } catch (error) {
    console.error('Logoff error:', error.response?.data || error.message);
    return false;
  }
}
```

## Important Notes

1. Once you log off, the token is invalidated and you will need to obtain a new token by logging in again.
2. If you try to use an invalidated token, you will receive the "Not logged on" error (error code 3).
3. The JSON API, unlike the XML API, returns a proper JSON response even when the operation returns no specific data.
4. If you're using an API key directly (which is the recommended approach), you don't need to log off as your API key remains valid until revoked.
