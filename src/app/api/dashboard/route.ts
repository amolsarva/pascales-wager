import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type UserMessage = {
  conversation_id: string | null
  content: string
  created_at: string
}

type MemoryRow = {
  id: string
  type: 'episodic' | 'semantic' | 'narrative'
  content: string
  confidence: number
  created_at: string
}

type SummaryRow = {
  id: string
  summary: string
  themes: string[] | null
  created_at: string
}

type RitualRow = {
  id: string
  prompt: string
  response: string | null
  created_at: string
}

const dailyRituals = [
  'What did you avoid today?',
  'What energized you?',
  'What truth did you ignore?',
  'Who did you perform for?',
  'What are you becoming?',
  'What did you protect yourself from feeling?',
  'Where did you compromise without naming it?',
  'What would you do differently if no one was watching?',
]

function toPreview(content: string, maxLength = 86) {
  return content.length > maxLength ? `${content.slice(0, maxLength)}...` : content
}

function getDailyRitual() {
  const today = new Date()
  const start = new Date(today.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((today.getTime() - start.getTime()) / 1000 / 60 / 60 / 24)
  return dailyRituals[dayOfYear % dailyRituals.length]
}

function inferThemes(summary: SummaryRow | null, memories: MemoryRow[]) {
  const summaryThemes = summary?.themes?.filter(Boolean) || []
  if (summaryThemes.length > 0) return summaryThemes.slice(0, 7)

  const semanticThemes = memories
    .filter((memory) => memory.type === 'semantic' || memory.type === 'narrative')
    .flatMap((memory) => {
      const words = memory.content
        .replace(/[^\w\s-]/g, '')
        .split(/\s+/)
        .filter((word) => word.length > 5)
      return words.slice(0, 2)
    })

  return Array.from(new Set(semanticThemes)).slice(0, 7)
}

function chooseNextAction(conversationCount: number, memoryCount: number, summary: SummaryRow | null) {
  if (conversationCount === 0) {
    return {
      title: 'Begin with one real question.',
      source: 'No sessions yet',
      href: '/chat',
    }
  }

  if (memoryCount < 5) {
    return {
      title: 'Save one answer worth carrying forward.',
      source: `${memoryCount}/5 memories before first synthesis`,
      href: '/chat',
    }
  }

  if (!summary) {
    return {
      title: 'Form your first Mirror portrait.',
      source: 'Enough memories are ready',
      href: '/mirror',
    }
  }

  return {
    title: 'Review the newest memory shaping future advice.',
    source: 'From the Mirror',
    href: '/mirror',
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [
    profileResult,
    messagesResult,
    memoriesResult,
    summariesResult,
    ritualsResult,
  ] = await Promise.all([
    supabase
      .from('users')
      .select('email, display_name, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('messages')
      .select('conversation_id, content, created_at')
      .eq('user_id', user.id)
      .eq('role', 'user')
      .not('conversation_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('memories')
      .select('id, type, content, confidence, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(60),
    supabase
      .from('identity_summaries')
      .select('id, summary, themes, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('rituals')
      .select('id, prompt, response, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (messagesResult.error) return NextResponse.json({ error: messagesResult.error.message }, { status: 500 })
  if (memoriesResult.error) return NextResponse.json({ error: memoriesResult.error.message }, { status: 500 })
  if (summariesResult.error) return NextResponse.json({ error: summariesResult.error.message }, { status: 500 })
  if (ritualsResult.error) return NextResponse.json({ error: ritualsResult.error.message }, { status: 500 })

  const messages = (messagesResult.data || []) as UserMessage[]
  const memories = (memoriesResult.data || []) as MemoryRow[]
  const summaries = (summariesResult.data || []) as SummaryRow[]
  const rituals = (ritualsResult.data || []) as RitualRow[]
  const latestSummary = summaries[0] || null

  const seen = new Set<string>()
  const conversations = []

  for (const message of messages) {
    if (!message.conversation_id || seen.has(message.conversation_id)) continue

    seen.add(message.conversation_id)
    conversations.push({
      id: message.conversation_id,
      title: toPreview(message.content, 64),
      preview: toPreview(message.content),
      created_at: message.created_at,
      href: `/chat?conversation=${message.conversation_id}`,
    })

    if (conversations.length === 6) break
  }

  const profile = profileResult.data
  const displayName = profile?.display_name || profile?.email?.split('@')[0] || user.email?.split('@')[0] || 'there'
  const themes = inferThemes(latestSummary, memories)

  return NextResponse.json({
    profile: {
      displayName,
      memberSince: profile?.created_at || user.created_at,
    },
    conversations,
    latestConversation: conversations[0] || null,
    themes,
    nextAction: chooseNextAction(conversations.length, memories.length, latestSummary),
    dailyRitual: getDailyRitual(),
    latestRitual: rituals[0] || null,
    counts: {
      conversations: seen.size,
      memories: memories.length,
      portraits: summaries.length,
      rituals: rituals.length,
    },
  })
}
