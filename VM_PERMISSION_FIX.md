# VM Control Permission Fix

## 🚀 QUICK START

### Windows PC - Just do this:
1. **Double-click**: `start-server-admin.bat` (in your project folder)
2. Click **"Yes"** when prompted for permission
3. Server starts automatically! ✓
4. Open browser to `http://localhost:3000`
5. Click "Open Remote VM" to control your VM

If the .bat file doesn't work, try `start-server-admin.ps1` instead.

---

## Problem
When you click "Open Remote VM" in the browser dashboard, you get a permission error: "You do not have permission to complete this task"

This happens because the Node.js server needs **Administrator privileges** to control Hyper-V VMs.

## Solution

### For Windows PC:

#### Quick Method (Automatic Admin Request) ⭐ RECOMMENDED

Simply double-click one of these files:

**Option A: Batch File (Easiest)**
- Double-click: `start-server-admin.bat`
- A dialog will appear asking for permission
- Click **"Yes"** to approve
- Server starts automatically with Admin privileges

**Option B: PowerShell Script**
- Right-click: `start-server-admin.ps1`
- Select **"Run with PowerShell"**
- A dialog will appear asking for permission
- Click **"Yes"** to approve
- Server starts automatically with Admin privileges

#### Manual Method (If scripts don't work)

#### Step 1: Stop the Current Server
Press `Ctrl+C` in the PowerShell terminal where npm is running.

#### Step 2: Run PowerShell as Administrator
1. Press `Win+X` on your keyboard
2. Select **"Windows PowerShell (Admin)"** (or "Terminal (Admin)" in Windows 11)
3. Click **"Yes"** when prompted for permission

#### Step 3: Start the Server as Administrator
```powershell
cd "C:\Users\anton\OneDrive\Desktop\idk-anton"
npm start
```

You should see:
```
App Launcher running on http://localhost:3000
```

#### Step 4: Test VM Control from Browser
1. Open browser to `http://localhost:3000`
2. Click the **"Virtual Terminal"** card
3. Click **"Open Remote VM"**
4. Click **OK** to start Win10-VM locally
5. You should now get a success message instead of a permission error

---

### For Chromebook:

**Chromebooks cannot run Node.js servers or Hyper-V VMs locally.** However, you have two options:

#### Option 1: Remote Access to Windows PC (Recommended)
If you want to control the VM from your Chromebook:

1. Set up the Node.js server on a **Windows desktop/laptop**
2. Restart that Windows machine's server as Administrator (follow steps above)
3. From your Chromebook, access the dashboard using the Windows PC's IP address:
   ```
   http://<windows-pc-ip>:3000
   ```
   
   To find your Windows PC's IP address:
   - Open PowerShell on the Windows PC
   - Run: `ipconfig`
   - Look for "IPv4 Address" (usually something like `192.168.1.x`)

4. Log in with your account and control the VM remotely

#### Option 2: Use Chrome Remote Desktop
If you want full control from Chromebook:

1. On your Windows PC, install **Chrome Remote Desktop**:
   - Visit: https://remotedesktop.google.com
   - Follow setup instructions
   - Allow remote connections from your Chromebook

2. From your Chromebook, open https://remotedesktop.google.com and connect
3. Once connected, you can control the entire Windows desktop
4. Open the browser to localhost:3000 and control VMs from there

#### Option 3: SSH Tunnel (Advanced)
If you have SSH access to the Windows PC:

```bash
# On Chromebook, open Terminal (Ctrl+Alt+T) and run:
ssh -L 3000:localhost:3000 username@windows-pc-ip

# Then visit: http://localhost:3000 in browser
```

---

## How It Works

- The Node.js server runs with **elevated (Admin) privileges**
- It can now execute PowerShell commands like `Start-VM`, `Stop-VM`, and `Get-VM`
- When you click buttons in the dashboard, they can control VMs on your machine
- VM commands are **restricted to localhost only** (security measure)
- All commands require valid authentication tokens

## Error Handling

If you still get a permission error:

1. **Check that PowerShell is Admin**: Look for "Administrator" in the title bar
2. **Verify Hyper-V is enabled**: Run `Get-VM` in Admin PowerShell - if it works, Hyper-V is ready
3. **Check VM exists**: Run `Get-VM -Name Win10-VM` to verify the VM was created
4. **Restart the browser**: Close all browser tabs to localhost:3000 and refresh

## Security Notes

- VM control API is **only accessible from localhost** (127.0.0.1 or ::1)
- Requires **authentication token** (prevents unauthorized VM access)
- Server logs all VM control attempts
- Network switches require Admin to create/modify

## Next Steps

Once VM control is working:
1. Click "Open Remote VM" → VM starts
2. A command will appear: `vmconnect.exe localhost Win10-VM`
3. Copy/paste this into a PowerShell window to open the VM console
4. Windows 10 installer should boot

## Troubleshooting

**"Already in use" error on port 3000:**
- Another Node process is running
- Run: `Get-Process -Name node | Stop-Process -Force`
- Then start npm again

**"VM not found" error:**
- Create VM first: `.\create-win11-vm.ps1` (as Admin)
- Or manually: `New-VM -Name Win10-VM -MemoryStartupBytes 2GB -Generation 1`

**"Access denied" for network adapter:**
- Network switch creation requires Admin
- Use `start-server-admin.bat` or `start-server-admin.ps1` to start server as Admin
- Or use `.\add-vm-network.ps1` script as Admin

**Scripts don't work (Permission denied):**
If the scripts show "cannot be loaded because running scripts is disabled":
1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Type `Y` and press Enter
4. Try the scripts again

**Can't run .bat file:**
- Windows may have blocked it as "untrusted"
- Right-click the file and select "Properties"
- Check "Unblock" at the bottom
- Click "OK"
- Try double-clicking it again

