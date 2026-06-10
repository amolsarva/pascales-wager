'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Mode = 'generate' | 'manual'

const ARCHETYPE_EXAMPLES = [
  'Greek mentor for character and excellence',
  'Stoic philosopher focused on what is in my control',
  'Pragmatic startup coach — direct and demanding',
  'Gentle witness for emotional processing and relationships',
  'Buddhist teacher focused on non-attachment and presence',
  'Ruthless editor who challenges my assumptions',
  'Future self speaking from 20 years ahead',
  'Jungian analyst interested in shadow and depth',
]

export default function NewAdvisorPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('generate')

  // Generate mode
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null)
  const [genError, setGenError] = useState('')

  // Manual / edit mode (used for both manual and post-generation editing)
  const [form, setForm] = useState({
    name: '',
    archetype: '',
    role_description: '',
    tone: '',
    worldview: '',
    helps_with: '',
    guardrails: '',
    system_prompt: '',
  })

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleGenerate = async () => {
    if (!description.trim()) return
    setGenerating(true)
    setGenError('')
    setPreview(null)

    try {
      const res = await fetch('/api/advisors/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setPreview(data.advisor)
      setForm({
        name: data.advisor.name || '',
        archetype: data.advisor.archetype || '',
        role_description: data.advisor.role_description || '',
        tone: data.advisor.tone || '',
        worldview: data.advisor.worldview || '',
        helps_with: (data.advisor.helps_with || []).join(', '),
        guardrails: (data.advisor.guardrails || []).join(', '),
        system_prompt: data.advisor.system_prompt || '',
      })
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.system_prompt.trim()) {
      setSaveError('Name and system prompt are required.')
      return
    }
    setSaving(true)
    setSaveError('')

    try {
      const res = await fetch('/api/advisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          archetype: form.archetype.trim() || null,
          role_description: form.role_description.trim() || null,
          tone: form.tone.trim() || null,
          worldview: form.worldview.trim() || null,
          helps_with: form.helps_with.split(',').map(s => s.trim()).filter(Boolean),
          guardrails: form.guardrails.split(',').map(s => s.trim()).filter(Boolean),
          system_prompt: form.system_prompt.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      router.push(`/advisors/${data.advisor.id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const field = (label: string, key: keyof typeof form, rows = 1, hint?: string) => (
    <div>
      <label className="sans text-xs tracking-wide uppercase block mb-1.5" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
        {label}
      </label>
      {hint && <p className="sans text-xs mb-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>{hint}</p>}
      {rows === 1 ? (
        <input
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="sans w-full px-3 py-2.5 text-sm outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '2px' }}
        />
      ) : (
        <textarea
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={rows}
          className="sans w-full px-3 py-2.5 text-sm outline-none resize-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '2px', lineHeight: 1.65 }}
        />
      )}
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/advisors" className="text-lg font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
          ← Advisors
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="sans text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--accent)', opacity: 0.6 }}>Create</p>
          <h1 className="text-3xl font-normal mb-6" style={{ color: 'var(--foreground)' }}>New advisor</h1>

          {/* Mode toggle */}
          <div className="flex gap-1">
            {(['generate', 'manual'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="sans text-xs px-4 py-2 capitalize transition-all"
                style={{
                  background: mode === m ? 'var(--surface-raised)' : 'transparent',
                  color: mode === m ? 'var(--foreground)' : 'var(--muted)',
                  border: `1px solid ${mode === m ? 'var(--border)' : 'transparent'}`,
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
              >
                {m === 'generate' ? 'AI generate' : 'Manual'}
              </button>
            ))}
          </div>
        </div>

        {/* Generate mode */}
        {mode === 'generate' && !preview && (
          <div className="fade-in">
            <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)', lineHeight: 1.75 }}>
              Describe the advisor you want in plain language. The more specific, the better.
            </p>

            {/* Examples */}
            <div className="mb-6">
              <p className="sans text-xs mb-3" style={{ color: 'var(--muted)', opacity: 0.6 }}>Examples:</p>
              <div className="flex flex-wrap gap-2">
                {ARCHETYPE_EXAMPLES.map(ex => (
                  <button
                    key={ex}
                    onClick={() => setDescription(ex)}
                    className="sans text-xs px-3 py-1.5 transition-all text-left"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted-foreground)', borderRadius: '2px', cursor: 'pointer' }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A Greek mentor for paideia, focused on character formation, judgment, and self-command. Warm, demanding, intellectually serious."
              rows={4}
              className="sans w-full px-4 py-3 text-sm outline-none resize-none mb-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '2px', lineHeight: 1.7 }}
            />

            {genError && <p className="sans text-xs mb-4" style={{ color: '#c47070' }}>{genError}</p>}

            <button
              onClick={handleGenerate}
              disabled={generating || !description.trim()}
              className="sans px-6 py-3 text-sm tracking-wide w-full transition-all"
              style={{
                background: generating || !description.trim() ? 'var(--accent-dim)' : 'var(--accent)',
                color: 'var(--background)',
                borderRadius: '2px',
                cursor: generating || !description.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {generating ? 'Generating advisor...' : 'Generate advisor'}
            </button>
          </div>
        )}

        {/* Edit/review form — shown after generation or in manual mode */}
        {(preview || mode === 'manual') && (
          <div className="fade-in">
            {preview && (
              <div className="mb-6 px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderLeft: '3px solid var(--accent)', borderRadius: '2px' }}>
                <p className="sans text-xs" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                  Advisor generated — review and edit before saving.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-5">
              {field('Name', 'name')}
              {field('Archetype', 'archetype', 1, 'e.g. "Greek Mentor", "Stoic Elder", "Pragmatic Coach"')}
              {field('Role description', 'role_description', 3)}
              {field('Tone', 'tone', 1, 'e.g. "Warm, elevated, occasionally demanding"')}
              {field('Worldview', 'worldview', 2, 'e.g. "Virtue ethics, classical paideia, secular humanism"')}
              {field('Helps with', 'helps_with', 2, 'Comma-separated topics, e.g. "ambition, character, discipline"')}
              {field('Guardrails', 'guardrails', 2, 'Comma-separated things this advisor should never do')}
              {field('System prompt', 'system_prompt', 10, 'The full instructions for how this advisor speaks and behaves')}
            </div>

            {saveError && <p className="sans text-xs mt-4" style={{ color: '#c47070' }}>{saveError}</p>}

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className="sans px-6 py-3 text-sm tracking-wide flex-1 transition-all"
                style={{
                  background: saving ? 'var(--accent-dim)' : 'var(--accent)',
                  color: 'var(--background)',
                  borderRadius: '2px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save advisor'}
              </button>
              {preview && (
                <button
                  onClick={() => setPreview(null)}
                  className="sans px-4 py-3 text-sm"
                  style={{ color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '2px' }}
                >
                  Regenerate
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
