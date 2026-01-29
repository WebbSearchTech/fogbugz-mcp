# FogBugz API Search Reference

## Overview

This document describes FogBugz search query syntax and pagination strategies for bulk operations.

## Important Limitations

### Result Set Limits

- **UI Default**: FogBugz returns a maximum of **200 case results** initially, sorted by relevance
- **API Max Parameter**: The `max` parameter can retrieve up to **100,000 cases** in a single API request
- **Default Results**: When no filter is applied, FogBugz applies implicit filters based on user permissions
- **No pagination parameters**: FogBugz API does not support `offset`, `skip`, `start`, or `page` parameters

### Sorting with OrderBy

Use the `OrderBy` axis to sort search results:

```
OrderBy:ixBug              # Sort by case ID ascending
OrderBy:"-ixBug"           # Sort by case ID descending
OrderBy:Milestone OrderBy:Priority  # Multiple sorts
```

**Note**: Must be included in the search query (`q` parameter), not as a separate parameter.

## Search Query Syntax

### Case ID Searches

**Valid:**
- `ixBug:"123"` - Find specific case
- `ixBug:"123" OR ixBug:"456"` - Find multiple cases
- `case:"123"` - Alias for ixBug

**Invalid (Not Supported):**
- `ixBug:>="1000"` - Range comparisons not supported
- `ixBug:1000..2000` - Range syntax not supported

**Workaround**: Fetch all cases sorted by `OrderBy:ixBug`, then filter client-side.

### Date Searches

Supports ranges and relative dates:

```
edited:"3/26/2007..6/8/2007"  # Date range
opened:"-3w..-1w"              # Relative dates (3-1 weeks ago)
closed:"-30m..now"             # Within last 30 minutes
```

### Boolean Operators

```
term1 term2           # AND (both required)
term1 OR term2        # OR
term1 -term2          # AND NOT
"exact phrase"        # Phrase search
term*                 # Wildcard (1+ characters)
```

### Axis Syntax

```
axis:value            # Exact/substring match
axis:"value"          # With quotes (for spaces)
axis:=1               # Exact ID match (using := operator)
-axis:value           # Negate the search
```

## Common Search Filters

```
status:"Active"              # By status
assignedto:"User Name"       # By assignment
project:Widget               # By project (substring)
area:"Feature Requests"      # By area
priority:1                   # By priority
milestone:1.0                # By milestone
tag:urgent                   # By tag
edited:"last week"           # By edit date
-due:*                       # Cases without due date
type:case                    # Specify document type
```

## Search Engine Details

- **Technology**: Apache Lucene.NET-based full-text search
- **Indexing**: Built in background, may not include very recent entries
- **Stemming**: Uses word stemming by default (e.g., "hiking" finds "hike", "hiker")
- **Reindexing**: On rare occasions, re-indexes with most recent cases first

## Backup Script Considerations

For bulk exports, FogBugz uses date-based pagination to retrieve all cases:

1. **Date-based pagination**: Query results sorted by `OrderBy:opened` (case creation date)
2. **Batch retrieval**: Fetch N cases at a time (e.g., 1000), note the last case's `dtOpened` 
3. **Next batch**: Use `opened:"LAST_DATE.."` to fetch cases opened after the last batch's final case
4. **Incremental strategy**: This avoids re-fetching the same cases and ensures progress through the full result set
5. **ISO 8601 format**: Use precise timestamps like `2026-01-29T10:30:45Z` to handle multiple cases created at the same time

### Example Pagination Flow

```
Batch 1: opened:"2025-01-01.." OrderBy:opened  →  fetches 1000 cases, last opened: 2025-03-15T14:22:30Z
Batch 2: opened:"2025-03-15T14:22:30Z.." OrderBy:opened  →  fetches next 1000 cases
Batch 3: opened:"2025-06-01T09:15:00Z.." OrderBy:opened  →  continues until all cases retrieved
```

### No Native Pagination

Limitations acknowledged:

- **No offset/skip parameters**: Must use date ranges instead
- **No case ID range filtering**: `ixBug:>=1000` syntax is not supported
- **Default result limit**: UI shows 200 results; API allows up to 100,000 per request
- **Timestamp precision**: Use ISO 8601 format (`YYYY-MM-DDTHH:MM:SSZ`) for precise boundaries
- **Same-second duplicates**: If multiple cases created in same second, fetch all and deduplicate client-side
