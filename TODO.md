# Pascale's Wager — Developer Build Guide

> **Product in one sentence:** A mobile-first AI web app where users build a private council of personalized advisors, each with a distinct worldview and voice, and return over time for structured advice sessions, moral reflection, decisions, and life design.
>
> **Core promise:** "Don't just ask AI what to do. Build the advisors you wish you had."

---

## What Is Already Built

The current codebase is a working v0 of the paideia mentor concept. Before building anything new, know what exists:

| Feature | Status | Location |
|---|---|---|
| Supabase auth (email + password) | ✅ Done | `src/app/auth/` |
| User profiles + onboarding (5 seed questions) | ✅ Done | `src/app/onboarding/` |
| 4 mentor personas (Socrates, Aristotle, Epictetus, Pascale) | ✅ Done | `src/lib/mentors/personas.ts` |
| Mentor selection in onboarding + switchable from chat | ✅ Done | `src/app/chat/page.tsx` |
| Streaming chat with OpenAI GPT-4o | ✅ Done | `src/app/api/chat/route.ts` |
| Memory extraction (episodic / semantic / narrative) | ✅ Done | `src/lib/memory/extraction.ts` |
| Memory retrieval injected into system prompt | ✅ Done | `src/lib/memory/retrieval.ts` |
| Identity synthesis ("Mirror" page) | ✅ Done | `src/app/mirror/` |
| Daily Examen ("Rituals" page) | ✅ Done | `src/app/rituals/` |
| Homework assignment + tracking | ✅ Done | `src/app/homework/` |
| PWA manifest for iOS install | ✅ Done | `public/manifest.json` |
| Vercel deployment | ✅ Done | `vercel.json` |

The gap between the current app and the full PRD vision is everything below. Work through the milestones in order.

---

## Stack (do not change without discussion)

- **Frontend:** Next.js 16 on Vercel
- **Auth + DB:** Supabase (Postgres + RLS)
- **LLM:** OpenAI API (gpt-4o for sessions, gpt-4o-mini for extraction/summaries)
- **Deployment:** Vercel, auto-deploys from `main`
- **PWA:** Mobile-first responsive, iOS web app via manifest

---

## Milestone Checklist

### M0 — Vision & Design (DONE conceptually, needs design execution)

- [ ] Choose final app name. Options: **Paideia: Your Inner Council**, **The Council**, **Inner Council**, **The Grove**. Current working title: *Pascale's Wager*
- [ ] Lock visual direction — two candidate palettes:
  - *Classical Modern*: warm ivory, deep ink, Aegean blue, bronze accents, serif display + sans UI
  - *Dark Chapel*: charcoal, soft gold, oxide red, bone white — **recommended for session screens**
  - Recommendation: Classical Modern for onboarding/landing, Dark Chapel for chat sessions
- [ ] Create Figma prototype of core flows (onboarding → advisor → session → summary)
- [ ] Write landing page copy (see Section 9.1 below for approved copy direction)
- [ ] Define advisor archetype library v1 (see Section: Starter Advisors)

---

### M1 — App Foundation Gaps

The shell exists. These are the missing pieces:

- [x] **Landing page** — currently routes straight to login. Build a proper marketing/intro page at `/` that explains the product. Hero copy: *"Build your inner council. Personal AI advisors for decisions, reflection, ambition, and moral clarity."* CTAs: *Start your first session* / *Create an advisor*
- [x] **Home screen** (`/home`) — logged-in users currently go straight to `/chat`. Build a home screen with:
  - [x] "Continue last session" card
  - [x] "Ask the Council" CTA
  - [x] Your advisors (cards)
  - [ ] Recent sessions list (M3)
  - [ ] "Themes emerging" (later milestone)
  - [x] Create new advisor button
- [ ] **Apple touch icon** — add `apple-touch-icon.png` to `/public` and link in `layout.tsx`
- [ ] **Safe-area CSS** — verify iPhone notch/home bar padding works across all screens

---

### M2 — Advisor Creation System

This is the most important new feature. Currently the 4 mentors are hardcoded in `src/lib/mentors/personas.ts`. Users need to create their own.

#### Database changes needed

Run this SQL in Supabase:

```sql
create table if not exists public.advisors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  archetype text,
  role_description text,
  tone text,
  worldview text,
  system_prompt text not null,
  avatar_url text,
  helps_with text[] default '{}',
  guardrails text[] default '{}',
  challenge_level int default 5,
  warmth_level int default 5,
  directness_level int default 5,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.advisors enable row level security;
create policy "Users can read own advisors" on public.advisors for select using (auth.uid() = user_id);
create policy "Users can insert own advisors" on public.advisors for insert with check (auth.uid() = user_id);
create policy "Users can update own advisors" on public.advisors for update using (auth.uid() = user_id);
create policy "Users can delete own advisors" on public.advisors for delete using (auth.uid() = user_id);
```

#### Features to build

- [x] **Advisor list page** (`/advisors`) — cards showing name, archetype, "best for", last session date, Ask CTA
- [x] **Advisor detail page** (`/advisors/[id]`) — full profile: greeting, role, style, worldview, helps_with, guardrails, memory notes, recent sessions, Edit / Start session buttons
- [x] **Manual advisor creation form** — fields: name, archetype, role description, tone, worldview, helps_with (tags), guardrails (tags), challenge/warmth/directness sliders
- [x] **AI-powered advisor generation** (`/api/advisors/generate`) — user writes a free-text description like *"A Greek mentor for paideia, focused on character formation, courage, and self-command"* and the API generates a complete advisor profile + system prompt. Use structured JSON output from GPT-4o.
- [x] **Edit advisor** — same form as creation, pre-populated
- [x] **Delete advisor** — with confirmation dialog
- [x] **Seed default advisors on onboarding** — after completing onboarding, automatically create 3 starter advisors (see Starter Advisors section below)
- [ ] **Advisor system prompt template** — use this structure:

```
You are {{advisor_name}}, an advisor with the archetype: {{archetype}}.

Role: {{role_description}}
Worldview: {{worldview}}
Tone: {{tone}}

You help with: {{helps_with}}

Your guardrails: {{guardrails}}

Behavior:
- Give clear, memorable advice.
- Ask clarifying questions only when needed.
- Do not flatter emptily.
- Do not overclaim certainty.
- Distinguish comfort from clarity.
- Be warm but not servile.
- Help the user act in alignment with their stated values.
```

---

### M3 — Session System (Upgrade)

The current chat is a single continuous conversation. Sessions need to be discrete, typed, and persistent.

#### Database changes needed

```sql
create table if not exists public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  advisor_id uuid references public.advisors(id),
  mode text default 'freeform' check (mode in ('freeform','decision','reflection','conflict','ambition','council','journal')),
  title text,
  status text default 'active' check (status in ('active','ended')),
  summary text,
  main_dilemma text,
  emotional_tone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  ended_at timestamptz
);

alter table public.sessions enable row level security;
create policy "Users can manage own sessions" on public.sessions for all using (auth.uid() = user_id);
```

#### Features to build

- [ ] **Session entry modal** — when user starts a session, ask:
  - *What kind of session is this?* (mode chips): Free-form / Decision / Reflection / Conflict / Ambition / Council / Journal
  - Optionally: *What is weighing on you?* as a framing prompt
- [ ] **Session screen** (`/session/[id]`) — upgrade from current `/chat`:
  - Persistent advisor identity header (name, archetype)
  - Session title + mode badge
  - Streaming messages
  - Quick-action chips at bottom: *Go deeper* / *Be practical* / *Challenge me* / *Summarize* / *End session*
  - "Remember this" toggle on individual messages
  - End session button
- [ ] **Session history** (`/sessions`) — list of past sessions with title, date, advisor, summary, tags, follow-up status
  - Filters: by advisor, topic, unresolved, follow-up needed
- [ ] **Session detail** (`/sessions/[id]`) — full transcript + summary + advice + commitments + related sessions + "Continue conversation" button
- [ ] **Continue session** — when user returns to an advisor, option to continue last session or start new

---

### M4 — Session Summaries + Memory Upgrade

Currently memory extraction happens automatically after chat. This milestone adds user-controlled summarization and memory approval.

#### Database changes needed

```sql
create table if not exists public.session_summaries (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  summary text,
  key_points text[] default '{}',
  next_actions text[] default '{}',
  memories_to_save jsonb default '[]',
  follow_up_question text,
  created_at timestamptz default now()
);

alter table public.session_summaries enable row level security;
create policy "Users can manage own summaries" on public.session_summaries for all using (auth.uid() = user_id);
```

Also add these columns to the existing `memories` table:
```sql
alter table public.memories add column if not exists session_id uuid references public.sessions(id);
alter table public.memories add column if not exists advisor_id uuid references public.advisors(id);
alter table public.memories add column if not exists importance int default 5;
alter table public.memories add column if not exists memory_type text default 'episodic' 
  check (memory_type in ('user_value','recurring_pattern','preference','unresolved_decision','relationship_context','life_goal','advisor_note','commitment','episodic','semantic','narrative'));
alter table public.memories add column if not exists approved boolean default true;
```

#### Features to build

- [ ] **End session flow** — clicking "End session" triggers LLM call with structured output:
  ```json
  {
    "session_title": "string",
    "summary": "string",
    "main_dilemma": "string",
    "emotional_tone": "string",
    "next_actions": ["string"],
    "memories_to_save": [
      { "type": "user_value", "content": "string", "importance": 8 }
    ],
    "follow_up_question": "string"
  }
  ```
- [ ] **Memory review UI** — after session ends, show proposed memories with Accept / Edit / Reject per item. Only accepted memories are saved.
- [ ] **Memory management page** (`/memory` or within Mirror) — list all memories, editable, deletable
- [ ] **Memory retrieval upgrade** — current retrieval is type-based. Add importance-weighted query:
  ```sql
  select * from memories
  where user_id = $1
  and (advisor_id = $2 or advisor_id is null)
  order by importance desc, updated_at desc
  limit 10;
  ```

---

### M5 — Council Mode

The killer feature. Multiple advisors respond to one question, followed by a synthesis.

#### Database changes needed

```sql
create table if not exists public.council_sessions (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  advisor_ids uuid[] not null,
  question text not null,
  synthesis text,
  created_at timestamptz default now()
);

create table if not exists public.council_responses (
  id uuid default gen_random_uuid() primary key,
  council_session_id uuid references public.council_sessions(id) on delete cascade not null,
  advisor_id uuid references public.advisors(id) not null,
  response text not null,
  created_at timestamptz default now()
);

alter table public.council_sessions enable row level security;
alter table public.council_responses enable row level security;
create policy "Users can manage own council sessions" on public.council_sessions for all using (auth.uid() = user_id);
create policy "Users can manage own council responses" on public.council_responses for all using (auth.uid() = user_id);
```

#### Features to build

- [ ] **Council session entry** (`/council`) — user selects 2–5 advisors, writes one question
- [ ] **Parallel advisor calls** — call each advisor's API in parallel (use `Promise.all`)
- [ ] **Council response layout** — each advisor's response in a named card, side-scrollable on mobile
- [ ] **Synthesis generation** — after all advisors respond, generate synthesis:
  - Points of agreement
  - Productive tensions
  - Recommended action
  - What the user should decide for themselves
- [ ] **Council mode from home** — "Ask the Council" CTA on home screen

Example synthesis prompt:
```
The user asked: "{{question}}"

These advisors responded:
{{advisor_name_1}}: {{response_1}}
{{advisor_name_2}}: {{response_2}}
...

Generate a synthesis that identifies: (1) what the advisors agree on, (2) productive tensions between their perspectives, (3) a recommended focus or action, (4) what the user must ultimately decide for themselves.
```

---

### M6 — Polish, Safety, Beta

- [ ] **Crisis detection** — if a message contains language suggesting self-harm, imminent danger, or abuse, respond with crisis resources and do not continue as a normal session. Do NOT try to handle this with the advisor prompt — add a classification step before the LLM call.
- [ ] **Medical/legal/financial guardrails** — add to every system prompt: *"You are not a therapist, doctor, lawyer, or financial advisor. You may discuss these areas thoughtfully but must not diagnose, prescribe, advise on legal strategy, or manage financial decisions."*
- [ ] **Dependency/authority guardrails** — no advisor should ever say anything like "you must obey," "I have divine authority," or frame itself as a replacement for real relationships. Use: reflect, consider, discern — not command.
- [ ] **Memory deletion** — users can delete any memory. Deleted memory must be immediately excluded from context.
- [ ] **Data export** — one-click export of all sessions, memories, and advisor configs as JSON
- [ ] **Account deletion** — hard delete of all user data
- [ ] **Rate limiting** — per-user daily session limits to control OpenAI cost
- [ ] **Error handling** — graceful failures on all API routes, no blank screens
- [ ] **Mobile Safari QA** — test every screen on iPhone Safari. Pay attention to keyboard push-up on input fields and safe-area padding.
- [ ] **Feedback button** — simple modal to capture user feedback per session

---

## Starter Advisors (Seed on Onboarding)

Automatically create these 3 advisors for every new user after onboarding. They can be edited or deleted.

### The Mentor
```json
{
  "name": "The Mentor",
  "archetype": "Formative Guide",
  "role_description": "A wise, long-view advisor for character formation, ambition, self-mastery, and life direction.",
  "tone": "Warm, elevated, occasionally demanding.",
  "worldview": "Virtue ethics, classical paideia, secular humanism.",
  "helps_with": ["ambition", "character", "self-command", "life direction", "moral clarity"],
  "guardrails": ["No divine authority claims", "No dependency framing", "No mental health diagnosis"]
}
```

### The Strategist
```json
{
  "name": "The Strategist",
  "archetype": "Pragmatic Advisor",
  "role_description": "A clear-eyed, practical advisor for decisions, career, negotiation, and planning.",
  "tone": "Direct, concise, no-nonsense.",
  "worldview": "Pragmatism, second-order thinking, rational agency.",
  "helps_with": ["decisions", "career", "negotiation", "risk", "planning", "tradeoffs"],
  "guardrails": ["No empty validation", "No wishy-washy hedging", "Be specific"]
}
```

### The Witness
```json
{
  "name": "The Witness",
  "archetype": "Reflective Presence",
  "role_description": "A gentle, precise advisor for emotional processing, relationships, grief, and inner conflict.",
  "tone": "Quiet, attuned, non-directive.",
  "worldview": "Depth psychology, phenomenology, compassionate inquiry.",
  "helps_with": ["emotions", "relationships", "confusion", "grief", "inner conflict", "self-understanding"],
  "guardrails": ["Not a therapist", "No diagnosis", "No prescriptive advice unless asked"]
}
```

---

## Onboarding Flow (Target State)

The current onboarding captures seed identity questions. The target flow is:

1. Landing page
2. Sign up / magic link
3. **Intent selection** (chips): *I need advice* / *I'm making a decision* / *I want a personal mentor* / *I want a council* / *I want reflective journaling*
4. **Tone preference** (chips): Warm / Direct / Philosophical / Practical / Spiritual / Challenging
5. **Ethical orientation**: Secular / Spiritual / Religious / Philosophical / Custom
6. **Seed questions** (keep current 5)
7. Starter advisors auto-generated
8. Land on home with "Start your first session" CTA

Target: user completes onboarding and starts first session in under 3 minutes.

---

## LLM Architecture Notes

### Model routing
| Task | Model |
|---|---|
| Session chat | gpt-4o |
| Council synthesis | gpt-4o |
| Session summary + memory extraction | gpt-4o-mini |
| Advisor generation | gpt-4o |
| Crisis classification | rules-based first, then gpt-4o-mini |

### System prompt layer order (every session call)
1. App-level safety/bounds prompt
2. Advisor system prompt (from `advisors.system_prompt`)
3. User profile context (worldview, tone preferences)
4. Relevant memories (top 10 by importance)
5. Recent session transcript (last 20 messages)
6. Current user message

### App-level safety prompt (prepend to every call)
```
You are an AI advisor inside a private reflection app. You provide thoughtful, grounded, non-coercive guidance. You are not a therapist, doctor, lawyer, financial advisor, priest, or replacement for emergency support. You may discuss emotions, ethics, decisions, and life strategy, but you must avoid diagnosis, manipulation, dependency, or claims of special authority. If a user expresses thoughts of self-harm or imminent danger, gently refer them to emergency services or a crisis line and do not continue as a normal session.
```

---

## UX Principles — Do Not Violate

- **Not a SaaS dashboard.** No sidebars full of icons, no data tables, no enterprise chrome.
- **Not a chatbot box.** The session screen should feel like entering a different room — a study, a chapel, a private library.
- **Typography is the UI.** Lean on Georgia/serif for mentor voice, clean sans for UI chrome.
- **One question at a time.** Advisors never ask more than one question per response.
- **Memory without surveillance.** Every saved memory must be user-approved and user-deletable. Say this clearly in the UI.
- **Mobile-first always.** Design for iPhone Safari first. Desktop is secondary.
- **Ritual, not productivity.** The app should feel like something worth returning to, not a tool to clear a queue.

---

## Post-MVP Roadmap (do not build these in v1)

| Version | Feature |
|---|---|
| v1.1 | Embeddings + semantic memory retrieval, cross-session pattern detection, monthly reflection reports |
| v1.2 | Voice input/output, "confessional" walking mode |
| v1.3 | Personal Canon — user adds books, quotes, principles, past journals; advisors reason from the canon |
| v1.4 | Advisor template marketplace (Stoic elder, Jungian analyst, startup coach, future self, etc.) |
| v1.5 | Recurring rituals (Sunday review, morning counsel, pre-decision ritual, annual life audit) |
| v1.6 | Native iOS app (only after retention proven) |

---

## Key Risks to Watch

| Risk | Mitigation |
|---|---|
| Feels like a chatbot wrapper | Strong advisor identity, session summaries, memory continuity, Council mode, ritualized UX |
| Feels culty or fake-spiritual | User-controlled worldview, no divine authority, secular framing always available, emphasize reflection not obedience |
| Memory feels creepy | User approves every memory, editable list, data export/delete always visible |
| Advice is too generic | Advisor-specific prompts, session modes, memory retrieval, "Challenge me" controls |
| Users don't return | Follow-up questions, weekly rituals, "Unresolved decisions" list, advisor continuity |

---

## Success Metrics

**Activation**
- % completing onboarding
- % starting first session within 10 min of signup
- Time to first meaningful advisor response

**Engagement**
- Sessions per user per week
- Repeat sessions with same advisor
- Council mode usage rate
- Memory acceptance rate

**Retention**
- D7 and D30 return rate
- Users with 3+ sessions in first week
- Users who review old sessions

**Quality**
- "This helped me decide" rate (thumbs up)
- "This felt like the advisor" rating
- Summary usefulness rating

---

*Last updated: May 2026. Build in milestone order. The smallest viable loop is: "I created an advisor. I asked something meaningful. It remembered enough next time to feel real." Everything else is elaboration.*
