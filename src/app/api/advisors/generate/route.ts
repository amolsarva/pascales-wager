import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

const GENERATION_SYSTEM = `You are an advisor design system. Given a user's description of an advisor they want, generate a complete advisor profile.

Return ONLY valid JSON with this exact structure:
{
  "name": "string — name or title for this advisor (e.g. 'The Mentor', 'Damon', 'The Strategist')",
  "archetype": "string — 2-4 word archetype label",
  "role_description": "string — 2-3 sentences describing what this advisor does and who they are",
  "tone": "string — brief description of speaking style and emotional register",
  "worldview": "string — philosophical, ethical, or spiritual foundation",
  "helps_with": ["array of 4-7 specific topics or domains"],
  "guardrails": ["array of 3-5 things this advisor should never do or say"],
  "system_prompt": "string — full 4-6 paragraph system prompt for this advisor"
}

For the system_prompt, use this structure:
- Paragraph 1: Who this advisor is, their voice and character
- Paragraph 2: Their method and approach
- Paragraph 3: What they help with and how
- Paragraph 4: ACTIVE COACHING DIRECTIVES (end each response with a question or homework, name patterns, assign structured tasks)
- Paragraph 5 (optional): Any specific language, frameworks, or references they use

Important: The advisor should be philosophically and ethically grounded, not a cartoon version. Warm and challenging in equal measure. Never guru-like, never authoritarian, never claiming divine authority.`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { description } = await request.json()
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description required' }, { status: 400 })
    }

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: GENERATION_SYSTEM },
        { role: 'user', content: `Create an advisor based on this description: "${description}"` },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0].message.content || '{}'
    const advisor = JSON.parse(content)

    return NextResponse.json({ advisor })
  } catch (err) {
    console.error('Advisor generation error:', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
