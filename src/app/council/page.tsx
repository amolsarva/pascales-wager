'use client'

import { useEffect, useState } from 'react'
import {
  Check,
  Feather,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { AdvisorAvatar } from '@/components/advisor-avatar'
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

type StoredRoom = {
  id: string
  rounds: CouncilRound[]
}

const prototypeRoomKey = 'the-council-prototype-room'
const suggestedQuestions = [
  'What am I avoiding because it would force a real decision?',
  'Where am I spending energy without changing the outcome?',
  'What deserves my attention this week?',
]

function readStoredRoom(): StoredRoom {
  try {
    const storedRoom = window.localStorage.getItem(prototypeRoomKey)
    if (storedRoom) {
      const parsed = JSON.parse(storedRoom) as StoredRoom
      if (parsed.id && Array.isArray(parsed.rounds)) return parsed
    }
  } catch {
    // Start a fresh room if browser storage is unavailable or malformed.
  }

  return { id: uuidv4(), rounds: [] }
}

export default function CouncilPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['damon', 'mara', 'elis'])
  const [question, setQuestion] = useState('')
  const [room, setRoom] = useState<StoredRoom>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRoom = async () => {
      await Promise.resolve()
      setRoom(readStoredRoom())
    }

    loadRoom()
  }, [])

  useEffect(() => {
    if (!room) return
    window.localStorage.setItem(prototypeRoomKey, JSON.stringify(room))
  }, [room])

  const toggleAdvisor = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.length === 2 ? current : current.filter((advisorId) => advisorId !== id)
      }
      return current.length === 5 ? current : [...current, id]
    })
  }

  const startNewThread = () => {
    setRoom({ id: uuidv4(), rounds: [] })
    setQuestion('')
    setError('')
  }

  const askCouncil = async () => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || !room || loading || selectedIds.length < 2) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmedQuestion,
          advisorIds: selectedIds,
          rounds: room.rounds,
        }),
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'The Council could not answer just now.')

      setRoom((current) => current
        ? { ...current, rounds: [...current.rounds, data.round] }
        : current)
      setQuestion('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The Council could not answer just now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-grain min-h-screen bg-[#131310]">
      <header className="border-b border-white/[0.07] bg-[#11110f]/95 px-5 py-4 backdrop-blur-xl sm:px-7">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
          <CouncilLogo href="/council" compact />
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-mist sm:flex">
              <Feather size={13} className="text-gold" />
              Prototype · remembered on this browser
            </span>
            <button onClick={startNewThread} className="button-secondary !px-3 !py-2">
              <RotateCcw size={12} /> New thread
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-7 lg:py-11">
        <section className="max-w-3xl">
          <p className="eyebrow">The Council room</p>
          <h1 className="mt-4 font-serif text-4xl tracking-[-0.045em] text-ivory sm:text-5xl">
            Bring the question.
            <span className="block italic text-gold-light">Let the voices disagree.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-mist">
            This prototype does one thing: it keeps a private thread on this browser, invites several advisors into each question, and carries the earlier conversation into the next answer.
          </p>
        </section>

        <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_292px]">
          <section className="space-y-6">
            {!room ? (
              <div className="glass-card-raised flex min-h-[220px] items-center justify-center p-7 text-gold">
                <LoaderCircle className="animate-spin" size={22} />
              </div>
            ) : room.rounds.length === 0 ? (
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
              room.rounds.map((round, roundIndex) => (
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
                {room?.rounds.length ? 'Continue the conversation' : 'Ask the Council'}
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
                  {room?.rounds.length
                    ? `${room.rounds.length} earlier ${room.rounds.length === 1 ? 'round is' : 'rounds are'} carried into the next answer.`
                    : 'Choose two or more advisors. Use Command + Enter to send.'}
                </p>
                <button
                  onClick={askCouncil}
                  disabled={!question.trim() || !room || loading || selectedIds.length < 2}
                  className="button-primary flex-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? 'Considering...' : room?.rounds.length ? 'Ask the follow-up' : 'Ask the Council'}
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
              For now, the room is the product. Threads remain in this browser until you start a new one.
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
