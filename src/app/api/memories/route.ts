import { NextRequest, NextResponse } from 'next/server'
import { isMissingColumn } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

const allowedTypes = new Set(['episodic', 'semantic', 'narrative'])
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function getMemoryId(request: NextRequest, body?: Record<string, unknown>) {
  const fromQuery = request.nextUrl.searchParams.get('id')
  const fromBody = typeof body?.id === 'string' ? body.id : ''
  const id = fromQuery || fromBody
  return uuidPattern.test(id) ? id : ''
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const content = cleanText(body.content, 3000)
  const type = allowedTypes.has(body.type) ? body.type : 'narrative'

  if (!content) {
    return NextResponse.json({ error: 'Memory content is required.' }, { status: 400 })
  }

  const memoryRow = {
    user_id: user.id,
    type,
    content,
    confidence: 1,
    importance: 7,
  }
  let { data, error } = await supabase
    .from('memories')
    .insert(memoryRow)
    .select()
    .single()
  if (isMissingColumn(error, 'importance')) {
    const { importance: _importance, ...fallbackRow } = memoryRow
    ;({ data, error } = await supabase
      .from('memories')
      .insert(fallbackRow)
      .select()
      .single())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ memory: data })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const id = getMemoryId(request, body)
  const content = cleanText(body.content, 3000)
  const type = allowedTypes.has(body.type) ? body.type : ''

  if (!id) return NextResponse.json({ error: 'Valid memory id is required.' }, { status: 400 })
  if (!content) return NextResponse.json({ error: 'Memory content is required.' }, { status: 400 })
  if (!type) return NextResponse.json({ error: 'Valid memory type is required.' }, { status: 400 })

  const { data, error } = await supabase
    .from('memories')
    .update({
      type,
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ memory: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = getMemoryId(request)

  if (!id) return NextResponse.json({ error: 'Valid memory id is required.' }, { status: 400 })

  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, id })
}
