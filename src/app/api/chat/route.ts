import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { apiErrorResponse } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'
import { getRelevantContext, buildSystemPrompt } from '@/lib/memory/retrieval'
import { extractMemoriesFromConversation } from '@/lib/memory/extraction'
import { advisors } from '@/lib/council-data'

let openai: OpenAI | undefined
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getOpenAI() {
  openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openai
}

function toPreview(content: string, maxLength = 96) {
  return content.length > maxLength ? `${content.slice(0, maxLength)}...` : content
}

function logDeferredWriteError(error: unknown) {
  if (error) console.error('Deferred chat persistence error:', error)
}

function isMissingMessageSessionId(error: { code?: string; message?: string } | null) {
  if (!error) return false
  const message = error.message?.toLowerCase() || ''
  return message.includes('session_id') && (error.code === 'PGRST204' || error.code === '42703')
}

function omitMessageSessionId<T extends { session_id?: string }>(row: T) {
  const { session_id: _sessionId, ...rest } = row
  return rest
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, conversationId, advisorId } = await request.json()
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    const advisor = advisors.find((item) => item.id === advisorId) ?? advisors[0]
    const safeConversationId = typeof conversationId === 'string' && uuidPattern.test(conversationId)
      ? conversationId
      : crypto.randomUUID()
    const userMessage = messages[messages.length - 1]
    if (typeof userMessage?.content !== 'string' || !userMessage.content.trim()) {
      return NextResponse.json({ error: 'No message content provided' }, { status: 400 })
    }

    const { error: profileError } = await supabase
      .from('users')
      .upsert({ id: user.id, email: user.email }, { onConflict: 'id' })
    if (profileError) throw profileError

    const { data: existingSession, error: existingSessionError } = await supabase
      .from('sessions')
      .select('id, title')
      .eq('id', safeConversationId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (existingSessionError) throw existingSessionError

    if (!existingSession) {
      const { error: sessionError } = await supabase.from('sessions').insert({
        id: safeConversationId,
        user_id: user.id,
        mode: 'freeform',
        title: toPreview(userMessage?.content || 'Advisor session'),
        status: 'active',
      })
      if (sessionError) throw sessionError
    }

    // Get user profile for seed identity
    const { data: profile, error: profileLoadError } = await supabase
      .from('users')
      .select('seed_identity')
      .eq('id', user.id)
      .single()
    if (profileLoadError) throw profileLoadError

    // Retrieve relevant memory context
    const context = await getRelevantContext(user.id, messages[messages.length - 1]?.content || '')
    const systemPrompt = buildSystemPrompt(context, profile?.seed_identity, advisor)

    // Save user message
    const userMessageRow = {
      user_id: user.id,
      role: 'user',
      content: userMessage.content,
      conversation_id: safeConversationId,
      session_id: safeConversationId,
    }
    let { error: userMessageError } = await supabase.from('messages').insert(userMessageRow)
    if (isMissingMessageSessionId(userMessageError)) {
      ;({ error: userMessageError } = await supabase.from('messages').insert(omitMessageSessionId(userMessageRow)))
    }
    if (userMessageError) throw userMessageError

    // Stream response from OpenAI
    const stream = await getOpenAI().chat.completions.create({
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
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || ''
            if (delta) {
              fullResponse += delta
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`))
            }
          }

          // Save assistant message
          const assistantMessageRow = {
            user_id: user.id,
            role: 'assistant',
            content: fullResponse,
            conversation_id: safeConversationId,
            session_id: safeConversationId,
          }
          let { error: assistantMessageError } = await supabase.from('messages').insert(assistantMessageRow)
          if (isMissingMessageSessionId(assistantMessageError)) {
            ;({ error: assistantMessageError } = await supabase.from('messages').insert(omitMessageSessionId(assistantMessageRow)))
          }
          logDeferredWriteError(assistantMessageError)

          const { error: sessionUpdateError } = await supabase
            .from('sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', safeConversationId)
            .eq('user_id', user.id)
          logDeferredWriteError(sessionUpdateError)

          // Trigger async memory extraction (fire and forget)
          extractAndStoreMemories(user.id, messages, fullResponse, context).catch(console.error)

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (streamError) {
          console.error('Chat stream error:', streamError)
          controller.error(streamError)
        }
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
    return apiErrorResponse(error, 'The advisor could not answer just now. Please try again.')
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
    const { error } = await supabase.from('memories').insert(memoriesToInsert)
    if (error) throw error
  }
}
