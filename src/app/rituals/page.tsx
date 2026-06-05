'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const DAILY_RITUALS = [
  'What did you avoid today?',
  'What energized you?',
  'What truth did you ignore?',
  'Who did you perform for?',
  'What are you becoming?',
  'What did you protect yourself from feeling?',
  'Where did you compromise without naming it?',
  'What would you do differently if no one was watching?',
]

function getTodayRitual(): string {
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  )
  return DAILY_RITUALS[dayOfYear % DAILY_RITUALS.length]
}

export default function RitualsPage() {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const ritualPrompt = getTodayRitual()

  const handleSubmit = async () => {
    if (!response.trim()) return
    setLoading(true)

    try {
      await fetch('/api/rituals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: ritualPrompt, response }),
      })
    } finally {
      // Route ritual response into the main chat for the advisor to reflect on.
      router.push(`/chat?ritual=${encodeURIComponent(ritualPrompt)}&response=${encodeURIComponent(response)}`)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/home" className="text-lg font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
          The Council
        </Link>
        <nav className="flex gap-6">
          <Link href="/chat" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Conversation
          </Link>
          <Link href="/mirror" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Mirror
          </Link>
        </nav>
      </header>

      <main className="max-w-xl mx-auto px-6 py-16">
        <div className="fade-in">
          <p className="sans text-xs tracking-[0.3em] uppercase mb-8" style={{ color: 'var(--accent)', opacity: 0.6 }}>
            Daily Examen
          </p>

          <p className="sans text-xs mb-3" style={{ color: 'var(--muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>

          <h2 className="text-2xl font-normal mb-10 leading-relaxed" style={{ color: 'var(--foreground)' }}>
            {ritualPrompt}
          </h2>

          <>
            <textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Write freely. Your council will hold this."
              rows={6}
              className="sans w-full px-4 py-3 text-sm outline-none resize-none mb-6"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                borderRadius: '2px',
                lineHeight: 1.75,
              }}
            />

            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={loading || !response.trim()}
                className="sans px-6 py-2.5 text-sm tracking-wide transition-all"
                style={{
                  background: loading || !response.trim() ? 'var(--accent-dim)' : 'var(--accent)',
                  color: 'var(--background)',
                  borderRadius: '2px',
                  cursor: loading || !response.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Reflecting...' : 'Bring to the Council'}
              </button>

              <Link
                href="/chat"
                className="sans px-4 py-2.5 text-sm"
                style={{ color: 'var(--muted)' }}
              >
                Skip today
              </Link>
            </div>
          </>
        </div>

        <div className="mt-16 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="sans text-xs tracking-[0.2em] uppercase mb-6" style={{ color: 'var(--muted)', opacity: 0.5 }}>
            The Examen
          </p>
          <div className="flex flex-col gap-3">
            {DAILY_RITUALS.map((prompt, i) => (
              <p
                key={i}
                className="sans text-sm"
                style={{
                  color: prompt === ritualPrompt ? 'var(--foreground)' : 'var(--muted)',
                  opacity: prompt === ritualPrompt ? 1 : 0.5,
                }}
              >
                {prompt === ritualPrompt ? '→ ' : ''}{prompt}
              </p>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
