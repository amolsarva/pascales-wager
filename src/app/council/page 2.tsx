'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { AdvisorAvatar } from '@/components/advisor-avatar'
import { AppNavigation } from '@/components/app-navigation'
import { CouncilLogo } from '@/components/council-logo'
import { advisors } from '@/lib/council-data'

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

const DEVELOPER_ROOM_KEY = 'the-council-developer-room'

export default function CouncilPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['damon', 'mara', 'elis'])
  const [question, setQuestion] = useState('')
  const [conversationId, setConversationId] = useState('')
  const [rounds, setRounds] = useState<CouncilRound[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadHistory = async () => {
      const storedConversationId = window.localStorage.getItem(DEVELOPER_ROOM_KEY)
      const roomId = storedConversationId || uuidv4()

      window.localStorage.setItem(DEVELOPER_ROOM_KEY, roomId)
      setConversationId(roomId)

      try {
        const response = await fetch(`/api/council?conversationId=${roomId}`)
        if (response.status === 401) {
          setAuthRequired(true)
          return
        }

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load this room')
        setRounds(data.rounds || [])
      } catch (historyError) {
        setError(historyError instanceof Error ? historyError.message : 'Unable to load this room')
      } finally {
        setHistoryLoading(false)
      }
    }

    loadHistory()
  }, [])

  const toggleAdvisor = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.length === 2 ? current : current.filter((advisorId) => advisorId !== id)
      }
      return current.length === 5 ? current : [...current, id]
    })
  }

  const startNewThread = () => {
    const roomId = uuidv4()
    window.localStorage.setItem(DEVELOPER_ROOM_KEY, roomId)
    setConversationId(roomId)
    setRounds([])
    setQuestion('')
    setError('')
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
        throw new Error('Sign in once to use your private developer room.')
      }

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'The Council could not answer just now')

      setRounds((current) => [...current, data.round])
      setQuestion('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The Council could not answer just now')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-grain min-h-screen bg-[#131310] pb-24 lg:pl-[238px] lg:pb-0">
      <AppNavigation active="council" />
      <header className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 lg:hidden">
        <CouncilLogo href="/home" compact />
        <Link href="/home" className="text-mist"><ArrowLeft size={18} /></Link>
      </header>

      <div className="mx-auto max-w-[1050px] px-5 py-8 md:px-8 lg:px-10 lg:py-11">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/20 bg-gold/5 text-gold">
                <UsersRound size={17} strokeWidth={1.5} />
              </span>
              <p className="eyebrow">Developer room</p>
            </div>
            <h1 className="mt-5 font-serif text-4xl tracking-[-0.04em] text-ivory sm:text-5xl">
              One thread.
              <span className="block italic text-gold-light">Several honest voices.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-mist">
              Ask a question, hear each advisor answer from a distinct point of view, then continue. This room carries earlier rounds and remembered themes forward.
            </p>
          </div>
          <button onClick={startNewThread} className="button-secondary w-fit">
            <RotateCcw size={13} /> New thread
          </button>
        </section>

        {authRequired ? (
          <section className="glass-card-raised mt-9 max-w-2xl p-6 sm:p-7">
            <p className="eyebrow">Private room</p>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-ivory">Sign in once, then stay with the conversation.</h2>
            <p className="mt-3 text-sm leading-6 text-mist">
              This prototype keeps one developer room private. After sign-in, your questions, advisor answers, and remembered threads persist between visits.
            </p>
            <Link href="/auth/login" className="button-primary mt-6 w-fit">
              Enter the room
            </Link>
          </section>
        ) : (
          <>
            <div className="mt-9 grid gap-5 xl:grid-cols-[1fr_290px]">
              <section className="space-y-6">
                {historyLoading ? (
                  <div className="glass-card-raised flex min-h-[220px] items-center justify-center p-7 text-gold">
                    <LoaderCircle className="animate-spin" size={22} />
                  </div>
                ) : rounds.length === 0 ? (
                  <div className="glass-card-raised p-6 sm:p-8">
                    <p className="eyebrow">Begin here</p>
                    <h2 className="mt-3 max-w-xl font-serif text-3xl tracking-[-0.03em] text-ivory">
                      What is the real question underneath the noise?
                    </h2>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-mist">
                      This is intentionally small: one persistent room, your chosen advisors, and enough memory to make the next exchange more useful than the first.
                    </p>
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
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold">Recommended action</p>
                                <p className="mt-2 text-sm leading-6 text-parchment/80">{round.synthesis.recommendedAction}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold">Yours to decide</p>
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
                    {rounds.length > 0 ? 'Continue the conversation' : 'What would you like the Council to help you see?'}
                  </p>
                  <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    rows={5}
                    className="mt-4 w-full resize-none bg-transparent font-serif text-2xl leading-9 text-parchment outline-none placeholder:text-mist/40"
                    placeholder="Name the decision, conflict, or question..."
                  />
                  {error && <p className="mt-3 text-xs leading-5 text-[#d28e7d]">{error}</p>}
                  <div className="mt-5 flex flex-col justify-between gap-4 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center">
                    <p className="text-xs leading-5 text-mist">
                      Earlier rounds in this thread and remembered questions from prior threads inform the next answer.
                    </p>
                    <button
                      onClick={askCouncil}
                      disabled={!question.trim() || !conversationId || loading || selectedIds.length < 2}
                      className="button-primary flex-none disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {loading ? 'Considering...' : rounds.length > 0 ? 'Ask the follow-up' : 'Ask the Council'}
                      {loading ? <LoaderCircle className="animate-spin" size={13} /> : <Send size={13} />}
                    </button>
                  </div>
                </section>
              </section>

              <aside className="glass-card h-fit p-5 xl:sticky xl:top-6">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">In this room</p>
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
                  For this prototype, the Council room is the product. Advisor customization and richer profiles can wait.
                </p>
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
