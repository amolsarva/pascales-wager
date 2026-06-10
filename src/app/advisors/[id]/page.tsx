'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Advisor } from '@/types'

export default function AdvisorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [advisor, setAdvisor] = useState<Advisor | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
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

  useEffect(() => {
    fetch(`/api/advisors/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.advisor) {
          setAdvisor(d.advisor)
          setForm({
            name: d.advisor.name || '',
            archetype: d.advisor.archetype || '',
            role_description: d.advisor.role_description || '',
            tone: d.advisor.tone || '',
            worldview: d.advisor.worldview || '',
            helps_with: (d.advisor.helps_with || []).join(', '),
            guardrails: (d.advisor.guardrails || []).join(', '),
            system_prompt: d.advisor.system_prompt || '',
          })
        }
        setLoading(false)
      })
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/advisors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        archetype: form.archetype || null,
        role_description: form.role_description || null,
        tone: form.tone || null,
        worldview: form.worldview || null,
        helps_with: form.helps_with.split(',').map(s => s.trim()).filter(Boolean),
        guardrails: form.guardrails.split(',').map(s => s.trim()).filter(Boolean),
        system_prompt: form.system_prompt,
      }),
    })
    const data = await res.json()
    if (data.advisor) {
      setAdvisor(data.advisor)
      setEditing(false)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete ${advisor?.name}? This cannot be undone.`)) return
    setDeleting(true)
    await fetch(`/api/advisors/${id}`, { method: 'DELETE' })
    router.push('/advisors')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <p className="sans text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
      </div>
    )
  }

  if (!advisor) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <p className="sans text-sm" style={{ color: 'var(--muted)' }}>Advisor not found.</p>
      </div>
    )
  }

  const editField = (label: string, key: keyof typeof form, rows = 1) => (
    <div>
      <label className="sans text-xs tracking-wide uppercase block mb-1.5" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>{label}</label>
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
        <Link
          href={`/chat?advisorId=${id}`}
          className="sans text-sm px-5 py-2 transition-all"
          style={{ background: 'var(--accent)', color: 'var(--background)', borderRadius: '2px' }}
        >
          Ask {advisor.name}
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        {!editing ? (
          <div className="fade-in">
            <div className="mb-8">
              {advisor.archetype && (
                <p className="sans text-xs tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--accent)', opacity: 0.6 }}>
                  {advisor.archetype}
                </p>
              )}
              <h1 className="text-3xl font-normal mb-4" style={{ color: 'var(--foreground)' }}>{advisor.name}</h1>
              {advisor.role_description && (
                <p className="text-base leading-relaxed" style={{ color: 'var(--muted-foreground)', lineHeight: 1.75 }}>
                  {advisor.role_description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-6 mb-10">
              {advisor.tone && (
                <div>
                  <p className="sans text-xs tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>Tone</p>
                  <p className="sans text-sm" style={{ color: 'var(--muted-foreground)' }}>{advisor.tone}</p>
                </div>
              )}
              {advisor.worldview && (
                <div>
                  <p className="sans text-xs tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>Worldview</p>
                  <p className="sans text-sm" style={{ color: 'var(--muted-foreground)' }}>{advisor.worldview}</p>
                </div>
              )}
              {advisor.helps_with?.length > 0 && (
                <div>
                  <p className="sans text-xs tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>Helps with</p>
                  <div className="flex flex-wrap gap-2">
                    {advisor.helps_with.map(t => (
                      <span key={t} className="sans text-xs px-3 py-1.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted-foreground)', borderRadius: '2px' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {advisor.guardrails?.length > 0 && (
                <div>
                  <p className="sans text-xs tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>Guardrails</p>
                  <div className="flex flex-col gap-1">
                    {advisor.guardrails.map(g => (
                      <p key={g} className="sans text-xs pl-3" style={{ color: 'var(--muted)', borderLeft: '1px solid var(--border)' }}>{g}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setEditing(true)}
                className="sans text-sm px-5 py-2.5 transition-all"
                style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', borderRadius: '2px' }}
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="sans text-sm px-5 py-2.5 transition-all"
                style={{ color: '#c47070', cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                {deleting ? 'Deleting...' : 'Delete advisor'}
              </button>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            <h2 className="text-2xl font-normal mb-8" style={{ color: 'var(--foreground)' }}>Edit {advisor.name}</h2>
            <div className="flex flex-col gap-5">
              {editField('Name', 'name')}
              {editField('Archetype', 'archetype')}
              {editField('Role description', 'role_description', 3)}
              {editField('Tone', 'tone')}
              {editField('Worldview', 'worldview', 2)}
              {editField('Helps with', 'helps_with', 2)}
              {editField('Guardrails', 'guardrails', 2)}
              {editField('System prompt', 'system_prompt', 10)}
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className="sans px-6 py-3 text-sm flex-1 transition-all"
                style={{ background: saving ? 'var(--accent-dim)' : 'var(--accent)', color: 'var(--background)', borderRadius: '2px' }}
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button onClick={() => setEditing(false)} className="sans px-5 py-3 text-sm" style={{ color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '2px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
