'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Advisor, HomeworkItem } from '@/types'

export default function HomePage() {
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [pendingHomework, setPendingHomework] = useState(0)
  const [recentActivity, setRecentActivity] = useState<{ content: string; created_at: string } | null>(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserName(user.email?.split('@')[0] || '')

      const [advisorRes, homeworkRes, messageRes] = await Promise.all([
        fetch('/api/advisors'),
        fetch('/api/homework'),
        supabase
          .from('messages')
          .select('content, created_at')
          .eq('user_id', user.id)
          .eq('role', 'assistant')
          .order('created_at', { ascending: false })
          .limit(1),
      ])

      const advisorData = await advisorRes.json()
      const homeworkData = await homeworkRes.json()

      setAdvisors(advisorData.advisors || [])
      setPendingHomework(
        (homeworkData.homework as HomeworkItem[] || []).filter(h => h.status === 'pending').length
      )
      setRecentActivity(messageRes.data?.[0] || null)
      setLoading(false)
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-lg font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
          Pascale&apos;s Wager
        </span>
        <nav className="flex gap-5">
          <Link href="/advisors" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Advisors</Link>
          <Link href="/sessions" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Sessions</Link>
          <Link href="/homework" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Homework{pendingHomework > 0 ? ` (${pendingHomework})` : ''}
          </Link>
          <Link href="/mirror" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Mirror</Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">

        {/* Greeting */}
        <div className="mb-12 fade-in">
          <p className="sans text-xs tracking-[0.2em] uppercase mb-2" style={{ color: 'var(--accent)', opacity: 0.6 }}>
            {greeting}
          </p>
          <h1 className="text-3xl font-normal" style={{ color: 'var(--foreground)' }}>
            {userName ? `${userName}.` : 'Welcome back.'}
          </h1>
        </div>

        {loading ? (
          <p className="sans text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
        ) : (
          <>
            {/* Recent activity */}
            {recentActivity && (
              <div className="mb-10 fade-in">
                <p className="sans text-xs tracking-[0.15em] uppercase mb-3" style={{ color: 'var(--muted)', opacity: 0.6 }}>
                  Last session
                </p>
                <div
                  className="px-5 py-4"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }}
                >
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
                    {recentActivity.content.length > 200
                      ? recentActivity.content.slice(0, 200) + '…'
                      : recentActivity.content}
                  </p>
                  <Link href="/sessions" className="sans text-xs" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                    Continue →
                  </Link>
                </div>
              </div>
            )}

            {/* Your advisors */}
            <div className="mb-10 fade-in">
              <div className="flex items-center justify-between mb-4">
                <p className="sans text-xs tracking-[0.15em] uppercase" style={{ color: 'var(--muted)', opacity: 0.6 }}>
                  Your advisors
                </p>
                <Link href="/advisors/new" className="sans text-xs" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                  + New advisor
                </Link>
              </div>

              {advisors.length === 0 ? (
                <div
                  className="px-5 py-8 text-center"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }}
                >
                  <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                    No advisors yet. Create one to begin.
                  </p>
                  <Link
                    href="/advisors/new"
                    className="sans text-sm px-5 py-2.5 transition-all"
                    style={{ background: 'var(--accent)', color: 'var(--background)', borderRadius: '2px' }}
                  >
                    Create your first advisor
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {advisors.map(advisor => (
                    <div
                      key={advisor.id}
                      className="flex items-center justify-between px-5 py-4 transition-all"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }}
                    >
                      <div>
                        <p className="text-sm font-normal mb-0.5" style={{ color: 'var(--foreground)' }}>{advisor.name}</p>
                        {advisor.archetype && (
                          <p className="sans text-xs" style={{ color: 'var(--muted)' }}>{advisor.archetype}</p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Link
                          href={`/advisors/${advisor.id}`}
                          className="sans text-xs"
                          style={{ color: 'var(--muted)' }}
                        >
                          View
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
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="fade-in">
              <p className="sans text-xs tracking-[0.15em] uppercase mb-4" style={{ color: 'var(--muted)', opacity: 0.6 }}>
                Quick actions
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/advisors" className="sans text-xs px-4 py-2.5 transition-all" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted-foreground)', borderRadius: '2px' }}>
                  New session
                </Link>
                <Link href="/rituals" className="sans text-xs px-4 py-2.5 transition-all" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted-foreground)', borderRadius: '2px' }}>
                  Daily Examen
                </Link>
                <Link href="/mirror" className="sans text-xs px-4 py-2.5 transition-all" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted-foreground)', borderRadius: '2px' }}>
                  Mirror
                </Link>
                {pendingHomework > 0 && (
                  <Link href="/homework" className="sans text-xs px-4 py-2.5 transition-all" style={{ background: 'var(--surface)', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '2px' }}>
                    {pendingHomework} pending assignment{pendingHomework > 1 ? 's' : ''}
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
