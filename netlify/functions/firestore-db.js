// Firestore persistence layer for Netlify Functions
// This module handles all data persistence using Firebase Firestore
// which provides true cross-invocation persistence

const admin = require('firebase-admin');

// Initialize Firebase Admin (uses service account from environment)
// To set this up:
// 1. Go to https://console.firebase.google.com
// 2. Project Settings > Service Accounts > Generate Private Key
// 3. Set FIREBASE_CREDENTIALS environment variable to the JSON key
// 4. Or: Set individual env vars: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL

let db;

function initFirestore() {
    if (db) return db;
    
    try {
        // Try to initialize from environment credentials
        const credentials = process.env.FIREBASE_CREDENTIALS 
            ? JSON.parse(process.env.FIREBASE_CREDENTIALS)
            : {
                type: 'service_account',
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                token_uri: 'https://oauth2.googleapis.com/token',
                auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
                client_x509_cert_url: process.env.FIREBASE_CERT_URL
            };
        
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(credentials),
                projectId: credentials.project_id
            });
        }
        
        db = admin.firestore();
        console.log('Firestore initialized successfully');
        return db;
    } catch (error) {
        console.error('Failed to initialize Firestore:', error.message);
        console.log('⚠️ Firestore not available. Using temporary in-memory storage.');
        console.log('⚠️ Data will NOT persist across function invocations.');
        console.log('⚠️ To fix: Set FIREBASE_CREDENTIALS env var in Netlify settings');
        return null;
    }
}

// Collection operations
async function getUsers() {
    const firestore = initFirestore();
    if (!firestore) return [];
    
    try {
        const snapshot = await firestore.collection('users').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

async function saveUsers(users) {
    const firestore = initFirestore();
    if (!firestore) {
        console.warn('Firestore not available, skipping save');
        return;
    }
    
    try {
        // Clear existing and rewrite
        const snapshot = await firestore.collection('users').get();
        const batch = firestore.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        users.forEach(user => {
            const ref = firestore.collection('users').doc(user.username);
            batch.set(ref, user);
        });
        await batch.commit();
    } catch (error) {
        console.error('Error saving users:', error);
    }
}

async function getMessages() {
    const firestore = initFirestore();
    if (!firestore) return [];
    
    try {
        const snapshot = await firestore.collection('messages').orderBy('timestamp').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

async function saveMessages(messages) {
    const firestore = initFirestore();
    if (!firestore) {
        console.warn('Firestore not available, skipping save');
        return;
    }
    
    try {
        const batch = firestore.batch();
        const snapshot = await firestore.collection('messages').get();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        messages.forEach((msg, index) => {
            const ref = firestore.collection('messages').doc(`msg-${index}`);
            batch.set(ref, msg);
        });
        await batch.commit();
    } catch (error) {
        console.error('Error saving messages:', error);
    }
}

async function getPayments() {
    const firestore = initFirestore();
    if (!firestore) return [];
    
    try {
        const snapshot = await firestore.collection('payments').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching payments:', error);
        return [];
    }
}

async function savePayments(payments) {
    const firestore = initFirestore();
    if (!firestore) {
        console.warn('Firestore not available, skipping save');
        return;
    }
    
    try {
        const batch = firestore.batch();
        const snapshot = await firestore.collection('payments').get();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        payments.forEach((payment, index) => {
            const ref = firestore.collection('payments').doc(`payment-${index}`);
            batch.set(ref, payment);
        });
        await batch.commit();
    } catch (error) {
        console.error('Error saving payments:', error);
    }
}

async function getBroadcasts() {
    const firestore = initFirestore();
    if (!firestore) return [];
    
    try {
        const snapshot = await firestore.collection('broadcasts').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching broadcasts:', error);
        return [];
    }
}

async function saveBroadcasts(broadcasts) {
    const firestore = initFirestore();
    if (!firestore) {
        console.warn('Firestore not available, skipping save');
        return;
    }
    
    try {
        const batch = firestore.batch();
        const snapshot = await firestore.collection('broadcasts').get();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        broadcasts.forEach((broadcast, index) => {
            const ref = firestore.collection('broadcasts').doc(`broadcast-${index}`);
            batch.set(ref, broadcast);
        });
        await batch.commit();
    } catch (error) {
        console.error('Error saving broadcasts:', error);
    }
}

module.exports = {
    initFirestore,
    getUsers,
    saveUsers,
    getMessages,
    saveMessages,
    getPayments,
    savePayments,
    getBroadcasts,
    saveBroadcasts
};
