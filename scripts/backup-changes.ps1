#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Backs up FogBugz cases edited since a given date.

.DESCRIPTION
    Queries cases edited on/after -Since (defaulting to the backup's own
    lastRunTimestamp in backup-state.json) and downloads any that changed.
    Safe to re-run: BackupManager compares each case's dtLastUpdated against
    the saved metadata.json and skips anything unchanged.

    NOTE ON SORTING: The FogBugz/Manuscript search API
    (https://api.manuscript.com/#Search-Cases) only accepts q, cols, max,
    and token - there is no OrderBy/sort parameter documented, confirmed by
    checking the official API reference. The previous version of this
    script tried to sort by OrderBy:"-LastUpdated" / OrderBy:"-Edited" to
    walk cases newest-edited-first; FogBugz either silently ignored that
    (falling back to default ixBug-ascending order) or rejected it outright
    with "Error 10: Invalid search query" depending on quoting. The
    sSorts=LastUpdated.descending parameter visible in the web UI's filter
    URL belongs to a separate internal /f/filters/ endpoint, not this API.

    This version sidesteps sorting entirely: it filters with
    edited:"<since>.." (documented full-text search syntax, same pattern
    backup-all.ps1 already uses successfully for opened:"<date>..") and
    fetches everything matching in one request, relying on the default
    OrderBy:ixBug that backup-full.ts already appends automatically.

.PARAMETER OutputDir
    The output directory for backups (REQUIRED)

.PARAMETER Since
    ISO 8601 timestamp. Only cases edited on/after this date are fetched.
    Defaults to backup-state.json's lastRunTimestamp if omitted.

.PARAMETER BatchSize
    Maximum cases to fetch in this run (default: 2000). FogBugz allows up
    to 100,000 per request. If Processed comes back equal to -BatchSize,
    you likely hit the cap - rerun with a larger -BatchSize.

.PARAMETER Query
    Optional additional FogBugz search query filter, ANDed with the
    edited: filter.

.EXAMPLE
    .\backup-changes.ps1 -OutputDir "F:\Fogbugz"

.EXAMPLE
    .\backup-changes.ps1 -OutputDir "F:\Fogbugz" -Since "2026-05-14T19:35:13Z" -BatchSize 5000
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$OutputDir,

    [Parameter(Mandatory=$false)]
    [string]$Since,

    [Parameter(Mandatory=$false)]
    [int]$BatchSize = 2000,

    [Parameter(Mandatory=$false)]
    [string]$Query = ""
)

function Write-Status {
    param([string]$Message)
    Write-Host "[BACKUP] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Message)
    Write-Host "[ERR] $Message" -ForegroundColor Red
}

if (-not $OutputDir) {
    Write-Err 'Output directory is required. Usage: .\backup-changes.ps1 -OutputDir <path> [-Since <ISO date>] [-BatchSize <n>]'
    exit 1
}

if (-not $Since) {
    $StateFile = Join-Path $OutputDir "backup-state.json"
    if (Test-Path $StateFile) {
        $State = Get-Content $StateFile -Raw | ConvertFrom-Json
        $Since = $State.lastRunTimestamp
        Write-Status "No -Since given; using backup-state.json lastRunTimestamp: $Since"
    } else {
        Write-Err "No -Since given and no backup-state.json found in $OutputDir. Pass -Since <ISO 8601 date> explicitly."
        exit 1
    }
}

$EffectiveQuery = "edited:`"$Since..`""
if ($Query) { $EffectiveQuery = "$Query $EffectiveQuery".Trim() }

Write-Status "FogBugz Changes Backup Script"
Write-Status "Output Directory: $OutputDir"
Write-Status "Since: $Since"
Write-Status "Batch Size: $BatchSize"
Write-Status "Query: $EffectiveQuery"
Write-Status ""

# PowerShell strips/mangles embedded double-quote characters when marshaling
# argv to a child process - this happens even calling node.exe directly, not
# just through the npm.cmd/npx.cmd batch shims. Since our query needs literal
# quotes around the date range (edited:"2026-05-14T19:35:13Z..") to survive,
# pass it via an environment variable instead: env vars go to the child
# process as raw strings with no argv escaping, so quotes always come through
# intact. backup-full.ts reads FOGBUGZ_QUERY_OVERRIDE in preference to --query.
$env:FOGBUGZ_QUERY_OVERRIDE = $EffectiveQuery
$ScriptArgs = @("--output", $OutputDir, "--max", $BatchSize)

Write-Status "Running backup..."
Write-Status ""

try {
    $Output = & node -r ts-node/register "$PSScriptRoot\backup-full.ts" @ScriptArgs 2>&1
} finally {
    Remove-Item Env:\FOGBUGZ_QUERY_OVERRIDE -ErrorAction SilentlyContinue
}

if ($LASTEXITCODE -ne 0) {
    Write-Err "Backup failed with exit code $LASTEXITCODE"
    Write-Host $Output
    exit 1
}

Write-Host $Output

$ProcessedMatch = $Output | Select-String "Total Processed: (\d+)"
$DownloadedMatch = $Output | Select-String "Downloaded: (\d+)"
$SkippedMatch = $Output | Select-String "Skipped: (\d+)"
$ErrorsMatch = $Output | Select-String "Errors: (\d+)"

if (-not $ProcessedMatch) {
    Write-Err "Could not parse backup output"
    exit 1
}

$Processed = [int]$ProcessedMatch.Matches[0].Groups[1].Value
$Downloaded = [int]$DownloadedMatch.Matches[0].Groups[1].Value
$Skipped = [int]$SkippedMatch.Matches[0].Groups[1].Value
$Errors = [int]$ErrorsMatch.Matches[0].Groups[1].Value

Write-Status ""
Write-Host "$('='*60)"
Write-Host "Changes Backup Complete"
Write-Host "$('='*60)"
Write-Success "Total Cases Processed: $Processed"
Write-Host "  Downloaded: $Downloaded"
Write-Host "  Skipped: $Skipped"
Write-Host "  Errors: $Errors"
Write-Host "$('='*60)"

if ($Processed -eq $BatchSize) {
    Write-Warn "Processed count equals -BatchSize ($BatchSize). You likely hit the cap and there may be more changed cases beyond this batch - rerun with a larger -BatchSize."
}

if ($Errors -gt 0) {
    Write-Warn "Some cases had errors. Review logs above."
    exit 1
}

exit 0
