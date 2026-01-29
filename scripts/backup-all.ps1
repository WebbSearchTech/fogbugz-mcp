#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Downloads all FogBugz cases in batches using the backup script.
    
.DESCRIPTION
    This script automates the initial full backup by batching the case downloads.
    It handles resuming if a batch fails and reports progress as it goes.
    
.PARAMETER OutputDir
    The output directory for backups (REQUIRED)
    
.EXAMPLE
    .\backup-all.ps1 -OutputDir ./my-backup
    
.EXAMPLE
    .\backup-all.ps1 -OutputDir ./my-backup -BatchSize 500
    
.EXAMPLE
    .\backup-all.ps1 -OutputDir ./my-backup -Query "status:active" -ContinueFrom 5001
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

# Validate output directory
if (-not $OutputDir) {
    Write-Error 'Output directory is required. Usage: .\backup-all.ps1 -OutputDir <path>'
    exit 1
}

Write-Status "Full FogBugz Backup Script"
Write-Status "Output Directory: $OutputDir"
Write-Status "Batch Size: $BatchSize cases per run"
if ($Query) { Write-Status "Query Filter: $Query" }
Write-Status ""



$BatchNumber = 1
$TotalProcessed = 0
$TotalDownloaded = 0
$TotalSkipped = 0
$TotalErrors = 0

while ($true) {
    $NpmArgs = @("run", "backup", "--")
    $NpmArgs += @("--output", $OutputDir)
    $NpmArgs += @("--max", $BatchSize)
    if ($Query) {
        $NpmArgs += @("--query", $Query)
    }
    if ($NextBatchOpenedAfter) {
        $NpmArgs += @("--opened-after", $NextBatchOpenedAfter)
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

    # Parse case IDs from output for infinite loop detection
    $CaseIdLines = $Output | Select-String "Processing Case (\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }
    $CurrentBatchCaseIds = $CaseIdLines -join ","
    if ($BatchNumber -gt 1 -and $CurrentBatchCaseIds -eq $PreviousBatchCaseIds) {
        Write-Warning "Detected identical batch of case IDs as previous batch. Stopping to prevent infinite loop."
        break
    }
    $PreviousBatchCaseIds = $CurrentBatchCaseIds

    # Parse pagination information for next batch
    $PaginationMatch = $Output | Select-String "\[PAGINATION\] Last case opened: (.+)"
    $NextBatchOpenedAfter = $null
    if ($PaginationMatch) {
        $NextBatchOpenedAfter = $PaginationMatch.Matches[0].Groups[1].Value
        Write-Status "Pagination marker found: $NextBatchOpenedAfter"
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

        if ($MaxReachedMatch -and $Processed -eq $BatchSize -and $NextBatchOpenedAfter) {
            $BatchNumber++
            Write-Status "Maximum cases in batch reached. Continue with next batch using pagination..."
            # Pass the opened-after date to the next batch
            continue  # Loop will use updated $NextBatchOpenedAfter
        } else {
            break
        }
    } else {
        Write-Error "Could not parse backup output"
        Write-Host $Output
        exit 1
    }
}

# Final summary
Write-Status ""
Write-Host "$('='*60)"
Write-Host "Full Backup Complete"
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
