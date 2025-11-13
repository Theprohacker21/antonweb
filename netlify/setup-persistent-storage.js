#!/usr/bin/env node
/**
 * Setup script for Netlify persistent data storage
 * 
 * Netlify Functions have ephemeral /tmp storage.
 * This script creates placeholder data files in the project root
 * that are deployed with your site and serve as fallback data.
 * 
 * WARNING: This is a workaround. For production use:
 * - Firebase Firestore (recommended)
 * - MongoDB Atlas
 * - Supabase PostgreSQL
 * - Any serverless database
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Create empty data files if they don't exist
const dataFiles = [
    'users.json',
    'messages.json',
    'payments.json',
    'broadcasts.json'
];

dataFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        console.log(`✓ Created ${file}`);
    } else {
        console.log(`✓ ${file} already exists`);
    }
});

console.log('\n⚠️  Netlify Functions have ephemeral /tmp storage');
console.log('Data may not persist between function invocations.');
console.log('\n✅ For production, set up a persistent database:');
console.log('   1. Create Firebase Firestore project');
console.log('   2. Generate service account key');
console.log('   3. Set FIREBASE_CREDENTIALS in Netlify environment');
console.log('\nSee: https://firebase.google.com/docs/firestore/');
