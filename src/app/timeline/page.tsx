'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Circle, LoaderCircle, MessageCircle, Sparkles } from 'lucide-react'
import { AppNavigation } from '@/components/app-navigation'
import type { IdentitySummary, Memory, Ritual } from '@/types'

type TimelineEntry = {
  id: string
  date: string
  type: 'memory' | 'identity' | 'ritual' | 'session-summary'
  memoryType?: Memory['type']
  content: string
  title: string
  label: string
  href?: string
}

type SessionSummaryRow = {
  id: string
  session_id: string
  summary: string
  key_points: string[] | null
  next_actions: string[] | null
  follow_up_question: string | null
  created_at: string
  href?: string
}

const typeLabels: Record<string, string> = {
  episodic: 'Moment',
  semantic: 'Truth',
  narrative: 'Interpretation',
  identity: 'Self-portrait',
  ritual: 'Examen',
  'session-summary': 'Session summary',
}

const filters = [
  { id: 'all', label: 'All' },
  { id: 'episodic', label: 'Moments' },
  { id: 'semantic', label: 'Truths' },
  { id: 'narrative', label: 'Interpretations' },
  { id: 'identity', label: 'Portraits' },
  { id: 'session-summary', label: 'Summaries' },
  { id: 'ritual', label: 'Rituals' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getAccent(entry: TimelineEntry) {
  if (entry.type === 'ritual') return 'text-[#9fb3aa]'
  if (entry.type === 'session-summary') return 'text-[#b7a673]'
  if (entry.type === 'identity') return 'text-gold-light'
  if (entry.memoryType === 'semantic') return 'text-[#b9a27f]'
  if (entry.memoryType === 'narrative') return 'text-[#b99da8]'
  return 'text-gold'
}

export default function TimelinePage() {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setError('')
      try {
        const [synthesisResponse, ritualsResponse, summariesResponse] = await Promise.all([
          fetch('/api/synthesis'),
          fetch('/api/rituals'),
          fetch('/api/session-summaries'),
        ])
        const synthesisData = await synthesisResponse.json()
        const ritualsData = await ritualsResponse.json()
        const summariesData = await summariesResponse.json()

        if (!synthesisResponse.ok) throw new Error(synthesisData.error || 'Unable to load memories.')
        if (!ritualsResponse.ok) throw new Error(ritualsData.error || 'Unable to load rituals.')
        if (!summariesResponse.ok) throw new Error(summariesData.error || 'Unable to load session summaries.')

        const nextEntries: TimelineEntry[] = []

        for (const memory of (synthesisData.memories || []) as Memory[]) {
          nextEntries.push({
            id: memory.id,
            date: memory.created_at,
            type: 'memory',
            memoryType: memory.type,
            content: memory.content,
            title: typeLabels[memory.type],
            label: typeLabels[memory.type],
          })
        }

        for (const summary of (synthesisData.allSummaries || []) as IdentitySummary[]) {
          nextEntries.push({
            id: summary.id,
            date: summary.created_at,
            type: 'identity',
            content: summary.summary,
            title: 'Identity synthesis',
            label: 'Self-portrait',
          })
        }

        for (const ritual of (ritualsData.rituals || []) as Ritual[]) {
          if (!ritual.response) continue
          nextEntries.push({
            id: ritual.id,
            date: ritual.created_at,
            type: 'ritual',
            content: ritual.response,
            title: ritual.prompt,
            label: 'Examen',
          })
        }

        for (const summary of (summariesData.summaries || []) as SessionSummaryRow[]) {
          nextEntries.push({
            id: summary.id,
            date: summary.created_at,
            type: 'session-summary',
            content: [
              summary.summary,
              summary.next_actions?.length ? `Next: ${summary.next_actions[0]}` : '',
              summary.follow_up_question ? `Question: ${summary.follow_up_question}` : '',
            ].filter(Boolean).join('\n\n'),
            title: 'Session intelligence',
            label: 'Session summary',
            href: summary.href,
          })
        }

        nextEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setEntries(nextEntries)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load the timeline.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filteredEntries = useMemo(() => {
    if (filter === 'all') return entries
    return entries.filter((entry) => entry.memoryType === filter || entry.type === filter)
  }, [entries, filter])

  const counts = useMemo(() => ({
    all: entries.length,
    episodic: entries.filter((entry) => entry.memoryType === 'episodic').length,
    semantic: entries.filter((entry) => entry.memoryType === 'semantic').length,
    narrative: entries.filter((entry) => entry.memoryType === 'narrative').length,
    identity: entries.filter((entry) => entry.type === 'identity').length,
    'session-summary': entries.filter((entry) => entry.type === 'session-summary').length,
    ritual: entries.filter((entry) => entry.type === 'ritual').length,
  }), [entries])

  return (
    <main className="page-grain min-h-screen bg-[#131310] pb-24 lg:pl-[238px] lg:pb-0">
      <AppNavigation active="sessions" />

      <div className="mx-auto max-w-[1120px] px-5 py-8 md:px-8 lg:px-10 lg:py-11">
        <section className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-8 xl:flex-row xl:items-end">
          <div>
            <p className="eyebrow">Becoming over time</p>
            <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-ivory sm:text-5xl">Timeline of Self</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-mist">
              Memories, rituals, and self-portraits in the order they entered the system.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/chat" className="button-primary">
              New session <MessageCircle size={14} />
            </Link>
            <Link href="/rituals" className="button-secondary">
              Ritual <CalendarDays size={14} />
            </Link>
          </div>
        </section>

        <section className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`whitespace-nowrap rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                filter === item.id
                  ? 'border-gold/35 bg-gold/[0.1] text-gold-light'
                  : 'border-white/[0.08] bg-white/[0.025] text-mist hover:border-white/[0.16] hover:text-parchment'
              }`}
            >
              {item.label} <span className="ml-1 opacity-60">{counts[item.id as keyof typeof counts]}</span>
            </button>
          ))}
        </section>

        {error && (
          <div className="mt-5 rounded-2xl border border-[#d28e7d]/25 bg-[#d28e7d]/10 px-4 py-3 text-sm leading-6 text-[#e4aa9d]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-10 glass-card-raised flex min-h-[260px] items-center justify-center text-gold">
            <LoaderCircle className="animate-spin" size={24} />
          </div>
        ) : filteredEntries.length === 0 ? (
          <section className="mt-10 glass-card-raised p-8 text-center">
            <Sparkles className="mx-auto text-gold" size={22} strokeWidth={1.5} />
            <h2 className="mt-5 font-serif text-3xl tracking-[-0.03em] text-ivory">Nothing here yet.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-mist">
              Start a conversation or complete a ritual. The timeline will fill as the council remembers.
            </p>
            <Link href="/chat" className="button-primary mt-6">
              Start a conversation <ArrowRight size={13} />
            </Link>
          </section>
        ) : (
          <section className="mt-8">
            <div className="relative">
              <div className="absolute bottom-5 left-[17px] top-4 hidden w-px bg-white/[0.08] sm:block" />

              <div className="space-y-5">
                {filteredEntries.map((entry, index) => {
                  const showDate = index === 0 || formatDate(filteredEntries[index - 1].date) !== formatDate(entry.date)
                  const accent = getAccent(entry)

                  return (
                    <div key={`${entry.type}-${entry.id}`}>
                      {showDate && (
                        <div className="mb-4 mt-7 flex items-center gap-3 first:mt-0">
                          <span className="hidden h-9 w-9 sm:block" />
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-mist/65">
                            {formatDate(entry.date)}
                          </p>
                        </div>
                      )}

                      <article className="grid gap-4 sm:grid-cols-[36px_1fr]">
                        <div className="relative hidden sm:block">
                          <span className="absolute left-1/2 top-5 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-white/[0.08] bg-[#131310]">
                            <Circle className={accent} size={10} fill="currentColor" />
                          </span>
                        </div>

                        <div className="advisor-card p-5 sm:p-6">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${accent}`}>
                                  {entry.label}
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.12em] text-mist/50">{formatTime(entry.date)}</span>
                              </div>
                              <h2 className="mt-2 font-serif text-2xl leading-8 text-ivory">{entry.title}</h2>
                            </div>
                            {(entry.type === 'memory' || entry.href) && (
                              <Link href={entry.href || '/mirror'} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.13em] text-gold">
                                Review <ArrowRight size={12} />
                              </Link>
                            )}
                          </div>
                          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-parchment/80">{entry.content}</p>
                        </div>
                      </article>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
