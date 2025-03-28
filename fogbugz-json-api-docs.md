# Overview

FogBugz API provides also a JSON interface where you can send requests and receive responses in JSON format.

For complete documentation on supported commands and arguments, please see our [XML API documentation](https://support.fogbugz.com/article/55730-fogbugz-api-introduction).

---

# Information

How to use the FogBugz JSON API: 

- The API URL is: `https://yourfogbugzsite.com/f/api/0/jsonapi`
  - **note:** `https`, not `http`
- Only POST requests are supported.
- The POST must contain no parameters (except when attaching files), and be passed a JSON object in the raw body.
- Strings containing lists (e.g. `cols=sTitle,sStatus`) must be sent as an array (e.g. `"cols": ["sTitle", "sStatus"]`)
- The JSON API understands values other than strings where appropriate:
  - Fields that begin with ix (*e.g.*, ixBug) will accept and return integer values.
  - Fields that begin with f (*e.g.*, fAdministrator) will accept and return boolean values (true/false).

> **Windows built-in curl** specific instructions:
> 
> - all curl parameters should be enclosed in double-quotes ", instead of single-quote '
> - the double quotes within the JSON raw body content should be escaped by replacing the " double-quotes with \" backslash + double quote 

---

## Examples

### Logging on

**Request Body:**

```json
{
  "cmd": "logon",
  "email": "email@example.com",
  "password": "yourpassword"
}
```

**Response:**

```json
{
  "data": {
    "token": "secret24dsg34lok43un23"
  }
  ...
}
```

[Back to the top](#overview)

---

### Creating a New Case with Token Using cUrl

**Request**

```bash
curl --location --request POST "https://yourfogbugzsite.com/f/api/0/jsonapi" --header 'Content-Type: application/json' --data-raw '{
    "cmd": "new",
    "token" : "secret24dsg34lok43un23" ,
    "sTitle" : "Case created with JSON API",
    "sEvent" : "Here is the first comment"
}'
```

**Response**

```json
{
    "data": {
        "case": {
            "ixBug": 1106,
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
    },
    "errorCode": null,
    "maxCacheAge": null
}
```

Read this article about [Creating a Case with an Attachment Using the JSON API](https://support.fogbugz.com/article/55691-creating-a-case-with-an-attachment-using-the-json-api).

[Back to the top](#overview)

---

### Searching Cases

**Request Body:**

```json
{
  "cmd": "search",
  "token": "24dsg34lok43un23",
  "q": "test",
  "max": 2,
  "cols": ["sTitle", "sStatus"]
}
```

**Response:**

```json
{
  "data": {
    "count": 2,
    "totalHits": 11,
    "cases": [
    {
      "ixBug": 29,
      "operations": [
        "edit",
        "assign",
        "resolve",
        "email"
      ],
      "sTitle": "test 123",
      "sStatus": "Active"
    },
    {
      "ixBug": 22,
      "operations": [
        "edit",
        "assign",
        "resolve",
        "email"
      ],
      "sTitle": "test 456",
      "sStatus": "Active"
    }
  }
  ...
}
```

[Back to the top](#overview)

---

### Error Handling

Errors will be returned in the `errors` array:

```json
{
  ...
  "errors": [
    {
      "message": "Error 3: Not logged in",
      "detail": null,
      "code": "3"
    }
  ]
  ...
}
```

See our [XML API documentation](https://support.fogbugz.com/article/55753-fogbugz-xml-api-error-codes) for a full list of error codes.

[Back to the top](#overview)
