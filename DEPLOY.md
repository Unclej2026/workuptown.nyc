# Work Uptown — Deployment Guide
## Cloudflare Pages + Supabase

Total time: ~45 minutes. No coding required beyond copy/paste.

---

## STEP 1 — Set up Supabase (your database)

1. Go to https://supabase.com and click **Start your project**
2. Sign up with GitHub (free)
3. Click **New project**
   - Name: `work-uptown`
   - Database password: save this somewhere safe
   - Region: **US East (N. Virginia)** — closest to NYC
4. Wait ~2 minutes for it to spin up
5. In the left sidebar click **SQL Editor**
6. Click **New query**
7. Open the file `schema.sql` from this folder, copy everything, paste it in, click **Run**
   - You should see "Success. No rows returned."
8. In the left sidebar click **Settings → API**
9. Copy these two values — you'll need them shortly:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (long string under "Project API keys")

---

## STEP 2 — Set up GitHub (where your code lives)

1. Go to https://github.com and sign up if you don't have an account
2. Click **+** → **New repository**
   - Name: `work-uptown`
   - Set to **Public**
   - Click **Create repository**
3. On your computer, install Git if you don't have it: https://git-scm.com
4. Open Terminal (Mac) or Command Prompt (Windows)
5. Navigate to this project folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/work-uptown.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## STEP 3 — Deploy to Cloudflare Pages

1. Go to https://pages.cloudflare.com and sign up (free)
2. Click **Create a project** → **Connect to Git**
3. Connect your GitHub account and select the `work-uptown` repository
4. Configure the build:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `18`
5. Click **Environment variables** and add:
   - `VITE_SUPABASE_URL` → paste your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` → paste your Supabase anon public key
   - `VITE_ADMIN_PASSWORD` → choose a password for your admin panel
6. Click **Save and Deploy**
7. Wait ~3 minutes. Cloudflare will give you a URL like `work-uptown.pages.dev`

---

## STEP 4 — Test it

1. Open your new URL
2. Register yourself for an event
3. Check the Directory tab — you should appear
4. Go to Admin, enter your password, confirm your registration shows up
5. Click Export CSV to test the download

---

## STEP 5 — Custom domain (optional, ~10 mins)

If you bought `workuptown.com`:
1. In Cloudflare Pages → your project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter `workuptown.com`
4. Follow the DNS instructions (if your domain is on Namecheap/GoDaddy, you'll point nameservers to Cloudflare)

---

## Updating event details

To change dates, venue names, or add new months, open `src/App.jsx` and find this section near the top:

```js
const EVENTS = {
  '2025-06': { month: 'June 2025', date: 'Tuesday, June 17', time: '10AM – 2PM', venue: 'TBD', ... },
  ...
}
```

Edit the values, save, push to GitHub (`git add . && git commit -m "Update event" && git push`), and Cloudflare will automatically redeploy in ~2 minutes.

---

## Admin panel

Go to `yoursite.com` → Admin tab → enter your `VITE_ADMIN_PASSWORD`

You'll see:
- Full name + email of every registrant
- Profession, neighborhood, how they heard about you
- Who checked the membership interest box
- One-click CSV export for every month

---

## Need help?

- Supabase docs: https://supabase.com/docs
- Cloudflare Pages docs: https://developers.cloudflare.com/pages
- Vite docs: https://vitejs.dev
