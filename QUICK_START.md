# Trading Tracker - Quick Start

## What You Have

A full-stack trading tracker app with:
- ✅ React frontend (clean, mobile-friendly UI)
- ✅ Neon PostgreSQL database (multi-device access)
- ✅ Netlify Functions (serverless API)
- ✅ Auto-calculations for ownership percentages
- ✅ Full trade history with details

## Files You Need

### 📁 Database
- `database-schema.sql` - Run this in Neon SQL Editor

### 📁 Backend (Netlify Functions)
Create folder: `netlify/functions/`
- `get-capital.js`
- `get-entries.js`
- `add-entry.js`
- `update-capital.js`
- `delete-entry.js`

### 📁 Frontend (React App)
- `src/App.jsx` → Use `App-with-database.jsx` (rename it)
- `src/index.css`

### 📁 Config Files (Root)
- `package.json` → Use `package-with-neon.json` (rename it)
- `netlify.toml` ← IMPORTANT!
- `tailwind.config.js`
- `postcss.config.js`
- `.gitignore`

## Quick Setup Steps

### 1. Create Neon Database (5 min)
```
1. Go to neon.tech
2. Create new project: "trading-tracker"
3. Run database-schema.sql in SQL Editor
4. Copy your DATABASE_URL (starts with postgresql://)
```

### 2. Create Local Project (5 min)
```bash
npm create vite@latest trading-tracker -- --template react
cd trading-tracker
npm install lucide-react @neondatabase/serverless
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Add All Files (5 min)
- Copy all the files to the right locations
- Make sure netlify/functions folder exists
- Run `npm install` again

### 4. Push to GitHub (2 min)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

### 5. Deploy on Netlify (5 min)
```
1. Go to netlify.com
2. Import from GitHub
3. Add environment variable: DATABASE_URL = (your Neon connection string)
4. Trigger deploy
5. Done!
```

## Testing It Works

1. Open the deployed URL
2. You should see:
   - Nick: $600 invested, 100% ownership
   - Joey: $0 invested, 0% ownership
   - Portfolio Value: $0
3. Add first entry with portfolio value $1,402.66
4. Should calculate Nick's profit: $802.66

## Share with Joey

Just send him the Netlify URL! Both of you can:
- Add daily trades
- Add capital when investing more
- See live updates (just hit refresh)

## Folder Structure

```
trading-tracker/
├── netlify/
│   └── functions/           ← All 5 .js files here
│       ├── get-capital.js
│       ├── get-entries.js
│       ├── add-entry.js
│       ├── update-capital.js
│       └── delete-entry.js
├── src/
│   ├── App.jsx              ← The database version
│   ├── index.css
│   └── main.jsx             ← Auto-created by Vite
├── public/                  ← Auto-created by Vite
├── index.html               ← Auto-created by Vite
├── netlify.toml             ← IMPORTANT CONFIG
├── package.json             ← With Neon dependency
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js           ← Auto-created by Vite
└── .gitignore
```

## Need Help?

**Read the full guide:**
- `DATABASE_DEPLOYMENT_GUIDE.md` has detailed step-by-step instructions

**Stuck on a specific part?**
Let me know which step you're on and what error you're seeing!
