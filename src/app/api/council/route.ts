import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { advisors, type Advisor } from '@/lib/council-data'

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
  question: string
  responses: CouncilAdvisorResponse[]
  synthesis?: CouncilSynthesis
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

const requestsByClient = new Map<string, number[]>()
const hourInMilliseconds = 60 * 60 * 1000
const maxRequestsPerHour = 30

let openai: OpenAI | undefined

function getOpenAI() {
  openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openai
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function normalizeRounds(value: unknown): CouncilRound[] {
  if (!Array.isArray(value)) return []

  return value.slice(-8).flatMap((round) => {
    const question = cleanText(round?.question, 2000)
    if (!question) return []

    const responses = Array.isArray(round?.responses)
      ? round.responses.slice(0, 5).flatMap((response: CouncilAdvisorResponse) => {
          const advisorId = cleanText(response?.advisorId, 30)
          const content = cleanText(response?.content, 3000)
          return advisorId && content ? [{ advisorId, content }] : []
        })
      : []

    const synthesis = round?.synthesis
      ? {
          headline: cleanText(round.synthesis.headline, 240),
          synthesis: cleanText(round.synthesis.synthesis, 2500),
          recommendedAction: cleanText(round.synthesis.recommendedAction, 800),
          openQuestion: cleanText(round.synthesis.openQuestion, 800),
        }
      : undefined

    return [{ question, responses, synthesis }]
  })
}

function formatTranscript(rounds: CouncilRound[]) {
  const transcript = rounds
    .map((round, index) => {
      const responses = round.responses
        .map(({ advisorId, content }) => {
          const advisor = advisors.find((item) => item.id === advisorId)
          return `${advisor?.name ?? 'Advisor'}: ${content}`
        })
        .join('\n')

      return `Round ${index + 1}
Developer: ${round.question}
${responses}
Council synthesis: ${round.synthesis?.synthesis ?? 'No synthesis saved.'}`
    })
    .join('\n\n')

  return transcript.slice(-16000)
}

function parseJson<T>(content: string): T | undefined {
  try {
    return JSON.parse(content) as T
  } catch {
    return undefined
  }
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

function isWithinPrototypeLimit(request: NextRequest) {
  const client =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  const now = Date.now()
  const recentRequests = (requestsByClient.get(client) || []).filter(
    (timestamp) => now - timestamp < hourInMilliseconds
  )

  if (recentRequests.length >= maxRequestsPerHour) return false

  recentRequests.push(now)
  requestsByClient.set(client, recentRequests)
  return true
}

async function answerAsAdvisor(
  advisor: Advisor,
  transcript: string,
  question: string
): Promise<CouncilAdvisorResponse> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are ${advisor.name}, ${advisor.archetype}, inside The Council: a private reflection prototype.

Role: ${advisor.description}
Worldview: ${advisor.worldview}
Tone: ${advisor.tone}
Your assignment: ${advisorAssignments[advisor.id] || advisor.bestFor}

Speak as one distinct advisor, not as a generic assistant. Use the earlier transcript when it matters, but do not recap it mechanically. Do not imitate the other advisors or anticipate the synthesis. Avoid empty encouragement, therapy language, and generic productivity advice. Be candid, grounded, and specific. Offer a perspective the other council members might miss.

Answer in 120-220 words. Use short paragraphs. End with one pointed recommendation or question.

Boundaries: do not diagnose, manipulate, encourage dependency, claim authority, or replace emergency, medical, legal, or financial support.`,
      },
      {
        role: 'user',
        content: `Earlier room transcript:
${transcript || 'This is the first question in this room.'}

Current question:
${question}`,
      },
    ],
    temperature: 0.85,
    max_tokens: 420,
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

export async function POST(request: NextRequest) {
  try {
    if (!isWithinPrototypeLimit(request)) {
      return NextResponse.json(
        { error: 'The prototype room has reached its hourly limit. Return in a little while.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const question = cleanText(body.question, 4000)
    const previousRounds = normalizeRounds(body.rounds)
    const selectedAdvisors = advisors
      .filter((advisor) => Array.isArray(body.advisorIds) && body.advisorIds.includes(advisor.id))
      .slice(0, 5)

    if (!question) {
      return NextResponse.json({ error: 'Bring one question under 4,000 characters.' }, { status: 400 })
    }
    if (selectedAdvisors.length < 2) {
      return NextResponse.json({ error: 'Invite at least two advisors.' }, { status: 400 })
    }

    const transcript = formatTranscript(previousRounds)
    const responses = await Promise.all(
      selectedAdvisors.map((advisor) => answerAsAdvisor(advisor, transcript, question))
    )
    const synthesis = await synthesizeCouncil(question, responses)

    return NextResponse.json({
      round: {
        id: crypto.randomUUID(),
        question,
        responses,
        synthesis,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Council response error:', error)
    return NextResponse.json({ error: 'The Council could not answer just now.' }, { status: 500 })
  }
}
