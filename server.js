const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
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

app.listen(PORT, () => {
    console.log(`App Launcher running on http://localhost:${PORT}`);
    console.log(`Visit http://localhost:${PORT} in your browser`);
    console.log(`Test admin with username: Anton`);
});
