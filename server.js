const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure all /api/* responses have proper JSON content-type
app.use('/api/', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});

app.use(express.static('.'));

// Simple in-memory user database (will be replaced with file storage)
let users = [];
let messages = [];
let paymentNotifications = [];
let broadcasts = [];
const usersFile = path.join(__dirname, 'users.json');
const messagesFile = path.join(__dirname, 'messages.json');
const paymentsFile = path.join(__dirname, 'payments.json');
const broadcastsFile = path.join(__dirname, 'broadcasts.json');

// Load users from file
function loadUsers() {
    try {
        if (fs.existsSync(usersFile)) {
            const data = fs.readFileSync(usersFile, 'utf8');
            users = JSON.parse(data);
        }
    } catch (error) {
        console.log('No users file found, starting fresh');
        users = [];
    }
}

// Save users to file
function saveUsers() {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Load messages from file
function loadMessages() {
    try {
        if (fs.existsSync(messagesFile)) {
            const data = fs.readFileSync(messagesFile, 'utf8');
            messages = JSON.parse(data);
        }
    } catch (error) {
        console.log('No messages file found, starting fresh');
        messages = [];
    }
}

// Save messages to file
function saveMessages() {
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

// Load payments from file
function loadPayments() {
    try {
        if (fs.existsSync(paymentsFile)) {
            const data = fs.readFileSync(paymentsFile, 'utf8');
            paymentNotifications = JSON.parse(data);
        }
    } catch (error) {
        console.log('No payments file found, starting fresh');
        paymentNotifications = [];
    }
}

// Save payments to file
function savePayments() {
    fs.writeFileSync(paymentsFile, JSON.stringify(paymentNotifications, null, 2));
}

// Load broadcasts from file
function loadBroadcasts() {
    try {
        if (fs.existsSync(broadcastsFile)) {
            const data = fs.readFileSync(broadcastsFile, 'utf8');
            broadcasts = JSON.parse(data);
        }
    } catch (error) {
        console.log('No broadcasts file found, starting fresh');
        broadcasts = [];
    }
}

// Save broadcasts to file
function saveBroadcasts() {
    fs.writeFileSync(broadcastsFile, JSON.stringify(broadcasts, null, 2));
}

// Save messages to file
function saveMessages() {
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

// Load users on startup
loadUsers();
loadMessages();
loadPayments();
loadBroadcasts();

// Simple JWT-like token (in production, use real JWT)
function generateToken(username) {
    return Buffer.from(username + ':' + Date.now()).toString('base64');
}

function verifyToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const username = decoded.split(':')[0];
        return username;
    } catch {
        return null;
    }
}

// Get user tier
function getUserTier(username) {
    if (username === 'Anton') {
        return 'Founder (Admin)';
    }
    const user = users.find(u => u.username === username);
    return user && user.isPremium ? 'Premium' : 'Free Version';
}

// Auth routes
app.post('/api/auth/signup', (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: 'Username already exists' });
    }

    const newUser = {
        username,
        password, // In production, hash this!
        email,
        isPremium: false,
        createdAt: new Date()
    };

    users.push(newUser);
    saveUsers();

    const token = generateToken(username);
    res.json({ token, username, isPremium: false });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(username);
    res.json({ token, username, isPremium: user.isPremium });
});

// Admin routes
app.get('/api/admin/users', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);

    if (username !== 'Anton') {
        return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ users });
});

app.post('/api/admin/delete-user', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);

    if (username !== 'Anton') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { username: targetUsername } = req.body;

    users = users.filter(u => u.username !== targetUsername);
    saveUsers();

    res.json({ message: 'User deleted' });
});

app.post('/api/admin/grant-premium', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);

    if (username !== 'Anton') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { username: targetUsername } = req.body;
    const user = users.find(u => u.username === targetUsername);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    user.isPremium = true;
    saveUsers();

    res.json({ message: 'Premium granted' });
});

app.post('/api/admin/remove-premium', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);

    if (username !== 'Anton') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { username: targetUsername } = req.body;
    const user = users.find(u => u.username === targetUsername);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    user.isPremium = false;
    saveUsers();

    res.json({ message: 'Premium removed' });
});

// Get user status
app.get('/api/user/status', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);

    if (!username) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json({ username, isPremium: user.isPremium });
});

// Chat routes
app.post('/api/chat/send', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);

    if (!username) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { message, group } = req.body;

    if (!message || !group) {
        return res.status(400).json({ message: 'Message and group are required' });
    }

    const tier = getUserTier(username);

    const newMessage = {
        id: messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1,
        username,
        tier,
        message,
        group,
        timestamp: new Date()
    };

    messages.push(newMessage);
    saveMessages();

    res.json({ success: true, messageId: newMessage.id });
});

app.get('/api/chat/messages', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);

    if (!username) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const group = req.query.group || 'NMS';
    const since = parseInt(req.query.since) || 0;

    // Get all messages for the group and add tier if missing
    const groupMessages = messages.filter(m => m.group === group).map(m => ({
        ...m,
        tier: m.tier || getUserTier(m.username)
    }));

    // Get new messages (after 'since')
    const newMessages = groupMessages.filter(m => m.id > since);

    res.json({
        messages: groupMessages,
        newMessages: newMessages
    });
});

// Premium Payment Routes
app.post('/api/premium/cash-payment', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);

    if (!username) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { amount } = req.body;

    const notification = {
        id: paymentNotifications.length > 0 ? Math.max(...paymentNotifications.map(p => p.id)) + 1 : 1,
        type: 'cash',
        username: username,
        amount: amount,
        status: 'pending',
        createdAt: new Date()
    };

    paymentNotifications.push(notification);
    savePayments();

    res.json({ success: true, message: 'Cash payment notification sent to admin' });
});

app.post('/api/premium/stripe-payment', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);

    if (!username) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { amount } = req.body;

    // Grant premium to user
    const user = users.find(u => u.username === username);
    if (user) {
        user.isPremium = true;
        saveUsers();

        // Log payment as completed
        const notification = {
            id: paymentNotifications.length > 0 ? Math.max(...paymentNotifications.map(p => p.id)) + 1 : 1,
            type: 'stripe',
            username: username,
            amount: amount / 100, // Convert from cents to dollars
            status: 'completed',
            createdAt: new Date()
        };

        paymentNotifications.push(notification);
        savePayments();

        res.json({ success: true, message: 'Payment processed. Premium activated!' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Get payment notifications (admin only)
app.get('/api/admin/payments', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);

    if (username !== 'Anton') {
        return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ payments: paymentNotifications });
});

// Confirm cash payment (admin only)
app.post('/api/admin/confirm-payment', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);

    if (username !== 'Anton') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { paymentId } = req.body;
    const payment = paymentNotifications.find(p => p.id === paymentId);

    if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
    }

    // Grant premium to user
    const user = users.find(u => u.username === payment.username);
    if (user) {
        user.isPremium = true;
        saveUsers();
    }

    // Mark payment as confirmed
    payment.status = 'confirmed';
    savePayments();

    res.json({ success: true, message: 'Payment confirmed. Premium activated!' });
});

// Broadcast routes
app.post('/api/admin/broadcast', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);

    if (username !== 'Anton') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });

    const b = {
        id: broadcasts.length > 0 ? Math.max(...broadcasts.map(x => x.id)) + 1 : 1,
        message: message,
        createdAt: new Date()
    };

    broadcasts.push(b);
    saveBroadcasts();

    res.json({ success: true, broadcast: b });
});

// Get broadcasts (any logged-in user)
app.get('/api/broadcasts', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);

    if (!username) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const since = parseInt(req.query.since) || 0;
    const all = broadcasts.slice();
    const newBroadcasts = all.filter(b => b.id > since);

    res.json({ broadcasts: all, newBroadcasts });
});

// Redirect index to signup
app.get('/', (req, res) => {
    res.redirect('/signup.html');
});

// Request server to restart with Administrator privileges
app.post('/api/request-admin', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);
    if (!username) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    // Check if already running as admin
    const checkAdminCmd = `powershell -NoProfile -NonInteractive -Command "[bool]([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]'Administrator')"`;
    
    exec(checkAdminCmd, { windowsHide: true }, (error, stdout, stderr) => {
        const isAdmin = stdout.toLowerCase().includes('true');
        
        if (isAdmin) {
            // Already running as admin
            return res.json({ ok: true, message: 'Server is already running as Administrator', alreadyAdmin: true });
        }
        
        // Try to request admin elevation using UAC
        const projectDir = __dirname;
        const scriptPath = path.join(projectDir, 'start-server-admin.bat');
        
        // Use powershell to run the batch file with RunAs
        const elevateCmd = `powershell -NoProfile -NonInteractive -Command "Start-Process cmd -ArgumentList '/c cd /d ${projectDir} && npm start' -Verb RunAs"`;
        
        exec(elevateCmd, { windowsHide: true }, (error, stdout, stderr) => {
            // Note: The elevation request may succeed even if exec returns an error
            // because it launches a new process
            return res.json({ 
                ok: true, 
                message: 'Admin privilege request sent. A Windows dialog should appear on your computer. Click Yes to approve.',
                elevationRequested: true 
            });
        });
    });
});

// VM control endpoints (local Hyper-V) - only allow from localhost and authenticated users
app.post('/api/vm/start', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);
    if (!username) return res.status(401).json({ message: 'Unauthorized' });

    // only allow calls from localhost
    const ip = req.ip || req.connection.remoteAddress;
    if (!(ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1'))) {
        return res.status(403).json({ message: 'VM control allowed only from localhost' });
    }

    const vmName = req.body && req.body.name ? req.body.name : 'Win10-VM';
    // Start the VM using PowerShell Start-VM
    const cmd = `powershell -NoProfile -NonInteractive -Command "Start-VM -Name '${vmName}' -ErrorAction Stop"`;
    exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
            const errorStr = String(stderr || error.message);
            // Check if it's a permission error
            if (errorStr.includes('Access denied') || errorStr.includes('authorized') || errorStr.includes('permission')) {
                return res.status(403).json({ 
                    ok: false, 
                    error: 'PERMISSION ERROR: The server does not have Administrator privileges to control VMs. Restart the server as Administrator.',
                    details: errorStr 
                });
            }
            return res.status(500).json({ ok: false, error: errorStr });
        }
        return res.json({ ok: true, message: `VM '${vmName}' start requested`, stdout: stdout });
    });
});

app.post('/api/vm/stop', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);
    if (!username) return res.status(401).json({ message: 'Unauthorized' });

    const ip = req.ip || req.connection.remoteAddress;
    if (!(ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1'))) {
        return res.status(403).json({ message: 'VM control allowed only from localhost' });
    }

    const vmName = req.body && req.body.name ? req.body.name : 'Win10-VM';
    const cmd = `powershell -NoProfile -NonInteractive -Command "Stop-VM -Name '${vmName}' -Force -ErrorAction Stop"`;
    exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
            const errorStr = String(stderr || error.message);
            if (errorStr.includes('Access denied') || errorStr.includes('authorized') || errorStr.includes('permission')) {
                return res.status(403).json({ 
                    ok: false, 
                    error: 'PERMISSION ERROR: The server does not have Administrator privileges. Restart as Administrator.',
                    details: errorStr 
                });
            }
            return res.status(500).json({ ok: false, error: errorStr });
        }
        return res.json({ ok: true, message: `VM '${vmName}' stop requested`, stdout: stdout });
    });
});

app.get('/api/vm/status', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const username = verifyToken(token);
    if (!username) return res.status(401).json({ message: 'Unauthorized' });

    const ip = req.ip || req.connection.remoteAddress;
    if (!(ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1'))) {
        return res.status(403).json({ message: 'VM status allowed only from localhost' });
    }

    const vmName = req.query.name || 'Win10-VM';
    const cmd = `powershell -NoProfile -NonInteractive -Command "Get-VM -Name '${vmName}' | Select-Object Name, State, MemoryAssigned, ProcessorCount | ConvertTo-Json -Compress"`;
    exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
            const errorStr = String(stderr || error.message);
            if (errorStr.includes('Access denied') || errorStr.includes('authorized') || errorStr.includes('permission')) {
                return res.status(403).json({ 
                    ok: false, 
                    error: 'PERMISSION ERROR: The server does not have Administrator privileges. Restart as Administrator.',
                    details: errorStr 
                });
            }
            return res.status(500).json({ ok: false, error: errorStr });
        }
        try {
            const info = JSON.parse(stdout || '{}');
            return res.json({ ok: true, vm: info });
        } catch (e) {
            return res.status(500).json({ ok: false, error: 'Failed to parse VM info' });
        }
    });
});

// Google Custom Search API endpoint
app.get('/api/search/google', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter' });
    }

    try {
        // For now, redirect to Google search - you can replace this with Custom Search API
        // To use Custom Search API, you'll need:
        // 1. Get a Google API Key from https://console.cloud.google.com
        // 2. Create a Custom Search Engine at https://programmablesearchengine.google.com
        // 3. Add GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID to your environment variables
        
        const apiKey = process.env.GOOGLE_API_KEY;
        const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
        
        if (!apiKey || !searchEngineId) {
            // Fallback to direct Google search if API not configured
            return res.json({
                url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
                redirect: true
            });
        }

        // Use Google Custom Search API
        const fetch = require('node-fetch');
        const apiUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${searchEngineId}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.items) {
            res.json({
                results: data.items.map(item => ({
                    title: item.title,
                    url: item.link,
                    snippet: item.snippet
                })),
                redirect: false
            });
        } else {
            res.json({
                url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
                redirect: true
            });
        }
    } catch (error) {
        console.error('Search error:', error);
        res.json({
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            redirect: true
        });
    }
});

// Diagnostic endpoint to check why a site may be blocked or refuse embedding
app.get('/api/diagnose', async (req, res) => {
    const target = req.query.url;
    if (!target) return res.status(400).json({ error: 'Missing url query parameter' });

    try {
        // Try a HEAD request first to get headers quickly
        let response;
        try {
            response = await fetch(target, { method: 'HEAD', redirect: 'follow', timeout: 8000 });
        } catch (headErr) {
            // Some servers don't respond to HEAD; fall back to GET
            response = await fetch(target, { method: 'GET', redirect: 'follow', timeout: 8000 });
        }

        const headers = {};
        // Collect some headers that commonly affect embedding
        const hdrs = response.headers.raw ? response.headers.raw() : {};
        // Normalize keys to lowercase
        Object.keys(hdrs).forEach(k => {
            try { headers[k.toLowerCase()] = Array.isArray(hdrs[k]) ? hdrs[k].join('; ') : String(hdrs[k]); } catch (e) {}
        });

        const useful = {
            url: target,
            status: response.status,
            statusText: response.statusText,
            headers: {
                'x-frame-options': headers['x-frame-options'] || null,
                'content-security-policy': headers['content-security-policy'] || null,
                'strict-transport-security': headers['strict-transport-security'] || null,
                'server': headers['server'] || null,
                'via': headers['via'] || null
            }
        };

        res.json({ ok: true, diagnosis: useful });
    } catch (err) {
        console.error('Diagnose error for', target, err && err.message);
        res.json({ ok: false, error: String(err && err.message ? err.message : err) });
    }
});

// Catch-all middleware for unmatched /api/* routes - must come AFTER all specific /api/* routes
app.use('/api/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.path,
        method: req.method,
        message: 'Check the endpoint URL and HTTP method'
    });
});

// Catch-all middleware for unmatched static routes - serve static file or 404
app.use((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.status(404).send('<!DOCTYPE html><html><body><h1>404 Not Found</h1><p>File not found: ' + req.path + '</p></body></html>');
});

// Error handling middleware - always return JSON for /api errors
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.setHeader('Content-Type', 'application/json');
    res.status(err.status || 500).json({ 
        error: 'Internal server error',
        message: err.message || 'An unexpected error occurred'
    });
});

app.listen(PORT, () => {
    console.log(`App Launcher running on http://localhost:${PORT}`);
    console.log(`Visit http://localhost:${PORT} in your browser`);
    console.log(`Test admin with username: Anton`);
});
