# Pascal — Developer AI Guide

> For AI agents working on this codebase. Read this before making any changes.

---

## What this project is

**Pascal** is a persistent AI paideia companion — a reflective mentor that builds a three-layer memory of the user over time. It is a Next.js 15 web app deployable on Vercel, installable as an iOS PWA.

Repo: `https://github.com/amolsarva/pascales-wager`
Owner: a@sarva.co

---

## Local development

```bash
cd /Users/MrAnonymous/Documents/root/pascales-wager
npm install
npm run dev        # http://localhost:3000
```

`.env.local` is in the project root. **Never commit it.** It contains:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

---

## Credentials

All keys are at `/Users/MrAnonymous/Documents/root/utils and keys/api_keys.md`.

**Never commit, paste into tickets, or send keys through chat or email.**

- **OpenAI key**: Use the "for Claude / repo2audiobook" key (`sk-proj-D_Pq…`) for all inference
- **Supabase project**: `yxmnqlxdxrtfnpcvvoww` (shared with knotable-props-mailer — Pascal tables are prefixed by context only, no schema-level separation yet)
- **Anon key**: in `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY` (also in `knotable-props-mailer/.env.local`)
- **Service role key**: in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY` — only use in server-side code, never commit

---

## Architecture

```
/                       Landing
/auth/login             Email/password sign in
/auth/signup            Create account
/auth/callback          OAuth code exchange → /onboarding
/onboarding             5-question seed identity questionnaire
/chat                   Main conversation (streaming SSE, conversation history sidebar)
/mirror                 Identity synthesis — what Pascal thinks of you
/rituals                Daily Examen — one reflective question per day
/timeline               Timeline of Self — all memories/identities/rituals in order
```

### Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS variables |
| Auth + DB | Supabase (postgres, RLS) |
| AI | OpenAI API (streaming) |
| Deploy | Vercel |
| PWA | Web manifest + iOS meta tags |

---

## Memory system

After each conversation turn, `gpt-4o-mini` extracts memories. Every N conversations, `gpt-4o` synthesizes an identity portrait.

**Three memory types:**

| Type | Meaning | Example |
|---|---|---|
| `episodic` | Specific events | "went to Tokyo for two weeks" |
| `semantic` | Stable values/traits | "avoids conflict even at personal cost" |
| `narrative` | Interpretive framing | "oscillates between intensity and isolation" |

### DB tables (in Supabase project `yxmnqlxdxrtfnpcvvoww`)

- `public.users` — extends `auth.users`, stores `seed_identity` (JSONB), `onboarding_complete`
- `public.messages` — all chat messages with `conversation_id`
- `public.memories` — extracted memories with type + confidence
- `public.identity_summaries` — synthesis snapshots with traits/themes/contradictions
- `public.rituals` — daily examen prompts + responses

All tables have **Row Level Security** — users can only read/write their own rows.

---

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/chat` | POST | Streaming chat: authenticates, builds memory-injected system prompt, streams gpt-4o, saves messages, async memory extraction |
| `/api/synthesis` | GET | Returns latest identity summary + all memories + all summaries |
| `/api/synthesis` | POST | Triggers gpt-4o identity synthesis, saves to DB |
| `/api/onboarding` | POST | Saves seed identity JSON to users table |
| `/api/rituals` | GET | Returns user's last 30 rituals |
| `/api/rituals` | POST | Saves a ritual prompt + response |

---

## Model routing

| Task | Model | Location |
|---|---|---|
| Live chat | `gpt-4o` | `src/app/api/chat/route.ts` |
| Memory extraction | `gpt-4o-mini` | `src/lib/memory/extraction.ts` |
| Identity synthesis | `gpt-4o` | `src/lib/memory/extraction.ts` |

---

## Design system

Dark serif aesthetic. All colors via CSS variables in `src/app/globals.css`:

```css
--background: #0a0a0f   /* near-black */
--foreground: #e8e6df   /* warm white */
--muted: #6b6860        /* muted gray */
--muted-foreground: #a09e98
--border: #1e1e28       /* dark border */
--accent: #c4a882       /* warm gold */
--accent-dim: #8a7560
--surface: #111118
--surface-raised: #16161f
```

Body font: Georgia (serif). UI labels: system sans-serif via `.sans` class.

---

## Key patterns

**Supabase client selection:**
- Browser components: `createClient()` from `@/lib/supabase/client`
- Server (API routes, middleware): `createServerClient()` from `@/lib/supabase/server`

**Streaming chat:** uses native `ReadableStream` with `TextEncoder`, sends `data: {...}\n\n` events, terminates with `data: [DONE]\n\n`.

**Ritual prefill:** `/chat?ritual=...&response=...` — chat page reads search params and pre-fills textarea on mount.

**Conversation history:** sidebar in chat page loads distinct `conversation_id` groups from `messages` table.

**Timeline:** `/timeline` pulls from `/api/synthesis` (memories + allSummaries) and `/api/rituals`, merges and sorts by date.

---

## Deployment

**Vercel project**: `amolsarva/pascales-wager` on GitHub  
Required env vars in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

Service role key is intentionally **not** in Vercel (server routes use anon key + user JWT for RLS).

---

## What NOT to do

- Never add `SUPABASE_SERVICE_ROLE_KEY` to Vercel env vars — it bypasses RLS
- Never commit `.env.local`
- Don't create a second Supabase project (free tier is limited to 2; this one is shared)
- Don't modify the `handle_new_user()` trigger without reading the schema first
- Don't change model routing without updating this guide
