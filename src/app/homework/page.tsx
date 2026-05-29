'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MENTORS, type MentorId } from '@/lib/mentors/personas'
import type { HomeworkItem } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  reflection: 'Reflection',
  practice: 'Practice',
  reading: 'Reading',
  quiz: 'Quiz',
}

function HomeworkCard({
  item,
  onComplete,
}: {
  item: HomeworkItem
  onComplete: (id: string, response: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [response, setResponse] = useState(item.response || '')
  const [submitting, setSubmitting] = useState(false)
  const mentor = MENTORS[(item.mentor_id as MentorId) || 'pascale']
  const isCompleted = item.status === 'completed'

  const handleComplete = async () => {
    setSubmitting(true)
    await onComplete(item.id, response)
    setSubmitting(false)
    setExpanded(false)
  }

  return (
    <div
      className="fade-in transition-all duration-200"
      style={{
        background: isCompleted ? 'transparent' : 'var(--surface)',
        border: `1px solid ${isCompleted ? 'var(--border)' : 'var(--border)'}`,
        borderLeft: `3px solid ${isCompleted ? 'var(--border)' : 'var(--accent)'}`,
        borderRadius: '2px',
        opacity: isCompleted ? 0.5 : 1,
      }}
    >
      <button
        onClick={() => !isCompleted && setExpanded(v => !v)}
        className="w-full text-left px-5 py-4"
        style={{ cursor: isCompleted ? 'default' : 'pointer', background: 'none', border: 'none' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span
                className="sans text-xs px-2 py-0.5"
                style={{
                  background: isCompleted ? 'var(--surface)' : 'var(--accent)',
                  color: isCompleted ? 'var(--muted)' : 'var(--background)',
                  borderRadius: '2px',
                  fontSize: '10px',
                  letterSpacing: '0.06em',
                }}
              >
                {TYPE_LABELS[item.type] || item.type}
              </span>
              <span className="sans text-xs" style={{ color: 'var(--muted)' }}>
                from {mentor.name}
              </span>
            </div>
            <p className="text-sm font-normal" style={{ color: isCompleted ? 'var(--muted)' : 'var(--foreground)' }}>
              {item.title}
            </p>
          </div>
          <div className="flex-shrink-0 mt-1">
            {isCompleted ? (
              <span className="sans text-xs" style={{ color: 'var(--muted)' }}>Done</span>
            ) : (
              <span className="sans text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                {expanded ? '↑' : '↓'}
              </span>
            )}
          </div>
        </div>
      </button>

      {expanded && !isCompleted && (
        <div className="px-5 pb-5">
          <p className="sans text-sm leading-relaxed mb-4" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
            {item.task}
          </p>
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Write your response here... (optional)"
            rows={4}
            className="sans w-full px-3 py-3 text-sm outline-none resize-none mb-3"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              borderRadius: '2px',
              lineHeight: 1.65,
            }}
          />
          <div className="flex gap-3">
            <button
              onClick={handleComplete}
              disabled={submitting}
              className="sans px-5 py-2 text-sm tracking-wide transition-all"
              style={{
                background: submitting ? 'var(--accent-dim)' : 'var(--accent)',
                color: 'var(--background)',
                borderRadius: '2px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              {submitting ? 'Saving...' : 'Mark complete'}
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="sans px-4 py-2 text-sm"
              style={{ color: 'var(--muted)' }}
            >
              Later
            </button>
          </div>
        </div>
      )}

      {isCompleted && item.response && (
        <div className="px-5 pb-4">
          <p className="sans text-xs italic" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            {item.response}
          </p>
        </div>
      )}
    </div>
  )
}

export default function HomeworkPage() {
  const [items, setItems] = useState<HomeworkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending')

  useEffect(() => {
    fetch('/api/homework')
      .then(r => r.json())
      .then(data => {
        setItems(data.homework || [])
        setLoading(false)
      })
  }, [])

  const handleComplete = async (id: string, response: string) => {
    await fetch('/api/homework', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'completed', response }),
    })
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: 'completed', response, completed_at: new Date().toISOString() }
          : item
      )
    )
  }

  const filtered = items.filter(item => {
    if (filter === 'all') return true
    return item.status === filter
  })

  const pendingCount = items.filter(i => i.status === 'pending').length
  const completedCount = items.filter(i => i.status === 'completed').length

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/chat" className="text-lg font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
          Pascale
        </Link>
        <nav className="flex gap-6">
          <Link href="/chat" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Conversation
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
            Assigned by your mentor
          </p>
          <h1 className="text-3xl font-normal mb-6" style={{ color: 'var(--foreground)' }}>
            Homework
          </h1>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {(['pending', 'completed', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="sans text-xs px-3 py-1.5 capitalize transition-all"
                style={{
                  background: filter === f ? 'var(--surface-raised)' : 'transparent',
                  color: filter === f ? 'var(--foreground)' : 'var(--muted)',
                  border: `1px solid ${filter === f ? 'var(--border)' : 'transparent'}`,
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
              >
                {f === 'pending' ? `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` : null}
                {f === 'completed' ? `Done${completedCount > 0 ? ` (${completedCount})` : ''}` : null}
                {f === 'all' ? 'All' : null}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="sans text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="fade-in text-center py-16">
            {filter === 'pending' ? (
              <>
                <p className="text-base mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  No pending assignments.
                </p>
                <p className="sans text-xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>
                  Keep talking. Your mentor will assign work when the moment is right.
                </p>
              </>
            ) : (
              <p className="text-base" style={{ color: 'var(--muted-foreground)' }}>
                Nothing here yet.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(item => (
              <HomeworkCard key={item.id} item={item} onComplete={handleComplete} />
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-16 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex gap-8">
              <div>
                <p className="text-2xl font-normal" style={{ color: 'var(--foreground)' }}>{pendingCount}</p>
                <p className="sans text-xs mt-1" style={{ color: 'var(--muted)' }}>pending</p>
              </div>
              <div>
                <p className="text-2xl font-normal" style={{ color: 'var(--foreground)' }}>{completedCount}</p>
                <p className="sans text-xs mt-1" style={{ color: 'var(--muted)' }}>completed</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
