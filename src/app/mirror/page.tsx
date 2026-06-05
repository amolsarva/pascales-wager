'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Brain, Check, LoaderCircle, Pencil, RefreshCw, Sparkles, Trash2, X } from 'lucide-react'
import { AppNavigation } from '@/components/app-navigation'
import type { IdentitySummary, Memory } from '@/types'

type MemoryType = Memory['type']

const memoryLabels: Record<MemoryType, string> = {
  episodic: 'Moment',
  semantic: 'Truth',
  narrative: 'Interpretation',
}

const memoryDescriptions: Record<MemoryType, string> = {
  episodic: 'Specific events and experiences your council may reference later.',
  semantic: 'Stable facts, values, patterns, and preferences.',
  narrative: 'Interpretive threads about who you are becoming.',
}

type EditingMemory = {
  id: string
  type: MemoryType
  content: string
}

export default function MirrorPage() {
  const [summary, setSummary] = useState<IdentitySummary | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [synthesizing, setSynthesizing] = useState(false)
  const [savingMemoryId, setSavingMemoryId] = useState('')
  const [deletingMemoryId, setDeletingMemoryId] = useState('')
  const [editingMemory, setEditingMemory] = useState<EditingMemory | null>(null)
  const [error, setError] = useState('')

  const loadMirror = useCallback(async () => {
    setError('')
    try {
      const response = await fetch('/api/synthesis')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load the mirror.')
      setSummary(data.summary)
      setMemories(data.memories || [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load the mirror.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMirror()
  }, [loadMirror])

  const memoryGroups = useMemo(() => ({
    episodic: memories.filter((memory) => memory.type === 'episodic'),
    semantic: memories.filter((memory) => memory.type === 'semantic'),
    narrative: memories.filter((memory) => memory.type === 'narrative'),
  }), [memories])

  const memoryCount = memories.length
  const canSynthesize = memoryCount >= 5 && !synthesizing

  const runSynthesis = async () => {
    setSynthesizing(true)
    setError('')

    try {
      const response = await fetch('/api/synthesis', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to synthesize right now.')
      if (data.summary) setSummary(data.summary)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to synthesize right now.')
    } finally {
      setSynthesizing(false)
    }
  }

  const saveMemory = async () => {
    if (!editingMemory) return
    const trimmedContent = editingMemory.content.trim()
    if (!trimmedContent) {
      setError('Memory content cannot be empty.')
      return
    }

    setSavingMemoryId(editingMemory.id)
    setError('')

    try {
      const response = await fetch('/api/memories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMemory.id,
          type: editingMemory.type,
          content: trimmedContent,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to update memory.')

      setMemories((current) =>
        current.map((memory) => memory.id === editingMemory.id ? data.memory : memory)
      )
      setEditingMemory(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update memory.')
    } finally {
      setSavingMemoryId('')
    }
  }

  const deleteMemory = async (id: string) => {
    setDeletingMemoryId(id)
    setError('')

    try {
      const response = await fetch(`/api/memories?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to delete memory.')
      setMemories((current) => current.filter((memory) => memory.id !== id))
      if (editingMemory?.id === id) setEditingMemory(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete memory.')
    } finally {
      setDeletingMemoryId('')
    }
  }

  return (
    <main className="page-grain min-h-screen bg-[#131310] pb-24 lg:pl-[238px] lg:pb-0">
      <AppNavigation active="settings" />

      <div className="mx-auto max-w-[1180px] px-5 py-8 md:px-8 lg:px-10 lg:py-11">
        <section className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-8 xl:flex-row xl:items-end">
          <div>
            <p className="eyebrow">What your council carries</p>
            <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-ivory sm:text-5xl">The Mirror</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-mist">
              Review the portrait your council is forming and curate the memories that shape future answers.
            </p>
          </div>
          <button
            onClick={runSynthesis}
            disabled={!canSynthesize}
            className="button-primary w-fit disabled:cursor-not-allowed disabled:opacity-45"
          >
            {synthesizing ? 'Synthesizing...' : summary ? 'Re-synthesize' : 'Form portrait'}
            {synthesizing ? <LoaderCircle className="animate-spin" size={14} /> : <Sparkles size={14} />}
          </button>
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
        ) : (
          <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="space-y-5">
              <article className="glass-card-raised p-6 sm:p-8">
                <div className="flex items-center gap-2 text-gold">
                  <Brain size={16} strokeWidth={1.5} />
                  <p className="eyebrow">Current portrait</p>
                </div>

                {summary ? (
                  <>
                    <p className="mt-6 whitespace-pre-wrap font-serif text-xl leading-9 text-parchment/90">
                      {summary.summary}
                    </p>

                    <div className="mt-8 grid gap-5 border-t border-white/[0.07] pt-6 lg:grid-cols-2">
                      {summary.traits?.length > 0 && (
                        <section>
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold">Strongest traits</p>
                          <div className="mt-4 space-y-3">
                            {summary.traits.slice(0, 6).map((trait) => (
                              <div key={trait.name}>
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm text-parchment/85">{trait.name}</p>
                                  <p className="text-[10px] text-mist">{Math.round(trait.confidence * 100)}%</p>
                                </div>
                                <div className="mt-2 h-1 rounded-full bg-white/[0.06]">
                                  <div
                                    className="h-1 rounded-full bg-gold"
                                    style={{ width: `${Math.round(trait.confidence * 100)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {summary.contradictions?.length > 0 && (
                        <section>
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold">Tensions noticed</p>
                          <div className="mt-4 space-y-3">
                            {summary.contradictions.slice(0, 4).map((contradiction) => (
                              <p key={contradiction} className="border-l border-gold/25 pl-3 text-sm leading-6 text-mist">
                                {contradiction}
                              </p>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>

                    {summary.themes?.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {summary.themes.map((theme) => (
                          <span key={theme} className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[11px] text-parchment/75">
                            {theme}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-6">
                    <p className="font-serif text-2xl leading-9 text-parchment">
                      The mirror fills slowly. Keep talking, then form a portrait once there are enough memories.
                    </p>
                    <p className="mt-3 text-sm leading-6 text-mist">
                      {memoryCount >= 5
                        ? 'There are enough memories to synthesize a first portrait.'
                        : `${Math.max(0, 5 - memoryCount)} more remembered moments are needed before synthesis.`}
                    </p>
                  </div>
                )}
              </article>

              <section className="glass-card-raised p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-3 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-end">
                  <div>
                    <p className="eyebrow">Memory review</p>
                    <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-ivory">Edit what gets carried forward.</h2>
                  </div>
                  <Link href="/chat" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.13em] text-gold">
                    Add through chat <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="mt-5 space-y-5">
                  {(Object.keys(memoryLabels) as MemoryType[]).map((type) => (
                    <section key={type}>
                      <div className="flex items-baseline justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold">{memoryLabels[type]}</p>
                          <p className="mt-1 text-xs leading-5 text-mist">{memoryDescriptions[type]}</p>
                        </div>
                        <p className="text-xs text-mist/70">{memoryGroups[type].length}</p>
                      </div>

                      <div className="mt-3 space-y-2">
                        {memoryGroups[type].length === 0 ? (
                          <p className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-3 py-3 text-xs leading-5 text-mist/65">
                            Nothing saved here yet.
                          </p>
                        ) : memoryGroups[type].map((memory) => (
                          <article key={memory.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                            {editingMemory?.id === memory.id ? (
                              <div>
                                <select
                                  value={editingMemory.type}
                                  onChange={(event) => setEditingMemory((current) =>
                                    current ? { ...current, type: event.target.value as MemoryType } : current
                                  )}
                                  className="rounded-xl border border-white/[0.09] bg-[#171714] px-3 py-2 text-xs text-parchment outline-none"
                                >
                                  {(Object.keys(memoryLabels) as MemoryType[]).map((option) => (
                                    <option key={option} value={option}>{memoryLabels[option]}</option>
                                  ))}
                                </select>
                                <textarea
                                  value={editingMemory.content}
                                  onChange={(event) => setEditingMemory((current) =>
                                    current ? { ...current, content: event.target.value } : current
                                  )}
                                  rows={4}
                                  className="mt-3 w-full resize-none rounded-xl border border-white/[0.09] bg-white/[0.025] px-3 py-3 text-sm leading-6 text-parchment outline-none focus:border-gold/35"
                                />
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    onClick={saveMemory}
                                    disabled={savingMemoryId === memory.id}
                                    className="button-primary !px-3 !py-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {savingMemoryId === memory.id ? 'Saving...' : 'Save'} <Check size={12} />
                                  </button>
                                  <button
                                    onClick={() => setEditingMemory(null)}
                                    className="button-secondary !px-3 !py-2"
                                  >
                                    Cancel <X size={12} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm leading-6 text-parchment/85">{memory.content}</p>
                                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                                  <p className="text-[10px] uppercase tracking-[0.12em] text-mist/55">
                                    Confidence {Math.round(memory.confidence * 100)}%
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setEditingMemory({ id: memory.id, type: memory.type, content: memory.content })}
                                      className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] text-mist transition hover:border-gold/25 hover:text-gold"
                                      aria-label="Edit memory"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      onClick={() => deleteMemory(memory.id)}
                                      disabled={deletingMemoryId === memory.id}
                                      className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] text-mist transition hover:border-[#d28e7d]/35 hover:text-[#d28e7d] disabled:cursor-not-allowed disabled:opacity-45"
                                      aria-label="Delete memory"
                                    >
                                      {deletingMemoryId === memory.id ? <LoaderCircle className="animate-spin" size={13} /> : <Trash2 size={13} />}
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            </section>

            <aside className="space-y-4">
              <section className="glass-card p-5">
                <p className="eyebrow">Memory mix</p>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {(Object.keys(memoryLabels) as MemoryType[]).map((type) => (
                    <div key={type} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3">
                      <p className="font-serif text-2xl text-ivory">{memoryGroups[type].length}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.11em] text-mist">{memoryLabels[type]}</p>
                    </div>
                  ))}
                </div>
              </section>

              <button
                onClick={loadMirror}
                className="glass-card group flex w-full items-center justify-between p-5 text-left transition hover:border-gold/20"
              >
                <span>
                  <span className="eyebrow">Refresh</span>
                  <span className="mt-2 block text-sm leading-6 text-mist">Reload memories and the latest portrait.</span>
                </span>
                <RefreshCw size={15} className="text-gold transition-transform group-hover:rotate-45" />
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
