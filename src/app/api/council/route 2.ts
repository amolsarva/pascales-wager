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

type StoredAdvisorMessage = CouncilAdvisorResponse & {
  kind: 'advisor'
}

type StoredSynthesisMessage = CouncilSynthesis & {
  kind: 'synthesis'
}

type StoredMessage = {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

type CouncilRound = {
  id: string
  question: string
  responses: CouncilAdvisorResponse[]
  synthesis?: CouncilSynthesis
  createdAt: string
}

let openai: OpenAI | undefined

function getOpenAI() {
  openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openai
}

function isUuid(value: string | null): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

function parseJson<T>(value: string): T | undefined {
  try {
    return JSON.parse(value) as T
  } catch {
    return undefined
  }
}

function groupRounds(messages: StoredMessage[]): CouncilRound[] {
  const rounds: CouncilRound[] = []

  for (const message of messages) {
    if (message.role === 'user') {
      rounds.push({
        id: `${message.created_at}-${rounds.length}`,
        question: message.content,
        responses: [],
        createdAt: message.created_at,
      })
      continue
    }

    const currentRound = rounds.at(-1)
    if (!currentRound) continue

    const storedResponse = parseJson<StoredAdvisorMessage | StoredSynthesisMessage>(message.content)
    if (storedResponse?.kind === 'advisor') {
      currentRound.responses.push(storedResponse)
    }
    if (storedResponse?.kind === 'synthesis') {
      currentRound.synthesis = storedResponse
    }
  }

  return rounds
}

function formatStoredMessage(message: StoredMessage) {
  if (message.role === 'user') return `Developer: ${message.content}`

  const storedResponse = parseJson<StoredAdvisorMessage | StoredSynthesisMessage>(message.content)

  if (storedResponse?.kind === 'advisor') {
    const response = storedResponse
    const advisor = advisors.find((item) => item.id === response?.advisorId)
    return `${advisor?.name ?? 'Advisor'}: ${response?.content ?? message.content}`
  }

  return `Council synthesis: ${storedResponse?.kind === 'synthesis' ? storedResponse.synthesis : message.content}`
}

function parseSynthesis(content: string): CouncilSynthesis {
  const parsed = parseJson<Partial<CouncilSynthesis>>(content)

  return {
    headline: parsed?.headline || 'A useful tension is coming into focus.',
    synthesis: parsed?.synthesis || content,
    recommendedAction: parsed?.recommendedAction || 'Name one concrete next step and give it a date.',
    openQuestion: parsed?.openQuestion || 'What remains yours to decide?',
  }
}

async function ensureDeveloperProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string }
) {
  const { error } = await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email }, { onConflict: 'id' })

  if (error) throw error
}

async function answerAsAdvisor(
  advisor: Advisor,
  context: Awaited<ReturnType<typeof getRelevantContext>>,
  seedIdentity: Record<string, string> | undefined,
  transcript: string,
  question: string
): Promise<CouncilAdvisorResponse> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: buildSystemPrompt(context, seedIdentity, advisor) },
      {
        role: 'user',
        content: `You are one member of a council. Answer independently in 2-4 short paragraphs. Do not imitate the other advisors. Name one practical implication when it helps.

Previous room transcript:
${transcript || 'This is the first question in the room.'}

The developer's current question:
${question}`,
      },
    ],
    temperature: 0.75,
    max_tokens: 550,
  })

  return {
    advisorId: advisor.id,
    content: response.choices[0]?.message.content?.trim() || 'I need a moment to consider that more carefully.',
  }
}

async function synthesizeCouncil(
  question: string,
  responses: CouncilAdvisorResponse[]
): Promise<CouncilSynthesis> {
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
        content: `You synthesize several distinct advisors inside The Council, a private reflection app.

Return JSON with exactly these string fields:
{
  "headline": "a concise insight",
  "synthesis": "the agreement and productive tension in 1-2 paragraphs",
  "recommendedAction": "one concrete next action",
  "openQuestion": "the question the developer still has to decide"
}

Remain grounded and non-coercive. Do not claim authority, diagnose, or flatten meaningful disagreements.`,
      },
      {
        role: 'user',
        content: `Question:\n${question}\n\nCouncil responses:\n${responseText}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.45,
    max_tokens: 650,
  })

  return parseSynthesis(response.choices[0]?.message.content || '{}')
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const conversationId = request.nextUrl.searchParams.get('conversationId')

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isUuid(conversationId)) return NextResponse.json({ rounds: [] })

    await ensureDeveloperProfile(supabase, user)

    const { data, error } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ rounds: groupRounds((data || []) as StoredMessage[]) })
  } catch (error) {
    console.error('Council history error:', error)
    return NextResponse.json({ error: 'Unable to load this room' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const question = typeof body.question === 'string' ? body.question.trim() : ''
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId : ''
    const selectedAdvisors = advisors.filter((advisor) => body.advisorIds?.includes(advisor.id)).slice(0, 5)

    if (!isUuid(conversationId)) {
      return NextResponse.json({ error: 'Invalid conversation' }, { status: 400 })
    }
    if (!question || question.length > 4000) {
      return NextResponse.json({ error: 'Bring one question under 4,000 characters' }, { status: 400 })
    }
    if (selectedAdvisors.length < 2) {
      return NextResponse.json({ error: 'Invite at least two advisors' }, { status: 400 })
    }

    await ensureDeveloperProfile(supabase, user)

    const [{ data: history, error: historyError }, { data: profile }] = await Promise.all([
      supabase
        .from('messages')
        .select('role, content, created_at')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: true })
        .limit(60),
      supabase.from('users').select('seed_identity').eq('id', user.id).single(),
    ])

    if (historyError) throw historyError

    const previousMessages = (history || []) as StoredMessage[]
    const transcript = previousMessages.map(formatStoredMessage).join('\n\n')
    const context = await getRelevantContext(user.id, question)

    const { error: questionError } = await supabase.from('messages').insert({
      user_id: user.id,
      role: 'user',
      content: question,
      conversation_id: conversationId,
    })
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
        role: 'assistant',
        content: JSON.stringify({ kind: 'advisor', ...response } satisfies StoredAdvisorMessage),
        conversation_id: conversationId,
      })),
      {
        user_id: user.id,
        role: 'assistant',
        content: JSON.stringify({ kind: 'synthesis', ...synthesis } satisfies StoredSynthesisMessage),
        conversation_id: conversationId,
      },
    ])
    if (responseError) throw responseError

    await supabase.from('memories').insert({
      user_id: user.id,
      type: 'episodic',
      content: `The developer brought this question to the Council: ${question}`,
      confidence: 0.9,
      importance: 6,
    })

    return NextResponse.json({
      round: {
        id: `${new Date().toISOString()}-${previousMessages.length}`,
        question,
        responses,
        synthesis,
        createdAt: new Date().toISOString(),
      } satisfies CouncilRound,
    })
  } catch (error) {
    console.error('Council response error:', error)
    return NextResponse.json({ error: 'The Council could not answer just now' }, { status: 500 })
  }
}
