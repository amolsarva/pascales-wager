import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { getRelevantContext, buildSystemPrompt } from '@/lib/memory/retrieval'
import { extractMemoriesFromConversation } from '@/lib/memory/extraction'
import { parseHomeworkBlocks, type MentorId } from '@/lib/mentors/personas'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, conversationId, advisorId } = await request.json()

    const { data: profile } = await supabase
      .from('users')
      .select('seed_identity, mentor_id')
      .eq('id', user.id)
      .single()

    const mentorId: MentorId = (profile?.mentor_id as MentorId) || 'pascale'

    const context = await getRelevantContext(user.id)

    let systemPrompt: string
    if (advisorId) {
      const { data: advisor } = await supabase
        .from('advisors')
        .select('system_prompt, name')
        .eq('id', advisorId)
        .eq('user_id', user.id)
        .single()
      if (advisor?.system_prompt) {
        systemPrompt = advisor.system_prompt
        if (context.identitySummary) systemPrompt += `\n\n[User context: ${context.identitySummary}]`
        if (context.semanticMemories.length > 0) {
          systemPrompt += '\n\n[Known about this user:\n' + context.semanticMemories.map(m => `- ${m.content}`).join('\n') + ']'
        }
      } else {
        systemPrompt = buildSystemPrompt(context, mentorId, profile?.seed_identity)
      }
    } else {
      systemPrompt = buildSystemPrompt(context, mentorId, profile?.seed_identity)
    }

    const userMessage = messages[messages.length - 1]
    await supabase.from('messages').insert({
      user_id: user.id,
      role: 'user',
      content: userMessage.content,
      conversation_id: conversationId,
    })

    // Collect full response before streaming so we can parse homework blocks
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-20),
      ],
      temperature: 0.8,
      max_tokens: 900,
    })

    const fullResponse = completion.choices[0]?.message?.content || ''
    const { cleanText, homework } = parseHomeworkBlocks(fullResponse)

    // Save assistant message (clean, without [HOMEWORK] tags)
    await supabase.from('messages').insert({
      user_id: user.id,
      role: 'assistant',
      content: cleanText,
      conversation_id: conversationId,
    })

    // Save any homework assignments
    if (homework.length > 0) {
      await supabase.from('homework').insert(
        homework.map(hw => ({
          user_id: user.id,
          mentor_id: mentorId,
          title: hw.title,
          type: hw.type,
          task: hw.task,
        }))
      )
    }

    // Trigger async memory extraction
    extractAndStoreMemories(user.id, messages, cleanText, context).catch(console.error)

    // Stream the clean text back to the client, then send any homework data
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      start(controller) {
        // Send content in one chunk (already buffered for homework parsing)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ content: cleanText })}\n\n`)
        )

        // Send homework metadata for client-side rendering
        if (homework.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ homework })}\n\n`)
          )
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function extractAndStoreMemories(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  assistantResponse: string,
  existingContext: Awaited<ReturnType<typeof getRelevantContext>>
) {
  const supabase = await createClient()

  const existingContextText = [
    ...existingContext.semanticMemories.map(m => m.content),
    ...existingContext.narrativeMemories.map(m => m.content),
  ].join('\n')

  const allMessages = [
    ...messages,
    { role: 'assistant', content: assistantResponse },
  ]

  const extracted = await extractMemoriesFromConversation(allMessages, existingContextText)

  const memoriesToInsert = [
    ...extracted.episodic.map(m => ({ ...m, type: 'episodic' as const, user_id: userId })),
    ...extracted.semantic.map(m => ({ ...m, type: 'semantic' as const, user_id: userId })),
    ...extracted.narrative.map(m => ({ ...m, type: 'narrative' as const, user_id: userId })),
  ].filter(m => m.confidence > 0.5)

  if (memoriesToInsert.length > 0) {
    await supabase.from('memories').insert(memoriesToInsert)
  }
}
