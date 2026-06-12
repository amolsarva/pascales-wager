import fs from 'node:fs'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const env = loadEnv('.env.local')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
const smokeEmail = `schema-audit-${Date.now()}@example.com`
const smokePassword = `schema-audit-${Date.now()}-Password!`
const checks = []

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

function record(name, error) {
  checks.push({
    name,
    ok: !error,
    detail: error?.message || '',
  })
}

function required(value, name) {
  if (!value) throw new Error(`${name} is missing`)
}

required(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL')
required(serviceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email: smokeEmail,
  password: smokePassword,
  email_confirm: true,
})

if (createError) throw createError
const userId = created.user?.id
if (!userId) throw new Error('Audit user id missing')

try {
  const sessionId = crypto.randomUUID()

  let result = await supabase
    .from('users')
    .upsert({ id: userId, email: smokeEmail, onboarding_complete: true }, { onConflict: 'id' })
  record('users upsert', result.error)

  result = await supabase.from('sessions').insert({
    id: sessionId,
    user_id: userId,
    mode: 'freeform',
    title: 'Schema audit',
    status: 'active',
  })
  record('sessions insert', result.error)

  result = await supabase.from('messages').insert({
    user_id: userId,
    role: 'user',
    content: 'Schema audit message',
    conversation_id: sessionId,
    session_id: sessionId,
  })
  record('messages insert with session_id', result.error)

  result = await supabase.from('memories').insert({
    user_id: userId,
    session_id: sessionId,
    type: 'narrative',
    content: 'Schema audit memory',
    confidence: 1,
    importance: 7,
    source_message_ids: [],
  })
  record('memories insert with optional columns', result.error)

  result = await supabase.from('session_summaries').insert({
    user_id: userId,
    session_id: sessionId,
    summary: 'Schema audit summary',
    key_points: ['Audit'],
    next_actions: ['Run smoke'],
    memories_to_save: [],
    follow_up_question: 'Ready?',
  })
  record('session_summaries insert', result.error)

  result = await supabase.from('advisors').insert({
    user_id: userId,
    name: 'Schema Auditor',
    archetype: 'The Verifier',
    monogram: 'V',
    tone: 'Direct',
    best_for: 'Production checks',
    description: 'A test advisor for schema readiness.',
    worldview: 'Operational clarity',
  })
  record('advisors insert', result.error)
} finally {
  if (userId) {
    await supabase.from('advisors').delete().eq('user_id', userId)
    await supabase.from('session_summaries').delete().eq('user_id', userId)
    await supabase.from('memories').delete().eq('user_id', userId)
    await supabase.from('messages').delete().eq('user_id', userId)
    await supabase.from('sessions').delete().eq('user_id', userId)
    await supabase.from('users').delete().eq('id', userId)
    await supabase.auth.admin.deleteUser(userId)
  }
}

for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.detail ? ` - ${check.detail}` : ''}`)
}

const failures = checks.filter((check) => !check.ok)
if (failures.length > 0) {
  console.error(`\n${failures.length} schema readiness check(s) failed.`)
  console.error('Run docs/supabase-alpha-readiness.sql in Supabase, then rerun this audit.')
  process.exit(1)
}

console.log(`\n${checks.length} schema readiness checks passed.`)
