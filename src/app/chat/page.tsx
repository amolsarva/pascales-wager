'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'
import { MENTORS, type MentorId, type ParsedHomework } from '@/lib/mentors/personas'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  homework?: ParsedHomework[]
}

const MENTOR_IDS: MentorId[] = ['socrates', 'aristotle', 'epictetus', 'pascale']

const HOMEWORK_TYPE_LABELS: Record<string, string> = {
  reflection: 'Reflection',
  practice: 'Practice',
  reading: 'Reading',
  quiz: 'Quiz',
}

function HomeworkCard({ hw, onSaved }: { hw: ParsedHomework; onSaved?: () => void }) {
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    // Homework is already saved server-side; this just gives visual feedback
    setSaved(true)
    onSaved?.()
  }

  return (
    <div
      className="mt-4 px-4 py-4 fade-in"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--accent)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: '2px',
        opacity: 0.95,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span
          className="sans text-xs tracking-wide uppercase px-2 py-0.5"
          style={{
            background: 'var(--accent)',
            color: 'var(--background)',
            borderRadius: '2px',
            fontSize: '10px',
            letterSpacing: '0.08em',
          }}
        >
          {HOMEWORK_TYPE_LABELS[hw.type] || hw.type}
        </span>
        {!saved && (
          <button
            onClick={handleSave}
            className="sans text-xs"
            style={{ color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Got it
          </button>
        )}
        {saved && (
          <span className="sans text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
            Saved to homework
          </span>
        )}
      </div>
      <p className="text-sm font-normal mb-2" style={{ color: 'var(--foreground)' }}>
        {hw.title}
      </p>
      <p className="sans text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
        {hw.task}
      </p>
    </div>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId] = useState(() => uuidv4())
  const [currentMentor, setCurrentMentor] = useState<MentorId>('pascale')
  const [showMentorSwitch, setShowMentorSwitch] = useState(false)
  const [switchingMentor, setSwitchingMentor] = useState(false)
  const [advisorId, setAdvisorId] = useState<string | null>(null)
  const [advisorName, setAdvisorName] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const supabase = createClient()

    // Check for advisor in URL params
    const params = new URLSearchParams(window.location.search)
    const aid = params.get('advisorId')
    if (aid) {
      setAdvisorId(aid)
      supabase
        .from('advisors')
        .select('name')
        .eq('id', aid)
        .single()
        .then(({ data }) => { if (data?.name) setAdvisorName(data.name) })
    }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('mentor_id')
        .eq('id', user.id)
        .single()
      if (data?.mentor_id) setCurrentMentor(data.mentor_id as MentorId)
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle ritual query params
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const ritual = params.get('ritual')
    const response = params.get('response')
    if (ritual && response) {
      const combinedContent = `Daily Examen reflection —\n\nPrompt: "${ritual}"\n\nMy response: ${response}`
      // Clear params then auto-send
      window.history.replaceState({}, '', '/chat')
      setTimeout(() => {
        setInput(combinedContent)
      }, 100)
    }
  }, [])

  const switchMentor = async (mentorId: MentorId) => {
    setSwitchingMentor(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('users')
        .update({ mentor_id: mentorId })
        .eq('id', user.id)
    }
    setCurrentMentor(mentorId)
    setShowMentorSwitch(false)
    setSwitchingMentor(false)
    const switchMsg: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: `You are now speaking with ${MENTORS[mentorId].name}. ${MENTORS[mentorId].tagline}.`,
    }
    setMessages(prev => [...prev, switchMsg])
  }

  const sendMessage = useCallback(async (overrideContent?: string) => {
    const content = overrideContent ?? input.trim()
    if (!content || loading) return

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
          conversationId,
          ...(advisorId ? { advisorId } : {}),
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
        const lines = chunk.split('\n').filter(Boolean)

        for (const line of lines) {
          if (line.startsWith('data: ')) {
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
              if (parsed.homework) {
                finalHomework = parsed.homework
              }
            } catch {}
          }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id
          ? { ...m, content: finalContent, streaming: false, homework: finalHomework.length > 0 ? finalHomework : undefined }
          : m
      ))
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, conversationId, advisorId])

  // Auto-send when input is set via ritual params
  useEffect(() => {
    if (input && !loading && messages.length === 0) {
      const timer = setTimeout(() => sendMessage(input), 300)
      return () => clearTimeout(timer)
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const mentor = MENTORS[currentMentor]
  const displayName = advisorName || mentor.name

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--background)' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="relative">
          {advisorId ? (
            <div className="flex items-center gap-3">
              <Link href="/advisors" className="sans text-xs" style={{ color: 'var(--muted)' }}>← Advisors</Link>
              <span className="text-lg font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
                {displayName}
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowMentorSwitch(v => !v)}
                className="flex items-center gap-2 transition-opacity hover:opacity-80"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <span className="text-lg font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
                  {displayName}
                </span>
                <span className="sans text-xs" style={{ color: 'var(--muted)' }}>
                  ↕
                </span>
              </button>

              {showMentorSwitch && (
                <div
                  className="absolute top-full left-0 mt-2 z-50 w-64"
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: '2px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                >
                  {MENTOR_IDS.map(id => {
                    const m = MENTORS[id]
                    return (
                      <button
                        key={id}
                        onClick={() => switchMentor(id)}
                        disabled={switchingMentor}
                        className="w-full text-left px-4 py-3 transition-all"
                        style={{
                          background: id === currentMentor ? 'var(--surface)' : 'transparent',
                          borderBottom: '1px solid var(--border)',
                          cursor: switchingMentor ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="sans text-sm" style={{ color: 'var(--foreground)' }}>{m.name}</span>
                          {id === currentMentor && (
                            <span className="sans text-xs" style={{ color: 'var(--accent)' }}>active</span>
                          )}
                        </div>
                        <p className="sans text-xs mt-0.5" style={{ color: 'var(--muted)', lineHeight: 1.4 }}>
                          {m.tagline}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <nav className="flex gap-6">
          <Link href="/home" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Home
          </Link>
          <Link href="/advisors" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Advisors
          </Link>
          <Link href="/homework" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Homework
          </Link>
          <Link href="/mirror" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Mirror
          </Link>
        </nav>
      </header>

      {/* Click outside to close mentor switcher */}
      {showMentorSwitch && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMentorSwitch(false)}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 && (
            <div className="fade-in text-center mt-16">
              {!advisorId && (
                <p className="text-xs uppercase tracking-widest mb-4 sans" style={{ color: 'var(--accent)', opacity: 0.5 }}>
                  {mentor.era}
                </p>
              )}
              <p className="text-base mb-3" style={{ color: 'var(--muted-foreground)' }}>
                {advisorId ? displayName : mentor.tagline}
              </p>
              {!advisorId && (
                <p className="sans text-xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>
                  {mentor.approach}
                </p>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-8 fade-in ${msg.role === 'user' ? 'text-right' : ''}`}
            >
              {msg.role === 'user' ? (
                <div className="inline-block max-w-[80%]">
                  <p
                    className="sans text-sm px-4 py-3 text-left"
                    style={{
                      background: 'var(--surface-raised)',
                      color: 'var(--foreground)',
                      borderRadius: '2px',
                      lineHeight: 1.65,
                    }}
                  >
                    {msg.content}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="prose-pascal" style={{ color: 'var(--foreground)' }}>
                    {msg.content ? (
                      <p className={msg.streaming ? 'cursor-blink' : ''} style={{ whiteSpace: 'pre-wrap' }}>
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

      {/* Input */}
      <div className="px-4 pb-safe pb-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto pt-4">
          <div
            className="flex items-end gap-3 px-4 py-3"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Speak freely..."
              rows={1}
              className="sans flex-1 bg-transparent outline-none resize-none text-sm"
              style={{
                color: 'var(--foreground)',
                lineHeight: 1.6,
                maxHeight: '120px',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="sans text-xs tracking-wide px-3 py-1.5 transition-all duration-200 flex-shrink-0"
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
          <p className="sans text-xs text-center mt-2" style={{ color: 'var(--muted)', opacity: 0.4 }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
