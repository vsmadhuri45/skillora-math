# Skillora Math Calculator — Deployment Guide

## What's in this folder?

```
skillora-calc/
├── index.html          ← App entry point
├── package.json        ← Dependencies
├── vite.config.js      ← Build config
├── vercel.json         ← Vercel routing config
├── public/
│   └── favicon.svg     ← Site icon
└── src/
    ├── main.jsx        ← React bootstrap
    ├── index.css       ← Global styles
    └── App.jsx         ← The full 58-topic calculator
```

---

## STEP 1 — Install Node.js (one-time setup)

Download from: https://nodejs.org  
Install the **LTS version** (recommended). This gives you `npm`.

Verify by opening your terminal and typing:
```
node -v
npm -v
```

---

## STEP 2 — Create a GitHub account & repository (free)

1. Go to https://github.com and sign up
2. Click **"New repository"**
3. Name it: `skillora-calc`
4. Keep it **Public**, click **Create repository**
5. Follow GitHub's instructions to push this folder to the repo

Or using terminal from inside this folder:
```
git init
git add .
git commit -m "Initial commit — Skillora Math Calculator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/skillora-calc.git
git push -u origin main
```

---

## STEP 3 — Deploy on Vercel (free)

1. Go to https://vercel.com and sign up with your GitHub account
2. Click **"Add New Project"**
3. Select your `skillora-calc` repository
4. Vercel auto-detects it as a Vite project. Click **Deploy**
5. In ~60 seconds, you'll get a live URL like `skillora-calc.vercel.app`

---

## STEP 4 — Connect your domain (skillora.life)

1. In Vercel dashboard → your project → **Settings → Domains**
2. Type in `skillora.life` and click **Add**
3. Vercel gives you DNS records (usually two: an `A` record and a `CNAME`)
4. Log in to wherever you bought your domain (GoDaddy, Namecheap, etc.)
5. Find **DNS Settings** and add those records
6. Wait 5–30 minutes for DNS to propagate
7. Done! `skillora.life` is live ✅

---

## Updating in the future

Whenever you want to update the calculator:
1. Edit `src/App.jsx`
2. Run `git add . && git commit -m "Update" && git push`
3. Vercel auto-deploys in ~30 seconds

**You never need to touch your laptop's files permanently — everything lives on GitHub.**

---

## Testing locally (optional)

```
npm install
npm run dev
```
Opens at http://localhost:5173

---

## Adding new pages later (courses, etc.)

When you're ready to add course pages, you can either:
- **Add React Router** for multiple pages in the same project
- **Use Vercel's CMS** features
- **Keep the calculator as a subdirectory** (`skillora.life/calculator`) and build a landing page at the root

Vercel handles all of this without changing your setup.

---

## Setting up the Registration Database (Supabase)

### Step 1 — Create a free Supabase project
1. Go to https://supabase.com → Sign up free
2. Click **New Project** → name it `skillora`
3. Set a database password → click **Create Project**
4. Wait ~1 minute for it to spin up

### Step 2 — Create the registrations table
1. In Supabase → click **SQL Editor** (left sidebar)
2. Paste and run this SQL:

```sql
create table registrations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text not null,
  class_level text not null,
  registered_at timestamptz default now()
);

-- Allow anyone to insert (for public registration form)
alter table registrations enable row level security;
create policy "Anyone can register" on registrations
  for insert with check (true);

-- Only you can view registrations (via Supabase dashboard)
create policy "Service role can view" on registrations
  for select using (false);
```

### Step 3 — Get your API keys
1. In Supabase → **Project Settings** → **API**
2. Copy **Project URL** and **anon public** key

### Step 4 — Add keys to the app
Open `src/App.jsx` and replace at the top:
```js
const SUPABASE_URL  = 'YOUR_SUPABASE_URL';    // ← paste Project URL
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY'; // ← paste anon key
```

### Step 5 — View your registrations
Go to **Supabase → Table Editor → registrations**
You'll see every person who signed up, with their name, email, phone, and class.
You can also export as CSV anytime!

