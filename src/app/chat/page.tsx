'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Feather,
  Menu,
  MoreHorizontal,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { AdvisorAvatar } from '@/components/advisor-avatar'
import { CouncilLogo } from '@/components/council-logo'
import { createClient } from '@/lib/supabase/client'
import { advisors } from '@/lib/council-data'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  remembered?: boolean
  streaming?: boolean
}

type Conversation = {
  id: string
  preview: string
  created_at: string
}

const QUICK_ACTIONS = ['Clarify', 'Challenge me', 'Be practical', 'Go deeper']

function ChatPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState(() => {
    const ritual = searchParams.get('ritual')
    const response = searchParams.get('response')
    return ritual && response ? `[Daily reflection: ${ritual}]\n\n${response}` : ''
  })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationId] = useState(() => uuidv4())

  const advisor = useMemo(() => {
    const requested = searchParams.get('advisor')
    return advisors.find((item) => item.id === requested) ?? advisors[0]
  }, [searchParams])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at')
        .eq('user_id', user.id)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!data) return
      const seen = new Set<string>()
      const recent: Conversation[] = []
      for (const message of data) {
        if (message.conversation_id && !seen.has(message.conversation_id)) {
          seen.add(message.conversation_id)
          recent.push({
            id: message.conversation_id,
            preview: message.content.slice(0, 62) + (message.content.length > 62 ? '...' : ''),
            created_at: message.created_at,
          })
        }
      }
      setConversations(recent.slice(0, 10))
    }

    init()
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
  }, [input])

  const sendMessage = useCallback(async () => {
    const content = input.trim()
    if (!content || loading) return

    const userMessage: ChatMessage = { id: uuidv4(), role: 'user', content }
    const assistantMessage: ChatMessage = { id: uuidv4(), role: 'assistant', content: '', streaming: true }
    const nextMessages = [...messages, userMessage]

    setMessages([...nextMessages, assistantMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
          conversationId,
          advisorId: advisor.id,
        }),
      })

      if (!response.ok || !response.body) throw new Error('Unable to start stream')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let streamed = ''
      let pending = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        pending += decoder.decode(value, { stream: true })
        const events = pending.split('\n\n')
        pending = events.pop() ?? ''

        for (const event of events) {
          const data = event.replace(/^data:\s*/, '')
          if (!data || data === '[DONE]') continue
          try {
            streamed += JSON.parse(data).content ?? ''
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id ? { ...message, content: streamed } : message
              )
            )
          } catch {
            // Ignore malformed partial events. The next complete SSE event continues the stream.
          }
        }
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessage.id ? { ...message, streaming: false } : message
        )
      )
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content: 'The room is quiet for a moment. Please try again.',
                streaming: false,
              }
            : message
        )
      )
    } finally {
      setLoading(false)
    }
  }, [advisor.id, conversationId, input, loading, messages])

  const applyQuickAction = (action: string) => {
    setInput((current) => current || `${action}: `)
    textareaRef.current?.focus()
  }

  const toggleRemembered = (id: string) => {
    setMessages((current) =>
      current.map((message) => message.id === id ? { ...message, remembered: !message.remembered } : message)
    )
  }

  return (
    <main className="flex h-screen min-h-[620px] overflow-hidden bg-[#0e0e0d] text-ivory">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[284px] flex-col border-r border-white/[0.07] bg-[#121210] p-4 transition-transform lg:static lg:translate-x-0 ${
          historyOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-1 py-2">
          <CouncilLogo href="/home" compact />
          <button onClick={() => setHistoryOpen(false)} className="text-mist lg:hidden" aria-label="Close history">
            <X size={18} />
          </button>
        </div>

        <Link href="/home" className="mt-6 flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-mist transition hover:bg-white/[0.03] hover:text-ivory">
          <ArrowLeft size={14} /> Leave the room
        </Link>

        <div className="mt-5 border-t border-white/[0.07] pt-5">
          <p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">Recent sessions</p>
          <div className="mt-3 space-y-1">
            {conversations.length > 0 ? conversations.map((conversation) => (
              <button key={conversation.id} className="w-full rounded-lg px-2 py-2.5 text-left transition hover:bg-white/[0.035]">
                <p className="line-clamp-2 text-xs leading-5 text-parchment/80">{conversation.preview}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-mist/50">
                  {new Date(conversation.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </button>
            )) : (
              <p className="px-2 py-2 text-xs leading-5 text-mist/60">This is a new thread. Your recent sessions will gather here.</p>
            )}
          </div>
        </div>

        <div className="mt-auto rounded-2xl border border-gold/15 bg-gold/[0.045] p-4">
          <div className="flex items-center gap-2 text-gold">
            <Feather size={14} strokeWidth={1.5} />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]">Remembered with care</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-mist">
            Mark any moment worth carrying forward. You can review each memory later.
          </p>
        </div>
      </aside>

      {historyOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/55 lg:hidden"
          onClick={() => setHistoryOpen(false)}
          aria-label="Close history"
        />
      )}

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[68px] flex-none items-center justify-between border-b border-white/[0.07] bg-[#11110f]/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setHistoryOpen(true)} className="text-mist lg:hidden" aria-label="Open session history">
              <Menu size={19} />
            </button>
            <AdvisorAvatar advisor={advisor} size="sm" active />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-serif text-lg leading-none text-ivory">{advisor.name}</p>
                <ChevronDown size={12} className="text-mist" />
              </div>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gold">{advisor.archetype}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden rounded-full border border-gold/15 bg-gold/5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-gold sm:inline">
              Decision
            </span>
            <button className="text-mist transition hover:text-gold" aria-label="More session actions">
              <MoreHorizontal size={19} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-[720px]">
            {messages.length === 0 ? (
              <div className="rise-in mx-auto max-w-lg pt-[7vh] text-center">
                <AdvisorAvatar advisor={advisor} size="xl" active />
                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">{advisor.archetype}</p>
                <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-ivory">A private room for a real question.</h1>
                <p className="mx-auto mt-5 max-w-md font-serif text-lg leading-8 text-parchment/75">
                  Tell me the situation. I will help you separate the noise from the thing that matters.
                </p>
                <div className="mx-auto mt-9 grid max-w-md gap-2 text-left sm:grid-cols-2">
                  {[
                    'I am facing a decision.',
                    'I need a clearer strategy.',
                    'Help me see what I am avoiding.',
                    'I want to reflect on what happened.',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3 text-xs leading-5 text-mist transition hover:border-gold/25 hover:text-parchment"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {messages.map((message) => (
                  <article key={message.id} className={`rise-in ${message.role === 'user' ? 'ml-auto max-w-[84%]' : 'max-w-[94%]'}`}>
                    {message.role === 'user' ? (
                      <div className="rounded-[18px] rounded-br-[5px] border border-white/[0.08] bg-white/[0.06] px-4 py-3">
                        <p className="text-sm leading-6 text-parchment/90 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ) : (
                      <div className="flex gap-3 sm:gap-4">
                        <AdvisorAvatar advisor={advisor} size="sm" />
                        <div className="min-w-0 flex-1 pt-1">
                          <p className={`font-serif text-[18px] leading-8 text-parchment/95 whitespace-pre-wrap ${message.streaming ? 'cursor-blink' : ''}`}>
                            {message.content || ' '}
                          </p>
                          {!message.streaming && (
                            <button
                              onClick={() => toggleRemembered(message.id)}
                              className={`mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                                message.remembered ? 'text-gold' : 'text-mist/55 hover:text-gold'
                              }`}
                            >
                              {message.remembered ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                              {message.remembered ? 'Remembered' : 'Remember this'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <footer className="flex-none border-t border-white/[0.07] bg-[#11110f] px-4 pb-safe pt-3 sm:px-6">
          <div className="mx-auto max-w-[720px]">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => applyQuickAction(action)}
                  className="whitespace-nowrap rounded-full border border-white/[0.09] bg-white/[0.025] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.11em] text-mist transition hover:border-gold/25 hover:text-gold"
                >
                  {action}
                </button>
              ))}
              <button className="flex items-center gap-1 whitespace-nowrap rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.11em] text-gold">
                <Sparkles size={11} /> Summarize
              </button>
            </div>
            <div className="flex items-end gap-3 rounded-[18px] border border-white/[0.1] bg-white/[0.035] p-3 focus-within:border-gold/35">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    sendMessage()
                  }
                }}
                rows={1}
                className="max-h-[150px] flex-1 resize-none bg-transparent text-sm leading-6 text-parchment outline-none placeholder:text-mist/55"
                placeholder={`Ask ${advisor.name}...`}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="grid h-9 w-9 flex-none place-items-center rounded-full bg-gold-light text-ink transition hover:bg-[#ecd09f] disabled:cursor-not-allowed disabled:bg-white/[0.07] disabled:text-mist/50"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] tracking-wide text-mist/45">
              This is reflective guidance, not therapy or emergency support.
            </p>
          </div>
        </footer>
      </section>
    </main>
  )
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  )
}
