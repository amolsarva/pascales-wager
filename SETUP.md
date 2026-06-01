# The Council — Setup Guide

## 1. Push to GitHub

The repo is already initialized with a commit and the remote is set.
Run this once from Terminal to push:

```bash
cd ~/Library/Application\ Support/Claude/local-agent-mode-sessions/62576868-4122-49d4-8aa2-b4ef768a9b6a/d7aceaee-3d92-47d4-a5d9-f8084a05ad54/local_3357294d-dee7-4c71-b84b-d48d247e8ba8/outputs/pascales-wager
git push -u origin main
```

Repo: https://github.com/amolsarva/pascales-wager

---

## 2. Supabase Setup

1. Go to https://supabase.com and create a new project
2. In the SQL Editor, run the contents of `supabase/schema.sql`
3. Copy your project URL and anon key from Project Settings → API
4. In Authentication → URL Configuration:
   - Set **Site URL** to `https://pascales-wager.vercel.app`
   - Add `https://pascales-wager.vercel.app/auth/callback?next=/council` to **Redirect URLs**
   - Add `http://localhost:3000/auth/callback?next=/council` to **Redirect URLs** for local development

Supabase rejects confirmation redirects that are not on this allow-list and falls back to the Site URL. The signup form sends the current runtime origin to `/auth/callback?next=/council`, so production, preview, and local environments can return to the app that initiated signup when their callback URLs are allowed.

---

## 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
OPENAI_API_KEY=sk-...
```

---

## 4. Deploy to Vercel

### Option A — CLI (fastest)
```bash
npm i -g vercel
vercel
```

### Option B — Dashboard
1. Go to https://vercel.com/new
2. Import `amolsarva/pascales-wager` from GitHub
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
4. Deploy

---

## 5. Install as iOS Web App

1. Open your Vercel URL in Safari on iPhone
2. Tap Share → "Add to Home Screen"
3. The Council is now a native-feeling app on your home screen

---

## 6. Run Locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## Architecture

```
/ — Landing page
/auth/login — Sign in
/auth/signup — Create account
/ — Redirects directly into the prototype room
/council — Persistent browser-local developer room with several advisor responses and synthesis
/api/council — Generates parallel advisor responses and synthesis from the recent browser-local transcript
/chat — Single-advisor streaming conversation
/mirror — "What Pascal Thinks" — identity synthesis page
/rituals — Daily Examen prompts
```

### Memory System
- **Episodic**: specific events ("went to Tokyo", "had a fight")
- **Semantic**: stable values ("avoids conflict", "values honesty")  
- **Narrative**: interpretive ("oscillates between intensity and isolation")

Prototype Council rounds are saved in the current browser and carried into follow-ups.
Single-advisor chats continue to use gpt-4o-mini memory extraction.
Every advisor prompt is built from retrieved memories + identity summary.

### Model Routing
| Task | Model |
|------|-------|
| Live chat | gpt-4o |
| Memory extraction | gpt-4o-mini |
| Identity synthesis | gpt-4o |
