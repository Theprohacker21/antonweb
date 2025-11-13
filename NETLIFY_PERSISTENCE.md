# 🚨 Netlify Functions: Data Persistence Issue & Solution

## Problem

Netlify Functions use an **ephemeral `/tmp` filesystem**. This means:
- Each function invocation gets a fresh `/tmp` directory
- Files written to `/tmp` are lost when the function completes
- Data does NOT persist between requests
- The app works locally (`npm start`) but fails on Netlify

## Current Status

✅ **Working Locally** (Node.js):
- `npm start` uses `server.js` with persistent file storage
- All payments, messages, and user data are saved to disk

❌ **Broken on Netlify** (Netlify Functions):
- `netlify/functions/api.js` tries to write to `/tmp`
- Data is created but lost immediately
- Admin panel shows no payments even though requests succeeded

## Solutions

### Option 1: Firebase Firestore (Recommended)

Firebase provides a free tier with 50,000 reads/writes per day.

**Setup Steps:**

1. Go to https://console.firebase.google.com
2. Click "Create Project" or select existing project
3. Enable Firestore Database (Create Database in "Test Mode")
4. Go to Settings > Service Accounts > Node.js
5. Click "Generate New Private Key"
6. Save the JSON file (keep it secret!)
7. In Netlify Dashboard:
   - Go to Site settings > Build & deploy > Environment
   - Add environment variable: `FIREBASE_CREDENTIALS`
   - Paste the entire JSON content from the key file
8. Redeploy: `git push` to trigger Netlify rebuild
9. The app should now use Firestore for all data persistence

**Uncomment in code after setup:**
- File: `netlify/functions/firestore-db.js` (replace stub implementation)
- Update handlers in `netlify/functions/api.js` to use firestore-db module

### Option 2: MongoDB Atlas

Free tier includes 512MB storage, perfect for testing.

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create database user
4. Get connection string
5. Store in Netlify environment variable: `MONGODB_URI`
6. Install driver: `npm install mongodb`
7. Update `netlify/functions/api.js` to use MongoDB connection

### Option 3: Supabase (PostgreSQL)

Free tier includes 500MB storage and unlimited API calls.

1. Create account at https://supabase.com
2. Create new project
3. Get connection URL
4. Store in Netlify: `SUPABASE_URL` + `SUPABASE_ANON_KEY`
5. Use JavaScript client to connect

### Option 4: Netlify Blobs (If Available)

Netlify has experimental "Blobs" storage in some plans.

1. Check if available in your Netlify plan
2. Uses automatic persistence without manual setup
3. Limited to 50KB-100MB per item

## Temporary Workaround (Testing Only)

The current code in `netlify/functions/api.js`:
- Attempts to write to `/tmp` (data lost between invocations)
- Includes debug logging to show this is happening
- Works for **immediate testing** within a single function invocation
- **Does NOT persist data** across multiple requests

To test the full flow:
1. Deploy to Netlify
2. Make a payment request
3. Immediately check admin panel (same session)
4. Refresh or wait 5+ seconds → data is gone

## Quick Test

To verify the issue:

```bash
# Terminal 1: Watch Netlify logs
netlify logs --tail

# Terminal 2: Make a payment on deployed site
# Then check the logs for:
# [PAYMENT] Cash payment from [user] for $[amount]
# [Netlify] ✓ Saved 1 payments to /tmp/...

# Terminal 3: Try to see payment in admin panel
# It will be empty because /tmp was cleaned up
```

## Migration Path

1. **Immediate**: Deploy with Firebase Firestore for true persistence
2. **Option**: Use MongoDB or Supabase if you prefer
3. **Later**: Can migrate between databases without code changes (same API structure)

## Environment Variables Reference

### Firebase
```env
FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

### MongoDB
```env
MONGODB_URI='mongodb+srv://username:password@cluster.mongodb.net/dbname'
```

### Supabase
```env
SUPABASE_URL='https://[project].supabase.co'
SUPABASE_ANON_KEY='...'
```

## Files Related to This Issue

- `netlify/functions/api.js` - Main serverless handler (currently uses ephemeral /tmp)
- `netlify/functions/firestore-db.js` - Firestore adapter (needs environment setup)
- `netlify/setup-persistent-storage.js` - Setup helper script
- `netlify.toml` - Netlify config (routes /api/* to functions)
- `.gitignore` - Should exclude data files and credentials

## Testing Checklist

- [ ] Firebase Firestore project created
- [ ] Service account key generated
- [ ] FIREBASE_CREDENTIALS env var set in Netlify
- [ ] Netlify deployment updated
- [ ] Payment flow tested on deployed site
- [ ] Admin panel shows payments persisting
- [ ] Messages persist in chat
- [ ] User data persists across logins

## Support

For more info:
- Firebase: https://firebase.google.com/docs/firestore/
- MongoDB: https://docs.mongodb.com/
- Supabase: https://supabase.com/docs
- Netlify: https://docs.netlify.com/

---

**TL;DR**: Netlify Functions can't write files persistently. Use Firebase Firestore or another database. Local testing works fine with Node.js backend.
