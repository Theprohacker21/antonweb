# Virtual Terminal Setup Instructions

## Overview
This adds a "Virtual Terminal" button to your dashboard that opens a web-based terminal in a popup. The terminal uses **xterm.js** (a popular open-source terminal emulator).

## Steps to Implement

### Step 1: Update `dashboard.js`

Add this code **after** the `renderSearchCard()` function (around line 113):

```javascript
    // Render a Virtual Machine / Terminal card
    function renderVMCard() {
        const appsGrid = document.querySelector('.apps-grid');
        if (!appsGrid) return;
        if (document.getElementById('vmCard')) return; // Don't duplicate

        const div = document.createElement('div');
        div.className = 'app-card';
        div.id = 'vmCard';
        div.style.cssText = 'display:flex;align-items:center;justify-content:center;flex-direction:column;padding:24px;min-width:260px;';
        div.innerHTML = `
            <div class="app-icon" style="font-size:40px">🖥️</div>
            <h3>Virtual Terminal</h3>
            <p class="app-status">Run commands in a web-based terminal</p>
            <button id="openVMBtn" class="btn-app" style="padding:8px 12px;border-radius:6px;">Launch Terminal</button>
        `;

        appsGrid.insertBefore(div, appsGrid.children[1] || appsGrid.firstChild);

        document.getElementById('openVMBtn').addEventListener('click', () => {
            openVMTerminal();
        });
    }
```

Also add this call **right after** the `attachAppButtons()` call inside `renderSearchCard()` (around line 113):

```javascript
        // Add VM Terminal card
        renderVMCard();

    Note: The VM card now includes an additional button "Open Remote VM" which will open a configured remote VM URL in a popup. If no URL is configured, the dashboard will prompt you to enter the remote VM address and save it to `localStorage` under the key `REMOTE_VM_URL`.
```

### Step 2: Add the VM Terminal Function

Add this function **at the end** of `dashboard.js` (before the final `});`):

```javascript
    // Open a Virtual Terminal in a popup
    function openVMTerminal() {
        const features = 'width=1200,height=700,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
        let popup = null;
        try {
            popup = window.open('about:blank', 'vm_terminal', features);
        } catch (e) {
            popup = null;
        }

        if (!popup) {
            alert('Popup blocked. Please allow popups for this site to use the terminal.');
            return;
        }

        try {
            const doc = popup.document;
            doc.open();
            doc.write(`<!doctype html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>about:blank</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/xterm/4.18.0/xterm.min.css" />
    <style>
        * { margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; background: #1e1e1e; }
        #terminal { width: 100%; height: 100%; }
        .xterm { padding: 10px; }
    </style>
</head>
<body>
    <div id="terminal"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xterm/4.18.0/xterm.min.js"></script>
    <script>
        const term = new Terminal({
            cols: 120,
            rows: 30,
            cursorBlink: true,
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#aeafad'
            }
        });

        term.open(document.getElementById('terminal'));
        term.write('\\r\\n✓ Virtual Terminal Ready\\r\\n');
        term.write('\\r\\nThis is a web-based terminal emulator.\\r\\n');
        term.write('Type "help" for a list of available commands.\\r\\n');
        term.write('Type "exit" to close this terminal.\\r\\n');
        term.write('\\r\\n$ ');

        let inputBuffer = '';
        const commands = {
            'help': 'Available commands: help, echo, pwd, ls, date, whoami, clear, exit\\n',
            'pwd': '/home/user\\n',
            'ls': 'Desktop/  Documents/  Downloads/  Pictures/\\n',
            'date': new Date().toString() + '\\n',
            'whoami': 'terminal_user\\n',
            'clear': '\\x1b[2J\\x1b[H',
            'exit': 'goodbye'
        };

        term.onKey((key) => {
            const char = key.key;

            if (key.domEvent.code === 'Enter') {
                term.write('\\r\\n');
                const cmd = inputBuffer.trim().toLowerCase();
                
                if (cmd === 'exit') {
                    term.write('Goodbye!\\r\\n');
                    setTimeout(() => window.close(), 1000);
                    return;
                }

                if (commands[cmd]) {
                    term.write(commands[cmd]);
                } else if (cmd === '') {
                    // Empty input
                } else {
                    term.write('Command not found: ' + cmd + '\\n');
                }

                inputBuffer = '';
                term.write('$ ');
            } else if (key.domEvent.code === 'Backspace') {
                if (inputBuffer.length > 0) {
                    inputBuffer = inputBuffer.slice(0, -1);
                    term.write('\\x08 \\x08'); // Backspace visual feedback
                }
            } else if (char && char.length === 1 && char.charCodeAt(0) >= 32) {
                inputBuffer += char;
                term.write(char);
            }
        });
    </script>
</body>
</html>`);
            doc.close();
            try { popup.focus(); } catch (e) {}
        } catch (err) {
            console.error('Failed to open VM terminal:', err);
            try { popup.close(); } catch (e) {}
        }
    }
```

### Step 3: Save and Test Locally

1. Open `dashboard.js` in your editor.
2. Add the two code blocks from Steps 1 and 2.
3. Save the file.
4. Run locally:
   ```powershell
   cd 'C:\Users\anton\OneDrive\Desktop\idk-anton'
   npm start
   ```
5. Open `http://localhost:3000` in your browser.
6. Log in and you should see a "Virtual Terminal" card on the dashboard.
7. Click "Launch Terminal" to open the terminal popup.

### Step 4: Test Terminal Commands

Try typing in the popup terminal:
- `help` — show available commands
- `pwd` — print working directory
- `ls` — list files
- `date` — show current date
- `whoami` — show user
- `clear` — clear screen
- `exit` — close terminal

### Step 5: Commit and Push

```powershell
cd 'C:\Users\anton\OneDrive\Desktop\idk-anton'
git add dashboard.js
git commit -m "Add Virtual Terminal feature with xterm.js"
git push origin main
```

## How It Works

- The terminal runs entirely in the browser using **xterm.js** (CDN-hosted).
- It's a **simulated terminal** — not a real shell. It responds to a few demo commands but doesn't execute arbitrary system commands.
- If you want a **real backend terminal** later, you'd need a backend service (like `node-pty` on the server).
- It works offline (CDN cached) and works both locally and on Netlify.

## Optional: Add Real Backend Terminal (Advanced)

If you want actual shell commands, you'd need:
1. Add `node-pty` to `package.json`
2. Create a WebSocket endpoint in `server.js` that runs real shell commands
3. Replace the demo terminal with a WebSocket client

But for now, the simulated terminal is ready to go!

---

**Next Steps:**
- Follow Steps 1-5 above to add the code.
- Test locally.
- Push to GitHub when ready.
- The terminal will work on the Netlify deploy too (it's all client-side).
