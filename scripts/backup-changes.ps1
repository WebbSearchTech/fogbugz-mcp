#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Backfills changed FogBugz cases in reverse edit-date order.

.DESCRIPTION
    Downloads cases in batches ordered by last edited date (newest first).
    Each batch moves further back in time using edited:"..DATE" and stops
    when a full batch contains only skipped cases.

.PARAMETER OutputDir
    The output directory for backups (REQUIRED)

.PARAMETER BatchSize
    Cases per batch (default: 1000)

.PARAMETER Query
    Optional FogBugz search query filter. OrderBy:"-Edited" will be appended
    if not provided.
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$OutputDir,

    [Parameter(Mandatory=$false)]
    [int]$BatchSize = 1000,

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

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERR] $Message" -ForegroundColor Red
}

if (-not $OutputDir) {
    Write-Error 'Output directory is required. Usage: .\backup-changes.ps1 -OutputDir <path>'
    exit 1
}

$BatchNumber = 1
$TotalProcessed = 0
$TotalDownloaded = 0
$TotalSkipped = 0
$TotalErrors = 0
$NextBatchEditedBefore = $null
$PreviousBatchCaseIds = $null

Write-Status "FogBugz Changes Backup Script"
Write-Status "Output Directory: $OutputDir"
Write-Status "Batch Size: $BatchSize cases per run"
if ($Query) { Write-Status "Query Filter: $Query" }
Write-Status ""

while ($true) {
    $EffectiveQuery = $Query
    if ($EffectiveQuery -notmatch 'OrderBy:') {
        $EffectiveQuery = ($EffectiveQuery + " OrderBy:'-LastUpdated'").Trim()
    }

    $NpmArgs = @("run", "backup", "--")
    $NpmArgs += @("--output", $OutputDir)
    $NpmArgs += @("--max", $BatchSize)
    if ($EffectiveQuery) {
        $NpmArgs += @("--query", $EffectiveQuery)
    }
    if ($NextBatchEditedBefore) {
        $NpmArgs += @("--edited-before", $NextBatchEditedBefore)
    }

    Write-Status ""
    Write-Status "Batch $BatchNumber - Starting batch"
    Write-Status "Running backup batch..."
    Write-Status ""

    $Output = & npm @NpmArgs 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Batch $BatchNumber failed with exit code $LASTEXITCODE"
        Write-Host $Output
        exit 1
    }

    # Parse case IDs for duplicate batch detection
    $CaseIdLines = $Output | Select-String "Processing Case (\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }
    $CurrentBatchCaseIds = $CaseIdLines -join ","
    if ($BatchNumber -gt 1 -and $CurrentBatchCaseIds -eq $PreviousBatchCaseIds) {
        Write-Warning "Detected identical batch of case IDs as previous batch. Stopping to prevent infinite loop."
        break
    }
    $PreviousBatchCaseIds = $CurrentBatchCaseIds

    # Parse pagination marker for edited date
    $PaginationMatch = $Output | Select-String "\[PAGINATION\] Last case edited: (.+)"
    $NextBatchEditedBefore = $null
    if ($PaginationMatch) {
        $NextBatchEditedBefore = $PaginationMatch.Matches[0].Groups[1].Value
        Write-Status "Pagination marker found: $NextBatchEditedBefore"
    }

    $ProcessedMatch = $Output | Select-String "Total Processed: (\d+)"
    $DownloadedMatch = $Output | Select-String "Downloaded: (\d+)"
    $SkippedMatch = $Output | Select-String "Skipped: (\d+)"
    $ErrorsMatch = $Output | Select-String "Errors: (\d+)"
    $MaxReachedMatch = $Output | Select-String "Maximum case limit reached"

    if ($ProcessedMatch) {
        $Processed = [int]$ProcessedMatch.Matches[0].Groups[1].Value
        $Downloaded = [int]$DownloadedMatch.Matches[0].Groups[1].Value
        $Skipped = [int]$SkippedMatch.Matches[0].Groups[1].Value
        $Errors = [int]$ErrorsMatch.Matches[0].Groups[1].Value

        $TotalProcessed += $Processed
        $TotalDownloaded += $Downloaded
        $TotalSkipped += $Skipped
        $TotalErrors += $Errors

        Write-Success "Batch $BatchNumber complete:"
        Write-Host "  Processed: $Processed (Downloaded: $Downloaded, Skipped: $Skipped, Errors: $Errors)"

        if ($Processed -eq $BatchSize -and $Downloaded -eq 0) {
            Write-Warning "Full batch had zero downloads (all skipped). Stopping changes backup."
            break
        }

        if ($MaxReachedMatch -and $Processed -eq $BatchSize -and $NextBatchEditedBefore) {
            $BatchNumber++
            Write-Status "Maximum cases in batch reached. Continue with next batch using edited date pagination..."
            continue
        } else {
            break
        }
    } else {
        Write-Error "Could not parse backup output"
        Write-Host $Output
        exit 1
    }
}

Write-Status ""
Write-Host "$('='*60)"
Write-Host "Changes Backup Complete"
Write-Host "$('='*60)"
Write-Success "Total Cases Processed: $TotalProcessed"
Write-Host "  Downloaded: $TotalDownloaded"
Write-Host "  Skipped: $TotalSkipped"
Write-Host "  Errors: $TotalErrors"
Write-Host "$('='*60)"

if ($TotalErrors -gt 0) {
    Write-Warning "Some cases had errors. Review logs above."
    exit 1
}

exit 0
