# Strata — full app (accounts + database)

A Next.js app with real sign-in (email magic link) and a Supabase database,
so each person's entries follow them across devices.

## 1. Create a Supabase project (free)
1. Go to https://supabase.com and create a new project
2. Once it's ready, open **SQL Editor** → New query
3. Paste the contents of `supabase/schema.sql` and run it — this creates the
   tables and locks each row to its owner (row-level security), so no user
   can ever see another user's entries
4. Go to **Project Settings → API** and copy the "Project URL" and the
   "anon public" key

## 2. Configure the appPaste your Supabase URL and anon key into `.env.local`.

## 3. Run it locallyOpen http://localhost:3000 — enter your email, click the link Supabase
emails you, and you're in.

## 4. Deploy it for real
1. Push this folder to a GitHub repo
2. Go to https://vercel.com/new and import that repo
3. In Vercel's project settings, add the same two environment variables
   from your `.env.local`
4. Deploy — you get a live URL (e.g. `strata.vercel.app`)
5. Optional: connect a custom domain in Vercel's Domains tab

## What's included
- Email magic-link sign-in (no passwords to manage)
- Core sample (journal timeline), check-ins, breathing exercise,
  vent-and-reframe, and values compass — all synced to the database
- Row-level security so people's reflections are private by default

## Things to think about before sharing this widely
- You'd be storing people's personal reflections — worth a short privacy
  note in the app about what's stored and that it's not a substitute for
  professional support
- Supabase's free tier has usage limits; check their pricing page before
  a large launch
- No password reset flow needed (magic link handles that), but consider
  adding a "delete my account and data" option if this becomes a real product
