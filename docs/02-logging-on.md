# Logging On

## XML API

In the XML API, you can log on using an email address (or full name) and password:

```
http://www.example.com/api.asp?cmd=logon&email=xxx@example.com&password=YourPassword
```

Upon successful login, you receive a token which should be used for all subsequent requests:

```xml
<response><token>24dsg34lok43un23</token></response>
```

If there are multiple users with the same email address, you'll receive an "Ambiguous Logon" error:

```xml
<response>
  <error code="2">Ambiguous Logon</error>
  <people>
    <person>John Hancock</person>
    <person>Fred Astaire</person>
  </people>
</response>
```

In this case, you should try logging in again with the full name.

## JSON API Equivalent

The JSON API provides similar functionality with a more structured approach:

### 1. Login with Email and Password (Not Recommended)

```json
{
  "cmd": "logon",
  "email": "user@example.com",
  "password": "YourPassword"
}
```

### 2. Login with API Token (Recommended)

```json
{
  "cmd": "logon",
  "token": "your_api_token"
}
```

Successful response:

```json
{
  "data": {
    "token": "your_api_token"
  },
  "errors": [],
  "warnings": []
}
```

### 3. Handling Ambiguous Login

If multiple users share the same email, you'll receive an error response:

```json
{
  "data": {},
  "errors": [
    {
      "message": "Error 2: Ambiguous Logon",
      "detail": null,
      "code": "2"
    }
  ],
  "warnings": [],
  "people": [
    "John Hancock",
    "Fred Astaire"
  ]
}
```

You should then try logging in with the full name:

```json
{
  "cmd": "logon",
  "email": "John Hancock",
  "password": "YourPassword"
}
```

### 4. Checking Token Validity

To check if a token is still valid, use the same logon command with the token:

```json
{
  "cmd": "logon",
  "token": "your_api_token"
}
```

If the token is valid, you'll receive the same token back in the response.

### Example with curl

```bash
# Login with API token
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "logon",
    "token": "your_api_token"
}'

# Login with email and password
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "logon",
    "email": "user@example.com",
    "password": "YourPassword"
}'
```

### Example with JavaScript

```javascript
const axios = require('axios');

async function login(apiUrl, emailOrToken, password = null) {
  try {
    const payload = password 
      ? { cmd: 'logon', email: emailOrToken, password } 
      : { cmd: 'logon', token: emailOrToken };
    
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.errors && response.data.errors.length > 0) {
      console.error('Login failed:', response.data.errors);
      return null;
    }
    
    return response.data.data.token;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    return null;
  }
}
```

## Important Notes

1. Using the API token directly is the recommended approach, especially since email/password authentication may not work if two-factor authentication (2FA) is enabled.
2. Token reuse is encouraged over issuing repeated logon commands.
3. All subsequent requests to the API will require the token.
4. Unlike the XML API which uses GET requests, the JSON API requires POST requests with a JSON payload.
