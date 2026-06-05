import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { advisors, type Advisor } from '@/lib/council-data'
import { buildSystemPrompt, getRelevantContext } from '@/lib/memory/retrieval'

type CouncilAdvisorResponse = {
  advisorId: string
  content: string
}

type CouncilSynthesis = {
  headline: string
  synthesis: string
  recommendedAction: string
  openQuestion: string
}

type CouncilRound = {
  id: string
  question: string
  responses: CouncilAdvisorResponse[]
  synthesis?: CouncilSynthesis
  createdAt: string
}

type StoredAdvisorMessage = CouncilAdvisorResponse & {
  kind: 'advisor'
}

type StoredSynthesisMessage = CouncilSynthesis & {
  kind: 'synthesis'
}

type StoredMessage = {
  id: string
  role: 'user' | 'assistant' | 'advisor' | 'synthesis'
  content: string
  created_at: string
}

type CouncilSession = {
  id: string
  title: string | null
  summary: string | null
  created_at: string
  updated_at: string
}

const advisorAssignments: Record<string, string> = {
  damon:
    'Focus on character formation. Ask what choice, habit, or discipline this situation is training. Do not confuse restraint with passivity.',
  mara:
    'Focus on decisions. Expose the tradeoff, identify the missing evidence, and recommend the smallest useful test or commitment.',
  elis:
    'Focus on the emotional truth. Name the feeling, desire, grief, or avoidance beneath the stated problem without diagnosing the person.',
  cassian:
    'Focus on self-deception. Test the premise, identify the convenient story, and name the risk the other advisors may underweight.',
  future:
    'Focus on the long view. Distinguish temporary discomfort from durable regret and protect the life the person is trying to build.',
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

let openai: OpenAI | undefined

function getOpenAI() {
  openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openai
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function parseJson<T>(value: string): T | undefined {
  try {
    return JSON.parse(value) as T
  } catch {
    return undefined
  }
}

function isUuid(value: string | null): value is string {
  return Boolean(value && uuidPattern.test(value))
}

function toPreview(content: string, maxLength = 72) {
  return content.length > maxLength ? `${content.slice(0, maxLength)}...` : content
}

function parseSynthesis(content: string): CouncilSynthesis {
  const parsed = parseJson<Partial<CouncilSynthesis>>(content)

  return {
    headline: parsed?.headline || 'A useful tension is coming into focus.',
    synthesis: parsed?.synthesis || content,
    recommendedAction: parsed?.recommendedAction || 'Choose one small action and give it a date.',
    openQuestion: parsed?.openQuestion || 'What remains yours to decide?',
  }
}

function parseStoredCouncilMessage(content: string) {
  return parseJson<StoredAdvisorMessage | StoredSynthesisMessage>(content)
}

function groupRounds(messages: StoredMessage[]): CouncilRound[] {
  const rounds: CouncilRound[] = []

  for (const message of messages) {
    if (message.role === 'user') {
      rounds.push({
        id: message.id,
        question: message.content,
        responses: [],
        createdAt: message.created_at,
      })
      continue
    }

    const currentRound = rounds.at(-1)
    if (!currentRound) continue

    if (message.role === 'advisor') {
      const stored = parseStoredCouncilMessage(message.content)
      if (stored?.kind === 'advisor') {
        currentRound.responses.push({
          advisorId: stored.advisorId,
          content: stored.content,
        })
      }
      continue
    }

    if (message.role === 'synthesis') {
      const stored = parseStoredCouncilMessage(message.content)
      currentRound.synthesis = stored?.kind === 'synthesis'
        ? {
            headline: stored.headline,
            synthesis: stored.synthesis,
            recommendedAction: stored.recommendedAction,
            openQuestion: stored.openQuestion,
          }
        : parseSynthesis(message.content)
    }
  }

  return rounds
}

function formatStoredMessage(message: StoredMessage) {
  if (message.role === 'user') return `Developer: ${message.content}`

  const stored = parseStoredCouncilMessage(message.content)
  if (stored?.kind === 'advisor') {
    const advisor = advisors.find((item) => item.id === stored.advisorId)
    return `${advisor?.name ?? 'Advisor'}: ${stored.content}`
  }

  if (stored?.kind === 'synthesis') {
    return `Council synthesis: ${stored.synthesis}`
  }

  return `Council: ${message.content}`
}

async function ensureUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string | null }
) {
  const { error } = await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email }, { onConflict: 'id' })

  if (error) throw error
}

async function ensureCouncilSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  conversationId: string,
  title: string
) {
  const { data: existing, error: existingError } = await supabase
    .from('sessions')
    .select('id, title')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingError) throw existingError

  if (!existing) {
    const { error } = await supabase.from('sessions').insert({
      id: conversationId,
      user_id: userId,
      mode: 'council',
      title: toPreview(title, 96),
      status: 'active',
    })
    if (error) throw error
    return
  }

  const { error } = await supabase
    .from('sessions')
    .update({
      title: existing.title || toPreview(title, 96),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .eq('user_id', userId)

  if (error) throw error
}

async function answerAsAdvisor(
  advisor: Advisor,
  context: Awaited<ReturnType<typeof getRelevantContext>>,
  seedIdentity: Record<string, string> | undefined,
  transcript: string,
  question: string
): Promise<CouncilAdvisorResponse> {
  const memoryPrompt = buildSystemPrompt(context, seedIdentity, advisor)
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `${memoryPrompt}

Council assignment: ${advisorAssignments[advisor.id] || advisor.bestFor}

Speak as one distinct advisor, not as a generic assistant. Use prior Council rounds and remembered context when it matters, but do not recap mechanically. Do not imitate the other advisors or anticipate the synthesis. Avoid empty encouragement, therapy language, and generic productivity advice. Be candid, grounded, and specific.

Answer in 120-220 words. Use short paragraphs. End with one pointed recommendation or question.`,
      },
      {
        role: 'user',
        content: `Earlier Council transcript:
${transcript || 'This is the first question in this Council thread.'}

Current question:
${question}`,
      },
    ],
    temperature: 0.85,
    max_tokens: 480,
  })

  return {
    advisorId: advisor.id,
    content: response.choices[0]?.message.content?.trim() || 'I need a moment to consider that more carefully.',
  }
}

async function synthesizeCouncil(question: string, responses: CouncilAdvisorResponse[]) {
  const responseText = responses
    .map(({ advisorId, content }) => {
      const advisor = advisors.find((item) => item.id === advisorId)
      return `${advisor?.name ?? 'Advisor'} (${advisor?.archetype ?? 'Council member'}):\n${content}`
    })
    .join('\n\n')

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You synthesize a private council of distinct advisors.

Return JSON with exactly these string fields:
{
  "headline": "a concise insight, not a slogan",
  "synthesis": "the real agreement and productive disagreement in 1-2 short paragraphs",
  "recommendedAction": "one concrete action, experiment, or conversation for the next 24-72 hours",
  "openQuestion": "the unresolved question the person must answer for themselves"
}

Preserve meaningful disagreement. Do not flatten every response into generic consensus. Do not diagnose, flatter, or claim authority.`,
      },
      {
        role: 'user',
        content: `Question:
${question}

Council responses:
${responseText}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 560,
  })

  return parseSynthesis(response.choices[0]?.message.content || '{}')
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureUserProfile(supabase, user)

    const conversationId = request.nextUrl.searchParams.get('conversationId')
    if (conversationId) {
      if (!isUuid(conversationId)) {
        return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .in('role', ['user', 'advisor', 'synthesis'])
        .order('created_at', { ascending: true })

      if (error) throw error

      return NextResponse.json({
        conversationId,
        rounds: groupRounds((data || []) as StoredMessage[]),
      })
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('id, title, summary, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('mode', 'council')
      .order('updated_at', { ascending: false })
      .limit(12)

    if (error) throw error

    return NextResponse.json({
      conversations: ((data || []) as CouncilSession[]).map((session) => ({
        id: session.id,
        title: session.title || 'Council thread',
        preview: session.summary || session.title || 'Council thread',
        created_at: session.created_at,
        updated_at: session.updated_at,
      })),
    })
  } catch (error) {
    console.error('Council history error:', error)
    return NextResponse.json({ error: 'Unable to load Council history.' }, { status: 500 })
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
    const question = cleanText(body.question, 4000)
    const conversationId = cleanText(body.conversationId, 80)
    const selectedAdvisors = advisors
      .filter((advisor) => Array.isArray(body.advisorIds) && body.advisorIds.includes(advisor.id))
      .slice(0, 5)

    if (!isUuid(conversationId)) {
      return NextResponse.json({ error: 'Invalid Council thread.' }, { status: 400 })
    }
    if (!question) {
      return NextResponse.json({ error: 'Bring one question under 4,000 characters.' }, { status: 400 })
    }
    if (selectedAdvisors.length < 2) {
      return NextResponse.json({ error: 'Invite at least two advisors.' }, { status: 400 })
    }

    await ensureUserProfile(supabase, user)
    await ensureCouncilSession(supabase, user.id, conversationId, question)

    const [{ data: history, error: historyError }, { data: profile }] = await Promise.all([
      supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .in('role', ['user', 'advisor', 'synthesis'])
        .order('created_at', { ascending: true })
        .limit(80),
      supabase
        .from('users')
        .select('seed_identity')
        .eq('id', user.id)
        .single(),
    ])

    if (historyError) throw historyError

    const previousMessages = (history || []) as StoredMessage[]
    const transcript = previousMessages.map(formatStoredMessage).join('\n\n').slice(-16000)
    const context = await getRelevantContext(user.id, question)
    const now = new Date().toISOString()

    const { data: questionMessage, error: questionError } = await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        role: 'user',
        content: question,
        conversation_id: conversationId,
        session_id: conversationId,
      })
      .select('id, created_at')
      .single()

    if (questionError) throw questionError

    const responses = await Promise.all(
      selectedAdvisors.map((advisor) =>
        answerAsAdvisor(advisor, context, profile?.seed_identity, transcript, question)
      )
    )
    const synthesis = await synthesizeCouncil(question, responses)

    const { error: responseError } = await supabase.from('messages').insert([
      ...responses.map((response) => ({
        user_id: user.id,
        role: 'advisor',
        content: JSON.stringify({ kind: 'advisor', ...response } satisfies StoredAdvisorMessage),
        conversation_id: conversationId,
        session_id: conversationId,
      })),
      {
        user_id: user.id,
        role: 'synthesis',
        content: JSON.stringify({ kind: 'synthesis', ...synthesis } satisfies StoredSynthesisMessage),
        conversation_id: conversationId,
        session_id: conversationId,
      },
    ])

    if (responseError) throw responseError

    await Promise.all([
      supabase
        .from('sessions')
        .update({
          summary: synthesis.headline,
          main_dilemma: question,
          decision_status: synthesis.recommendedAction,
          updated_at: now,
        })
        .eq('id', conversationId)
        .eq('user_id', user.id),
      supabase
        .from('memories')
        .insert({
          user_id: user.id,
          session_id: conversationId,
          type: 'episodic',
          content: `Council question: ${question}`,
          confidence: 0.86,
          importance: 6,
          source_message_ids: questionMessage?.id ? [questionMessage.id] : undefined,
        }),
    ])

    return NextResponse.json({
      round: {
        id: questionMessage?.id || crypto.randomUUID(),
        question,
        responses,
        synthesis,
        createdAt: questionMessage?.created_at || now,
      } satisfies CouncilRound,
    })
  } catch (error) {
    console.error('Council response error:', error)
    return NextResponse.json({ error: 'The Council could not answer just now.' }, { status: 500 })
  }
}
