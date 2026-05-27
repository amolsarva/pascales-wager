# Pascal — Setup Guide

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
3. Pascal is now a native-feeling app on your home screen

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
/onboarding — Seed identity questionnaire (5 questions)
/chat — Main conversation with Pascal (streaming)
/mirror — "What Pascal Thinks" — identity synthesis page
/rituals — Daily Examen prompts
```

### Memory System
- **Episodic**: specific events ("went to Tokyo", "had a fight")
- **Semantic**: stable values ("avoids conflict", "values honesty")  
- **Narrative**: interpretive ("oscillates between intensity and isolation")

After every conversation, gpt-4o-mini extracts memories.
Every N conversations, gpt-4o synthesizes an identity portrait.
The system prompt for every chat is built from retrieved memories + identity summary.

### Model Routing
| Task | Model |
|------|-------|
| Live chat | gpt-4o |
| Memory extraction | gpt-4o-mini |
| Identity synthesis | gpt-4o |
