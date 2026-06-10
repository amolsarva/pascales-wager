import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: session }, { data: messages }] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, advisors(name, archetype, role_description, tone)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ session, messages: messages || [] })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title
  if (body.status !== undefined) {
    updates.status = body.status
    if (body.status === 'ended') updates.ended_at = new Date().toISOString()
  }
  if (body.summary !== undefined) updates.summary = body.summary
  if (body.emotional_tone !== undefined) updates.emotional_tone = body.emotional_tone

  const { data: session, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ session })
}
