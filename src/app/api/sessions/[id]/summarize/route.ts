import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

const SUMMARY_SYSTEM_PROMPT = `You are analyzing a conversation between a user and their AI advisor. Your job is to create a structured session summary.

Return ONLY valid JSON with this exact structure:
{
  "session_title": "A short, descriptive title for this session (5-8 words)",
  "summary": "A 2-3 sentence narrative summary of what was explored",
  "main_dilemma": "The core question or challenge the person brought (1 sentence)",
  "emotional_tone": "The overall emotional quality of the session (2-4 words, e.g. 'anxious but clarifying')",
  "next_actions": ["Specific action the person committed to or should take"],
  "memories_to_save": [
    {
      "type": "user_value",
      "content": "A specific, durable fact or value worth remembering about this person",
      "importance": 8
    }
  ],
  "follow_up_question": "One question the advisor would want to return to in the next session"
}

Memory types: "user_value", "recurring_pattern", "preference", "unresolved_decision", "relationship_context", "life_goal", "commitment"
Importance: 1-10. Only include memories with importance >= 6. Include 2-5 memories maximum.
If there is nothing worth remembering, return an empty memories_to_save array.`

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: session } = await supabase
    .from('sessions')
    .select('id, advisor_id, advisors(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Load messages
  const { data: messages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (!messages || messages.length < 2) {
    return NextResponse.json({ error: 'Not enough messages to summarize' }, { status: 400 })
  }

  const conversationText = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Advisor'}: ${m.content}`)
    .join('\n\n')

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: `Here is the session conversation:\n\n${conversationText}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000,
    })

    const raw = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(raw)

    // Save to session_summaries table (graceful — table may not exist yet)
    try {
      await supabase.from('session_summaries').insert({
        session_id: id,
        user_id: user.id,
        summary: parsed.summary,
        key_points: parsed.next_actions || [],
        next_actions: parsed.next_actions || [],
        memories_to_save: parsed.memories_to_save || [],
        follow_up_question: parsed.follow_up_question,
      })
    } catch {}

    // Update session with generated title and summary
    await supabase
      .from('sessions')
      .update({
        title: parsed.session_title,
        summary: parsed.summary,
        main_dilemma: parsed.main_dilemma,
        emotional_tone: parsed.emotional_tone,
      })
      .eq('id', id)

    return NextResponse.json({ summary: parsed })
  } catch (error) {
    console.error('Summarize error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
