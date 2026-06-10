'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Advisor } from '@/types'

interface CouncilResponse {
  advisorId: string
  advisorName: string
  advisorArchetype: string | null
  response: string
}

interface CouncilResult {
  responses: CouncilResponse[]
  synthesis: string
}

export default function CouncilPage() {
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [result, setResult] = useState<CouncilResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/advisors')
      .then(r => r.json())
      .then(d => {
        setAdvisors(d.advisors || [])
        setLoading(false)
      })
  }, [])

  const toggleAdvisor = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAsk = async () => {
    if (selectedIds.size < 2) { setError('Select at least 2 advisors.'); return }
    if (!question.trim()) { setError('Enter a question.'); return }
    setAsking(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advisorIds: [...selectedIds], question }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setAsking(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/home" className="text-lg font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
          Pascale&apos;s Wager
        </Link>
        <nav className="flex gap-5">
          <Link href="/advisors" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Advisors</Link>
          <Link href="/sessions" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Sessions</Link>
          <Link href="/mirror" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Mirror</Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {!result ? (
          <div className="fade-in">
            <div className="mb-10">
              <p className="sans text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--accent)', opacity: 0.6 }}>Council</p>
              <h1 className="text-3xl font-normal mb-3" style={{ color: 'var(--foreground)' }}>Ask the Council</h1>
              <p className="sans text-sm" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
                Bring one question. Your advisors each respond from their own perspective. A synthesis follows.
              </p>
            </div>

            {loading ? (
              <p className="sans text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
            ) : advisors.length < 2 ? (
              <div className="text-center py-12">
                <p className="text-base mb-4" style={{ color: 'var(--muted-foreground)' }}>
                  Council requires at least 2 advisors.
                </p>
                <Link href="/advisors/new" className="sans text-sm px-5 py-2.5" style={{ background: 'var(--accent)', color: 'var(--background)', borderRadius: '2px' }}>
                  Create advisors
                </Link>
              </div>
            ) : (
              <>
                {/* Advisor selection */}
                <div className="mb-8">
                  <p className="sans text-xs tracking-[0.15em] uppercase mb-3" style={{ color: 'var(--muted)', opacity: 0.6 }}>
                    Select advisors <span style={{ opacity: 0.5 }}>(2–5)</span>
                  </p>
                  <div className="flex flex-col gap-2">
                    {advisors.map(advisor => {
                      const selected = selectedIds.has(advisor.id)
                      return (
                        <button
                          key={advisor.id}
                          onClick={() => toggleAdvisor(advisor.id)}
                          className="flex items-center justify-between px-4 py-3 text-left transition-all"
                          style={{
                            background: selected ? 'var(--surface-raised)' : 'var(--surface)',
                            border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                            borderRadius: '2px',
                          }}
                        >
                          <div>
                            <p className="text-sm" style={{ color: 'var(--foreground)' }}>{advisor.name}</p>
                            {advisor.archetype && (
                              <p className="sans text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{advisor.archetype}</p>
                            )}
                          </div>
                          <div
                            className="w-4 h-4 flex-shrink-0"
                            style={{
                              border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                              background: selected ? 'var(--accent)' : 'transparent',
                              borderRadius: '2px',
                            }}
                          />
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Question input */}
                <div className="mb-6">
                  <p className="sans text-xs tracking-[0.15em] uppercase mb-3" style={{ color: 'var(--muted)', opacity: 0.6 }}>Your question</p>
                  <textarea
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="What decision is weighing on you? What do you want their perspectives on?"
                    rows={4}
                    className="sans w-full px-4 py-3 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '2px', lineHeight: 1.7 }}
                  />
                </div>

                {error && <p className="sans text-xs mb-4" style={{ color: '#c47070' }}>{error}</p>}

                <button
                  onClick={handleAsk}
                  disabled={asking || selectedIds.size < 2 || !question.trim()}
                  className="sans w-full py-3.5 text-sm tracking-wide transition-all"
                  style={{
                    background: asking || selectedIds.size < 2 || !question.trim() ? 'var(--accent-dim)' : 'var(--accent)',
                    color: 'var(--background)',
                    borderRadius: '2px',
                    cursor: asking || selectedIds.size < 2 || !question.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {asking ? `Consulting ${selectedIds.size} advisors…` : 'Convene the council'}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="fade-in">
            <div className="mb-10">
              <p className="sans text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--accent)', opacity: 0.6 }}>Council response</p>
              <div className="px-4 py-3 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }}>
                <p className="text-sm italic" style={{ color: 'var(--muted-foreground)' }}>&ldquo;{question}&rdquo;</p>
              </div>
            </div>

            {/* Individual advisor responses */}
            <div className="flex flex-col gap-8 mb-12">
              {result.responses.map(r => (
                <div key={r.advisorId}>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-base font-normal" style={{ color: 'var(--foreground)' }}>{r.advisorName}</p>
                    {r.advisorArchetype && (
                      <span className="sans text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>{r.advisorArchetype}</span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {r.response}
                  </p>
                </div>
              ))}
            </div>

            {/* Synthesis */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
              <p className="sans text-xs tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--accent)', opacity: 0.6 }}>
                Synthesis
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
                {result.synthesis}
              </p>
            </div>

            <div className="flex gap-3 mt-10">
              <button
                onClick={() => { setResult(null); setQuestion(''); setSelectedIds(new Set()) }}
                className="sans text-sm px-5 py-2.5"
                style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', borderRadius: '2px' }}
              >
                New question
              </button>
              <Link href="/sessions" className="sans text-sm px-5 py-2.5" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', borderRadius: '2px' }}>
                Sessions
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
