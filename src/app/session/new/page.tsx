'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type SessionMode = 'freeform' | 'decision' | 'reflection' | 'conflict' | 'ambition' | 'journal'

const MODES: { id: SessionMode; label: string; description: string }[] = [
  { id: 'freeform', label: 'Free-form', description: 'Open conversation — no structure imposed' },
  { id: 'decision', label: 'Decision', description: 'Working through a choice or tradeoff' },
  { id: 'reflection', label: 'Reflection', description: 'Making sense of something that happened' },
  { id: 'conflict', label: 'Conflict', description: 'A difficult situation with another person' },
  { id: 'ambition', label: 'Ambition', description: 'Long-term goals, direction, what you are building' },
  { id: 'journal', label: 'Journal', description: 'Thinking out loud, no agenda' },
]

interface Advisor {
  id: string
  name: string
  archetype: string | null
}

function NewSessionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const advisorIdParam = searchParams.get('advisorId')

  const [mode, setMode] = useState<SessionMode>('freeform')
  const [framing, setFraming] = useState('')
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(advisorIdParam)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/advisors')
      .then(r => r.json())
      .then(d => {
        setAdvisors(d.advisors || [])
        if (!advisorIdParam && d.advisors?.length > 0) {
          setSelectedAdvisor(d.advisors[0].id)
        }
      })
  }, [advisorIdParam])

  const handleBegin = async () => {
    setCreating(true)
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        advisorId: selectedAdvisor,
        mode,
        mainDilemma: framing.trim() || null,
      }),
    })
    const data = await res.json()
    if (data.session?.id) {
      if (framing.trim()) {
        // Pre-seed the conversation with the framing prompt via chat
        router.push(`/session/${data.session.id}?framing=${encodeURIComponent(framing.trim())}`)
      } else {
        router.push(`/session/${data.session.id}`)
      }
    } else {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/advisors" className="text-lg font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
          ← Advisors
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="sans text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--accent)', opacity: 0.6 }}>Begin</p>
          <h1 className="text-3xl font-normal mb-2" style={{ color: 'var(--foreground)' }}>New session</h1>
          <p className="sans text-sm" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
            A session is a focused conversation. It persists across time.
          </p>
        </div>

        {/* Advisor select */}
        {advisors.length > 1 && (
          <div className="mb-8">
            <p className="sans text-xs tracking-[0.15em] uppercase mb-3" style={{ color: 'var(--muted)', opacity: 0.6 }}>Advisor</p>
            <div className="flex flex-col gap-2">
              {advisors.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAdvisor(a.id)}
                  className="flex items-center justify-between px-4 py-3 text-left transition-all"
                  style={{
                    background: selectedAdvisor === a.id ? 'var(--surface-raised)' : 'var(--surface)',
                    border: `1px solid ${selectedAdvisor === a.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '2px',
                  }}
                >
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>{a.name}</span>
                  {a.archetype && <span className="sans text-xs" style={{ color: 'var(--muted)' }}>{a.archetype}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode select */}
        <div className="mb-8">
          <p className="sans text-xs tracking-[0.15em] uppercase mb-3" style={{ color: 'var(--muted)', opacity: 0.6 }}>Session type</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className="text-left px-4 py-3 transition-all"
                style={{
                  background: mode === m.id ? 'var(--surface-raised)' : 'var(--surface)',
                  border: `1px solid ${mode === m.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '2px',
                }}
              >
                <p className="sans text-sm mb-1" style={{ color: 'var(--foreground)' }}>{m.label}</p>
                <p className="sans text-xs" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>{m.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Optional framing */}
        <div className="mb-8">
          <p className="sans text-xs tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>
            What is weighing on you? <span style={{ opacity: 0.5 }}>(optional)</span>
          </p>
          <textarea
            value={framing}
            onChange={e => setFraming(e.target.value)}
            placeholder="A brief framing of what you want to explore..."
            rows={3}
            className="sans w-full px-4 py-3 text-sm outline-none resize-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '2px', lineHeight: 1.7 }}
          />
        </div>

        <button
          onClick={handleBegin}
          disabled={creating || !selectedAdvisor}
          className="sans w-full py-3.5 text-sm tracking-wide transition-all"
          style={{
            background: creating || !selectedAdvisor ? 'var(--accent-dim)' : 'var(--accent)',
            color: 'var(--background)',
            borderRadius: '2px',
            cursor: creating || !selectedAdvisor ? 'not-allowed' : 'pointer',
          }}
        >
          {creating ? 'Beginning...' : 'Begin session'}
        </button>
      </main>
    </div>
  )
}

export default function NewSessionPage() {
  return (
    <Suspense>
      <NewSessionForm />
    </Suspense>
  )
}
