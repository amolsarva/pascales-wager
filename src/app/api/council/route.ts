import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

const SYNTHESIS_PROMPT = `You are synthesizing responses from multiple advisors who answered the same question.

Generate a concise synthesis (2-3 paragraphs) that addresses:
1. Where the advisors agree — what seems clear
2. The most productive tension between their perspectives — what the disagreement reveals
3. A recommended focus or action the user should consider
4. What ultimately remains for the user to decide for themselves

Do not list or attribute responses. Synthesize into flowing prose. Be direct.`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { advisorIds, question } = await request.json()

  if (!advisorIds?.length || advisorIds.length < 2) {
    return NextResponse.json({ error: 'Select at least 2 advisors' }, { status: 400 })
  }
  if (!question?.trim()) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 })
  }

  // Load advisors
  const { data: advisors } = await supabase
    .from('advisors')
    .select('id, name, archetype, role_description, worldview, tone, system_prompt')
    .in('id', advisorIds)
    .eq('user_id', user.id)

  if (!advisors?.length) {
    return NextResponse.json({ error: 'Advisors not found' }, { status: 404 })
  }

  const openai = getOpenAI()

  // Call each advisor in parallel
  const advisorCalls = advisors.map(async (advisor) => {
    const systemPrompt = `${advisor.system_prompt}

You are participating in a council session. The user is hearing from multiple advisors at once.
Your task: give your perspective on their question in your authentic voice. Be direct. 2-3 paragraphs maximum.
Do not try to cover everything — offer your most distinctive insight.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.8,
        max_tokens: 500,
      })
      return {
        advisorId: advisor.id,
        advisorName: advisor.name,
        advisorArchetype: advisor.archetype,
        response: completion.choices[0]?.message?.content || '',
      }
    } catch {
      return {
        advisorId: advisor.id,
        advisorName: advisor.name,
        advisorArchetype: advisor.archetype,
        response: 'This advisor could not respond at this time.',
      }
    }
  })

  const responses = await Promise.all(advisorCalls)

  // Generate synthesis
  const synthesisInput = responses
    .map(r => `${r.advisorName}${r.advisorArchetype ? ` (${r.advisorArchetype})` : ''}:\n${r.response}`)
    .join('\n\n---\n\n')

  const synthesisCompletion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYNTHESIS_PROMPT },
      { role: 'user', content: `The question: "${question}"\n\nAdvisor responses:\n\n${synthesisInput}` },
    ],
    temperature: 0.5,
    max_tokens: 600,
  })

  const synthesis = synthesisCompletion.choices[0]?.message?.content || ''

  // Try to save council session to DB (graceful — tables may not exist)
  try {
    const { data: councilSession } = await supabase
      .from('council_sessions')
      .insert({
        user_id: user.id,
        advisor_ids: advisorIds,
        question,
        synthesis,
      })
      .select()
      .single()

    if (councilSession) {
      await supabase.from('council_responses').insert(
        responses.map(r => ({
          council_session_id: councilSession.id,
          advisor_id: r.advisorId,
          response: r.response,
        }))
      )
    }
  } catch {}

  return NextResponse.json({ responses, synthesis })
}
