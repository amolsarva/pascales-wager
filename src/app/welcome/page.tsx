'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'collab-setup-progress'

interface Step {
  id: string
  title: string
  who: 'self' | 'amol'
  body: React.ReactNode
  verify?: string
}

const STEPS: Step[] = [
  {
    id: 'github-access',
    title: 'Get GitHub access',
    who: 'amol',
    body: (
      <div>
        <p className="sans text-sm mb-3" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
          Ask Amol to add you as a collaborator on the GitHub repo.
        </p>
        <div className="px-4 py-3 mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--foreground)' }}>
          github.com/amolsarva/pascales-wager
        </div>
        <p className="sans text-xs" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          You'll receive an email invite. Accept it to get read/write access to the repo.
        </p>
      </div>
    ),
    verify: 'You can see the repo at github.com/amolsarva/pascales-wager',
  },
  {
    id: 'prerequisites',
    title: 'Install prerequisites',
    who: 'self',
    body: (
      <div>
        <p className="sans text-sm mb-4" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
          You need Node.js 18 or later, Git, and a code editor.
        </p>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Node.js 18+', url: 'nodejs.org/en/download', cmd: 'node --version' },
            { label: 'Git', url: 'git-scm.com', cmd: 'git --version' },
            { label: 'VS Code (recommended)', url: 'code.visualstudio.com', cmd: null },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }}>
              <span className="sans text-sm" style={{ color: 'var(--foreground)' }}>{item.label}</span>
              {item.cmd && (
                <code className="sans text-xs px-2 py-1" style={{ background: 'var(--surface-raised)', color: 'var(--muted-foreground)', borderRadius: '2px' }}>
                  {item.cmd}
                </code>
              )}
            </div>
          ))}
        </div>
      </div>
    ),
    verify: 'node --version returns v18 or higher',
  },
  {
    id: 'clone',
    title: 'Clone the repo',
    who: 'self',
    body: (
      <div>
        <p className="sans text-sm mb-3" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
          Clone the repository and move into it.
        </p>
        <pre
          className="sans text-xs px-4 py-4 overflow-x-auto"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--foreground)', lineHeight: 1.8 }}
        >{`git clone https://github.com/amolsarva/pascales-wager.git
cd pascales-wager`}</pre>
      </div>
    ),
    verify: 'You can see the files with ls',
  },
  {
    id: 'install',
    title: 'Install dependencies',
    who: 'self',
    body: (
      <div>
        <p className="sans text-sm mb-3" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
          Install all npm packages. This takes 30–60 seconds.
        </p>
        <pre
          className="sans text-xs px-4 py-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--foreground)' }}
        >{`npm install`}</pre>
      </div>
    ),
    verify: 'A node_modules folder exists in the project root',
  },
  {
    id: 'env',
    title: 'Set up environment variables',
    who: 'amol',
    body: (
      <div>
        <p className="sans text-sm mb-3" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
          Create a file called <code style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: '13px' }}>.env.local</code> in the project root. Ask Amol for the contents — it has three keys:
        </p>
        <pre
          className="sans text-xs px-4 py-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--foreground)', lineHeight: 1.8 }}
        >{`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...`}</pre>
        <p className="sans text-xs mt-3" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          This file is in .gitignore — never commit it. The Supabase keys are public (they show in the browser), but the OpenAI key is secret.
        </p>
      </div>
    ),
    verify: '.env.local exists and has all 3 variables filled in',
  },
  {
    id: 'dev',
    title: 'Run the dev server',
    who: 'self',
    body: (
      <div>
        <p className="sans text-sm mb-3" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
          Start the local development server.
        </p>
        <pre
          className="sans text-xs px-4 py-4 mb-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--foreground)' }}
        >{`npm run dev`}</pre>
        <p className="sans text-xs" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          Open{' '}
          <a href="http://localhost:3000" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
            localhost:3000
          </a>
          {' '}in your browser. You should see the Pascale&apos;s Wager landing page.
        </p>
      </div>
    ),
    verify: 'localhost:3000 loads the landing page without errors',
  },
  {
    id: 'supabase',
    title: 'Get Supabase access',
    who: 'amol',
    body: (
      <div>
        <p className="sans text-sm mb-3" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
          Ask Amol to invite you to the Supabase project. You&apos;ll need this to inspect the database, run SQL migrations, and debug auth issues.
        </p>
        <div className="flex flex-col gap-2">
          {[
            'Go to supabase.com → create a free account with your email',
            'Tell Amol your email address',
            'Accept the project invite email from Supabase',
            'You should now see "pascales-wager" in your Supabase dashboard',
          ].map((step, i) => (
            <div key={i} className="flex gap-3 px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }}>
              <span className="sans text-xs flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)', opacity: 0.7 }}>{i + 1}.</span>
              <p className="sans text-sm" style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{step}</p>
            </div>
          ))}
        </div>
        <p className="sans text-xs mt-3" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--foreground)' }}>Supabase project URL:</strong>{' '}
          <code style={{ fontFamily: 'monospace', fontSize: '12px' }}>tnwrqlnrgqydeyumcanb.supabase.co</code>
        </p>
      </div>
    ),
    verify: 'You can see the database tables at supabase.com/dashboard',
  },
  {
    id: 'supabase-sql',
    title: 'Run pending SQL migrations',
    who: 'self',
    body: (
      <div>
        <p className="sans text-sm mb-3" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
          Some database tables need to be created manually. In the Supabase dashboard, go to <strong style={{ color: 'var(--foreground)' }}>SQL Editor</strong> and run these in order:
        </p>
        <div className="flex flex-col gap-3">
          {[
            {
              label: 'Sessions table (M3)',
              sql: `create table if not exists public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  advisor_id uuid references public.advisors(id),
  mode text default 'freeform',
  title text,
  status text default 'active',
  summary text,
  main_dilemma text,
  emotional_tone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  ended_at timestamptz
);
alter table public.sessions enable row level security;
create policy "Users can manage own sessions" on public.sessions for all using (auth.uid() = user_id);`,
            },
            {
              label: 'Session summaries table (M4)',
              sql: `create table if not exists public.session_summaries (
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
create policy "Users can manage own summaries" on public.session_summaries for all using (auth.uid() = user_id);`,
            },
            {
              label: 'Advisors table (M2) — if not already done',
              sql: `create table if not exists public.advisors (
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
create policy "Users can delete own advisors" on public.advisors for delete using (auth.uid() = user_id);`,
            },
          ].map(item => (
            <div key={item.label}>
              <p className="sans text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>{item.label}</p>
              <pre
                className="text-xs px-4 py-3 overflow-x-auto"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--muted-foreground)', lineHeight: 1.7, fontFamily: 'monospace' }}
              >{item.sql}</pre>
            </div>
          ))}
        </div>
      </div>
    ),
    verify: 'sessions, session_summaries, advisors tables appear in Supabase Table Editor',
  },
  {
    id: 'vercel',
    title: 'Get Vercel access (optional)',
    who: 'amol',
    body: (
      <div>
        <p className="sans text-sm mb-3" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
          Needed only if you want to deploy or check production logs. Ask Amol to add you to the Vercel team.
        </p>
        <div className="flex flex-col gap-2">
          {[
            'Create an account at vercel.com',
            'Tell Amol your Vercel email',
            'Accept the team invite',
            'You can see the pascales-wager project and its deployments',
          ].map((step, i) => (
            <div key={i} className="flex gap-3 px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }}>
              <span className="sans text-xs flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)', opacity: 0.7 }}>{i + 1}.</span>
              <p className="sans text-sm" style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{step}</p>
            </div>
          ))}
        </div>
        <p className="sans text-xs mt-3" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          Every push to <code style={{ fontFamily: 'monospace', fontSize: '12px' }}>main</code> deploys automatically. Feature branches get preview URLs.
        </p>
      </div>
    ),
    verify: 'You can see the pascales-wager project on vercel.com',
  },
  {
    id: 'workflow',
    title: 'Understand the workflow',
    who: 'self',
    body: (
      <div className="flex flex-col gap-4">
        <div>
          <p className="sans text-xs tracking-wide uppercase mb-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>Stack</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Frontend', 'Next.js 16 (App Router)'],
              ['Auth + DB', 'Supabase (Postgres + RLS)'],
              ['LLM', 'OpenAI GPT-4o'],
              ['Deploy', 'Vercel (auto-deploys from main)'],
            ].map(([k, v]) => (
              <div key={k} className="px-3 py-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }}>
                <p className="sans text-xs mb-0.5" style={{ color: 'var(--muted)' }}>{k}</p>
                <p className="sans text-sm" style={{ color: 'var(--foreground)' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="sans text-xs tracking-wide uppercase mb-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>Git rules</p>
          <div className="flex flex-col gap-1">
            {[
              'Never commit directly to main',
              'Create a feature branch: git checkout -b your-name/feature-name',
              'Open a PR → main auto-deploys when merged',
              'The AI agent uses branches prefixed with claude/',
            ].map((rule, i) => (
              <p key={i} className="sans text-xs pl-3" style={{ color: 'var(--muted-foreground)', borderLeft: '1px solid var(--border)', lineHeight: 1.7 }}>{rule}</p>
            ))}
          </div>
        </div>
        <div>
          <p className="sans text-xs tracking-wide uppercase mb-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>Key files to read</p>
          <div className="flex flex-col gap-1">
            {[
              ['TODO.md', 'Feature roadmap with milestones and SQL migrations'],
              ['CLAUDE.md → AGENTS.md', 'Important: Next.js version has breaking changes — read before writing code'],
              ['src/lib/mentors/personas.ts', 'The 4 hardcoded mentor personas'],
              ['src/lib/memory/', 'Memory extraction and retrieval system'],
            ].map(([file, desc]) => (
              <div key={file} className="flex flex-col px-3 py-2" style={{ borderLeft: '1px solid var(--border)' }}>
                <code className="text-xs mb-0.5" style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{file}</code>
                <p className="sans text-xs" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    verify: 'You understand the stack and can create a feature branch',
  },
]

export default function WelcomePage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<string | null>(STEPS[0].id)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try { setChecked(JSON.parse(stored)) } catch {}
    }
    setMounted(true)
  }, [])

  const toggle = (id: string) => {
    const next = { ...checked, [id]: !checked[id] }
    setChecked(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const completedCount = STEPS.filter(s => checked[s.id]).length
  const allDone = completedCount === STEPS.length

  if (!mounted) return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="sans text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--accent)', opacity: 0.6 }}>
          Pascale&apos;s Wager — Collaborator Setup
        </p>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-12 fade-in">
          <h1 className="text-4xl font-normal mb-4 tracking-tight" style={{ color: 'var(--foreground)' }}>
            Welcome, collaborator.
          </h1>
          <p className="text-base" style={{ color: 'var(--muted-foreground)', lineHeight: 1.8, maxWidth: '480px' }}>
            This page walks you through getting set up to work on Pascale&apos;s Wager.
            Check off each step as you go — your progress is saved locally.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <span className="sans text-xs" style={{ color: 'var(--muted)' }}>
              {completedCount} of {STEPS.length} steps complete
            </span>
            {completedCount > 0 && (
              <button
                onClick={() => {
                  setChecked({})
                  localStorage.removeItem(STORAGE_KEY)
                }}
                className="sans text-xs"
                style={{ color: 'var(--muted)', opacity: 0.5, textDecoration: 'underline' }}
              >
                Reset
              </button>
            )}
          </div>
          <div className="h-0.5 w-full" style={{ background: 'var(--border)' }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${(completedCount / STEPS.length) * 100}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>

        {/* Completion banner */}
        {allDone && (
          <div className="mb-8 px-5 py-4 fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderLeft: '3px solid var(--accent)', borderRadius: '2px' }}>
            <p className="text-base mb-1" style={{ color: 'var(--foreground)' }}>You&apos;re all set.</p>
            <p className="sans text-sm" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
              You have everything you need. Check <code style={{ fontFamily: 'monospace', fontSize: '12px' }}>TODO.md</code> for the feature roadmap, then pick something and open a PR.
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
            <span className="sans text-xs" style={{ color: 'var(--muted)' }}>Need Amol</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--border)' }} />
            <span className="sans text-xs" style={{ color: 'var(--muted)' }}>Do yourself</span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-3">
          {STEPS.map((step, i) => {
            const isChecked = !!checked[step.id]
            const isExpanded = expanded === step.id
            return (
              <div
                key={step.id}
                className="transition-all"
                style={{
                  background: isChecked ? 'var(--surface)' : 'var(--surface)',
                  border: `1px solid ${isExpanded ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '2px',
                  opacity: isChecked && !isExpanded ? 0.6 : 1,
                }}
              >
                {/* Step header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : step.id)}
                >
                  {/* Checkbox */}
                  <button
                    onClick={e => { e.stopPropagation(); toggle(step.id) }}
                    className="flex-shrink-0 w-5 h-5 flex items-center justify-center transition-all"
                    style={{
                      border: `1px solid ${isChecked ? 'var(--accent)' : 'var(--border)'}`,
                      background: isChecked ? 'var(--accent)' : 'transparent',
                      borderRadius: '2px',
                    }}
                  >
                    {isChecked && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="var(--background)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Step number + title */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="sans text-xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>{i + 1}</span>
                      <span
                        className="text-sm font-normal"
                        style={{ color: isChecked ? 'var(--muted)' : 'var(--foreground)', textDecoration: isChecked ? 'line-through' : 'none' }}
                      >
                        {step.title}
                      </span>
                    </div>
                  </div>

                  {/* Who badge */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: step.who === 'amol' ? 'var(--accent)' : 'var(--border)' }}
                      title={step.who === 'amol' ? 'Needs Amol' : 'Do yourself'}
                    />
                    <span className="sans text-xs" style={{ color: 'var(--muted)', opacity: 0.4 }}>
                      {isExpanded ? '↑' : '↓'}
                    </span>
                  </div>
                </div>

                {/* Step body */}
                {isExpanded && (
                  <div className="px-5 pb-5 fade-in" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                    {step.body}
                    {step.verify && (
                      <div className="mt-4 px-4 py-3" style={{ background: 'var(--surface-raised)', borderRadius: '2px' }}>
                        <p className="sans text-xs mb-1" style={{ color: 'var(--muted)', opacity: 0.6 }}>Verify:</p>
                        <p className="sans text-xs" style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{step.verify}</p>
                      </div>
                    )}
                    <button
                      onClick={() => { toggle(step.id); setExpanded(STEPS[i + 1]?.id || null) }}
                      className="sans text-xs mt-4 px-4 py-2 transition-all"
                      style={{
                        background: isChecked ? 'var(--surface-raised)' : 'var(--accent)',
                        color: isChecked ? 'var(--muted)' : 'var(--background)',
                        borderRadius: '2px',
                      }}
                    >
                      {isChecked ? 'Unmark as done' : 'Mark as done →'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="sans text-xs text-center" style={{ color: 'var(--muted)', opacity: 0.4 }}>
            Questions? Message Amol. This page is not linked from the main app — share the URL directly.
          </p>
        </div>
      </main>
    </div>
  )
}
