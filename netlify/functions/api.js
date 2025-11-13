// Netlify Function: Serverless API Handler
// All /api/* requests route here

const fs = require('fs');
const path = require('path');

// ⚠️ CRITICAL: Netlify Functions filesystem persistence issue
// Each function invocation gets:
// - Fresh /tmp directory (ephemeral - data lost)
// - Deployed files are READ-ONLY (can't write)
//
// CURRENT WORKAROUND: Use /tmp within a single invocation,
// but understand data won't persist between invocations
//
// PERMANENT SOLUTION (REQUIRED FOR PRODUCTION):
// Set up Firebase Firestore by:
// 1. Creating a Firebase project at console.firebase.google.com
// 2. Generating a service account key (Project Settings > Service Accounts)
// 3. Setting FIREBASE_CREDENTIALS env var in Netlify Dashboard
// 4. Uncommenting the Firestore code in netlify/functions/firestore-db.js

// Use volatile storage that at least works during testing
// Each request will re-load data from /tmp (fresh but empty)
const os = require('os');
const tempDir = os.tmpdir();

// Use a consistent temp filename per deployment
const usersFile = path.join(tempDir, 'netlify-data-users.json');
const messagesFile = path.join(tempDir, 'netlify-data-messages.json');
const paymentsFile = path.join(tempDir, 'netlify-data-payments.json');
const broadcastsFile = path.join(tempDir, 'netlify-data-broadcasts.json');

let users = [];
let messages = [];
let paymentNotifications = [];
let broadcasts = [];

// Load all data on startup
function loadUsers() {
    try {
        if (fs.existsSync(usersFile)) {
            const data = fs.readFileSync(usersFile, 'utf8');
            users = JSON.parse(data);
            console.log(`[Netlify] Loaded ${users.length} users from ${usersFile}`);
        } else {
            users = [];
        }
    } catch (error) {
        console.warn('Could not load users file, starting fresh:', error.message);
        users = [];
    }
}

function saveUsers() {
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        console.log(`[Netlify] Saved ${users.length} users to ${usersFile}`);
    } catch (e) {
        console.error(`[Netlify] ERROR saving users to ${usersFile}:`, e.message);
        // Silently fail - data stays in memory for this invocation
    }
}

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

function saveMessages() {
    try {
        fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
    } catch (e) {
        console.error('Error saving messages:', e);
    }
}

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

function savePayments() {
    try {
        fs.writeFileSync(paymentsFile, JSON.stringify(paymentNotifications, null, 2));
        console.log(`[Netlify] ✓ Saved ${paymentNotifications.length} payments to ${paymentsFile}`);
        return { success: true, saved: paymentNotifications.length, file: paymentsFile };
    } catch (e) {
        console.error(`[Netlify] ✗ ERROR saving payments to ${paymentsFile}:`, e.message);
        return { success: false, error: e.message, file: paymentsFile };
    }
}

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

function saveBroadcasts() {
    try {
        fs.writeFileSync(broadcastsFile, JSON.stringify(broadcasts, null, 2));
    } catch (e) {
        console.error('Error saving broadcasts:', e);
    }
}

// Load on startup
loadUsers();
loadMessages();
loadPayments();
loadBroadcasts();

// Token helpers
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

function getUserTier(username) {
    if (username === 'Anton') {
        return 'Founder (Admin)';
    }
    const user = users.find(u => u.username === username);
    return user && user.isPremium ? 'Premium' : 'Free Version';
}

// Route handlers
const routes = {
    // Auth routes
    'POST /api/auth/signup': (req) => {
        const { username, password, email } = req.body;
        if (!username || !password || !email) {
            return { status: 400, body: { message: 'All fields are required' } };
        }
        if (users.find(u => u.username === username)) {
            return { status: 400, body: { message: 'Username already exists' } };
        }
        const newUser = {
            username,
            password,
            email,
            isPremium: false,
            createdAt: new Date()
        };
        users.push(newUser);
        saveUsers();
        const token = generateToken(username);
        return { status: 200, body: { token, username, isPremium: false } };
    },

    'POST /api/auth/login': (req) => {
        const { username, password } = req.body;
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) {
            return { status: 401, body: { message: 'Invalid credentials' } };
        }
        const token = generateToken(username);
        return { status: 200, body: { token, username, isPremium: user.isPremium } };
    },

    // Admin routes
    'GET /api/admin/users': (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        const username = verifyToken(token);
        if (username !== 'Anton') {
            return { status: 403, body: { message: 'Access denied' } };
        }
        return { status: 200, body: { users } };
    },

    'POST /api/admin/delete-user': (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        const username = verifyToken(token);
        if (username !== 'Anton') {
            return { status: 403, body: { message: 'Access denied' } };
        }
        const { username: targetUsername } = req.body;
        users = users.filter(u => u.username !== targetUsername);
        saveUsers();
        return { status: 200, body: { message: 'User deleted' } };
    },

    'POST /api/admin/grant-premium': (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        const username = verifyToken(token);
        if (username !== 'Anton') {
            return { status: 403, body: { message: 'Access denied' } };
        }
        const { username: targetUsername } = req.body;
        const user = users.find(u => u.username === targetUsername);
        if (!user) {
            return { status: 404, body: { message: 'User not found' } };
        }
        user.isPremium = true;
        saveUsers();
        return { status: 200, body: { message: 'Premium granted' } };
    },

    'POST /api/admin/remove-premium': (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        const username = verifyToken(token);
        if (username !== 'Anton') {
            return { status: 403, body: { message: 'Access denied' } };
        }
        const { username: targetUsername } = req.body;
        const user = users.find(u => u.username === targetUsername);
        if (!user) {
            return { status: 404, body: { message: 'User not found' } };
        }
        user.isPremium = false;
        saveUsers();
        return { status: 200, body: { message: 'Premium removed' } };
    },

    // User status
    'GET /api/user/status': (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        const username = verifyToken(token);
        if (!username) {
            return { status: 401, body: { message: 'Unauthorized' } };
        }
        const user = users.find(u => u.username === username);
        if (!user) {
            return { status: 404, body: { message: 'User not found' } };
        }
        return { status: 200, body: { username, isPremium: user.isPremium } };
    },

    // Chat routes
    'POST /api/chat/send': (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        const username = verifyToken(token);
        if (!username) {
            return { status: 401, body: { message: 'Unauthorized' } };
        }
        const { message, group } = req.body;
        if (!message || !group) {
            return { status: 400, body: { message: 'Message and group are required' } };
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
        return { status: 200, body: { success: true, messageId: newMessage.id } };
    },

    'GET /api/chat/messages': (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        const username = verifyToken(token);
        if (!username) {
            return { status: 401, body: { message: 'Unauthorized' } };
        }
        const group = req.query.group || 'NMS';
        const since = parseInt(req.query.since) || 0;
        const groupMessages = messages.filter(m => m.group === group).map(m => ({
            ...m,
            tier: m.tier || getUserTier(m.username)
        }));
        const newMessages = groupMessages.filter(m => m.id > since);
        return { status: 200, body: { messages: groupMessages, newMessages } };
    },

    // Premium payment routes
    'POST /api/premium/cash-payment': (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        const username = verifyToken(token);
        if (!username) {
            return { status: 401, body: { message: 'Unauthorized' } };
        }
        const { amount } = req.body;
        
        console.log(`[PAYMENT] Cash payment from ${username} for $${amount}`);
        console.log(`[PAYMENT] Current notifications in memory: ${paymentNotifications.length}`);
        console.log(`[PAYMENT] Payment file: ${paymentsFile}`);
        
        const notification = {
            id: paymentNotifications.length > 0 ? Math.max(...paymentNotifications.map(p => p.id)) + 1 : 1,
            type: 'cash',
            username: username,
            amount: amount,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        paymentNotifications.push(notification);
        console.log(`[PAYMENT] Added notification, now ${paymentNotifications.length} in memory`);
        
        const saveResult = savePayments();
        console.log(`[PAYMENT] Save result:`, saveResult);
        
        return { 
            status: 200, 
            body: { 
                success: true, 
                message: 'Cash payment notification sent to admin',
                paymentId: notification.id,
                debug: {
                    username,
                    amount,
                    notificationId: notification.id,
                    totalNotifications: paymentNotifications.length,
                    filename: paymentsFile
                }
            } 
        };
    },

    'POST /api/premium/stripe-payment': (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        const username = verifyToken(token);
        if (!username) {
            return { status: 401, body: { message: 'Unauthorized' } };
        }
        const { amount } = req.body;
        const user = users.find(u => u.username === username);
        if (user) {
            user.isPremium = true;
            saveUsers();
            const notification = {
                id: paymentNotifications.length > 0 ? Math.max(...paymentNotifications.map(p => p.id)) + 1 : 1,
                type: 'stripe',
                username: username,
                amount: amount / 100,
                status: 'completed',
                createdAt: new Date()
            };
            paymentNotifications.push(notification);
            savePayments();
            return { status: 200, body: { success: true, message: 'Payment processed. Premium activated!' } };
        } else {
            return { status: 404, body: { message: 'User not found' } };
        }
    },

    'GET /api/admin/payments': (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        const username = verifyToken(token);
        if (username !== 'Anton') {
            return { status: 403, body: { message: 'Access denied' } };
        }
        return { status: 200, body: { payments: paymentNotifications } };
    },

    'POST /api/admin/confirm-payment': (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        const username = verifyToken(token);
        if (username !== 'Anton') {
            return { status: 403, body: { message: 'Access denied' } };
        }
        const { paymentId } = req.body;
        const payment = paymentNotifications.find(p => p.id === paymentId);
        if (!payment) {
            return { status: 404, body: { message: 'Payment not found' } };
        }
        const user = users.find(u => u.username === payment.username);
        if (user) {
            user.isPremium = true;
            saveUsers();
        }
        payment.status = 'confirmed';
        savePayments();
        return { status: 200, body: { success: true, message: 'Payment confirmed. Premium activated!' } };
    },

    // Broadcast routes
    'POST /api/admin/broadcast': (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        const username = verifyToken(token);
        if (username !== 'Anton') {
            return { status: 403, body: { message: 'Access denied' } };
        }
        const { message } = req.body;
        if (!message) {
            return { status: 400, body: { message: 'Message required' } };
        }
        const b = {
            id: broadcasts.length > 0 ? Math.max(...broadcasts.map(x => x.id)) + 1 : 1,
            message: message,
            createdAt: new Date()
        };
        broadcasts.push(b);
        saveBroadcasts();
        return { status: 200, body: { success: true, broadcast: b } };
    },

    'GET /api/broadcasts': (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        const username = verifyToken(token);
        if (!username) {
            return { status: 401, body: { message: 'Unauthorized' } };
        }
        const since = parseInt(req.query.since) || 0;
        const all = broadcasts.slice();
        const newBroadcasts = all.filter(b => b.id > since);
        return { status: 200, body: { broadcasts: all, newBroadcasts } };
    }
};

// Main handler
exports.handler = async (event, context) => {
    // Reload all data at the start of each invocation (Netlify doesn't persist memory)
    loadUsers();
    loadMessages();
    loadPayments();
    loadBroadcasts();

    const method = event.httpMethod;
    const path = event.path;
    
    // Parse body
    let body = null;
    if (event.body) {
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            body = {};
        }
    }

    // Parse query params
    const queryParams = event.queryStringParameters || {};
    const query = {};
    for (const [key, value] of Object.entries(queryParams)) {
        query[key] = value;
    }

    // Parse headers
    const headers = event.headers || {};

    // Create request-like object
    const req = {
        method,
        path,
        body,
        query,
        headers: { ...headers, authorization: headers.authorization || headers.Authorization }
    };

    // Find matching route
    const routeKey = `${method} ${path}`;
    const handler = routes[routeKey];

    if (!handler) {
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'API endpoint not found',
                path,
                method,
                message: 'Check the endpoint URL and HTTP method'
            })
        };
    }

    try {
        const result = handler(req);
        return {
            statusCode: result.status || 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.body)
        };
    } catch (error) {
        console.error('Handler error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
