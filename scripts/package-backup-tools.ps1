#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Packages the FogBugz backup tools into a standalone distribution.

.DESCRIPTION
    Creates a minimal package containing only what's needed to run the backup scripts.
    This can be distributed to colleagues or saved with backups.

.PARAMETER OutputDir
    Where to create the package (default: ./fogbugz-backup-tools)
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "fogbugz-backup-tools"
)

Write-Host "Creating FogBugz Backup Tools package..." -ForegroundColor Cyan

# Create output directory
if (Test-Path $OutputDir) {
    Write-Host "Removing existing package directory..." -ForegroundColor Yellow
    Remove-Item $OutputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDir | Out-Null

# Copy essential files
Write-Host "Copying files..." -ForegroundColor Cyan

# Scripts
Copy-Item "scripts/backup-all.ps1" "$OutputDir/"
Copy-Item "scripts/backup-changes.ps1" "$OutputDir/"
Copy-Item "scripts/backup-full.ts" "$OutputDir/"

# Package files
Copy-Item "package.json" "$OutputDir/"
Copy-Item "tsconfig.json" "$OutputDir/"

# Source code (needed for ts-node)
New-Item -ItemType Directory -Path "$OutputDir/src" -Force | Out-Null
Copy-Item -Recurse "src/*" "$OutputDir/src/"

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
``````

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
Write-Host "  2. npm install"
Write-Host "  3. Copy .env.example to .env and configure"
Write-Host "  4. Run .\backup-all.ps1 -OutputDir <path>"
Write-Host ""
Write-Host "To distribute, zip the entire folder or copy to a shared location." -ForegroundColor Cyan
