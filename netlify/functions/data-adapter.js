// Data adapter for Netlify Functions
// Supports both file-based (local) and Firestore (production) backends
// Auto-detects which one to use based on environment

const fs = require('fs');
const path = require('path');
const os = require('os');

// Try to initialize Firestore if credentials available
let firestore = null;
let firestoreReady = false;

async function initializeFirestore() {
    if (firestoreReady) return;
    
    try {
        const credentials = process.env.FIREBASE_CREDENTIALS
            ? JSON.parse(process.env.FIREBASE_CREDENTIALS)
            : null;
        
        if (!credentials || !credentials.project_id) {
            console.log('[DataAdapter] No Firebase credentials, using local file storage');
            firestoreReady = true;
            return;
        }
        
        const admin = require('firebase-admin');
        
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(credentials),
                projectId: credentials.project_id
            });
        }
        
        firestore = admin.firestore();
        console.log('[DataAdapter] ✓ Firestore initialized');
    } catch (error) {
        console.warn('[DataAdapter] Firestore initialization failed:', error.message);
        console.log('[DataAdapter] Falling back to file-based storage (ephemeral on Netlify)');
    }
    
    firestoreReady = true;
}

// Fallback: file-based storage (local only, ephemeral on Netlify)
const tempDir = os.tmpdir();
const usersFile = path.join(tempDir, 'app-users.json');
const messagesFile = path.join(tempDir, 'app-messages.json');
const paymentsFile = path.join(tempDir, 'app-payments.json');
const broadcastsFile = path.join(tempDir, 'app-broadcasts.json');

function loadFile(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.warn(`Failed to load ${path.basename(filePath)}:`, e.message);
    }
    return defaultValue;
}

function saveFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error(`Failed to save ${path.basename(filePath)}:`, e.message);
        return false;
    }
}

// Export interface that API handlers use
module.exports = {
    async initialize() {
        await initializeFirestore();
    },
    
    async getUsers() {
        if (firestore) {
            try {
                const docs = await firestore.collection('users').get();
                return docs.docs.map(doc => doc.data());
            } catch (e) {
                console.error('Firestore getUsers failed:', e.message);
                return [];
            }
        }
        return loadFile(usersFile);
    },
    
    async saveUsers(users) {
        if (firestore) {
            try {
                const batch = firestore.batch();
                const existing = await firestore.collection('users').get();
                existing.docs.forEach(doc => batch.delete(doc.ref));
                users.forEach(user => {
                    const doc = firestore.collection('users').doc(user.username || user.id);
                    batch.set(doc, user);
                });
                await batch.commit();
                return true;
            } catch (e) {
                console.error('Firestore saveUsers failed:', e.message);
            }
        }
        return saveFile(usersFile, users);
    },
    
    async getMessages() {
        if (firestore) {
            try {
                const docs = await firestore.collection('messages').orderBy('timestamp', 'asc').get();
                return docs.docs.map(doc => doc.data());
            } catch (e) {
                console.error('Firestore getMessages failed:', e.message);
                return [];
            }
        }
        return loadFile(messagesFile);
    },
    
    async saveMessages(messages) {
        if (firestore) {
            try {
                const batch = firestore.batch();
                const existing = await firestore.collection('messages').get();
                existing.docs.forEach(doc => batch.delete(doc.ref));
                messages.forEach((msg, i) => {
                    const doc = firestore.collection('messages').doc(`msg-${i}`);
                    batch.set(doc, msg);
                });
                await batch.commit();
                return true;
            } catch (e) {
                console.error('Firestore saveMessages failed:', e.message);
            }
        }
        return saveFile(messagesFile, messages);
    },
    
    async getPayments() {
        if (firestore) {
            try {
                const docs = await firestore.collection('payments').orderBy('createdAt', 'desc').get();
                return docs.docs.map(doc => doc.data());
            } catch (e) {
                console.error('Firestore getPayments failed:', e.message);
                return [];
            }
        }
        return loadFile(paymentsFile);
    },
    
    async savePayments(payments) {
        if (firestore) {
            try {
                const batch = firestore.batch();
                const existing = await firestore.collection('payments').get();
                existing.docs.forEach(doc => batch.delete(doc.ref));
                payments.forEach((payment, i) => {
                    const doc = firestore.collection('payments').doc(`payment-${i}`);
                    batch.set(doc, payment);
                });
                await batch.commit();
                return true;
            } catch (e) {
                console.error('Firestore savePayments failed:', e.message);
            }
        }
        return saveFile(paymentsFile, payments);
    },
    
    async getBroadcasts() {
        if (firestore) {
            try {
                const docs = await firestore.collection('broadcasts').orderBy('createdAt', 'desc').get();
                return docs.docs.map(doc => doc.data());
            } catch (e) {
                console.error('Firestore getBroadcasts failed:', e.message);
                return [];
            }
        }
        return loadFile(broadcastsFile);
    },
    
    async saveBroadcasts(broadcasts) {
        if (firestore) {
            try {
                const batch = firestore.batch();
                const existing = await firestore.collection('broadcasts').get();
                existing.docs.forEach(doc => batch.delete(doc.ref));
                broadcasts.forEach((bc, i) => {
                    const doc = firestore.collection('broadcasts').doc(`broadcast-${i}`);
                    batch.set(doc, bc);
                });
                await batch.commit();
                return true;
            } catch (e) {
                console.error('Firestore saveBroadcasts failed:', e.message);
            }
        }
        return saveFile(broadcastsFile, broadcasts);
    }
};
