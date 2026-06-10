import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, advisors(name, archetype)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ sessions: sessions || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { advisorId, mode, title, mainDilemma } = await request.json()

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      advisor_id: advisorId || null,
      mode: mode || 'freeform',
      title: title || null,
      main_dilemma: mainDilemma || null,
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ session })
}
