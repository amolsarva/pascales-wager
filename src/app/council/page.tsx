'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  Feather,
  LoaderCircle,
  Menu,
  RotateCcw,
  Send,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { AdvisorAvatar } from '@/components/advisor-avatar'
import { AppNavigation } from '@/components/app-navigation'
import { CouncilLogo } from '@/components/council-logo'
import { advisors } from '@/lib/council-data'
import { createClient } from '@/lib/supabase/client'
import type { SessionSummary } from '@/lib/sessions/summaries'

type CouncilAdvisorResponse = {
  advisorId: string
  content: string
}

type CouncilSynthesis = {
  headline: string
  synthesis: string
  recommendedAction: string
  openQuestion: string
}

type CouncilRound = {
  id: string
  question: string
  responses: CouncilAdvisorResponse[]
  synthesis?: CouncilSynthesis
  createdAt: string
}

type CouncilThread = {
  id: string
  title: string
  preview: string
  created_at: string
  updated_at: string
}

const suggestedQuestions = [
  'What am I avoiding because it would force a real decision?',
  'Where am I spending energy without changing the outcome?',
  'What deserves my attention this week?',
]

function formatThreadDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function CouncilPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeConversationId = searchParams.get('conversation')

  const [selectedIds, setSelectedIds] = useState<string[]>(['damon', 'mara', 'elis'])
  const [question, setQuestion] = useState('')
  const [conversationId, setConversationId] = useState(activeConversationId || uuidv4())
  const [rounds, setRounds] = useState<CouncilRound[]>([])
  const [threads, setThreads] = useState<CouncilThread[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [threadsLoading, setThreadsLoading] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [authRequired, setAuthRequired] = useState(false)
  const [error, setError] = useState('')
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const selectedAdvisorNames = useMemo(
    () => selectedIds
      .map((id) => advisors.find((advisor) => advisor.id === id)?.name)
      .filter(Boolean)
      .join(', '),
    [selectedIds]
  )

  const loadThreads = useCallback(async () => {
    setThreadsLoading(true)
    try {
      const response = await fetch('/api/council')
      if (response.status === 401) {
        setAuthRequired(true)
        return
      }

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load Council threads.')
      setThreads(data.conversations || [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load Council threads.')
    } finally {
      setThreadsLoading(false)
    }
  }, [])

  const loadThread = useCallback(async (threadId: string) => {
    setHistoryLoading(true)
    setError('')
    setSessionSummary(null)

    try {
      const response = await fetch(`/api/council?conversationId=${encodeURIComponent(threadId)}`)
      if (response.status === 401) {
        setAuthRequired(true)
        return
      }

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to open this Council thread.')
      setRounds(data.rounds || [])
      const summaryResponse = await fetch(`/api/session-summaries?sessionId=${encodeURIComponent(threadId)}`)
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setSessionSummary(summaryData.summary || null)
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to open this Council thread.')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setAuthRequired(true)
        setHistoryLoading(false)
        setThreadsLoading(false)
        return
      }

      await loadThreads()
    }

    init()
  }, [loadThreads])

  useEffect(() => {
    if (authRequired) return

    if (!activeConversationId) {
      setHistoryLoading(false)
      return
    }

    setConversationId(activeConversationId)
    loadThread(activeConversationId)
  }, [activeConversationId, authRequired, loadThread])

  const toggleAdvisor = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.length === 2 ? current : current.filter((advisorId) => advisorId !== id)
      }
      return current.length === 5 ? current : [...current, id]
    })
  }

  const startNewThread = () => {
    const nextConversationId = uuidv4()
    setConversationId(nextConversationId)
    setRounds([])
    setQuestion('')
    setError('')
    setSessionSummary(null)
    setHistoryOpen(false)
    router.replace('/council')
  }

  const openThread = (threadId: string) => {
    setConversationId(threadId)
    setHistoryOpen(false)
    router.push(`/council?conversation=${threadId}`)
  }

  const askCouncil = async () => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || !conversationId || loading || selectedIds.length < 2) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmedQuestion,
          conversationId,
          advisorIds: selectedIds,
        }),
      })

      if (response.status === 401) {
        setAuthRequired(true)
        throw new Error('Sign in to use your private Council room.')
      }

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'The Council could not answer just now.')

      setRounds((current) => [...current, data.round])
      setQuestion('')
      router.replace(`/council?conversation=${conversationId}`)
      loadThreads()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The Council could not answer just now.')
    } finally {
      setLoading(false)
    }
  }

  const summarizeThread = async () => {
    if (summaryLoading || loading || rounds.length === 0) return

    setSummaryLoading(true)
    setError('')

    try {
      const response = await fetch('/api/session-summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: conversationId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to summarize this Council thread.')
      setSessionSummary(data.summary)
      loadThreads()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to summarize this Council thread.')
    } finally {
      setSummaryLoading(false)
    }
  }

  return (
    <main className="page-grain min-h-screen bg-[#131310] pb-24 lg:pl-[238px] lg:pb-0">
      <AppNavigation active="council" />

      <header className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 lg:hidden">
        <button onClick={() => setHistoryOpen(true)} className="text-mist" aria-label="Open Council threads">
          <Menu size={19} />
        </button>
        <CouncilLogo href="/home" compact />
        <Link href="/home" className="text-mist" aria-label="Leave Council">
          <ArrowLeft size={18} />
        </Link>
      </header>

      {historyOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/55 xl:hidden"
          onClick={() => setHistoryOpen(false)}
          aria-label="Close Council threads"
        />
      )}

      <div className="mx-auto grid max-w-[1260px] gap-6 px-5 py-8 md:px-8 lg:px-10 lg:py-11 xl:grid-cols-[270px_1fr]">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[284px] flex-col border-r border-white/[0.07] bg-[#121210] p-4 transition-transform lg:left-[238px] xl:static xl:z-auto xl:h-fit xl:w-auto xl:translate-x-0 xl:rounded-[22px] xl:border xl:bg-white/[0.02] ${
            historyOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-1 py-2 xl:hidden">
            <CouncilLogo href="/home" compact />
            <button onClick={() => setHistoryOpen(false)} className="text-mist" aria-label="Close Council threads">
              <X size={18} />
            </button>
          </div>

          <button
            onClick={startNewThread}
            className="mt-5 flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-gold transition hover:bg-gold/[0.06] xl:mt-0"
          >
            <Feather size={14} /> New Council thread
          </button>

          <div className="mt-5 border-t border-white/[0.07] pt-5">
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">Council threads</p>
            <div className="mt-3 space-y-1">
              {threadsLoading ? (
                <p className="px-2 py-2 text-xs leading-5 text-mist/60">Reading saved Council threads...</p>
              ) : threads.length > 0 ? threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => openThread(thread.id)}
                  className={`w-full rounded-lg px-2 py-2.5 text-left transition hover:bg-white/[0.035] ${
                    thread.id === conversationId ? 'bg-gold/[0.07]' : ''
                  }`}
                >
                  <p className="line-clamp-2 font-serif text-sm leading-5 text-parchment/85">{thread.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs leading-5 text-mist/60">{thread.preview}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-mist/50">
                    {formatThreadDate(thread.updated_at || thread.created_at)}
                  </p>
                </button>
              )) : (
                <p className="px-2 py-2 text-xs leading-5 text-mist/60">No saved Council threads yet.</p>
              )}
            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-gold/15 bg-gold/[0.045] p-4 xl:mt-6">
            <div className="flex items-center gap-2 text-gold">
              <UsersRound size={14} strokeWidth={1.5} />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]">Persisted Council</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-mist">
              Questions, advisor replies, and syntheses now save into your private record.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/20 bg-gold/5 text-gold">
                  <UsersRound size={17} strokeWidth={1.5} />
                </span>
                <p className="eyebrow">The Council room</p>
              </div>
              <h1 className="mt-5 font-serif text-4xl tracking-[-0.04em] text-ivory sm:text-5xl">
                Bring the question.
                <span className="block italic text-gold-light">Let the voices disagree.</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-mist">
                Ask several advisors at once, keep the thread, and let earlier Council rounds inform the next answer.
              </p>
            </div>
            <button onClick={startNewThread} className="button-secondary hidden w-fit xl:inline-flex">
              <RotateCcw size={13} /> New thread
            </button>
          </section>

          {authRequired ? (
            <section className="glass-card-raised mt-9 max-w-2xl p-6 sm:p-7">
              <p className="eyebrow">Private room</p>
              <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-ivory">Sign in once, then stay with the conversation.</h2>
              <p className="mt-3 text-sm leading-6 text-mist">
                Council threads are now stored privately, so you need an account before the room can remember what was said.
              </p>
              <Link href="/auth/login" className="button-primary mt-6 w-fit">
                Enter the room
              </Link>
            </section>
          ) : (
            <div className="mt-9 grid gap-5 xl:grid-cols-[1fr_290px]">
              <section className="space-y-6">
                {historyLoading ? (
                  <div className="glass-card-raised flex min-h-[220px] items-center justify-center p-7 text-gold">
                    <LoaderCircle className="animate-spin" size={22} />
                  </div>
                ) : rounds.length === 0 ? (
                  <div className="glass-card-raised p-6 sm:p-8">
                    <p className="eyebrow">Begin anywhere</p>
                    <h2 className="mt-3 max-w-xl font-serif text-3xl tracking-[-0.03em] text-ivory">
                      What is worth sitting with for a few minutes?
                    </h2>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-mist">
                      Ask about work, a decision, a conflict, a pattern, or the thing you keep circling without naming.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {suggestedQuestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setQuestion(suggestion)}
                          className="rounded-full border border-white/[0.09] bg-white/[0.025] px-3 py-2 text-left text-xs leading-5 text-parchment/75 transition hover:border-gold/30 hover:text-ivory"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  rounds.map((round, roundIndex) => (
                    <article key={round.id} className="space-y-3">
                      <div className="rounded-[20px] border border-gold/15 bg-[#211e18] p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                          <p className="eyebrow">Your question</p>
                          <p className="text-[10px] uppercase tracking-[0.12em] text-mist/60">Round {roundIndex + 1}</p>
                        </div>
                        <h2 className="mt-3 max-w-3xl font-serif text-2xl leading-8 text-parchment">{round.question}</h2>
                      </div>

                      {round.responses.map(({ advisorId, content }) => {
                        const advisor = advisors.find((item) => item.id === advisorId)
                        if (!advisor) return null

                        return (
                          <article key={`${round.id}-${advisor.id}`} className="advisor-card p-5 sm:p-6">
                            <div className="flex gap-4">
                              <AdvisorAvatar advisor={advisor} size="md" active />
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-serif text-xl text-ivory">{advisor.name}</h3>
                                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-gold">{advisor.archetype}</span>
                                </div>
                                <p className="mt-3 whitespace-pre-wrap font-serif text-lg leading-8 text-parchment/90">{content}</p>
                              </div>
                            </div>
                          </article>
                        )
                      })}

                      {round.synthesis && (
                        <article className="relative overflow-hidden rounded-[22px] border border-gold/25 bg-[#272117] p-5 sm:p-7">
                          <div className="absolute -right-8 -top-10 h-44 w-44 rounded-full bg-gold/10 blur-[50px]" />
                          <div className="relative">
                            <div className="flex items-center gap-2 text-gold">
                              <Sparkles size={16} strokeWidth={1.5} />
                              <p className="eyebrow">Council synthesis</p>
                            </div>
                            <h3 className="mt-5 font-serif text-3xl tracking-[-0.03em] text-ivory">{round.synthesis.headline}</h3>
                            <p className="mt-4 max-w-3xl whitespace-pre-wrap font-serif text-lg leading-8 text-parchment/85">
                              {round.synthesis.synthesis}
                            </p>
                            <div className="mt-6 grid gap-3 border-t border-gold/15 pt-5 sm:grid-cols-2">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold">Try next</p>
                                <p className="mt-2 text-sm leading-6 text-parchment/80">{round.synthesis.recommendedAction}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold">Still yours to answer</p>
                                <p className="mt-2 text-sm leading-6 text-parchment/80">{round.synthesis.openQuestion}</p>
                              </div>
                            </div>
                          </div>
                        </article>
                      )}
                    </article>
                  ))
                )}

                <section className="glass-card-raised p-5 sm:p-7">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
                    {rounds.length > 0 ? 'Continue the conversation' : 'Ask the Council'}
                  </p>
                  <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') askCouncil()
                    }}
                    rows={5}
                    className="mt-4 w-full resize-none bg-transparent font-serif text-2xl leading-9 text-parchment outline-none placeholder:text-mist/40"
                    placeholder="Name the decision, conflict, or pattern..."
                  />
                  {error && <p className="mt-3 text-xs leading-5 text-[#d28e7d]">{error}</p>}
                  <div className="mt-5 flex flex-col justify-between gap-4 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center">
                    <p className="text-xs leading-5 text-mist">
                      {rounds.length
                        ? `${rounds.length} earlier ${rounds.length === 1 ? 'round is' : 'rounds are'} carried into the next answer.`
                        : `Selected advisors: ${selectedAdvisorNames || 'choose at least two'}. Use Command + Enter to send.`}
                    </p>
                    <button
                      onClick={askCouncil}
                      disabled={!question.trim() || !conversationId || loading || selectedIds.length < 2}
                      className="button-primary flex-none disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {loading ? 'Considering...' : rounds.length ? 'Ask the follow-up' : 'Ask the Council'}
                      {loading ? <LoaderCircle className="animate-spin" size={13} /> : <Send size={13} />}
                    </button>
                  </div>
                </section>
              </section>

              <aside className="glass-card h-fit p-5 xl:sticky xl:top-6">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">At the table</p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-mist">{selectedIds.length} selected</p>
                </div>
                <div className="mt-4 space-y-2">
                  {advisors.map((advisor) => {
                    const selected = selectedIds.includes(advisor.id)
                    return (
                      <button
                        key={advisor.id}
                        onClick={() => toggleAdvisor(advisor.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                          selected
                            ? 'border-gold/25 bg-gold/[0.07]'
                            : 'border-white/[0.06] bg-white/[0.015] opacity-65 hover:opacity-100'
                        }`}
                      >
                        <AdvisorAvatar advisor={advisor} size="sm" active={selected} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-serif text-base text-ivory">{advisor.name}</span>
                          <span className="mt-0.5 block truncate text-[9px] font-bold uppercase tracking-[0.13em] text-mist">{advisor.archetype}</span>
                        </span>
                        {selected && <Check size={14} className="text-gold" />}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-5 border-t border-white/[0.07] pt-4 text-xs leading-5 text-mist">
                  Choose two to five advisors. The saved thread keeps prior rounds available for the next Council answer.
                </p>

                <div className="mt-5 border-t border-white/[0.07] pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="eyebrow">Thread summary</p>
                    <button
                      onClick={summarizeThread}
                      disabled={summaryLoading || loading || rounds.length === 0}
                      className="text-[10px] font-bold uppercase tracking-[0.12em] text-gold transition hover:text-gold-light disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {summaryLoading ? 'Writing...' : sessionSummary ? 'Refresh' : 'Create'}
                    </button>
                  </div>
                  {sessionSummary ? (
                    <div className="mt-4 space-y-3">
                      <p className="line-clamp-6 text-xs leading-5 text-parchment/80">{sessionSummary.summary}</p>
                      {sessionSummary.follow_up_question && (
                        <p className="rounded-2xl border border-gold/15 bg-gold/[0.045] p-3 text-xs leading-5 text-mist">
                          {sessionSummary.follow_up_question}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs leading-5 text-mist/60">
                      Save a compact record of key points, next actions, and what to ask next.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function CouncilPage() {
  return (
    <Suspense>
      <CouncilPageInner />
    </Suspense>
  )
}
