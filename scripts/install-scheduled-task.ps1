#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Registers a weekly Windows Task Scheduler job for the FogBugz changes
    backup. Run this once to install it.

.DESCRIPTION
    Installs (or updates, if re-run) a scheduled task that calls
    run-weekly-backup.ps1 - which itself calls backup-changes.ps1 and logs
    the result to <OutputDir>\backup-log.txt.

.PARAMETER OutputDir
    Where the FogBugz backup lives (default: F:\Fogbugz)

.PARAMETER DayOfWeek
    Day to run the backup (default: Sunday)

.PARAMETER Time
    Time of day to run the backup (default: 3:00AM)

.PARAMETER TaskName
    Name shown in Task Scheduler (default: "FogBugz Weekly Backup")

.PARAMETER RunWhenLoggedOff
    If set, registers the task to run whether you're logged on or not
    (prompts for your Windows password to store for unattended runs).
    By default the task only runs when you're logged on, which is simpler
    and - important if F:\Fogbugz is a mapped network drive - keeps your
    drive mappings visible to the task. Tasks that run while logged off
    execute in a session without your mapped drives, so if you use
    -RunWhenLoggedOff, point -OutputDir at a UNC path (\\server\share\Fogbugz)
    instead of a drive letter.

.EXAMPLE
    .\install-scheduled-task.ps1

.EXAMPLE
    .\install-scheduled-task.ps1 -DayOfWeek Monday -Time "6:00AM"

.EXAMPLE
    .\install-scheduled-task.ps1 -RunWhenLoggedOff -OutputDir "\\myserver\Fogbugz"
#>

param(
    [string]$OutputDir = "F:\Fogbugz",
    [string]$DayOfWeek = "Friday",
    [string]$Time = "10:00AM",
    [string]$TaskName = "FogBugz Weekly Backup",
    [switch]$RunWhenLoggedOff
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WrapperScript = Join-Path $ScriptDir "run-weekly-backup.ps1"

if (-not (Test-Path $WrapperScript)) {
    Write-Error "Could not find $WrapperScript - make sure this script sits next to run-weekly-backup.ps1"
    exit 1
}

$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$WrapperScript`" -OutputDir `"$OutputDir`"" `
    -WorkingDirectory $ScriptDir

$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $DayOfWeek -At $Time

$Settings = New-ScheduledTaskSettingsSet `
    -WakeToRun `
    -StartWhenAvailable `
    -DontStopOnIdleEnd `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

if ($RunWhenLoggedOff) {
    Write-Host "This will prompt for your Windows account password so the task can run while you're logged off." -ForegroundColor Yellow
    $Credential = Get-Credential -UserName "$env:USERDOMAIN\$env:USERNAME" -Message "Password for unattended scheduled task"
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -User $Credential.UserName `
        -Password $Credential.GetNetworkCredential().Password `
        -RunLevel Limited | Out-Null
} else {
    $Principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Principal $Principal | Out-Null
}

Write-Host ""
Write-Host "Scheduled task '$TaskName' installed: runs every $DayOfWeek at $Time." -ForegroundColor Green
Write-Host "Logs will be written to $(Join-Path $OutputDir 'backup-log.txt')" -ForegroundColor Green
if (-not $RunWhenLoggedOff) {
    Write-Host "Note: this task only runs while you're logged on. Use -RunWhenLoggedOff to change that." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "To test it right now instead of waiting for the schedule:" -ForegroundColor Cyan
Write-Host "  Start-ScheduledTask -TaskName `"$TaskName`"" -ForegroundColor Cyan
Write-Host ""
Write-Host "To check on it later:" -ForegroundColor Cyan
Write-Host "  Get-ScheduledTaskInfo -TaskName `"$TaskName`"" -ForegroundColor Cyan
Write-Host "  or open Task Scheduler (taskschd.msc) -> Task Scheduler Library" -ForegroundColor Cyan
Write-Host ""
Write-Host "To remove it:" -ForegroundColor Cyan
Write-Host "  Unregister-ScheduledTask -TaskName `"$TaskName`"" -ForegroundColor Cyan
