'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type SessionMode = 'freeform' | 'decision' | 'reflection' | 'conflict' | 'ambition' | 'council' | 'journal'

interface Session {
  id: string
  mode: SessionMode
  title: string | null
  status: 'active' | 'ended'
  summary: string | null
  main_dilemma: string | null
  created_at: string
  ended_at: string | null
  advisors: { name: string; archetype: string | null } | null
}

const MODE_LABELS: Record<SessionMode, string> = {
  freeform: 'Free-form',
  decision: 'Decision',
  reflection: 'Reflection',
  conflict: 'Conflict',
  ambition: 'Ambition',
  council: 'Council',
  journal: 'Journal',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all')

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => { setSessions(d.sessions || []); setLoading(false) })
  }, [])

  const filtered = sessions.filter(s => filter === 'all' || s.status === filter)

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/home" className="text-lg font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
          Pascale&apos;s Wager
        </Link>
        <nav className="flex gap-5">
          <Link href="/advisors" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Advisors</Link>
          <Link href="/homework" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Homework</Link>
          <Link href="/mirror" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Mirror</Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="sans text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--accent)', opacity: 0.6 }}>Your history</p>
            <h1 className="text-3xl font-normal" style={{ color: 'var(--foreground)' }}>Sessions</h1>
          </div>
          <Link
            href="/advisors"
            className="sans text-sm px-5 py-2.5 mt-2"
            style={{ background: 'var(--accent)', color: 'var(--background)', borderRadius: '2px' }}
          >
            + New session
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-8">
          {(['all', 'active', 'ended'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="sans text-xs px-4 py-2 capitalize"
              style={{
                background: filter === f ? 'var(--surface-raised)' : 'transparent',
                color: filter === f ? 'var(--foreground)' : 'var(--muted)',
                border: `1px solid ${filter === f ? 'var(--border)' : 'transparent'}`,
                borderRadius: '2px',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="sans text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 fade-in">
            <p className="text-base mb-3" style={{ color: 'var(--muted-foreground)' }}>No sessions yet.</p>
            <p className="sans text-sm mb-8" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              Start a session with one of your advisors to begin.
            </p>
            <Link
              href="/advisors"
              className="sans text-sm px-6 py-3"
              style={{ background: 'var(--accent)', color: 'var(--background)', borderRadius: '2px' }}
            >
              Go to Advisors
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3 fade-in">
            {filtered.map(session => (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className="block px-5 py-5 transition-all"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="sans text-xs px-2 py-0.5"
                      style={{
                        background: session.status === 'active' ? 'var(--accent)' : 'var(--surface-raised)',
                        color: session.status === 'active' ? 'var(--background)' : 'var(--muted)',
                        borderRadius: '2px',
                        fontSize: '10px',
                      }}
                    >
                      {MODE_LABELS[session.mode]}
                    </span>
                    {session.status === 'active' && (
                      <span className="sans text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>active</span>
                    )}
                  </div>
                  <span className="sans text-xs" style={{ color: 'var(--muted)' }}>{formatDate(session.created_at)}</span>
                </div>

                <p className="text-sm font-normal mb-1" style={{ color: 'var(--foreground)' }}>
                  {session.title || session.main_dilemma || 'Untitled session'}
                </p>

                {session.advisors && (
                  <p className="sans text-xs mb-2" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                    {session.advisors.name}
                    {session.advisors.archetype ? ` · ${session.advisors.archetype}` : ''}
                  </p>
                )}

                {session.summary && (
                  <p className="sans text-xs leading-relaxed" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                    {session.summary.length > 120 ? session.summary.slice(0, 120) + '…' : session.summary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
