# Website Admin Permission Request Feature

## What's New

You can now request Administrator privileges **directly from the website dashboard**! No more manual PowerShell commands needed.

## How to Use

### From the Browser:

1. Open your dashboard at `http://localhost:3000`
2. Find the **"Virtual Terminal"** card
3. Click the new **🔐 Request Admin** button (orange button)
4. A dialog will appear asking to confirm
5. Click **"Request Admin"**
6. **You will see a Windows dialog on your desktop** asking to approve the privilege escalation
7. Click **"Yes"** on the Windows dialog
8. The server will restart with Administrator privileges
9. Refresh your browser
10. Click **"Open Remote VM"** and it should work now! ✓

## What Happens Behind the Scenes

When you click the **"Request Admin"** button:

1. Your browser sends a request to `/api/request-admin`
2. The server checks if it's already running as Admin
3. If not Admin, it launches PowerShell with `Start-Process ... -Verb RunAs`
4. Windows shows the UAC (User Account Control) dialog
5. When you click "Yes", the server restarts as Administrator
6. The browser shows a status message
7. After a few seconds, the new Admin server is running and ready

## Visual Walkthrough

```
Dashboard → Virtual Terminal Card
              ↓
         Three Buttons:
         ├─ "Launch Terminal"     (web terminal emulator)
         ├─ "Open Remote VM"      (connect to remote VM)
         └─ "🔐 Request Admin"    (NEW - request privilege escalation)
              ↓
         Click "🔐 Request Admin"
              ↓
         Dialog appears asking to confirm
              ↓
         Click "Request Admin"
              ↓
         Windows UAC dialog appears on desktop
              ↓
         Click "Yes" on Windows dialog
              ↓
         Server restarts with Admin privileges
              ↓
         Status dialog shows "✓ Request Sent"
              ↓
         Refresh browser
              ↓
         Click "Open Remote VM"
              ↓
         Success! VM starts! ✓
```

## Fallback Options

If the website button doesn't work:

### Option 1: Use the Batch File
```
Double-click: start-server-admin.bat
```

### Option 2: Use the PowerShell Script
```
Right-click: start-server-admin.ps1
Select: "Run with PowerShell"
```

### Option 3: Manual Method
```powershell
# Open PowerShell as Administrator (Win+X → select Admin)
cd "C:\Users\anton\OneDrive\Desktop\idk-anton"
npm start
```

## Troubleshooting

**Q: The dialog doesn't appear / nothing happens**
- Check if the browser console shows any errors (Press F12)
- Make sure you're running from `http://localhost:3000`, not a different address
- Try one of the fallback methods above

**Q: I clicked Yes on Windows but nothing happened**
- The server may have restarted in the background
- Refresh your browser (F5 or Ctrl+R)
- Try "Open Remote VM" again

**Q: It says "Request Failed"**
- Check the error message shown
- Try using one of the fallback methods
- Make sure Node.js (npm) is installed and working

**Q: The VM still won't start after getting Admin**
- Make sure the Win10-VM exists: `Get-VM -Name Win10-VM`
- Try checking VM status: click "Open Remote VM" and watch for success message
- Check browser console for error details (Press F12)

## Technical Details

### New API Endpoint

**POST /api/request-admin**
- Requires authentication token
- Only accessible from localhost
- Checks current admin status
- Launches elevation request via PowerShell RunAs
- Returns status of elevation request

### Files Involved

- `dashboard.js` - Added `requestServerAdmin()` function and 🔐 button
- `server.js` - Added `/api/request-admin` endpoint
- `start-server-admin.bat` - Used by PowerShell for elevation
- `request-admin.bat` - Helper script (optional fallback)

### Security

- ✓ Requires valid authentication token
- ✓ Only works from localhost (cannot be exploited remotely)
- ✓ User must manually click "Yes" on Windows dialog (cannot be automated)
- ✓ All VM commands remain restricted to localhost

## Next Steps

After successfully getting Admin privileges:

1. Click **"Open Remote VM"** button
2. Confirm you want to start Win10-VM locally
3. Copy the `vmconnect.exe localhost Win10-VM` command
4. Paste it into PowerShell to open the VM console
5. Windows 10 installer should boot in the VM

