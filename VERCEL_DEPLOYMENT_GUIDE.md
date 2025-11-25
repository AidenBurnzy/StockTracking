# Deploy to Vercel - Quick Guide

## Steps to Deploy Your Trading Tracker to Vercel

### 1. Push to GitHub (if not done already)
```bash
git add .
git commit -m "Add Vercel API routes"
git push
```

### 2. Deploy on Vercel

#### Option A: Vercel Website (Recommended)
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Select your **StockTracking** repository
5. Vercel will auto-detect it's a Vite project
6. **IMPORTANT**: Add Environment Variable:
   - Name: `DATABASE_URL`
   - Value: `postgresql://neondb_owner:npg_2FOGgNTUr5Zt@ep-small-wildflower-ahrblxoi-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
7. Click **"Deploy"**
8. Wait 2-3 minutes
9. Done! Click the URL to see your live app

#### Option B: Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# When prompted:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - What's your project's name? trading-tracker
# - In which directory is your code located? ./
# - Want to override settings? No

# Add environment variable
vercel env add DATABASE_URL production

# Paste your Neon connection string when prompted

# Deploy to production
vercel --prod
```

### 3. Verify Deployment

Your app should now be live! Test these features:
- ✅ Portfolio displays correctly
- ✅ Can add daily entries
- ✅ Can add/withdraw capital
- ✅ Can edit and delete entries
- ✅ History shows all entries

### 4. Update Later

When you make changes:
```bash
git add .
git commit -m "Your update message"
git push
# Vercel will automatically redeploy!
```

## What Changed for Vercel?

1. **Created `/api` folder** - Vercel uses this for serverless functions
2. **Converted all Netlify functions** to Vercel format
3. **Added `vercel.json`** - Configuration file
4. **Updated App.jsx** - Automatically detects Vercel vs Netlify

## Both Platforms Supported!

Your app now works on both:
- ✅ **Netlify** - Uses `netlify/functions/`
- ✅ **Vercel** - Uses `api/`

The app automatically detects which platform it's on and uses the correct API path.

## Troubleshooting

**404 errors on API calls?**
- Make sure you added the `DATABASE_URL` environment variable in Vercel settings

**Can't see environment variables?**
1. Go to your Vercel project
2. Click "Settings"
3. Click "Environment Variables"
4. Add `DATABASE_URL` with your Neon connection string
5. Redeploy

**Need to redeploy manually?**
1. Go to Vercel dashboard
2. Click your project
3. Click "Deployments"
4. Click "Redeploy" on the latest deployment
