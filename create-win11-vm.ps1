# Windows 11 Hyper-V VM Creation Script
# Run as Administrator in PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Windows 11 Hyper-V VM Creator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "ERROR: This script must run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as administrator'" -ForegroundColor Yellow
    Exit 1
}

Write-Host "[OK] Running as Administrator" -ForegroundColor Green
Write-Host ""

# Check if Hyper-V is enabled
Write-Host "Checking Hyper-V..." -ForegroundColor Yellow
$hyperVFeature = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -ErrorAction SilentlyContinue
if ($null -eq $hyperVFeature -or $hyperVFeature.State -ne "Enabled") {
    Write-Host "ERROR: Hyper-V is not enabled!" -ForegroundColor Red
    Write-Host "Run this command in Administrator PowerShell:" -ForegroundColor Yellow
    Write-Host "  Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All" -ForegroundColor Yellow
    Write-Host "Then restart your computer." -ForegroundColor Yellow
    Exit 1
}
Write-Host "[OK] Hyper-V is enabled" -ForegroundColor Green
Write-Host ""

# Get ISO path from user (default to Windows10.iso in Downloads)
$defaultISO = 'C:\Users\anton\Downloads\Windows10.iso'
Write-Host "Enter the full path to your Windows ISO file (press Enter to accept default):" -ForegroundColor Yellow
Write-Host "Default: $defaultISO" -ForegroundColor Gray
$inputISO = Read-Host "ISO Path"

if ([string]::IsNullOrEmpty($inputISO)) {
    $ISOPath = $defaultISO
} else {
    $ISOPath = $inputISO.Trim('"').Trim("'")
}

if (-not (Test-Path $ISOPath)) {
    Write-Host "ERROR: ISO not found at: $ISOPath" -ForegroundColor Red
    Write-Host "Please verify the path or download the ISO to the default location and try again." -ForegroundColor Yellow
    Exit 1
}

Write-Host "[OK] ISO found: $ISOPath" -ForegroundColor Green
Write-Host ""

# Create VM storage directory
$VMPath = "C:\VMs"
$VMName = "Win11-VM"
$vhdxPath = "$VMPath\$VMName.vhdx"

Write-Host "Creating storage directory..." -ForegroundColor Yellow
if (-not (Test-Path $VMPath)) {
    New-Item -ItemType Directory -Path $VMPath -Force | Out-Null
}
Write-Host "[OK] Storage directory ready: $VMPath" -ForegroundColor Green
Write-Host ""

# Check for existing VM
Write-Host "Checking for existing VM..." -ForegroundColor Yellow
$existingVM = Get-VM -Name $VMName -ErrorAction SilentlyContinue

if ($null -ne $existingVM) {
    Write-Host "VM '$VMName' already exists." -ForegroundColor Yellow
    $response = Read-Host "Delete and recreate? (y/n)"
    
    if ($response -eq 'y') {
        Write-Host "Stopping VM..." -ForegroundColor Yellow
        Stop-VM -Name $VMName -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        
        Write-Host "Removing VM..." -ForegroundColor Yellow
        Remove-VM -Name $VMName -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        
        if (Test-Path $vhdxPath) {
            Remove-Item $vhdxPath -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "Aborted." -ForegroundColor Yellow
        Exit 0
    }
}

# Create new VM
Write-Host ""
Write-Host "Creating VM '$VMName'..." -ForegroundColor Yellow
Write-Host "  Memory: 8GB" -ForegroundColor Gray
Write-Host "  CPU Cores: 4" -ForegroundColor Gray
Write-Host "  Disk: 80GB" -ForegroundColor Gray

try {
    New-VM -Name $VMName `
           -MemoryStartupBytes 8GB `
           -Generation 2 `
           -NewVHDPath $vhdxPath `
           -NewVHDSizeBytes 80GB `
           -ErrorAction Stop | Out-Null
    
    Write-Host "[OK] VM created successfully" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to create VM!" -ForegroundColor Red
    Write-Host "Details: $_" -ForegroundColor Red
    Exit 1
}

# Set CPU count
Write-Host ""
Write-Host "Configuring CPU..." -ForegroundColor Yellow
try {
    Set-VMProcessor -VMName $VMName -Count 4 -ErrorAction Stop
    Write-Host "[OK] CPU set to 4 cores" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Could not set CPU: $_" -ForegroundColor Yellow
}

# Create or get Virtual Network Switch
Write-Host ""
Write-Host "Configuring network..." -ForegroundColor Yellow
try {
    $switchName = "HyperV-Internal"
    $existingSwitch = Get-VMSwitch -Name $switchName -ErrorAction SilentlyContinue
    
    if ($null -eq $existingSwitch) {
        Write-Host "Creating virtual network switch '$switchName'..." -ForegroundColor Gray
        New-VMSwitch -Name $switchName -SwitchType Internal -ErrorAction Stop | Out-Null
        Write-Host "[OK] Virtual switch created: $switchName" -ForegroundColor Green
    } else {
        Write-Host "[OK] Using existing switch: $switchName" -ForegroundColor Green
    }
} catch {
    Write-Host "WARNING: Could not create network switch: $_" -ForegroundColor Yellow
}

# Attach network adapter to VM
try {
    $existingAdapter = Get-VMNetworkAdapter -VMName $VMName -ErrorAction SilentlyContinue
    if ($null -eq $existingAdapter) {
        Add-VMNetworkAdapter -VMName $VMName -SwitchName $switchName -ErrorAction Stop
        Write-Host "[OK] Network adapter added to VM" -ForegroundColor Green
    } else {
        Connect-VMNetworkAdapter -VMNetworkAdapter $existingAdapter -SwitchName $switchName -ErrorAction Stop
        Write-Host "[OK] Network adapter connected to switch" -ForegroundColor Green
    }
} catch {
    Write-Host "WARNING: Could not configure network adapter: $_" -ForegroundColor Yellow
}
Write-Host ""

# Attach ISO
Write-Host "Attaching ISO..." -ForegroundColor Yellow
try {
    Set-VMDvdDrive -VMName $VMName -Path $ISOPath -ErrorAction Stop
    Write-Host "[OK] ISO attached" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to attach ISO!" -ForegroundColor Red
    Write-Host "Details: $_" -ForegroundColor Red
    Exit 1
}

# Configure firmware
Write-Host ""
Write-Host "Configuring firmware..." -ForegroundColor Yellow
try {
    Set-VMFirmware -VMName $VMName -EnableSecureBoot On -ErrorAction Stop
    Write-Host "[OK] Secure Boot enabled" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Could not enable Secure Boot: $_" -ForegroundColor Yellow
}

try {
    Set-VMKeyProtector -VMName $VMName -NewLocalKeyProtector -ErrorAction Stop
    Write-Host "[OK] TPM configured" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Could not configure TPM: $_" -ForegroundColor Yellow
}

# Success
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SUCCESS! VM is ready." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the VM:" -ForegroundColor White
Write-Host "   Start-VM -Name 'Win11-VM'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Open the VM console:" -ForegroundColor White
Write-Host "   vmconnect.exe localhost Win11-VM" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Follow the Windows 11 installer" -ForegroundColor White
Write-Host "4. You will need a valid Windows 11 product key" -ForegroundColor Yellow
Write-Host ""
