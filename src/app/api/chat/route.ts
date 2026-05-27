import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { getRelevantContext, buildSystemPrompt } from '@/lib/memory/retrieval'
import { extractMemoriesFromConversation } from '@/lib/memory/extraction'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, conversationId } = await request.json()

    // Get user profile for seed identity
    const { data: profile } = await supabase
      .from('users')
      .select('seed_identity')
      .eq('id', user.id)
      .single()

    // Retrieve relevant memory context
    const context = await getRelevantContext(user.id, messages[messages.length - 1]?.content || '')
    const systemPrompt = buildSystemPrompt(context, profile?.seed_identity)

    // Save user message
    const userMessage = messages[messages.length - 1]
    await supabase.from('messages').insert({
      user_id: user.id,
      role: 'user',
      content: userMessage.content,
      conversation_id: conversationId,
    })

    // Stream response from OpenAI
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-20), // Keep last 20 messages for context window
      ],
      stream: true,
      temperature: 0.8,
      max_tokens: 800,
    })

    let fullResponse = ''

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || ''
          if (delta) {
            fullResponse += delta
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`))
          }
        }

        // Save assistant message
        await supabase.from('messages').insert({
          user_id: user.id,
          role: 'assistant',
          content: fullResponse,
          conversation_id: conversationId,
        })

        // Trigger async memory extraction (fire and forget)
        extractAndStoreMemories(user.id, messages, fullResponse, context).catch(console.error)

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
