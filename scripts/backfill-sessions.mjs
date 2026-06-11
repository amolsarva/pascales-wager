import fs from 'node:fs'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const env = loadEnv('.env.local')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
const dryRun = process.argv.includes('--dry-run')
const pageSize = 1000

function loadEnv(path) {
  if (!fs.existsSync(path)) return {}

  return Object.fromEntries(
    fs.readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=')
        return [line.slice(0, index), line.slice(index + 1)]
      })
  )
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function toPreview(content, maxLength = 96) {
  const normalized = String(content || '').replace(/\s+/g, ' ').trim() || 'Restored session'
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized
}

function inferMode(messages) {
  return messages.some((message) => ['advisor', 'synthesis'].includes(message.role)) ? 'council' : 'freeform'
}

function isMissingMessageSessionId(error) {
  if (!error) return false
  const message = (error.message || '').toLowerCase()
  return message.includes('session_id') && (error.code === 'PGRST204' || error.code === '42703')
}

function isSessionsTableNotWritable(error) {
  if (!error) return false
  const message = (error.message || '').toLowerCase()
  return error.code === 'PGRST205' && message.includes("'public.sessions'") && message.includes('schema cache')
}

function chooseTitle(messages) {
  return toPreview(messages.find((message) => message.role === 'user')?.content || messages[0]?.content)
}

async function fetchAllMessages(supabase) {
  const messages = []
  let from = 0
  let hasSessionIdColumn = true

  while (true) {
    let { data, error } = await supabase
      .from('messages')
      .select('id, user_id, role, content, conversation_id, session_id, created_at')
      .not('conversation_id', 'is', null)
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1)

    if (isMissingMessageSessionId(error)) {
      hasSessionIdColumn = false
      ;({ data, error } = await supabase
        .from('messages')
        .select('id, user_id, role, content, conversation_id, created_at')
        .not('conversation_id', 'is', null)
        .order('created_at', { ascending: true })
        .range(from, from + pageSize - 1))
    }

    if (error) throw error
    messages.push(...(data || []))
    if (!data || data.length < pageSize) break
    from += pageSize
  }

  return { messages, hasSessionIdColumn }
}

assert(Boolean(supabaseUrl), 'NEXT_PUBLIC_SUPABASE_URL is missing')
assert(Boolean(serviceRoleKey), 'SUPABASE_SERVICE_ROLE_KEY is missing')

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
const { messages, hasSessionIdColumn } = await fetchAllMessages(supabase)
const grouped = new Map()

for (const message of messages) {
  if (!message.user_id || !message.conversation_id) continue
  const key = `${message.user_id}:${message.conversation_id}`
  const group = grouped.get(key) || {
    userId: message.user_id,
    conversationId: message.conversation_id,
    messages: [],
  }
  group.messages.push(message)
  grouped.set(key, group)
}

let sessionsCreated = 0
let messagesLinked = 0
let skipped = 0

for (const group of grouped.values()) {
  const needsLinking = hasSessionIdColumn && group.messages.some((message) => message.session_id !== group.conversationId)
  const { data: existing, error: existingError } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', group.conversationId)
    .eq('user_id', group.userId)
    .maybeSingle()

  if (existingError) throw existingError

  if (!existing) {
    const firstCreatedAt = group.messages[0]?.created_at
    const lastCreatedAt = group.messages.at(-1)?.created_at || firstCreatedAt
    const session = {
      id: group.conversationId,
      user_id: group.userId,
      mode: inferMode(group.messages),
      title: chooseTitle(group.messages),
      status: 'active',
      created_at: firstCreatedAt,
      updated_at: lastCreatedAt,
    }

    if (!dryRun) {
      const { error } = await supabase.from('sessions').insert(session)
      if (isSessionsTableNotWritable(error)) {
        console.log('sessions is not writable through Supabase REST; apply INSERT grants or run this backfill through SQL.')
        skipped += 1
        continue
      }
      if (error) throw error
    }
    sessionsCreated += 1
  }

  if (needsLinking) {
    if (!dryRun) {
      const { error } = await supabase
        .from('messages')
        .update({ session_id: group.conversationId })
        .eq('user_id', group.userId)
        .eq('conversation_id', group.conversationId)
      if (error) throw error
    }
    messagesLinked += group.messages.filter((message) => message.session_id !== group.conversationId).length
  } else if (existing || !hasSessionIdColumn) {
    skipped += 1
  }
}

console.log(`${dryRun ? 'Dry run: ' : ''}${grouped.size} conversation group(s) scanned.`)
console.log(`${sessionsCreated} session row(s) ${dryRun ? 'would be created' : 'created'}.`)
console.log(`${messagesLinked} message row(s) ${dryRun ? 'would be linked' : 'linked'} to sessions.`)
console.log(`${skipped} conversation group(s) already had session rows and links.`)
if (!hasSessionIdColumn) {
  console.log('messages.session_id is not present in this schema; session rows were backfilled using conversation_id only.')
}
