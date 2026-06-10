import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: memories } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ memories: memories || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memories, sessionId } = await request.json()
  if (!memories?.length) return NextResponse.json({ ok: true })

  const rows = memories.map((m: { type: string; content: string; importance: number }) => ({
    user_id: user.id,
    type: m.type,
    content: m.content,
    confidence: Math.min((m.importance || 5) / 10, 1),
    ...(sessionId ? { conversation_id: sessionId } : {}),
  }))

  await supabase.from('memories').insert(rows)

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  await supabase.from('memories').delete().eq('id', id).eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
