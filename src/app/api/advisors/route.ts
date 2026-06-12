import { NextRequest, NextResponse } from 'next/server'
import { isMissingTableWrite } from '@/lib/api/errors'
import { advisors, type Advisor } from '@/lib/council-data'
import { createClient } from '@/lib/supabase/server'

type AdvisorRow = {
  id: string
  name: string
  archetype: string | null
  monogram: string | null
  tone: string | null
  best_for: string | null
  description: string | null
  accent: string | null
  shadow: string | null
  worldview: string | null
  archived?: boolean | null
}

const defaultAccent = '#B98A57'
const defaultShadow = '#34241C'

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function toCustomAdvisor(row: AdvisorRow): Advisor & { source: 'custom' } {
  return {
    id: row.id,
    name: row.name,
    archetype: row.archetype || 'Custom Advisor',
    monogram: row.monogram || row.name.slice(0, 1).toUpperCase() || 'A',
    tone: row.tone || 'Clear, grounded, specific',
    bestFor: row.best_for || 'Questions that need a tailored point of view',
    description: row.description || 'A custom advisor shaped for your recurring questions.',
    accent: row.accent || defaultAccent,
    shadow: row.shadow || defaultShadow,
    worldview: row.worldview || 'User-defined',
    lastAsked: 'Custom',
    source: 'custom',
  }
}

function defaultAdvisors() {
  return advisors.map((advisor) => ({ ...advisor, source: 'default' as const }))
}

function advisorPayload(body: Record<string, unknown>) {
  const name = cleanText(body.name, 80)
  const archetype = cleanText(body.archetype, 100)

  return {
    name,
    archetype,
    monogram: cleanText(body.monogram, 2) || name.slice(0, 1).toUpperCase(),
    tone: cleanText(body.tone, 180),
    best_for: cleanText(body.bestFor || body.best_for, 220),
    description: cleanText(body.description, 420),
    accent: cleanText(body.accent, 24) || defaultAccent,
    shadow: cleanText(body.shadow, 24) || defaultShadow,
    worldview: cleanText(body.worldview, 220),
  }
}

function validatePayload(payload: ReturnType<typeof advisorPayload>) {
  if (!payload.name) return 'Advisor name is required.'
  if (!payload.archetype) return 'Advisor archetype is required.'
  if (!payload.description) return 'Advisor description is required.'
  if (!payload.best_for) return 'Best-for guidance is required.'
  return ''
}

function schemaUnavailable() {
  return NextResponse.json(
    {
      error: 'Custom advisor storage is not available until the Supabase advisors table is exposed.',
      code: 'schema_unavailable',
    },
    { status: 503 }
  )
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('advisors')
    .select('id, name, archetype, monogram, tone, best_for, description, accent, shadow, worldview, archived')
    .eq('user_id', user.id)
    .or('archived.is.null,archived.eq.false')
    .order('created_at', { ascending: true })

  if (error && isMissingTableWrite(error, 'advisors')) {
    return NextResponse.json({
      advisors: defaultAdvisors(),
      customAdvisors: [],
      storage: 'unavailable',
    })
  }
  if (error) throw error

  const customAdvisors = ((data || []) as AdvisorRow[]).map(toCustomAdvisor)

  return NextResponse.json({
    advisors: [...defaultAdvisors(), ...customAdvisors],
    customAdvisors,
    storage: 'ready',
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const payload = advisorPayload(body)
  const validationError = validatePayload(payload)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('advisors')
    .insert({
      user_id: user.id,
      ...payload,
    })
    .select('id, name, archetype, monogram, tone, best_for, description, accent, shadow, worldview, archived')
    .single()

  if (error && isMissingTableWrite(error, 'advisors')) return schemaUnavailable()
  if (error) throw error

  return NextResponse.json({ advisor: toCustomAdvisor(data as AdvisorRow) })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const id = cleanText(body.id, 80)
  const payload = advisorPayload(body)
  const validationError = validatePayload(payload)

  if (!id) return NextResponse.json({ error: 'Advisor id is required.' }, { status: 400 })
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const { data, error } = await supabase
    .from('advisors')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, name, archetype, monogram, tone, best_for, description, accent, shadow, worldview, archived')
    .single()

  if (error && isMissingTableWrite(error, 'advisors')) return schemaUnavailable()
  if (error) throw error

  return NextResponse.json({ advisor: toCustomAdvisor(data as AdvisorRow) })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = cleanText(request.nextUrl.searchParams.get('id'), 80)
  if (!id) return NextResponse.json({ error: 'Advisor id is required.' }, { status: 400 })

  const { error } = await supabase
    .from('advisors')
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error && isMissingTableWrite(error, 'advisors')) return schemaUnavailable()
  if (error) throw error

  return NextResponse.json({ success: true, id })
}
