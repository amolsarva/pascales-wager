'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  RotateCcw,
  Send,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { AdvisorAvatar } from '@/components/advisor-avatar'
import { AppNavigation } from '@/components/app-navigation'
import { CouncilLogo } from '@/components/council-logo'
import { advisors, councilResponses } from '@/lib/council-data'

export default function CouncilPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['damon', 'mara', 'elis'])
  const [question, setQuestion] = useState('Should I leave my job and finally build the company I keep thinking about?')
  const [hasAsked, setHasAsked] = useState(false)

  const selectedAdvisors = useMemo(
    () => advisors.filter((advisor) => selectedIds.includes(advisor.id)),
    [selectedIds]
  )

  const toggleAdvisor = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.length === 2 ? current : current.filter((advisorId) => advisorId !== id)
      }
      return current.length === 5 ? current : [...current, id]
    })
  }

  return (
    <main className="page-grain min-h-screen bg-[#131310] pb-24 lg:pl-[238px] lg:pb-0">
      <AppNavigation active="council" />
      <header className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 lg:hidden">
        <CouncilLogo href="/home" compact />
        <Link href="/home" className="text-mist"><ArrowLeft size={18} /></Link>
      </header>

      <div className="mx-auto max-w-[1050px] px-5 py-8 md:px-8 lg:px-10 lg:py-11">
        <section className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/20 bg-gold/5 text-gold">
              <UsersRound size={17} strokeWidth={1.5} />
            </span>
            <p className="eyebrow">Council mode</p>
          </div>
          <h1 className="mt-5 font-serif text-4xl tracking-[-0.04em] text-ivory sm:text-5xl">
            Bring one question.
            <span className="block italic text-gold-light">Invite several minds.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-mist">
            Each advisor will answer from their own commitments. The Council will then show you the agreement, the tension, and the decision that remains yours.
          </p>
        </section>

        {!hasAsked ? (
          <div className="mt-9 grid gap-5 xl:grid-cols-[1fr_290px]">
            <section className="glass-card-raised p-5 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">What would you like the Council to help you see?</p>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={6}
                className="mt-4 w-full resize-none bg-transparent font-serif text-2xl leading-9 text-parchment outline-none placeholder:text-mist/40"
                placeholder="Name the decision, conflict, or question..."
              />
              <div className="mt-5 flex flex-col justify-between gap-4 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center">
                <p className="text-xs leading-5 text-mist">Invite 2 to 5 advisors. You can ask a follow-up after the synthesis.</p>
                <button
                  onClick={() => setHasAsked(true)}
                  disabled={!question.trim() || selectedIds.length < 2}
                  className="button-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Ask the Council <Send size={13} />
                </button>
              </div>
            </section>

            <aside className="glass-card p-5">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Your panel</p>
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
            </aside>
          </div>
        ) : (
          <section className="mt-9">
            <div className="rounded-[20px] border border-gold/15 bg-[#211e18] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Your question</p>
                  <h2 className="mt-3 max-w-3xl font-serif text-2xl leading-8 text-parchment">{question}</h2>
                </div>
                <button
                  onClick={() => setHasAsked(false)}
                  className="flex flex-none items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-mist transition hover:text-gold"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
              <div className="mt-5 flex -space-x-2">
                {selectedAdvisors.map((advisor) => (
                  <AdvisorAvatar key={advisor.id} advisor={advisor} size="sm" />
                ))}
              </div>
            </div>

            <div className="mt-7 space-y-3">
              {councilResponses.map(({ advisor, response }, index) => (
                <article key={advisor.id} className="advisor-card rise-in p-5 sm:p-6" style={{ animationDelay: `${index * 80}ms` }}>
                  <div className="flex gap-4">
                    <AdvisorAvatar advisor={advisor} size="md" active />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-xl text-ivory">{advisor.name}</h3>
                        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-gold">{advisor.archetype}</span>
                      </div>
                      <p className="mt-3 font-serif text-lg leading-8 text-parchment/90">{response}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <article className="relative mt-6 overflow-hidden rounded-[22px] border border-gold/25 bg-[#272117] p-5 sm:p-7">
              <div className="absolute -right-8 -top-10 h-44 w-44 rounded-full bg-gold/10 blur-[50px]" />
              <div className="relative">
                <div className="flex items-center gap-2 text-gold">
                  <Sparkles size={16} strokeWidth={1.5} />
                  <p className="eyebrow">Council synthesis</p>
                </div>
                <h3 className="mt-5 font-serif text-3xl tracking-[-0.03em] text-ivory">The decision needs a container, not more permission.</h3>
                <p className="mt-4 max-w-3xl font-serif text-lg leading-8 text-parchment/85">
                  Your advisors agree that this is not only a career decision. It is a question of whether you can give your ambition a disciplined form without demanding certainty first. The tension is useful: Damon wants the character test, Mara wants the evidence, and Elis wants you to notice how long you have been waiting for someone else to authorize the life you want.
                </p>
                <div className="mt-6 grid gap-3 border-t border-gold/15 pt-5 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold">Recommended action</p>
                    <p className="mt-2 text-sm leading-6 text-parchment/80">Write a 90-day validation plan with a runway number and a decision date.</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold">Yours to decide</p>
                    <p className="mt-2 text-sm leading-6 text-parchment/80">What evidence would be enough for you to stop asking for permission?</p>
                  </div>
                </div>
              </div>
            </article>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/chat" className="button-primary">
                Continue with Damon <ArrowRight size={14} />
              </Link>
              <button className="button-secondary">
                Ask a follow-up <ChevronRight size={14} />
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
