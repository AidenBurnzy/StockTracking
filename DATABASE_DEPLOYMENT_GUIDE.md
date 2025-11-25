# 🚀 FULL DEPLOYMENT GUIDE - Trading Tracker with Neon Database

This version uses a Neon PostgreSQL database so both Nick and Joey can access from any device.

## Part 1: Create Neon Database (5 minutes)

1. **Go to Neon:**
   - Visit https://neon.tech
   - Sign in (you probably already have an account)

2. **Create New Project:**
   - Click "New Project"
   - Name it: `trading-tracker`
   - Choose region closest to you
   - Click "Create Project"

3. **Run the Database Schema:**
   - In your Neon project, click "SQL Editor"
   - Copy ALL the contents from `database-schema.sql`
   - Paste it in the SQL Editor
   - Click "Run" button
   - You should see success messages

4. **Save Your Database URL:**
   - Click on "Dashboard"
   - Find your connection string (starts with `postgresql://`)
   - Copy it - you'll need this for Netlify
   - It looks like: `postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname`

## Part 2: Create Local Project (5 minutes)

Open your terminal:

```bash
# Create new React project with Vite
npm create vite@latest trading-tracker -- --template react

# Navigate into the folder
cd trading-tracker

# Install dependencies
npm install

# Install additional packages
npm install lucide-react @neondatabase/serverless
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p
```

## Part 3: Add All Project Files

Download and add these files to your project:

### In the ROOT folder (same level as package.json):
- `netlify.toml` ← NEW! Place in root
- `tailwind.config.js`
- `postcss.config.js`
- `.gitignore`
- Replace `package.json` with `package-with-neon.json` (rename it to package.json)

### In the `src/` folder:
- Replace `src/App.jsx` with `App-with-database.jsx` (rename it to App.jsx)
- Replace `src/index.css` with the provided index.css

### Create `netlify/functions/` folder:
Create a folder structure: `netlify/functions/` in your project root, then add:
- `get-capital.js`
- `get-entries.js`
- `add-entry.js`
- `update-capital.js`
- `delete-entry.js`

Your folder structure should look like:
```
trading-tracker/
├── netlify/
│   └── functions/
│       ├── get-capital.js
│       ├── get-entries.js
│       ├── add-entry.js
│       ├── update-capital.js
│       └── delete-entry.js
├── src/
│   ├── App.jsx
│   └── index.css
├── netlify.toml
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── .gitignore
```

### Run npm install again:
```bash
npm install
```

## Part 4: Test Locally (Optional but Recommended)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Test locally (will use your Neon database)
netlify dev
```

This will ask for your DATABASE_URL - paste your Neon connection string.

## Part 5: Push to GitHub

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Trading Tracker with Neon DB"

# Connect to your GitHub repo
git remote add origin https://github.com/YOUR-USERNAME/trading-tracker.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Part 6: Deploy on Netlify

1. **Go to Netlify:**
   - Visit https://app.netlify.com
   - Click "Add new site" → "Import an existing project"

2. **Connect GitHub:**
   - Click "GitHub"
   - Select your `trading-tracker` repository
   - Click "Deploy"

3. **IMPORTANT - Add Environment Variable:**
   - After deployment, go to **Site settings**
   - Click **Environment variables** (in the left sidebar)
   - Click **Add a variable**
   - Key: `DATABASE_URL`
   - Value: Your Neon connection string (the postgresql:// URL from Part 1)
   - Click **Save**

4. **Redeploy:**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**
   - Wait 2-3 minutes

5. **Done! 🎉**
   - Click on your site URL
   - Share it with Joey!

## Part 7: First Time Setup

When you first open the app:
1. Nick's position should show $600 invested, $0 portfolio
2. Add your first daily entry with the current portfolio value ($1,402.66 based on your earlier info)
3. Everything should calculate automatically!

## Testing Multi-Device Access

1. **On your phone:** Open the URL
2. **On Joey's phone:** Open the same URL
3. **Add an entry on one device** → Refresh the other → Should see the update!

## Troubleshooting

**"Failed to fetch capital" error:**
- Check that DATABASE_URL is set correctly in Netlify environment variables
- Make sure you ran the database-schema.sql in Neon
- Check Netlify Functions logs for detailed errors

**Functions not working:**
- Make sure the `netlify` folder is in the root of your project
- Check that all function files are `.js` not `.jsx`
- Verify netlify.toml is in the root

**Data not showing:**
- Click the refresh button (circular arrow) in the app
- Check browser console for errors (F12)
- Verify the database has the capital table with Nick/Joey rows

**Can't see updates on other device:**
- Click the refresh button
- The app doesn't auto-refresh, you need to manually refresh or reload

## Updating the App Later

```bash
# Make changes to files
git add .
git commit -m "Updated feature X"
git push

# Netlify will automatically redeploy!
```

## Common Database Operations

**View your data in Neon:**
1. Go to Neon dashboard
2. Click "SQL Editor"
3. Run: `SELECT * FROM entries ORDER BY entry_date DESC LIMIT 10;`

**Reset everything (careful!):**
```sql
DELETE FROM entries;
UPDATE capital SET total_invested = 600 WHERE person = 'nick';
UPDATE capital SET total_invested = 0 WHERE person = 'joey';
```

## Security Notes

- Your DATABASE_URL is secret - never share it or commit it to GitHub
- Only store it in Netlify environment variables
- Neon has built-in security and connection pooling

---

**Need help?** Let me know which step you're stuck on!
