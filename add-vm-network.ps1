# Add Network to Win10-VM Hyper-V Script
# Run as Administrator in PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Add Network to Win10-VM" -ForegroundColor Cyan
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

# Define VM name
$VMName = "Win10-VM"
$SwitchName = "HyperV-Internal"

# Check if VM exists
Write-Host "Checking for VM '$VMName'..." -ForegroundColor Yellow
$vm = Get-VM -Name $VMName -ErrorAction SilentlyContinue
if ($null -eq $vm) {
    Write-Host "ERROR: VM '$VMName' not found!" -ForegroundColor Red
    Exit 1
}
Write-Host "[OK] VM found: $VMName" -ForegroundColor Green
Write-Host ""

# Create or get virtual network switch
Write-Host "Configuring network switch..." -ForegroundColor Yellow
try {
    $existingSwitch = Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue
    
    if ($null -eq $existingSwitch) {
        Write-Host "Creating virtual network switch '$SwitchName'..." -ForegroundColor Gray
        New-VMSwitch -Name $SwitchName -SwitchType Internal -ErrorAction Stop | Out-Null
        Write-Host "[OK] Virtual switch created: $SwitchName" -ForegroundColor Green
    } else {
        Write-Host "[OK] Using existing switch: $SwitchName" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR: Failed to create/get network switch!" -ForegroundColor Red
    Write-Host "Details: $_" -ForegroundColor Red
    Exit 1
}
Write-Host ""

# Check if network adapter already exists
Write-Host "Checking network adapter..." -ForegroundColor Yellow
$existingAdapter = Get-VMNetworkAdapter -VMName $VMName -ErrorAction SilentlyContinue

if ($null -ne $existingAdapter) {
    Write-Host "Network adapter already exists: $($existingAdapter.Name)" -ForegroundColor Green
    Write-Host "Reconnecting to switch '$SwitchName'..." -ForegroundColor Yellow
    try {
        Connect-VMNetworkAdapter -VMNetworkAdapter $existingAdapter -SwitchName $SwitchName -ErrorAction Stop
        Write-Host "[OK] Network adapter reconnected to switch" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to reconnect network adapter!" -ForegroundColor Red
        Write-Host "Details: $_" -ForegroundColor Red
        Exit 1
    }
} else {
    Write-Host "No network adapter found. Adding one..." -ForegroundColor Gray
    try {
        Add-VMNetworkAdapter -VMName $VMName -SwitchName $SwitchName -Name "Network Adapter" -ErrorAction Stop
        Write-Host "[OK] Network adapter added to VM" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to add network adapter!" -ForegroundColor Red
        Write-Host "Details: $_" -ForegroundColor Red
        Exit 1
    }
}
Write-Host ""

# Verify configuration
Write-Host "Verifying network configuration..." -ForegroundColor Yellow
$adapter = Get-VMNetworkAdapter -VMName $VMName -ErrorAction SilentlyContinue
if ($null -ne $adapter) {
    Write-Host "[OK] Network adapter details:" -ForegroundColor Green
    Write-Host "  - VM: $VMName" -ForegroundColor Gray
    Write-Host "  - Adapter Name: $($adapter.Name)" -ForegroundColor Gray
    Write-Host "  - Switch: $($adapter.SwitchName)" -ForegroundColor Gray
    Write-Host "  - MAC Address: $($adapter.MacAddress)" -ForegroundColor Gray
} else {
    Write-Host "WARNING: Could not verify network adapter" -ForegroundColor Yellow
}
Write-Host ""

# Success
Write-Host "========================================" -ForegroundColor Green
Write-Host "SUCCESS! Network configured for $VMName" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the VM:" -ForegroundColor White
Write-Host "   Start-VM -Name '$VMName'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Open the VM console:" -ForegroundColor White
Write-Host "   vmconnect.exe localhost $VMName" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Once Windows boots, configure network in the VM:" -ForegroundColor White
Write-Host "   - The VM should automatically get DHCP if a DHCP server is available" -ForegroundColor Gray
Write-Host "   - Or configure static IP in Settings > Network" -ForegroundColor Gray
Write-Host ""
