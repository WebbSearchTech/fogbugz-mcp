# Editing a Person

## XML API

In the XML API, you can edit an existing person using the `editPerson` command. It's similar to `newPerson`, but the only required parameter is `ixPerson`:

```
http://www.example.com/api.asp?cmd=editPerson&token=your_token&ixPerson=5&sPhone=555-1234
```

Only fields that are specified in the request will be updated.

## JSON API Equivalent

The JSON API provides the same `editPerson` command to update user information:

### Edit a Person

#### Request

```json
{
  "cmd": "editPerson",
  "token": "your_api_token",
  "ixPerson": 5,
  "sEmail": "updated.email@example.com",
  "sFullname": "Updated User Name",
  "sPhone": "555-1234",
  "fNotify": true
}
```

#### Response

```json
{
  "data": {
    "person": {
      "ixPerson": 5,
      "sFullName": "Updated User Name",
      "sEmail": "updated.email@example.com",
      "sPhone": "555-1234",
      "fAdministrator": false,
      "fCommunity": false,
      "fVirtual": false,
      "fDeleted": false,
      "fNotify": true,
      "sHomepage": "",
      "sLocale": "*",
      "sLanguage": "*",
      "sTimeZoneKey": "*",
      "sSnippetKey": "`",
      "ixBugWorkingOn": 0,
      "nType": 0
    }
  },
  "errors": [],
  "warnings": []
}
```

### View a Person (Current User)

To get information about the currently logged-in user, you can use the `viewPerson` command without specifying a person ID:

#### Request

```json
{
  "cmd": "viewPerson",
  "token": "your_api_token"
}
```

#### Response

```json
{
  "data": {
    "person": {
      "ixPerson": 2,
      "sFullName": "Administrator",
      "sEmail": "admin@example.com",
      "sPhone": "",
      "fAdministrator": true,
      "fCommunity": false,
      "fVirtual": false,
      "fDeleted": false,
      "sHomepage": "",
      "sLocale": "*",
      "sLanguage": "*",
      "sTimeZoneKey": "*",
      "sSnippetKey": "`",
      "ixBugWorkingOn": 0,
      "nType": 1
    }
  },
  "errors": [],
  "warnings": []
}
```

### View a Specific Person

To get information about a specific user, you can use the `viewPerson` command with either `ixPerson` or `sEmail`:

#### Request

```json
{
  "cmd": "viewPerson",
  "token": "your_api_token",
  "ixPerson": 5
}
```

Or:

```json
{
  "cmd": "viewPerson",
  "token": "your_api_token",
  "sEmail": "user@example.com"
}
```

## Parameters

The `editPerson` command accepts the same parameters as `newPerson`, but the only required parameter is `ixPerson`:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ixPerson` | Integer | Yes | ID of the person to edit |
| `sEmail` | String | No | Email address |
| `sFullname` | String | No | Full name |
| `nType` | Integer | No | User type: 0=normal, 1=admin, 2=community, 3=virtual |
| `fActive` | Boolean | No | Whether the user is active |
| `sPassword` | String | No | Password |
| `sLocale` | String | No | Locale for date/number formats |
| `sLanguage` | String | No | UI language |
| `sTimeZoneKey` | String | No | Time zone key |
| `sSnippetKey` | String | No | Snippet key |
| `fNotify` | Boolean | No | Whether the user receives notifications |
| `sPhone` | String | No | Phone number |
| `sHomepage` | String | No | Homepage URL |
| `fDeleted` | Boolean | No | Whether the user is inactive |

## Example with curl

```bash
# View the current user
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "viewPerson",
    "token": "your_api_token"
}'

# Edit a user
curl --location --request POST "https://example.fogbugz.com/f/api/0/jsonapi" \
--header 'Content-Type: application/json' \
--data-raw '{
    "cmd": "editPerson",
    "token": "your_api_token",
    "ixPerson": 5,
    "sPhone": "555-1234",
    "sHomepage": "https://example.com"
}'
```

## Example with JavaScript

```javascript
const axios = require('axios');

// View the current user
async function getCurrentUser(apiUrl, token) {
  try {
    const response = await axios.post(apiUrl, {
      cmd: 'viewPerson',
      token: token
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data.person;
  } catch (error) {
    console.error('Error fetching current user:', error.response?.data || error.message);
    return null;
  }
}

// View a specific user
async function getUser(apiUrl, token, userId) {
  try {
    const response = await axios.post(apiUrl, {
      cmd: 'viewPerson',
      token: token,
      ixPerson: userId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data.person;
  } catch (error) {
    console.error('Error fetching user:', error.response?.data || error.message);
    return null;
  }
}

// Edit a user
async function editUser(apiUrl, token, userId, updates) {
  try {
    const response = await axios.post(apiUrl, {
      cmd: 'editPerson',
      token: token,
      ixPerson: userId,
      ...updates
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data.person;
  } catch (error) {
    console.error('Error editing user:', error.response?.data || error.message);
    return null;
  }
}

// Example usage
async function updateUserContact(apiUrl, token, userId, phone, homepage) {
  const updates = {};
  if (phone) updates.sPhone = phone;
  if (homepage) updates.sHomepage = homepage;
  
  const updatedUser = await editUser(apiUrl, token, userId, updates);
  console.log(`Updated user ${updatedUser.sFullName} with new contact information`);
  return updatedUser;
}
```

## Notes

1. The JSON API provides two related commands:
   - `viewPerson`: To view user information
   - `editPerson`: To update user information
2. When using `editPerson`, only the fields you specify will be updated. Other fields will remain unchanged.
3. When using `viewPerson` without specifying a user ID, you'll get information about the currently authenticated user.
4. You can use `ixPerson` or `sEmail` to identify a user when viewing their information.
5. When updating a user's type, use these values:
   - `0`: Normal user
   - `1`: Administrator
   - `2`: Community user
   - `3`: Virtual user
6. Setting `fDeleted` to `true` will mark a user as inactive, but won't delete their history.
7. The `sPassword` parameter should be used with caution, as it will change the user's password.
