#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Logging wrapper around backup-changes.ps1, meant to be invoked by
    Windows Task Scheduler.

.DESCRIPTION
    Task Scheduler doesn't capture console output on its own, so this
    wrapper runs the changes backup and appends timestamped results to a
    log file you can check later. It also trims the log once it grows past
    -MaxLogSizeMB so it doesn't grow unbounded over months of weekly runs.

.PARAMETER OutputDir
    Where the FogBugz backup lives (default: F:\Fogbugz)

.PARAMETER LogFile
    Path to the log file (default: <OutputDir>\backup-log.txt)

.PARAMETER MaxLogSizeMB
    Log file is trimmed to its most recent half once it exceeds this size.

.EXAMPLE
    .\run-weekly-backup.ps1
    .\run-weekly-backup.ps1 -OutputDir "F:\Fogbugz"
#>

param(
    [string]$OutputDir = "F:\Fogbugz",
    [string]$LogFile = "",
    [int]$MaxLogSizeMB = 5
)

if (-not $LogFile) {
    $LogFile = Join-Path $OutputDir "backup-log.txt"
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

"=" * 60 | Out-File -FilePath $LogFile -Append -Encoding utf8
"[$Timestamp] Starting scheduled FogBugz backup" | Out-File -FilePath $LogFile -Append -Encoding utf8

$ExitCode = 1
try {
    $Output = & "$ScriptDir\backup-changes.ps1" -OutputDir $OutputDir 2>&1
    $ExitCode = $LASTEXITCODE
    $Output | Out-File -FilePath $LogFile -Append -Encoding utf8

    $EndTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    if ($ExitCode -eq 0) {
        "[$EndTimestamp] Backup completed successfully (exit code 0)" | Out-File -FilePath $LogFile -Append -Encoding utf8
    } else {
        "[$EndTimestamp] Backup FAILED (exit code $ExitCode)" | Out-File -FilePath $LogFile -Append -Encoding utf8
    }
} catch {
    $ErrTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$ErrTimestamp] Backup FAILED with exception: $_" | Out-File -FilePath $LogFile -Append -Encoding utf8
    $ExitCode = 1
}

# Keep the log from growing unbounded - trim to the most recent half once
# it crosses the size threshold.
if (Test-Path $LogFile) {
    $SizeMB = (Get-Item $LogFile).Length / 1MB
    if ($SizeMB -gt $MaxLogSizeMB) {
        $Lines = Get-Content $LogFile
        $KeepLines = [Math]::Floor($Lines.Count / 2)
        $Lines | Select-Object -Last $KeepLines | Set-Content $LogFile -Encoding utf8
        "[$Timestamp] Log trimmed (exceeded ${MaxLogSizeMB}MB)" | Out-File -FilePath $LogFile -Append -Encoding utf8
    }
}

exit $ExitCode
