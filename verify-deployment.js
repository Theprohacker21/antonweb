#!/usr/bin/env node

/**
 * Vercel Deployment Verification Script
 * Ensures all required files exist and are properly configured
 * Run this before deploying: npm run verify
 */

const fs = require('fs');
const path = require('path');

const checks = [];
const errors = [];
const warnings = [];

function checkFileExists(filePath, description) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        checks.push(`✓ ${description}`);
        return true;
    } else {
        errors.push(`✗ Missing: ${description} (${filePath})`);
        return false;
    }
}

function checkFileContent(filePath, searchString, description) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        errors.push(`✗ File not found: ${filePath}`);
        return false;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(searchString)) {
        checks.push(`✓ ${description}`);
        return true;
    } else {
        errors.push(`✗ Missing content in ${filePath}: ${description}`);
        return false;
    }
}

function checkDependency(packageName, description) {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.dependencies && packageJson.dependencies[packageName]) {
        checks.push(`✓ ${description} (${packageJson.dependencies[packageName]})`);
        return true;
    } else {
        errors.push(`✗ Missing dependency: ${packageName}`);
        return false;
    }
}

console.log('🔍 Vercel Deployment Verification\n');

// === CRITICAL FILES ===
console.log('📋 Critical Files:');
checkFileExists('package.json', 'Package manifest');
checkFileExists('server.js', 'Express server');
checkFileExists('vercel.json', 'Vercel configuration');
checkFileExists('netlify.toml', 'Netlify configuration');

// === FRONTEND FILES ===
console.log('\n🎨 Frontend Files:');
checkFileExists('index.html', 'Index entry point');
checkFileExists('signup.html', 'Signup page');
checkFileExists('login.html', 'Login page');
checkFileExists('dashboard.html', 'Dashboard page');
checkFileExists('admin.html', 'Admin panel');
checkFileExists('premium.html', 'Premium page');
checkFileExists('chat-widget.html', 'Chat widget');
checkFileExists('popup-monitor.html', 'Popup monitor');
checkFileExists('test-api.html', 'API test page');

// === CSS FILES ===
console.log('\n🎨 Stylesheet Files:');
checkFileExists('auth.css', 'Auth styles');
checkFileExists('dashboard.css', 'Dashboard styles');
checkFileExists('admin.css', 'Admin styles');
checkFileExists('premium.css', 'Premium styles');
checkFileExists('chat.css', 'Chat styles');
checkFileExists('notifications.css', 'Notification styles');

// === JAVASCRIPT FILES ===
console.log('\n⚙️ JavaScript Files:');
checkFileExists('auth.js', 'Auth logic');
checkFileExists('dashboard.js', 'Dashboard logic');
checkFileExists('admin.js', 'Admin logic');
checkFileExists('premium.js', 'Premium logic');
checkFileExists('chat.js', 'Chat logic');
checkFileExists('notifications.js', 'Notifications logic');

// === BACKEND FUNCTIONS ===
console.log('\n🔧 Backend Functions:');
checkFileExists('api/lib.js', 'Shared library functions');
checkFileExists('api/auth/[action].js', 'Auth endpoints');
checkFileExists('api/admin/users.js', 'Admin users endpoint');
checkFileExists('api/user/status.js', 'User status endpoint');

// === DEPENDENCIES ===
console.log('\n📦 Dependencies:');
checkDependency('express', 'Express.js');
checkDependency('cors', 'CORS middleware');

// === SERVER CONFIGURATION ===
console.log('\n⚙️ Server Configuration:');
checkFileContent('server.js', 'const PORT = 3000', 'Server port configuration');
checkFileContent('server.js', 'app.use(cors())', 'CORS enabled');
checkFileContent('server.js', 'app.use(express.json())', 'JSON parser configured');
checkFileContent('server.js', 'app.use(express.static', 'Static file serving');
checkFileContent('server.js', '/api/auth/signup', 'Signup endpoint');
checkFileContent('server.js', '/api/auth/login', 'Login endpoint');

// === NETLIFY FUNCTIONS ===
console.log('\n⚙️ Vercel Configuration:');
checkFileContent('vercel.json', '"version": 2', 'Vercel v2 configuration');
checkFileContent('vercel.json', '"version"', 'Vercel config file valid');

// === AUTHENTICATION ===
console.log('\n🔐 Authentication Setup:');
checkFileContent('server.js', "username === 'Anton'", 'Admin user (Anton) configured');
checkFileContent('api/lib.js', "verifyToken", 'Auth verification in Vercel functions');
checkFileContent('dashboard.js', "username === 'Anton'", 'Admin check in frontend');

// === DATA PERSISTENCE ===
console.log('\n💾 Data Persistence:');
checkFileContent('server.js', 'users.json', 'Users storage');
checkFileContent('server.js', 'messages.json', 'Messages storage');
checkFileContent('server.js', 'payments.json', 'Payments storage');
checkFileContent('server.js', 'broadcasts.json', 'Broadcasts storage');

// === CLIENT-SIDE FEATURES ===
console.log('\n✨ Client-Side Features:');
checkFileContent('dashboard.js', 'window.open', 'Popup launcher');
checkFileContent('chat.js', '/api/chat/send', 'Chat messaging');
checkFileContent('admin.js', '/api/admin/broadcast', 'Admin broadcast');
checkFileContent('premium.js', '/api/premium', 'Premium payment');
checkFileContent('notifications.js', 'updateNotifier', 'Update notifications');

// === ERROR HANDLING ===
console.log('\n🛡️ Error Handling:');
checkFileContent('login.html', 'safeJson', 'Safe JSON parsing in login');
checkFileContent('signup.html', 'safeJson', 'Safe JSON parsing in signup');
checkFileContent('chat.js', 'safeJson', 'Safe JSON parsing in chat');
checkFileContent('admin.js', 'safeJson', 'Safe JSON parsing in admin');

// === SUMMARY ===
console.log('\n' + '='.repeat(50));
console.log(`✓ Checks passed: ${checks.length}`);
console.log(`✗ Errors: ${errors.length}`);
console.log(`⚠ Warnings: ${warnings.length}`);
console.log('='.repeat(50) + '\n');

if (checks.length > 0) {
    console.log('✅ Passed Checks:');
    checks.forEach(check => console.log('  ' + check));
}

if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    warnings.forEach(warning => console.log('  ' + warning));
}

if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log('  ' + error));
    console.log('\n⛔ Deployment verification FAILED');
    process.exit(1);
} else {
    console.log('\n✅ All checks passed! Ready to deploy.\n');
    process.exit(0);
}
