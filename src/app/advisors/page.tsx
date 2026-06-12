'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronRight,
  LoaderCircle,
  Plus,
  Save,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import { AdvisorAvatar } from '@/components/advisor-avatar'
import { AppNavigation } from '@/components/app-navigation'
import { CouncilLogo } from '@/components/council-logo'
import type { Advisor } from '@/lib/council-data'

type AdvisorWithSource = Advisor & {
  source: 'default' | 'custom'
}

type AdvisorForm = {
  id?: string
  name: string
  archetype: string
  monogram: string
  tone: string
  bestFor: string
  description: string
  accent: string
  shadow: string
  worldview: string
}

const emptyForm: AdvisorForm = {
  name: '',
  archetype: '',
  monogram: '',
  tone: '',
  bestFor: '',
  description: '',
  accent: '#B98A57',
  shadow: '#34241C',
  worldview: '',
}

const fieldClass = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 text-sm text-parchment outline-none transition placeholder:text-mist/45 focus:border-gold/35'

function formFromAdvisor(advisor: AdvisorWithSource): AdvisorForm {
  return {
    id: advisor.id,
    name: advisor.name,
    archetype: advisor.archetype,
    monogram: advisor.monogram,
    tone: advisor.tone,
    bestFor: advisor.bestFor,
    description: advisor.description,
    accent: advisor.accent,
    shadow: advisor.shadow,
    worldview: advisor.worldview,
  }
}

function advisorFromForm(form: AdvisorForm): AdvisorWithSource {
  return {
    id: form.id || `local-${crypto.randomUUID()}`,
    name: form.name,
    archetype: form.archetype,
    monogram: form.monogram || form.name.slice(0, 1).toUpperCase() || 'A',
    tone: form.tone,
    bestFor: form.bestFor,
    description: form.description,
    accent: form.accent || '#B98A57',
    shadow: form.shadow || '#34241C',
    worldview: form.worldview,
    lastAsked: 'Custom',
    source: 'custom',
  }
}

export default function AdvisorsPage() {
  const [advisors, setAdvisors] = useState<AdvisorWithSource[]>([])
  const [storage, setStorage] = useState<'ready' | 'unavailable'>('ready')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [form, setForm] = useState<AdvisorForm>(emptyForm)

  const customCount = useMemo(() => advisors.filter((advisor) => advisor.source === 'custom').length, [advisors])

  useEffect(() => {
    const loadAdvisors = async () => {
      setError('')
      try {
        const response = await fetch('/api/advisors')
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load advisors.')
        setAdvisors(data.advisors || [])
        setStorage(data.storage === 'unavailable' ? 'unavailable' : 'ready')
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load advisors.')
      } finally {
        setLoading(false)
      }
    }

    loadAdvisors()
  }, [])

  const startCreate = () => {
    setForm(emptyForm)
    setError('')
    setPanelOpen(true)
  }

  const startEdit = (advisor: AdvisorWithSource) => {
    if (advisor.source !== 'custom') return
    setForm(formFromAdvisor(advisor))
    setError('')
    setPanelOpen(true)
  }

  const saveAdvisor = async () => {
    if (saving) return
    setSaving(true)
    setError('')

    try {
      const method = form.id ? 'PATCH' : 'POST'
      const response = await fetch('/api/advisors', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to save advisor.')

      const saved = data.advisor as AdvisorWithSource
      setAdvisors((current) => {
        if (form.id) return current.map((advisor) => advisor.id === saved.id ? saved : advisor)
        return [...current, saved]
      })
      setPanelOpen(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save advisor.')
    } finally {
      setSaving(false)
    }
  }

  const deleteAdvisor = async () => {
    if (!form.id || saving) return
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/advisors?id=${encodeURIComponent(form.id)}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to delete advisor.')

      setAdvisors((current) => current.filter((advisor) => advisor.id !== form.id))
      setPanelOpen(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete advisor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page-grain min-h-screen bg-[#131310] pb-24 lg:pl-[238px] lg:pb-0">
      <AppNavigation active="advisors" />
      <header className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 lg:hidden">
        <CouncilLogo href="/home" compact />
        <Link href="/home" className="text-mist"><ArrowLeft size={18} /></Link>
      </header>

      <div className="mx-auto max-w-[1120px] px-5 py-8 md:px-8 lg:px-10 lg:py-11">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Your private faculty</p>
            <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-ivory sm:text-5xl">Your advisors</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-mist">
              Shape recurring voices for the questions that need a specific temperament, discipline, or worldview.
            </p>
          </div>
          <button onClick={startCreate} className="button-primary w-fit">
            Create advisor <Plus size={14} />
          </button>
        </section>

        {storage === 'unavailable' && (
          <div className="mt-6 rounded-xl border border-[#d8b56d]/25 bg-[#d8b56d]/10 px-4 py-3 text-sm leading-6 text-[#e6c98f]">
            Custom advisor storage needs the Supabase advisors table to be exposed. Built-in advisors still work.
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-[#d28e7d]/25 bg-[#d28e7d]/10 px-4 py-3 text-sm leading-6 text-[#e4aa9d]">
            {error}
          </div>
        )}

        {loading ? (
          <section className="mt-10 glass-card-raised flex min-h-[260px] items-center justify-center text-gold">
            <LoaderCircle className="animate-spin" size={24} />
          </section>
        ) : (
          <section className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {advisors.map((advisor) => (
              <article key={advisor.id} className="advisor-card flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <AdvisorAvatar advisor={advisor} size="lg" />
                  <button
                    onClick={() => startEdit(advisor)}
                    disabled={advisor.source !== 'custom'}
                    className="text-mist transition hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Edit ${advisor.name}`}
                  >
                    <SlidersHorizontal size={15} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-gold">{advisor.archetype}</p>
                  {advisor.source === 'custom' && (
                    <span className="rounded-full border border-gold/20 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-gold">
                      Custom
                    </span>
                  )}
                </div>
                <h2 className="mt-2 font-serif text-[29px] text-ivory">{advisor.name}</h2>
                <p className="mt-3 text-xs leading-5 text-mist">{advisor.description}</p>
                <div className="mt-5 border-t border-white/[0.07] pt-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-mist/60">Best for</p>
                  <p className="mt-2 text-xs leading-5 text-parchment/80">{advisor.bestFor}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-mist/55">
                    {advisor.source === 'custom' ? 'User-made' : `Asked ${advisor.lastAsked}`}
                  </p>
                  <Link href={`/chat?advisor=${advisor.id}`} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
                    Ask <ChevronRight size={12} />
                  </Link>
                </div>
              </article>
            ))}

            <button
              onClick={startCreate}
              className="flex min-h-[325px] flex-col items-center justify-center rounded-[20px] border border-dashed border-white/[0.12] p-6 text-center transition hover:border-gold/35 hover:bg-gold/[0.025]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/25 text-gold">
                <Plus size={18} />
              </span>
              <p className="mt-5 font-serif text-2xl text-ivory">Create an advisor</p>
              <p className="mt-2 max-w-[210px] text-xs leading-5 text-mist">
                {customCount > 0 ? 'Add another perspective to your private faculty.' : 'Shape a voice for questions the current council cannot answer.'}
              </p>
            </button>
          </section>
        )}
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6">
          <section className="max-h-[92vh] w-full overflow-y-auto border border-white/[0.08] bg-[#151411] p-5 shadow-2xl sm:max-w-[680px] sm:rounded-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{form.id ? 'Edit advisor' : 'Create advisor'}</p>
                <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-ivory">Shape the voice</h2>
              </div>
              <button onClick={() => setPanelOpen(false)} className="text-mist transition hover:text-ivory" aria-label="Close editor">
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-mist/70">Name</span>
                <input className={fieldClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-mist/70">Archetype</span>
                <input className={fieldClass} value={form.archetype} onChange={(event) => setForm({ ...form, archetype: event.target.value })} />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-mist/70">Monogram</span>
                <input className={fieldClass} value={form.monogram} onChange={(event) => setForm({ ...form, monogram: event.target.value.slice(0, 2).toUpperCase() })} />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-mist/70">Worldview</span>
                <input className={fieldClass} value={form.worldview} onChange={(event) => setForm({ ...form, worldview: event.target.value })} />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-mist/70">Description</span>
                <textarea rows={3} className={fieldClass} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-mist/70">Best for</span>
                <textarea rows={2} className={fieldClass} value={form.bestFor} onChange={(event) => setForm({ ...form, bestFor: event.target.value })} />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-mist/70">Tone</span>
                <input className={fieldClass} value={form.tone} onChange={(event) => setForm({ ...form, tone: event.target.value })} />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-mist/70">Accent</span>
                <input type="color" className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] p-1" value={form.accent} onChange={(event) => setForm({ ...form, accent: event.target.value })} />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-mist/70">Shadow</span>
                <input type="color" className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] p-1" value={form.shadow} onChange={(event) => setForm({ ...form, shadow: event.target.value })} />
              </label>
            </div>

            {error && <p className="mt-4 text-sm leading-6 text-[#e4aa9d]">{error}</p>}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={deleteAdvisor}
                disabled={!form.id || saving}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#d28e7d]/25 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#d28e7d] transition hover:bg-[#d28e7d]/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Trash2 size={14} /> Delete
              </button>
              <button onClick={saveAdvisor} disabled={saving} className="button-primary justify-center">
                {saving ? 'Saving...' : 'Save advisor'} <Save size={14} />
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
