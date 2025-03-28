# FogBugz JSON API Documentation

This directory contains documentation for the FogBugz JSON API, organized by sections.

## Table of Contents

1. [API Version and Location](01-api-version-location.md) ✅
2. [Logging On](02-logging-on.md) ✅
3. [General Rules for API Requests](03-general-rules.md) ✅
4. [Logging Off](04-logging-off.md) ✅
5. [Filters](05-filters.md) ✅
6. [Listing and Viewing Cases](06-listing-viewing-cases.md) ✅
7. [Editing Cases](07-editing-cases.md) ✅
8. [Lists](08-lists.md) ✅
9. [Creating](09-creating.md) ✅
10. [Editing a Person](10-editing-person.md) ✅
11. [Views](11-views.md) ✅
12. [Milestone Dependencies](12-milestone-dependencies.md) ✅
13. [Working Schedule](13-working-schedule.md) ✅
14. [Time Tracking](14-time-tracking.md) ✅
15. [Source Control](15-source-control.md) ✅
16. [Tags](16-tags.md) ✅
17. [Release Notes](17-release-notes.md) ✅
18. [Milestones](18-milestones.md) ✅
19. [Wikis](19-wikis.md) ✅
20. [Discussion Groups](20-discussion-groups.md) ✅
21. [BugzScout](21-bugzscout.md) ✅
22. [Subscriptions](22-subscriptions.md)
23. [Email Correspondents](23-email-correspondents.md)
24. [Mark as Viewed](24-mark-as-viewed.md)
25. [Star/Unstar](25-star-unstar.md)
26. [Settings](26-settings.md)
27. [Site Settings](27-site-settings.md)
28. [Evidence-Based Scheduling](28-evidence-based-scheduling.md)
29. [Increasing the Case Number](29-increasing-case-number.md)
30. [Error Codes](30-error-codes.md)
31. [Event Codes](31-event-codes.md)

## Usage

The JSON API provides equivalent functionality to the XML API but with JSON request and response formats. Use these docs as a reference for implementing JSON API clients.

### API Explorer

An API Explorer script is available in the scripts directory to test and demonstrate the JSON API functionality:

```bash
node scripts/api-explorer.js
```

The API Explorer demonstrates:
- API Version and Location verification
- Logging in with an API token
- General rules for API requests
- Logging out and token invalidation
- Working with filters
- Listing and viewing cases
- Editing cases
- Listing various FogBugz entities
- Creating new entities (projects, areas, people, milestones)
- Editing person information
- Viewing detailed entity information

### Note on API Key

For API functionality to work, you need a valid API key in your `.env` file:

```
FOGBUGZ_API_KEY=your_api_key
FOGBUGZ_URL=https://your-instance.fogbugz.com
```

For the complete XML API documentation, see [fogbugz-xml-api-complete.md](../fogbugz-xml-api-complete.md).
