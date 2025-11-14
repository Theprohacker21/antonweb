# Start Node.js server with Administrator privileges
# This script automatically requests UAC (User Account Control) permission

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    # Not running as admin, request elevation
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    
    # Get the script's directory
    $scriptPath = $PSScriptRoot
    if ([string]::IsNullOrEmpty($scriptPath)) {
        $scriptPath = Get-Location
    }
    
    # Relaunch script as administrator
    $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    Start-Process PowerShell -ArgumentList $arguments -Verb RunAs
    exit
}

# Running as admin, start the server
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Starting Node.js Server (Administrator)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "[OK] Running as Administrator" -ForegroundColor Green
Write-Host ""

$projectDir = $PSScriptRoot
if ([string]::IsNullOrEmpty($projectDir)) {
    $projectDir = Get-Location
}

Write-Host "Project directory: $projectDir" -ForegroundColor Gray
Write-Host ""

Set-Location $projectDir
npm start
