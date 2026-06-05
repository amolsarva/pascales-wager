# Pascale's Wager

Pascale's Wager is a private AI council for reflective decision-making. Users bring real questions to distinct advisor voices, save conversations, extract memories, review identity themes, complete daily rituals, and revisit the record over time.

## Product State

- Authenticated Next.js app with Supabase-backed user records.
- Single-advisor chat with persisted messages and memory extraction.
- Multi-advisor Council room with persisted threads, advisor responses, and syntheses.
- Home dashboard with recent threads, themes, next action, and record counts.
- Mirror, Timeline, rituals, memory review, onboarding, and advisor surfaces.

The current PRD and roadmap live in [docs/project-brief.md](docs/project-brief.md). The compact engineering task tracker lives in [tasks.md](tasks.md).

## Development

Install dependencies and start the local app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

Apply the Supabase schema in [supabase/schema.sql](supabase/schema.sql) before testing authenticated persistence.

## Deployment

The production app is deployed on Vercel:

[https://pascales-wager.vercel.app](https://pascales-wager.vercel.app)
