'use client'

import { useState, useRef, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'
import type { ParsedHomework } from '@/lib/mentors/personas'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  homework?: ParsedHomework[]
}

interface Session {
  id: string
  mode: string
  title: string | null
  status: 'active' | 'ended'
  advisor_id: string | null
  main_dilemma: string | null
  advisors: {
    name: string
    archetype: string | null
    role_description: string | null
    tone: string | null
  } | null
}

const MODE_LABELS: Record<string, string> = {
  freeform: 'Free-form',
  decision: 'Decision',
  reflection: 'Reflection',
  conflict: 'Conflict',
  ambition: 'Ambition',
  council: 'Council',
  journal: 'Journal',
}

const QUICK_ACTIONS = [
  { label: 'Go deeper', message: 'Please go deeper on this.' },
  { label: 'Be practical', message: "What's the most practical step I can take right now?" },
  { label: 'Challenge me', message: 'Challenge my thinking here. Where am I wrong or deceiving myself?' },
  { label: 'Summarize', message: 'Please summarize the key insights from our conversation so far.' },
]

const HOMEWORK_TYPE_LABELS: Record<string, string> = {
  reflection: 'Reflection',
  practice: 'Practice',
  reading: 'Reading',
  quiz: 'Quiz',
}

function HomeworkCard({ hw }: { hw: ParsedHomework }) {
  const [saved, setSaved] = useState(false)
  return (
    <div
      className="mt-4 px-4 py-4 fade-in"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--accent)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: '2px',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span
          className="sans text-xs tracking-wide uppercase px-2 py-0.5"
          style={{ background: 'var(--accent)', color: 'var(--background)', borderRadius: '2px', fontSize: '10px' }}
        >
          {HOMEWORK_TYPE_LABELS[hw.type] || hw.type}
        </span>
        {!saved ? (
          <button onClick={() => setSaved(true)} className="sans text-xs" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>
            Got it
          </button>
        ) : (
          <span className="sans text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>Saved</span>
        )}
      </div>
      <p className="text-sm font-normal mb-2" style={{ color: 'var(--foreground)' }}>{hw.title}</p>
      <p className="sans text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{hw.task}</p>
    </div>
  )
}

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [ending, setEnding] = useState(false)
  const [ended, setEnded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.session) {
          setSession(d.session)
          setEnded(d.session.status === 'ended')
          const existingMessages = (d.messages || []).map((m: { id: string; role: 'user' | 'assistant'; content: string }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
          setMessages(existingMessages)
          // Auto-send framing message if this is a fresh session
          if (existingMessages.length === 0) {
            const params = new URLSearchParams(window.location.search)
            const framing = params.get('framing')
            if (framing) {
              window.history.replaceState({}, '', `/session/${id}`)
              // Will be sent after session state is set, via a separate effect
              setInput(framing)
            }
          }
        }
        setSessionLoading(false)
      })
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-send framing message once session is loaded
  useEffect(() => {
    if (!sessionLoading && session && input && messages.length === 0 && !loading) {
      const timer = setTimeout(() => sendMessage(input), 300)
      return () => clearTimeout(timer)
    }
  }, [sessionLoading, session])

  const sendMessage = useCallback(async (overrideContent?: string) => {
    const content = overrideContent ?? input.trim()
    if (!content || loading || ended) return

    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', content }
    const assistantMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: '', streaming: true }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          conversationId: id,
          ...(session?.advisor_id ? { advisorId: session.advisor_id } : {}),
        }),
      })

      if (!response.body) throw new Error('No stream')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let finalContent = ''
      let finalHomework: ParsedHomework[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n').filter(Boolean)) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              finalContent = parsed.content
              setMessages(prev => prev.map(m =>
                m.id === assistantMsg.id ? { ...m, content: parsed.content } : m
              ))
            }
            if (parsed.homework) finalHomework = parsed.homework
          } catch {}
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id
          ? { ...m, content: finalContent, streaming: false, homework: finalHomework.length > 0 ? finalHomework : undefined }
          : m
      ))
    } catch (error) {
      console.error('Session chat error:', error)
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, id, session, ended])

  const handleEndSession = async () => {
    if (!confirm('End this session? You can return to read it, but it will be closed.')) return
    setEnding(true)
    await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ended' }),
    })
    setEnded(true)
    setEnding(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <p className="sans text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <p className="sans text-sm" style={{ color: 'var(--muted)' }}>Session not found.</p>
      </div>
    )
  }

  const advisorName = session.advisors?.name || 'Advisor'
  const advisorArchetype = session.advisors?.archetype

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--background)' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <Link href="/sessions" className="sans text-xs" style={{ color: 'var(--muted)' }}>← Sessions</Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
                {advisorName}
              </span>
              <span
                className="sans text-xs px-2 py-0.5"
                style={{
                  background: ended ? 'var(--surface-raised)' : 'var(--surface)',
                  color: ended ? 'var(--muted)' : 'var(--accent)',
                  border: '1px solid var(--border)',
                  borderRadius: '2px',
                  fontSize: '10px',
                }}
              >
                {MODE_LABELS[session.mode] || session.mode}
              </span>
              {ended && (
                <span className="sans text-xs" style={{ color: 'var(--muted)', opacity: 0.6 }}>ended</span>
              )}
            </div>
            {advisorArchetype && (
              <p className="sans text-xs" style={{ color: 'var(--muted)' }}>{advisorArchetype}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/sessions" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            History
          </Link>
          {!ended && (
            <button
              onClick={handleEndSession}
              disabled={ending}
              className="sans text-xs px-4 py-2"
              style={{ color: '#c47070', border: '1px solid var(--border)', borderRadius: '2px' }}
            >
              {ending ? 'Ending...' : 'End session'}
            </button>
          )}
          {ended && (
            <Link
              href={`/advisors${session.advisor_id ? '' : ''}`}
              className="sans text-xs px-4 py-2"
              style={{ background: 'var(--accent)', color: 'var(--background)', borderRadius: '2px' }}
            >
              New session
            </Link>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 && (
            <div className="fade-in text-center mt-16">
              <p className="text-base mb-3" style={{ color: 'var(--muted-foreground)' }}>
                {session.main_dilemma
                  ? `You brought: "${session.main_dilemma}"`
                  : `${advisorName} is ready.`}
              </p>
              {session.main_dilemma && (
                <p className="sans text-xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>
                  Begin when you are ready.
                </p>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`mb-8 fade-in ${msg.role === 'user' ? 'text-right' : ''}`}>
              {msg.role === 'user' ? (
                <div className="inline-block max-w-[80%]">
                  <p
                    className="sans text-sm px-4 py-3 text-left"
                    style={{ background: 'var(--surface-raised)', color: 'var(--foreground)', borderRadius: '2px', lineHeight: 1.65 }}
                  >
                    {msg.content}
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ color: 'var(--foreground)' }}>
                    {msg.content ? (
                      <p className={msg.streaming ? 'cursor-blink' : ''} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                        {msg.content}
                      </p>
                    ) : (
                      <p className="sans text-sm" style={{ color: 'var(--muted)' }}>
                        <span className="cursor-blink" />
                      </p>
                    )}
                  </div>
                  {!msg.streaming && msg.homework?.map((hw, i) => (
                    <HomeworkCard key={i} hw={hw} />
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick actions + Input */}
      <div className="px-4 pb-safe pb-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto">
          {/* Quick actions */}
          {!ended && messages.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 pb-2">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.message)}
                  disabled={loading}
                  className="sans text-xs px-3 py-1.5 transition-all"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--muted-foreground)',
                    borderRadius: '2px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {ended ? (
            <div className="pt-4 text-center">
              <p className="sans text-sm mb-4" style={{ color: 'var(--muted)' }}>This session has ended.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/sessions" className="sans text-sm px-5 py-2.5" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', borderRadius: '2px' }}>
                  All sessions
                </Link>
                <Link href="/advisors" className="sans text-sm px-5 py-2.5" style={{ background: 'var(--accent)', color: 'var(--background)', borderRadius: '2px' }}>
                  Start new session
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="flex items-end gap-3 px-4 py-3 mt-2"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px' }}
            >
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Speak freely..."
                rows={1}
                className="sans flex-1 bg-transparent outline-none resize-none text-sm"
                style={{ color: 'var(--foreground)', lineHeight: 1.6, maxHeight: '120px' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="sans text-xs tracking-wide px-3 py-1.5 transition-all flex-shrink-0"
                style={{
                  background: loading || !input.trim() ? 'transparent' : 'var(--accent)',
                  color: loading || !input.trim() ? 'var(--muted)' : 'var(--background)',
                  border: loading || !input.trim() ? '1px solid var(--border)' : 'none',
                  borderRadius: '2px',
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                Send
              </button>
            </div>
          )}
          {!ended && (
            <p className="sans text-xs text-center mt-2" style={{ color: 'var(--muted)', opacity: 0.4 }}>
              Enter to send · Shift+Enter for new line
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
