'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Memory, IdentitySummary } from '@/types'

interface TimelineEntry {
  id: string
  date: string
  type: 'memory' | 'identity' | 'ritual'
  memoryType?: 'episodic' | 'semantic' | 'narrative'
  content: string
  label: string
}

const TYPE_COLORS: Record<string, string> = {
  episodic: '#c4a882',
  semantic: '#8a7560',
  narrative: '#5a4f42',
  identity: '#e8e6df',
  ritual: '#6b6860',
}

const TYPE_LABELS: Record<string, string> = {
  episodic: 'Moment',
  semantic: 'Truth',
  narrative: 'Interpretation',
  identity: 'Self-portrait',
  ritual: 'Examen',
}

export default function TimelinePage() {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const load = async () => {
      try {
        const [synthRes, ritualsRes] = await Promise.all([
          fetch('/api/synthesis'),
          fetch('/api/rituals'),
        ])
        const synthData = await synthRes.json()
        const ritualsData = await ritualsRes.json()

        const all: TimelineEntry[] = []

        // Memories
        const memories: Memory[] = synthData.memories || []
        for (const m of memories) {
          all.push({
            id: m.id,
            date: m.created_at,
            type: 'memory',
            memoryType: m.type,
            content: m.content,
            label: TYPE_LABELS[m.type] || m.type,
          })
        }

        // Identity summaries
        const summaries: (IdentitySummary & { created_at: string })[] = synthData.allSummaries || []
        for (const s of summaries) {
          all.push({
            id: s.id,
            date: s.created_at,
            type: 'identity',
            content: s.summary,
            label: 'Self-portrait',
          })
        }

        // Rituals
        const rituals = ritualsData.rituals || []
        for (const r of rituals) {
          if (r.response) {
            all.push({
              id: r.id,
              date: r.created_at,
              type: 'ritual',
              content: `${r.prompt}\n\n${r.response}`,
              label: 'Examen',
            })
          }
        }

        // Sort by date, newest first
        all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setEntries(all)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = filter === 'all'
    ? entries
    : entries.filter(e => e.memoryType === filter || e.type === filter)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
  }

  const getColor = (entry: TimelineEntry) => {
    if (entry.type === 'memory' && entry.memoryType) return TYPE_COLORS[entry.memoryType]
    return TYPE_COLORS[entry.type] || '#6b6860'
  }

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'episodic', label: 'Moments' },
    { id: 'semantic', label: 'Truths' },
    { id: 'narrative', label: 'Interpretations' },
    { id: 'identity', label: 'Portraits' },
    { id: 'ritual', label: 'Examen' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/home" className="text-lg font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
          The Council
        </Link>
        <nav className="flex gap-5">
          <Link href="/chat" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Chat
          </Link>
          <Link href="/mirror" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Mirror
          </Link>
          <Link href="/rituals" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Rituals
          </Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="sans text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--accent)', opacity: 0.6 }}>
            Becoming
          </p>
          <h1 className="text-3xl font-normal mb-4" style={{ color: 'var(--foreground)' }}>
            Timeline of Self
          </h1>
          <p className="sans text-sm" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
            A record of how your council has understood you: moments, truths, interpretations, and portraits, in the order they emerged.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="sans text-xs px-3 py-1.5 transition-all"
              style={{
                background: filter === f.id ? 'var(--accent)' : 'var(--surface)',
                color: filter === f.id ? 'var(--background)' : 'var(--muted)',
                border: `1px solid ${filter === f.id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="sans text-sm" style={{ color: 'var(--muted)' }}>Reading your history...</p>
        ) : filtered.length === 0 ? (
          <div className="fade-in text-center py-20">
            <p className="prose-pascal mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Nothing here yet.
            </p>
            <Link href="/chat" className="sans text-xs" style={{ color: 'var(--accent)' }}>
              Start a conversation →
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline spine */}
            <div
              className="absolute left-[7px] top-2 bottom-2"
              style={{ width: '1px', background: 'var(--border)' }}
            />

            <div className="flex flex-col gap-0">
              {filtered.map((entry, i) => {
                const color = getColor(entry)
                const showDate = i === 0 || formatDate(filtered[i - 1].date) !== formatDate(entry.date)

                return (
                  <div key={entry.id}>
                    {showDate && (
                      <div className="flex items-center gap-4 mb-4 mt-6 first:mt-0">
                        <div style={{ width: '16px', flexShrink: 0 }} />
                        <p className="sans text-xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>
                          {formatDate(entry.date)}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-4 mb-6 fade-in">
                      {/* Dot */}
                      <div className="flex-shrink-0 mt-1.5">
                        <div
                          style={{
                            width: '15px',
                            height: '15px',
                            borderRadius: '50%',
                            background: color,
                            opacity: 0.8,
                            border: `2px solid var(--background)`,
                            outline: `1px solid ${color}`,
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div
                        className="flex-1 p-4"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '2px',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="sans"
                            style={{
                              fontSize: '10px',
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                              color,
                              opacity: 0.9,
                            }}
                          >
                            {entry.label}
                          </span>
                          <span
                            className="sans"
                            style={{ fontSize: '10px', color: 'var(--muted)', opacity: 0.4 }}
                          >
                            {new Date(entry.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                        <p
                          className={entry.type === 'identity' ? 'prose-pascal text-sm' : 'sans text-sm'}
                          style={{
                            color: 'var(--foreground)',
                            lineHeight: 1.7,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {entry.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
