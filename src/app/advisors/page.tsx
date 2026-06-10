'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Advisor } from '@/types'

export default function AdvisorsPage() {
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/advisors')
      .then(r => r.json())
      .then(d => { setAdvisors(d.advisors || []); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/home" className="text-lg font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
          Pascale&apos;s Wager
        </Link>
        <nav className="flex gap-5">
          <Link href="/chat" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Chat</Link>
          <Link href="/mirror" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Mirror</Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="sans text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--accent)', opacity: 0.6 }}>Your council</p>
            <h1 className="text-3xl font-normal" style={{ color: 'var(--foreground)' }}>Advisors</h1>
          </div>
          <Link
            href="/advisors/new"
            className="sans text-sm px-5 py-2.5 transition-all mt-2"
            style={{ background: 'var(--accent)', color: 'var(--background)', borderRadius: '2px' }}
          >
            + New advisor
          </Link>
        </div>

        {loading ? (
          <p className="sans text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
        ) : advisors.length === 0 ? (
          <div className="fade-in text-center py-16">
            <p className="text-base mb-3" style={{ color: 'var(--muted-foreground)' }}>No advisors yet.</p>
            <p className="sans text-sm mb-8" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              Create a personalized advisor — describe them in plain language<br />and the app will generate their full profile and voice.
            </p>
            <Link
              href="/advisors/new"
              className="sans text-sm px-6 py-3 transition-all"
              style={{ background: 'var(--accent)', color: 'var(--background)', borderRadius: '2px' }}
            >
              Create your first advisor
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3 fade-in">
            {advisors.map(advisor => (
              <div
                key={advisor.id}
                className="px-5 py-5 transition-all"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-base font-normal mb-0.5" style={{ color: 'var(--foreground)' }}>{advisor.name}</p>
                    {advisor.archetype && (
                      <p className="sans text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>{advisor.archetype}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/advisors/${advisor.id}`}
                      className="sans text-xs px-3 py-1.5"
                      style={{ border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: '2px' }}
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/session/new?advisorId=${advisor.id}`}
                      className="sans text-xs px-3 py-1.5 transition-all"
                      style={{ background: 'var(--accent)', color: 'var(--background)', borderRadius: '2px' }}
                    >
                      Ask
                    </Link>
                  </div>
                </div>
                {advisor.helps_with?.length > 0 && (
                  <p className="sans text-xs" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                    {advisor.helps_with.join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
