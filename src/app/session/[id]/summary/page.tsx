'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ProposedMemory {
  type: string
  content: string
  importance: number
}

interface SessionSummaryData {
  session_title: string
  summary: string
  main_dilemma: string
  emotional_tone: string
  next_actions: string[]
  memories_to_save: ProposedMemory[]
  follow_up_question: string
}

const MEMORY_TYPE_LABELS: Record<string, string> = {
  user_value: 'Value',
  recurring_pattern: 'Pattern',
  preference: 'Preference',
  unresolved_decision: 'Open decision',
  relationship_context: 'Relationship',
  life_goal: 'Goal',
  commitment: 'Commitment',
}

export default function SessionSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [summaryData, setSummaryData] = useState<SessionSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [memoryStates, setMemoryStates] = useState<Record<number, 'accepted' | 'rejected'>>({})
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    fetch(`/api/sessions/${id}/summarize`, { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d.summary) {
          setSummaryData(d.summary)
          // Default all to accepted
          const initial: Record<number, 'accepted' | 'rejected'> = {}
          ;(d.summary.memories_to_save || []).forEach((_: ProposedMemory, i: number) => {
            initial[i] = 'accepted'
          })
          setMemoryStates(initial)
        } else {
          setError(d.error || 'Could not generate summary')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to generate summary')
        setLoading(false)
      })
  }, [id])

  const handleComplete = async () => {
    if (!summaryData) return
    setCompleting(true)

    // Save accepted memories
    const acceptedMemories = summaryData.memories_to_save.filter((_, i) => memoryStates[i] !== 'rejected')
    if (acceptedMemories.length > 0) {
      await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memories: acceptedMemories, sessionId: id }),
      })
    }

    // Mark session as ended
    await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ended' }),
    })

    router.push('/sessions')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--background)' }}>
        <p className="text-base mb-2" style={{ color: 'var(--foreground)' }}>Reflecting on your session…</p>
        <p className="sans text-sm" style={{ color: 'var(--muted)' }}>Generating summary and memory proposals.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--background)' }}>
        <p className="sans text-sm mb-6" style={{ color: '#c47070' }}>{error}</p>
        <div className="flex gap-3">
          <Link href={`/session/${id}`} className="sans text-sm px-5 py-2.5" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', borderRadius: '2px' }}>
            Back to session
          </Link>
          <button
            onClick={async () => {
              await fetch(`/api/sessions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ended' }),
              })
              router.push('/sessions')
            }}
            className="sans text-sm px-5 py-2.5"
            style={{ background: 'var(--accent)', color: 'var(--background)', borderRadius: '2px' }}
          >
            End without summary
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href={`/session/${id}`} className="sans text-xs" style={{ color: 'var(--muted)' }}>← Back to session</Link>
        <span className="sans text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--accent)', opacity: 0.6 }}>Session summary</span>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="fade-in">
          {/* Title */}
          <div className="mb-10">
            {summaryData?.emotional_tone && (
              <p className="sans text-xs tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--accent)', opacity: 0.6 }}>
                {summaryData.emotional_tone}
              </p>
            )}
            <h1 className="text-2xl font-normal mb-4" style={{ color: 'var(--foreground)' }}>
              {summaryData?.session_title}
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)', lineHeight: 1.75 }}>
              {summaryData?.summary}
            </p>
          </div>

          {/* Main dilemma */}
          {summaryData?.main_dilemma && (
            <div className="mb-8 px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }}>
              <p className="sans text-xs tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>The question you brought</p>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>{summaryData.main_dilemma}</p>
            </div>
          )}

          {/* Next actions */}
          {summaryData?.next_actions && summaryData.next_actions.length > 0 && (
            <div className="mb-8">
              <p className="sans text-xs tracking-[0.15em] uppercase mb-3" style={{ color: 'var(--muted)', opacity: 0.6 }}>Next actions</p>
              <div className="flex flex-col gap-2">
                {summaryData.next_actions.map((action, i) => (
                  <p key={i} className="sans text-sm pl-4" style={{ color: 'var(--muted-foreground)', borderLeft: '2px solid var(--accent)', lineHeight: 1.6 }}>
                    {action}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up question */}
          {summaryData?.follow_up_question && (
            <div className="mb-10 px-4 py-3" style={{ background: 'var(--surface)', borderLeft: '2px solid var(--border)', borderRadius: '2px' }}>
              <p className="sans text-xs tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>To return to next time</p>
              <p className="text-sm italic" style={{ color: 'var(--muted-foreground)' }}>&ldquo;{summaryData.follow_up_question}&rdquo;</p>
            </div>
          )}

          {/* Memory review */}
          {summaryData?.memories_to_save && summaryData.memories_to_save.length > 0 && (
            <div className="mb-10" style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
              <p className="sans text-xs tracking-[0.2em] uppercase mb-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>
                Proposed memories
              </p>
              <p className="sans text-xs mb-5" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                Review what your advisor wants to remember about you. Accept or reject each.
              </p>
              <div className="flex flex-col gap-3">
                {summaryData.memories_to_save.map((memory, i) => {
                  const state = memoryStates[i] || 'accepted'
                  return (
                    <div
                      key={i}
                      className="px-4 py-4 transition-all"
                      style={{
                        background: state === 'rejected' ? 'transparent' : 'var(--surface)',
                        border: `1px solid ${state === 'rejected' ? 'var(--border)' : state === 'accepted' ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: '2px',
                        opacity: state === 'rejected' ? 0.4 : 1,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="sans text-xs px-2 py-0.5"
                              style={{ background: 'var(--surface-raised)', color: 'var(--muted)', borderRadius: '2px', fontSize: '10px' }}
                            >
                              {MEMORY_TYPE_LABELS[memory.type] || memory.type}
                            </span>
                            <span className="sans text-xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>
                              importance {memory.importance}/10
                            </span>
                          </div>
                          <p className="sans text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.6 }}>{memory.content}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => setMemoryStates(s => ({ ...s, [i]: 'accepted' }))}
                            className="sans text-xs px-2.5 py-1.5"
                            style={{
                              background: state === 'accepted' ? 'var(--accent)' : 'transparent',
                              color: state === 'accepted' ? 'var(--background)' : 'var(--muted)',
                              border: `1px solid ${state === 'accepted' ? 'var(--accent)' : 'var(--border)'}`,
                              borderRadius: '2px',
                            }}
                          >
                            Keep
                          </button>
                          <button
                            onClick={() => setMemoryStates(s => ({ ...s, [i]: 'rejected' }))}
                            className="sans text-xs px-2.5 py-1.5"
                            style={{
                              background: 'transparent',
                              color: state === 'rejected' ? '#c47070' : 'var(--muted)',
                              border: `1px solid ${state === 'rejected' ? '#c47070' : 'var(--border)'}`,
                              borderRadius: '2px',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleComplete}
            disabled={completing}
            className="sans w-full py-3.5 text-sm tracking-wide transition-all"
            style={{
              background: completing ? 'var(--accent-dim)' : 'var(--accent)',
              color: 'var(--background)',
              borderRadius: '2px',
              cursor: completing ? 'not-allowed' : 'pointer',
            }}
          >
            {completing ? 'Saving...' : 'Complete session'}
          </button>
        </div>
      </main>
    </div>
  )
}
