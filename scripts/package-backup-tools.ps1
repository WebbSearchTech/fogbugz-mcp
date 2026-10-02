#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Packages the FogBugz backup tools into a standalone distribution.

.DESCRIPTION
    Creates a minimal package containing only what's needed to run the backup scripts.
    This can be distributed to colleagues or saved with backups.

    Safe to re-run over an existing package (e.g. the one the scheduled task
    runs from): it refreshes the scripts and src/ in place and leaves .env,
    node_modules and anything else it doesn't manage untouched.

.PARAMETER OutputDir
    Where to create the package (default: ./fogbugz-backup-tools)
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "fogbugz-backup-tools"
)

# Resolve repo paths relative to this script so it works from any directory
$RepoRoot = Split-Path -Parent $PSScriptRoot
$ScriptsDir = Join-Path $RepoRoot "scripts"

Write-Host "Creating FogBugz Backup Tools package..." -ForegroundColor Cyan

if (Test-Path $OutputDir) {
    Write-Host "Updating existing package directory (keeping .env and node_modules)..." -ForegroundColor Yellow
} else {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

# Copy essential files
Write-Host "Copying files..." -ForegroundColor Cyan

# Scripts
foreach ($Script in @(
    "backup-all.ps1",
    "backup-changes.ps1",
    "backup-full.ts",
    "run-weekly-backup.ps1",
    "install-scheduled-task.ps1"
)) {
    Copy-Item (Join-Path $ScriptsDir $Script) "$OutputDir/" -Force
}

# Package files
Copy-Item (Join-Path $RepoRoot "package.json") "$OutputDir/" -Force
Copy-Item (Join-Path $RepoRoot "tsconfig.json") "$OutputDir/" -Force

# Source code (needed for ts-node). Replace src/ wholesale so files deleted
# from the repo don't linger in the package.
$PackageSrc = Join-Path $OutputDir "src"
if (Test-Path $PackageSrc) {
    Remove-Item $PackageSrc -Recurse -Force
}
New-Item -ItemType Directory -Path $PackageSrc -Force | Out-Null
Copy-Item -Recurse (Join-Path $RepoRoot "src/*") "$PackageSrc/"

# Create .env.example
@"
# FogBugz Configuration
FOGBUGZ_URL=https://your-company.fogbugz.com
FOGBUGZ_API_KEY=your_api_key_here
"@ | Out-File -FilePath "$OutputDir/.env.example" -Encoding UTF8

# Create simplified README
@"
# FogBugz Backup Tools

Standalone backup utilities for exporting FogBugz cases.

## Quick Start

### 1. Install Dependencies

``````powershell
npm install
``````

### 2. Configure FogBugz Connection

Copy `.env.example` to `.env` and edit with your FogBugz details:

``````
FOGBUGZ_URL=https://your-company.fogbugz.com
FOGBUGZ_API_KEY=your_api_key_here
``````

**Get your API key:** Log into FogBugz → Click your profile → API Tokens → Create New Token

### 3. Run Full Backup

**Windows PowerShell:**
``````powershell
.\backup-all.ps1 -OutputDir "D:\Backups\FogBugz"
``````

**Linux/macOS:**
``````bash
npm run backup -- -o ./fogbugz-backup -m 1000
``````

### 4. Run Changes Backup (newest changes first)

``````powershell
.\backup-changes.ps1 -OutputDir "D:\Backups\FogBugz" -BatchSize 500
``````

## What Gets Backed Up

Each case is saved in its own folder:

``````
backup-directory/
├── .gitignore
├── backup-state.json
└── case-12345/
    ├── metadata.json          # Full case data with events
    ├── 85105_screenshot.png   # Attachments prefixed with event ID
    └── 85106_document.pdf
└── wikis/
    └── wiki-1/
        └── article-34/
            ├── metadata.json      # Article headline, HTML body, revision, tags
            └── 7131_image.png     # Attachments prefixed with attachment ID
``````

Every run also backs up all wikis; articles whose revision hasn't changed are skipped.

## Weekly Scheduled Backup (Windows)

``````powershell
.\install-scheduled-task.ps1 -OutputDir "F:\Fogbugz"
``````

Registers a Task Scheduler job that runs run-weekly-backup.ps1, which calls
backup-changes.ps1 and appends results to <OutputDir>\backup-log.txt.

**Note:** Modern GitHub/GitLab commits shown in the FogBugz UI are not accessible via the backup API.

## Backup Options

### backup-all.ps1 Parameters

- **-OutputDir** (required): Where to save backups
- **-BatchSize** (optional, default: 1000): Cases per batch
- **-Query** (optional): FogBugz search filter (e.g., "status:active")

### backup-changes.ps1 Parameters

- **-OutputDir** (required): Where to save backups
- **-BatchSize** (optional, default: 1000): Cases per batch
- **-Query** (optional): Additional search filter

## Examples

### Backup only active cases
``````powershell
.\backup-all.ps1 -OutputDir "D:\Backups\Active" -Query "status:active"
``````

### Backup with smaller batches
``````powershell
.\backup-all.ps1 -OutputDir "D:\Backups\FogBugz" -BatchSize 500
``````

### Resume interrupted backup
``````powershell
# Just run the same command again - it automatically resumes
.\backup-all.ps1 -OutputDir "D:\Backups\FogBugz"
``````

## Troubleshooting

### "Cannot find module" errors
Run `npm install` to install dependencies.

### "Invalid API key" errors
Check your `.env` file and verify your API token in FogBugz.

### Backup stops early
Check the backup-state.json file. The script automatically resumes from where it left off.

## Security

Backups contain sensitive data in plain text. Recommended practices:

1. **Disk Encryption**: Use BitLocker/FileVault/LUKS encrypted volumes
2. **Filesystem Permissions**: Restrict read/write access to authorized users only
3. **Never commit .env files**: The backup auto-generates .gitignore to prevent this

## System Requirements

- Node.js 18 or later
- PowerShell 5.1+ (Windows) or PowerShell Core 7+ (Linux/macOS)
- Sufficient disk space (estimate: 1-10 MB per case with attachments)

---

**Version:** 1.1.0  
**License:** MIT
"@ | Out-File -FilePath "$OutputDir/README.md" -Encoding UTF8

Write-Host ""
Write-Host "Package created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $OutputDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. cd $OutputDir"
Write-Host "  2. npm install   (re-run after updating, in case dependencies changed)"
if (-not (Test-Path (Join-Path $OutputDir ".env"))) {
    Write-Host "  3. Copy .env.example to .env and configure"
} else {
    Write-Host "  3. .env already present - kept as-is"
}
Write-Host "  4. Run .\backup-all.ps1 -OutputDir <path>"
Write-Host ""
Write-Host "To distribute, zip the entire folder or copy to a shared location." -ForegroundColor Cyan
