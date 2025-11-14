# Deploy to Netlify - Complete Guide

## Quick Start (5 minutes)

### Step 1: Connect GitHub to Netlify
1. Go to: https://app.netlify.com
2. Click **"Sign up"** (or log in if you have an account)
3. Click **"Connect to Git"** → Choose **"GitHub"**
4. Authorize Netlify to access your GitHub account
5. Select your repository: **`Theprohacker21/antonweb`**
6. Click **"Deploy site"**

### Step 2: Wait for Initial Deploy
- Netlify will automatically build and deploy your site
- You'll get a URL like: `https://your-site-name.netlify.app`
- This may take 2-5 minutes

### Step 3: Set Environment Variables (IMPORTANT)
Your site needs these to work properly:

1. Go to your Netlify site dashboard
2. Click **"Site Settings"** → **"Build & Deploy"** → **"Environment"**
3. Click **"Edit variables"** and add:

```
FIREBASE_CREDENTIALS = (your Firebase service account JSON key)
GOOGLE_API_KEY = (your Google Custom Search API key)
GOOGLE_SEARCH_ENGINE_ID = (your Google Search Engine ID)
```

If you don't have these, see sections below.

### Step 4: Access Your Site
- Your site is now live at: `https://your-site-name.netlify.app`
- Share this link with anyone to access the dashboard

---

## What Works on Netlify

✅ **Dashboard** - All UI components  
✅ **Google Search** - Search results and app launcher  
✅ **Premium System** - User tiers and locked apps  
✅ **User Authentication** - Sign up, login, logout  
✅ **Admin Panel** - User management and content  
✅ **Chat & Messages** - Real-time communication  
✅ **Diagnostics** - Server-side header checking for blocked sites  
✅ **Database Persistence** - Firebase Firestore (with proper config)  

---

## What Doesn't Work on Netlify

❌ **VM Control** - Cannot access local Hyper-V from cloud  
  - `/api/vm/start`, `/api/vm/stop`, `/api/vm/status` will fail
  - This is expected - VMs are local only

❌ **Local Terminal** - Cannot run local shell commands  

❌ **Request Admin** - Cannot elevate cloud server permissions  

---

## Optional: Keep Local VM Control

If you want VM control **AND** Netlify hosting, use this hybrid setup:

### Architecture:
```
Chromebook/Browser
       ↓
   Netlify.app (Dashboard, Search, Premium)
       ↑ ↓
   Your Windows PC (VM Control API)
```

### Setup:
1. Deploy dashboard to Netlify (this guide)
2. Keep Node.js running locally on Windows PC (as Admin)
3. In `dashboard.js`, make VM API calls to your local PC IP instead of Netlify

**Example:**
```javascript
// Replace localhost with your PC IP
const vmApiUrl = 'http://192.168.1.100:3000/api/vm/start';
```

Then VM buttons will control your local machine while dashboard runs on Netlify!

---

## Setting Up Firebase (For Data Persistence)

If you want your data to persist on Netlify:

### 1. Create Firebase Project
- Go to: https://console.firebase.google.com
- Click **"Create Project"**
- Name it (e.g., "antonweb")
- Enable Firestore Database

### 2. Get Service Account Key
1. Click **"Settings"** (gear icon)
2. Go to **"Service Accounts"**
3. Click **"Generate New Private Key"**
4. Copy the entire JSON file content

### 3. Add to Netlify
1. Go to Netlify Site Settings → Environment
2. Create new variable: `FIREBASE_CREDENTIALS`
3. Paste the entire JSON as the value
4. Save

### 4. Redeploy
- Netlify will automatically rebuild with Firebase enabled
- Your data will now persist!

---

## Setting Up Google Custom Search (Optional)

For better search results:

### 1. Create Google Custom Search Engine
- Go to: https://programmablesearchengine.google.com
- Click **"Create"** and follow steps
- You'll get a Search Engine ID

### 2. Get Google API Key
- Go to: https://console.cloud.google.com
- Create a new project
- Enable **"Custom Search API"**
- Create an API key
- Restrict it to: **"Custom Search API"**

### 3. Add to Netlify
1. Go to Netlify Site Settings → Environment
2. Add variables:
   - `GOOGLE_API_KEY` = (your API key)
   - `GOOGLE_SEARCH_ENGINE_ID` = (your Search Engine ID)
3. Save and Netlify will rebuild

---

## Custom Domain (Optional)

To use your own domain instead of `*.netlify.app`:

1. Go to Netlify Site Settings → **"Domain Settings"**
2. Click **"Add a Domain"**
3. Enter your domain (e.g., `anton.example.com`)
4. Follow DNS setup instructions
5. Point your domain registrar to Netlify's nameservers

---

## Continuous Deployment

Once deployed:
- Any push to `main` branch automatically redeploys
- Changes appear live within 2-5 minutes
- No manual deployment needed!

```bash
# To deploy updates:
git add -A
git commit -m "Your changes"
git push origin main
# ✓ Netlify automatically builds and deploys!
```

---

## Troubleshooting

### "Build failed"
- Check build logs in Netlify dashboard
- Ensure `package.json` and `netlify.toml` are correct
- Run `npm install` locally to verify dependencies

### "Functions not working"
- Verify `netlify/functions/` folder exists
- Check environment variables are set
- Look at function logs in Netlify dashboard

### "Data not persisting"
- Add `FIREBASE_CREDENTIALS` environment variable
- Redeploy after adding it
- Check Firebase Firestore is enabled

### "Search not working"
- Add `GOOGLE_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID`
- Verify API keys are correct (not truncated)
- Redeploy after changes

### "VM buttons don't work"
- This is expected on Netlify (cloud can't access local VMs)
- Use the hybrid setup (see "Optional" section above) if needed

---

## Support Links

- **Netlify Docs**: https://docs.netlify.com
- **Firebase Docs**: https://firebase.google.com/docs
- **Google Custom Search**: https://programmablesearchengine.google.com
- **GitHub Pages Alternative**: https://pages.github.com

---

## Next Steps

1. ✅ Deploy to Netlify (this document)
2. 📧 Share your live URL: `https://your-site.netlify.app`
3. 🔐 Set environment variables for full functionality
4. 🎉 Enjoy your app live on the internet!

