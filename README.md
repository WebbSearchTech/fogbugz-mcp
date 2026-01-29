# FogBugz MCP Server

A Model Context Protocol (MCP) server for interacting with FogBugz through Language Learning Models (LLMs) such as Claude.

## Overview

This server allows LLMs to perform various operations on FogBugz including:

- Creating new issues/cases with optional attachments
- Updating existing cases (changing project, area, milestone, priority)
- Assigning cases to specific users
- Listing a user's open cases
- Getting direct links to specific cases
- Searching for cases by various criteria

The server implements the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) specification, allowing it to be used by any MCP-compatible LLM client.

## Project Background

This project was initiated with the help of [OpenAI's o3-mini-high model](https://openai.com/), which generated a comprehensive development plan (see DEVELOPMENT-PLAN.md in the repository). The plan outlined the architecture, tools, and implementation details for building a FogBugz MCP server in TypeScript.

The detailed specification served as a blueprint for the development team, demonstrating how AI can effectively assist in the early phases of project design and planning. This project is both an example of AI-assisted development and a tool that enhances AI capabilities through the MCP protocol.

## Installation

```bash
# Install from npm
npm install -g fogbugz-mcp

# Or use directly with npx
npx fogbugz-mcp <fogbugz-url> <api-key>
```

## Usage

### Basic Usage

```bash
# Run with command line arguments
fogbugz-mcp https://yourcompany.fogbugz.com your-api-key

# Or use environment variables
export FOGBUGZ_URL=https://yourcompany.fogbugz.com
export FOGBUGZ_API_KEY=your-api-key
fogbugz-mcp
```

### Development

```bash
# Clone the repository
git clone https://github.com/yourusername/fogbugz-mcp.git
cd fogbugz-mcp

# Install dependencies
npm install

# Create a .env file with your FogBugz credentials
echo "FOGBUGZ_URL=https://yourcompany.fogbugz.com" > .env
echo "FOGBUGZ_API_KEY=your-api-key" >> .env

# Run API explorer to test FogBugz API
npm run explore

# Run the development version of the server
npm run dev

# Run tests
npm test

# Build the project
npm run build
```

## API Explorer

The project includes an API explorer tool for testing FogBugz API endpoints directly:

```bash
# Run all API tests
npm run explore

# Run a specific test (by index)
npm run explore 0  # Run the first test
```

## MCP Tools

This server provides the following MCP tools for LLMs:

- `fogbugz_create_case` - Create a new FogBugz case
- `fogbugz_update_case` - Update an existing case's fields
- `fogbugz_assign_case` - Assign a case to a specific user
- `fogbugz_list_my_cases` - List cases assigned to a specific user
- `fogbugz_search_cases` - Search for cases using a query string
- `fogbugz_get_case_link` - Get a direct link to a specific case
- `fogbugz_get_case_details` - Get full details of a case including all events
- `fogbugz_download_case` - Download a complete case backup with attachments
- `fogbugz_create_project` - Create a new project in FogBugz

## Backup and Export

The server includes comprehensive backup capabilities for exporting FogBugz data locally with full fidelity.

### Features

- **Full Data Export**: Downloads complete case metadata, event history, and all file attachments
- **Incremental Sync**: Automatically skips unchanged cases based on `dtLastUpdated` timestamp
- **State Tracking**: Maintains `backup-state.json` with last run timestamp and progress information
- **Security Defaults**: Auto-generates `.gitignore` to prevent accidental commits of backup data
- **Timeline Preservation**: Includes case events with proper timestamps for chronological context

### Using the MCP Tool

Ask the LLM to download a case:

```
Download FogBugz case 12345 to ./my-backups
```

The tool will create a folder structure:
```
my-backups/
├── .gitignore
├── backup-state.json
└── case-12345/
    ├── metadata.json          # Full case data with events
    ├── 85105_screenshot.png   # Attachments prefixed with event ID
    └── 85106_document.pdf
```

### Using the CLI Backup Script

The backup script uses **date-based pagination** to retrieve all cases efficiently without getting stuck in infinite loops. Cases are sorted by creation date (`opened`), and each batch automatically advances to the next set of cases.

#### Starting a New Backup (From Case #1)

To start a fresh backup from the beginning, **delete the backup directory or use a new folder**:

```bash
# Windows PowerShell
Remove-Item "D:\Backups\FogBugz" -Recurse -Force -ErrorAction SilentlyContinue
.\scripts\backup-all.ps1 -OutputDir "D:\Backups\FogBugz" -BatchSize 1000

# Linux/macOS
rm -rf ./fogbugz-backup
npm run backup -- -o ./fogbugz-backup -m 1000
```

Alternatively, if you want to keep existing files but restart the pagination, delete only the state file:

```bash
# Windows
Remove-Item "D:\Backups\FogBugz\backup-state.json" -Force

# Linux/macOS
rm ./fogbugz-backup/backup-state.json
```

#### Basic Usage Examples

```bash
# Get total case count for a query
npm run backup -- --count-only

# Get count of active cases
npm run backup -- --count-only --query "status:active"

# Backup to specified directory (required)
npm run backup -- -o ./fogbugz-archive

# Specify batch size (default: 50, recommended: 500-1000)
npm run backup -- -o ./fogbugz-archive -m 1000

# Filter by query
npm run backup -- -o ./fogbugz-archive -q "status:active" -m 500

# Resume from specific date (ISO 8601 format)
npm run backup -- -o ./fogbugz-archive --opened-after "2025-03-07T19:21:03Z"

# Show help
npm run backup -- --help
```

#### Automated Full Backup (Recommended)

For initial backups of all cases, use the PowerShell automation script which handles batching automatically:

```powershell
# Basic full backup (default 1000 cases per batch)
.\scripts\backup-all.ps1 -OutputDir "D:\Backups\FogBugz"

# Custom batch size (smaller batches = more frequent progress updates)
.\scripts\backup-all.ps1 -OutputDir "D:\Backups\FogBugz" -BatchSize 500

# Backup with query filter (e.g., only active cases)
.\scripts\backup-all.ps1 -OutputDir "D:\Backups\FogBugz" -Query "status:active"
```

**What the script does:**
1. Fetches cases in batches sorted by creation date (`opened`)
2. Automatically extracts pagination markers from output
3. Passes `--opened-after` to subsequent batches to advance through all cases
4. Stops when batch returns fewer cases than requested (end of result set)
5. Provides progress updates and final summary

**Options:**
- `-OutputDir <path>` - Output directory **(REQUIRED)**
- `-BatchSize <num>` - Cases per batch (default: 1000, max: 100,000)
- `-Query <string>` - FogBugz search query filter (optional)

#### How Date-Based Pagination Works

The backup system uses the `opened` (case creation date) field to page through results:

1. **First batch**: `opened:"2025-01-01.." OrderBy:opened` fetches oldest 1000 cases
2. Script notes the last case's creation date: `2025-03-07T19:21:03Z`
3. **Next batch**: `opened:"2025-03-07T19:21:03Z.." OrderBy:opened` fetches cases created after that time
4. Repeats until batch returns fewer than requested (indicating end)

**Why this works:**
- FogBugz doesn't support `offset`/`skip` parameters for traditional pagination
- Date ranges (e.g., `opened:"DATE.."`) are supported in search queries
- ISO 8601 timestamps provide precision to avoid skipping cases created in same second
- Each batch processes a different subset of cases by date range

**Incremental Backups:**

Running the backup script multiple times on the same directory will:
1. Skip cases that haven't changed (based on `dtLastUpdated`)
2. Re-download only modified cases
3. Download new cases not previously backed up

For a truly fresh backup from case #1, use a new output directory or delete the existing one.

### Backup File Format

Backups are stored as **raw JSON** directly from the FogBugz API for maximum fidelity and future restoration capability. Each case folder contains:

- **metadata.json**: Complete case data including all fields and the full event history
- **Attachments**: Original files with sanitized names prefixed by event ID to prevent collisions

**Note**: Source control commits from modern integrations (GitHub, GitLab) are displayed in the FogBugz UI but are not accessible via the backup API. Only legacy source control check-ins (SVN, CVS, Perforce via hook scripts) would be included if present.

### Security Recommendations

Backups contain sensitive data in plain text. Recommended security practices:

1. **Disk Encryption**: Store on BitLocker/FileVault/LUKS encrypted volumes
2. **Filesystem Permissions**: Restrict read/write access to authorized users only
3. **Credential Isolation**: Never store API tokens in the backup directory
4. **Encrypted Archival**: For cold storage, compress into AES-256 encrypted archives
5. **Cloud Storage**: Use client-side encryption (Rclone, Cryptomator) before uploading
6. **Version Control**: The auto-generated `.gitignore` prevents accidental Git commits

### Future Enhancements

Planned features for backup/migration workflows:
- Database conversion scripts (SQLite format for search/indexing)
- Migration adapters for Jira, GitHub Issues, Linear
- Compression options (per-case .zip archives)
- Differential backup using case ID ranges

## License

ISC 