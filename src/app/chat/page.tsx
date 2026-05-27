'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId] = useState(() => uuidv4())
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const content = input.trim()
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
        }),
      })

      if (!response.body) throw new Error('No stream')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

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
              fullContent += parsed.content || ''
              setMessages(prev => prev.map(m =>
                m.id === assistantMsg.id ? { ...m, content: fullContent } : m
              ))
            } catch {}
          }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id ? { ...m, streaming: false } : m
      ))
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, conversationId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--background)' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/chat" className="text-lg font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
          Pascal
        </Link>
        <nav className="flex gap-6">
          <Link href="/mirror" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Mirror
          </Link>
          <Link href="/rituals" className="sans text-xs tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Rituals
          </Link>
        </nav>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 && (
            <div className="fade-in text-center mt-16">
              <p className="text-base mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Begin wherever you are.
              </p>
              <p className="sans text-xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>
                Pascal is listening.
              </p>
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
                <div className="prose-pascal" style={{ color: 'var(--foreground)' }}>
                  {msg.content ? (
                    <p className={msg.streaming && !msg.content.endsWith(' ') ? 'cursor-blink' : ''}>
                      {msg.content}
                    </p>
                  ) : (
                    <p className="sans text-sm" style={{ color: 'var(--muted)' }}>
                      <span className="cursor-blink" />
                    </p>
                  )}
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
              onClick={sendMessage}
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
