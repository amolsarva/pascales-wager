import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import {
  formatSummaryTranscript,
  parseGeneratedSummary,
  toPreview,
  uuidPattern,
  type GeneratedSessionSummary,
  type SummaryMessage,
} from '@/lib/sessions/summaries'

type StoredSession = {
  id: string
  mode: string | null
  title: string | null
}

let openai: OpenAI | undefined

function getOpenAI() {
  openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openai
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function firstUserMessage(messages: SummaryMessage[]) {
  return messages.find((message) => message.role === 'user')?.content || 'Reflective session'
}

async function generateSummary(transcript: string): Promise<GeneratedSessionSummary> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You summarize a private reflective advice session.

Return JSON with exactly these fields:
{
  "title": "specific short title, not generic",
  "summary": "4-7 sentence practical summary of the session",
  "keyPoints": ["3-6 important observations or decisions"],
  "nextActions": ["1-5 concrete next actions"],
  "memoriesToSave": ["0-5 durable facts, values, patterns, or commitments worth remembering"],
  "followUpQuestion": "one question worth asking next",
  "mainDilemma": "the central dilemma or topic",
  "emotionalTone": "the observed emotional tone in a few words",
  "decisionStatus": "where the decision or reflection stands now"
}

Do not invent facts. Keep wording direct, non-clinical, and non-authoritative. Preserve uncertainty where the session did.`,
      },
      {
        role: 'user',
        content: `Session transcript:
${transcript}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.35,
    max_tokens: 900,
  })

  return parseGeneratedSummary(response.choices[0]?.message.content || '{}')
}

async function ensureSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sessionId: string,
  mode: string,
  title: string
) {
  const { data: existing, error: existingError } = await supabase
    .from('sessions')
    .select('id, mode, title')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return existing as StoredSession

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      id: sessionId,
      user_id: userId,
      mode,
      title: toPreview(title, 96),
      status: 'active',
    })
    .select('id, mode, title')
    .single()

  if (error) throw error
  return data as StoredSession
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = request.nextUrl.searchParams.get('sessionId')

    let query = supabase
      .from('session_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (sessionId) {
      if (!uuidPattern.test(sessionId)) {
        return NextResponse.json({ error: 'Invalid session id' }, { status: 400 })
      }
      query = query.eq('session_id', sessionId).limit(5)
    }

    const { data, error } = await query
    if (error) throw error

    const sessionIds = Array.from(new Set((data || []).map((summary) => summary.session_id).filter(Boolean)))
    const { data: sessions } = sessionIds.length
      ? await supabase
          .from('sessions')
          .select('id, mode')
          .eq('user_id', user.id)
          .in('id', sessionIds)
      : { data: [] }

    const modeBySessionId = new Map((sessions || []).map((session) => [session.id, session.mode]))
    const summaries = (data || []).map((summary) => {
      const mode = modeBySessionId.get(summary.session_id) === 'council' ? 'council' : 'chat'
      return {
        ...summary,
        mode,
        href: mode === 'council'
          ? `/council?conversation=${summary.session_id}`
          : `/chat?conversation=${summary.session_id}`,
      }
    })

    return NextResponse.json({
      summaries,
      summary: summaries[0] || null,
    })
  } catch (error) {
    console.error('Session summary load error:', error)
    return NextResponse.json({ error: 'Unable to load session summaries.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const sessionId = cleanText(body.sessionId || body.conversationId, 80)

    if (!uuidPattern.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid session id' }, { status: 400 })
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .eq('conversation_id', sessionId)
      .in('role', ['user', 'assistant', 'advisor', 'synthesis', 'system'])
      .order('created_at', { ascending: true })
      .limit(120)

    if (messagesError) throw messagesError

    const sessionMessages = (messages || []) as SummaryMessage[]
    if (sessionMessages.length < 2) {
      return NextResponse.json({ error: 'Not enough session content to summarize.' }, { status: 400 })
    }

    const { data: existingSession } = await supabase
      .from('sessions')
      .select('mode')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle()

    const mode = existingSession?.mode === 'council' ? 'council' : 'freeform'
    await ensureSession(supabase, user.id, sessionId, mode, firstUserMessage(sessionMessages))

    const generated = await generateSummary(formatSummaryTranscript(sessionMessages))

    const { data: summary, error: summaryError } = await supabase
      .from('session_summaries')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        summary: generated.summary,
        key_points: generated.keyPoints,
        next_actions: generated.nextActions,
        memories_to_save: generated.memoriesToSave,
        follow_up_question: generated.followUpQuestion,
      })
      .select()
      .single()

    if (summaryError) throw summaryError

    const memoryRows = generated.memoriesToSave.map((content) => ({
      user_id: user.id,
      session_id: sessionId,
      type: 'narrative',
      content,
      confidence: 0.78,
      importance: 6,
    }))

    const { error: sessionUpdateError } = await supabase
      .from('sessions')
      .update({
        title: generated.title || toPreview(firstUserMessage(sessionMessages), 96),
        summary: generated.summary,
        main_dilemma: generated.mainDilemma || null,
        emotional_tone: generated.emotionalTone || null,
        decision_status: generated.decisionStatus || generated.nextActions[0] || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)

    if (sessionUpdateError) throw sessionUpdateError

    if (memoryRows.length > 0) {
      const { error: memoryError } = await supabase.from('memories').insert(memoryRows)
      if (memoryError) throw memoryError
    }

    return NextResponse.json({ summary, generated })
  } catch (error) {
    console.error('Session summary generation error:', error)
    return NextResponse.json({ error: 'Unable to summarize this session.' }, { status: 500 })
  }
}
