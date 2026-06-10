'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { IdentitySummary, Memory } from '@/types'

export default function MirrorPage() {
  const [summary, setSummary] = useState<IdentitySummary | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [synthesizing, setSynthesizing] = useState(false)

  useEffect(() => {
    fetch('/api/synthesis')
      .then(r => r.json())
      .then(data => {
        setSummary(data.summary)
        setMemories(data.memories || [])
        setLoading(false)
      })
  }, [])

  const runSynthesis = async () => {
    setSynthesizing(true)
    const res = await fetch('/api/synthesis', { method: 'POST' })
    const data = await res.json()
    if (data.summary) setSummary(data.summary)
    setSynthesizing(false)
  }

  const semanticMemories = memories.filter(m => m.type === 'semantic')
  const narrativeMemories = memories.filter(m => m.type === 'narrative')
  const episodicMemories = memories.filter(m => m.type === 'episodic')

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/home" className="text-lg font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
          Pascale&apos;s Wager
        </Link>
        <nav className="flex gap-5">
          <Link href="/advisors" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Advisors</Link>
          <Link href="/sessions" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Sessions</Link>
          <Link href="/homework" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Homework</Link>
          <Link href="/rituals" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Rituals</Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-12">
          <p className="sans text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--accent)', opacity: 0.6 }}>
            What your advisors carry
          </p>
          <h1 className="text-3xl font-normal" style={{ color: 'var(--foreground)' }}>
            The Mirror
          </h1>
        </div>

        {loading ? (
          <p className="sans text-sm" style={{ color: 'var(--muted)' }}>Reading your story...</p>
        ) : (
          <>
            {summary ? (
              <div className="fade-in">
                {/* Identity Summary */}
                <section className="mb-12">
                  <p className="prose-pascal" style={{ color: 'var(--foreground)', lineHeight: 1.9 }}>
                    {summary.summary}
                  </p>
                </section>

                {/* Traits */}
                {summary.traits?.length > 0 && (
                  <section className="mb-10">
                    <p className="sans text-xs tracking-[0.2em] uppercase mb-5" style={{ color: 'var(--accent)', opacity: 0.6 }}>
                      Strongest traits
                    </p>
                    <div className="flex flex-col gap-3">
                      {summary.traits.map((trait, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div
                            className="h-0.5 flex-1"
                            style={{
                              background: `linear-gradient(to right, var(--accent), transparent)`,
                              opacity: trait.confidence,
                            }}
                          />
                          <span className="sans text-sm" style={{ color: 'var(--foreground)', minWidth: '200px' }}>
                            {trait.name}
                          </span>
                          <span className="sans text-xs" style={{ color: 'var(--muted)' }}>
                            {Math.round(trait.confidence * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Contradictions */}
                {summary.contradictions?.length > 0 && (
                  <section className="mb-10">
                    <p className="sans text-xs tracking-[0.2em] uppercase mb-5" style={{ color: 'var(--accent)', opacity: 0.6 }}>
                      Contradictions I notice
                    </p>
                    <div className="flex flex-col gap-3">
                      {summary.contradictions.map((c, i) => (
                        <p key={i} className="prose-pascal text-sm pl-4" style={{
                          color: 'var(--muted-foreground)',
                          borderLeft: '1px solid var(--border)',
                        }}>
                          {c}
                        </p>
                      ))}
                    </div>
                  </section>
                )}

                {/* Themes */}
                {summary.themes?.length > 0 && (
                  <section className="mb-10">
                    <p className="sans text-xs tracking-[0.2em] uppercase mb-5" style={{ color: 'var(--accent)', opacity: 0.6 }}>
                      Recurring themes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {summary.themes.map((t, i) => (
                        <span
                          key={i}
                          className="sans text-xs px-3 py-1.5"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--muted-foreground)',
                            borderRadius: '2px',
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <div className="mt-8">
                  <button
                    onClick={runSynthesis}
                    disabled={synthesizing}
                    className="sans text-xs tracking-wide px-4 py-2 transition-all"
                    style={{
                      border: '1px solid var(--border)',
                      color: 'var(--muted)',
                      borderRadius: '2px',
                      cursor: synthesizing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {synthesizing ? 'Synthesizing...' : 'Re-synthesize'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="fade-in">
                <p className="prose-pascal mb-6" style={{ color: 'var(--muted-foreground)' }}>
                  Pascale hasn&apos;t yet formed a full picture of you. Keep talking. The mirror fills slowly.
                </p>
                {memories.length >= 5 && (
                  <button
                    onClick={runSynthesis}
                    disabled={synthesizing}
                    className="sans text-sm px-5 py-2.5 transition-all"
                    style={{
                      background: synthesizing ? 'var(--accent-dim)' : 'var(--accent)',
                      color: 'var(--background)',
                      borderRadius: '2px',
                      cursor: synthesizing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {synthesizing ? 'Thinking...' : 'Form a picture'}
                  </button>
                )}
              </div>
            )}

            {/* Memory list */}
            {memories.length > 0 && (
              <div className="mt-16 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="sans text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--muted)', opacity: 0.5 }}>
                    Memories ({memories.length})
                  </p>
                  <a
                    href="/api/export"
                    className="sans text-xs"
                    style={{ color: 'var(--muted)', opacity: 0.6, textDecoration: 'underline' }}
                  >
                    Export data
                  </a>
                </div>

                {[
                  { label: 'Truths', items: semanticMemories },
                  { label: 'Interpretations', items: narrativeMemories },
                  { label: 'Moments', items: episodicMemories },
                ].filter(g => g.items.length > 0).map(group => (
                  <div key={group.label} className="mb-6">
                    <p className="sans text-xs tracking-[0.1em] uppercase mb-2" style={{ color: 'var(--muted)', opacity: 0.4 }}>
                      {group.label}
                    </p>
                    <div className="flex flex-col gap-1">
                      {group.items.map(m => (
                        <div
                          key={m.id}
                          className="flex items-start justify-between gap-3 px-3 py-2.5"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }}
                        >
                          <p className="sans text-xs flex-1" style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
                            {m.content}
                          </p>
                          <button
                            onClick={async () => {
                              await fetch('/api/memories', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: m.id }),
                              })
                              setMemories(prev => prev.filter(x => x.id !== m.id))
                            }}
                            className="sans text-xs flex-shrink-0"
                            style={{ color: 'var(--muted)', opacity: 0.4 }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
