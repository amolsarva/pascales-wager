import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type StoredMessage = {
  id: string
  role: 'user' | 'assistant' | 'system' | 'advisor' | 'synthesis'
  content: string
  created_at: string
  conversation_id: string | null
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function toPreview(content: string) {
  return content.length > 72 ? `${content.slice(0, 72)}...` : content
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const conversationId = request.nextUrl.searchParams.get('conversationId')

  if (conversationId) {
    if (!uuidPattern.test(conversationId)) {
      return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('messages')
      .select('id, role, content, created_at, conversation_id')
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      conversationId,
      messages: (data || []).map((message: StoredMessage) => ({
        id: message.id,
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content,
        createdAt: message.created_at,
      })),
    })
  }

  const { data, error } = await supabase
    .from('messages')
    .select('conversation_id, content, created_at')
    .eq('user_id', user.id)
    .eq('role', 'user')
    .not('conversation_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const seen = new Set<string>()
  const conversations = []

  for (const message of data || []) {
    if (!message.conversation_id || seen.has(message.conversation_id)) continue

    seen.add(message.conversation_id)
    conversations.push({
      id: message.conversation_id,
      preview: toPreview(message.content),
      created_at: message.created_at,
    })

    if (conversations.length === 12) break
  }

  return NextResponse.json({ conversations })
}
