import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [advisors, sessions, memories, homework] = await Promise.all([
    supabase.from('advisors').select('*').eq('user_id', user.id),
    supabase.from('sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('memories').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('homework').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    advisors: advisors.data || [],
    sessions: sessions.data || [],
    memories: memories.data || [],
    homework: homework.data || [],
  }

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="pascales-wager-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
