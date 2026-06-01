import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { synthesizeIdentity } from '@/lib/memory/extraction'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all memories
    const { data: memories } = await supabase
      .from('memories')
      .select('type, content, confidence')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!memories || memories.length < 5) {
      return NextResponse.json({ error: 'Not enough memories yet' }, { status: 400 })
    }

    // Fetch seed identity
    const { data: profile } = await supabase
      .from('users')
      .select('seed_identity')
      .eq('id', user.id)
      .single()

    const synthesis = await synthesizeIdentity(memories, profile?.seed_identity)

    // Store the identity summary
    const { data: summary, error } = await supabase
      .from('identity_summaries')
      .insert({
        user_id: user.id,
        summary: synthesis.summary,
        traits: synthesis.traits,
        themes: synthesis.themes,
        contradictions: synthesis.contradictions,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Synthesis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: allSummaries } = await supabase
      .from('identity_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: memories } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      summary: allSummaries?.[0] || null,
      allSummaries: allSummaries || [],
      memories: memories || [],
    })
  } catch (error) {
    console.error('Get synthesis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
