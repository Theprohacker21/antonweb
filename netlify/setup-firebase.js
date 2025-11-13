#!/usr/bin/env node
/**
 * Quick setup: Copy Firebase service account credentials
 * 
 * Usage:
 * 1. Download service account JSON from Firebase Console
 * 2. Run: node netlify/setup-firebase.js /path/to/service-account-key.json
 * 3. Follow the instructions to set up Netlify environment variables
 */

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
    console.log('📋 Firebase Firestore Setup for Netlify');
    console.log('========================================\n');
    console.log('Usage: node netlify/setup-firebase.js <path-to-key.json>\n');
    console.log('Steps:');
    console.log('1. Go to: https://console.firebase.google.com');
    console.log('2. Select your project');
    console.log('3. Settings > Service Accounts > Node.js');
    console.log('4. Click "Generate New Private Key"');
    console.log('5. Save the downloaded JSON file');
    console.log('6. Run: node netlify/setup-firebase.js <path-to-downloaded-file.json>\n');
    process.exit(1);
}

const keyPath = process.argv[2];

if (!fs.existsSync(keyPath)) {
    console.error('❌ File not found:', keyPath);
    process.exit(1);
}

try {
    const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    
    console.log('✅ Service account key loaded successfully!\n');
    console.log('📝 Set this environment variable in Netlify:\n');
    console.log('Name: FIREBASE_CREDENTIALS');
    console.log('Value:\n');
    
    const credJson = JSON.stringify(keyData);
    console.log(credJson);
    
    console.log('\n\n📋 Instructions:');
    console.log('1. Copy the value above (entire JSON string)');
    console.log('2. Go to Netlify Dashboard: Site settings > Build & deploy > Environment');
    console.log('3. Click "Add environment variable"');
    console.log('4. Paste the value above as FIREBASE_CREDENTIALS');
    console.log('5. Deploy your site (git push or Netlify Dashboard > Deploys > Retry)');
    console.log('\nℹ️  Keep this file secret - it has full access to your Firebase database!\n');
    
    // Save to local file for reference
    const envFile = path.join(__dirname, '.env.firebase');
    fs.writeFileSync(envFile, `FIREBASE_CREDENTIALS='${credJson}'\n`);
    console.log(`💾 Saved to .env.firebase for reference (add to .gitignore!)\n`);
    
} catch (error) {
    console.error('❌ Error reading key file:', error.message);
    process.exit(1);
}
