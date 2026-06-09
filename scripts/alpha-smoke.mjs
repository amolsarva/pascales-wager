import fs from 'node:fs'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

const env = loadEnv('.env.local')
const baseUrl = process.env.SMOKE_BASE_URL || 'https://pascales-wager.vercel.app'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY

const requiredTables = [
  'users',
  'sessions',
  'messages',
  'memories',
  'identity_summaries',
  'session_summaries',
  'rituals',
  'advisors',
  'council_sessions',
]

const publicPages = ['/', '/auth/login', '/auth/signup']
const protectedPages = ['/home', '/chat', '/council', '/mirror', '/timeline', '/rituals']
const privateApis = [
  { method: 'GET', path: '/api/dashboard' },
  { method: 'GET', path: '/api/council' },
  { method: 'GET', path: '/api/session-summaries' },
  { method: 'POST', path: '/api/chat', body: {} },
  { method: 'POST', path: '/api/session-summaries', body: {} },
]

const results = []
const smokeEmail = `alpha-smoke-${Date.now()}@example.com`
const smokePassword = `alpha-smoke-${Date.now()}-Password!`

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

async function check(name, fn) {
  try {
    await fn()
    results.push({ name, ok: true })
  } catch (error) {
    results.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function expectStatus(path, expected, init) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual', ...init })
  assert(
    expected.includes(response.status),
    `${path} returned ${response.status}; expected ${expected.join(' or ')}`
  )
  return response
}

function cookieHeaderFromJar(cookieJar) {
  return Array.from(cookieJar.entries()).map(([name, value]) => `${name}=${value}`).join('; ')
}

await check('Supabase env available', async () => {
  assert(Boolean(supabaseUrl), 'NEXT_PUBLIC_SUPABASE_URL is missing')
  assert(Boolean(supabaseAnonKey), 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
  assert(Boolean(serviceRoleKey), 'SUPABASE_SERVICE_ROLE_KEY is missing')
})

if (supabaseUrl && supabaseAnonKey && serviceRoleKey) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  for (const table of requiredTables) {
    await check(`Supabase table: ${table}`, async () => {
      const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' }).limit(1)
      assert(!error, error?.message || `Unable to query ${table}`)
    })
  }

  await check('Authenticated onboarding and private reads', async () => {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: smokeEmail,
      password: smokePassword,
      email_confirm: true,
    })
    assert(!createError, createError?.message || 'Unable to create smoke user')
    const userId = created.user?.id
    assert(Boolean(userId), 'Smoke user id missing')

    try {
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: smokeEmail,
          onboarding_complete: false,
        }, { onConflict: 'id' })
      assert(!profileError, profileError?.message || 'Unable to create smoke profile')

      const cookieJar = new Map()
      const authClient = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return Array.from(cookieJar.entries()).map(([name, value]) => ({ name, value }))
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => cookieJar.set(name, value))
          },
        },
      })

      const { error: signInError } = await authClient.auth.signInWithPassword({
        email: smokeEmail,
        password: smokePassword,
      })
      assert(!signInError, signInError?.message || 'Unable to sign in smoke user')

      const incompleteHome = await expectStatus('/home', [307, 308], {
        headers: { Cookie: cookieHeaderFromJar(cookieJar) },
      })
      assert((incompleteHome.headers.get('location') || '').includes('/onboarding'), 'Incomplete user was not redirected to onboarding')

      const { error: completeError } = await supabase
        .from('users')
        .update({ onboarding_complete: true })
        .eq('id', userId)
      assert(!completeError, completeError?.message || 'Unable to complete smoke onboarding')

      await expectStatus('/home', [200], {
        headers: { Cookie: cookieHeaderFromJar(cookieJar) },
      })

      await expectStatus('/api/dashboard', [200], {
        headers: { Cookie: cookieHeaderFromJar(cookieJar) },
      })

      await expectStatus('/api/council', [200], {
        headers: { Cookie: cookieHeaderFromJar(cookieJar) },
      })
    } finally {
      if (userId) {
        await supabase.auth.admin.deleteUser(userId)
      }
    }
  })
}

for (const path of publicPages) {
  await check(`Public page ${path}`, async () => {
    await expectStatus(path, [200, 307, 308])
  })
}

for (const path of protectedPages) {
  await check(`Protected page redirects ${path}`, async () => {
    const response = await expectStatus(path, [307, 308])
    const location = response.headers.get('location') || ''
    assert(location.includes('/auth/login'), `${path} redirected to ${location || 'nowhere'}`)
  })
}

for (const api of privateApis) {
  await check(`Private API ${api.method} ${api.path}`, async () => {
    const response = await expectStatus(api.path, [401], {
      method: api.method,
      headers: api.body ? { 'Content-Type': 'application/json' } : undefined,
      body: api.body ? JSON.stringify(api.body) : undefined,
    })
    const body = await response.text()
    assert(body.includes('Unauthorized'), `${api.path} did not return Unauthorized body`)
  })
}

for (const result of results) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name}${result.error ? ` - ${result.error}` : ''}`)
}

const failures = results.filter((result) => !result.ok)
if (failures.length > 0) {
  console.error(`\n${failures.length} alpha smoke check(s) failed.`)
  process.exit(1)
}

console.log(`\n${results.length} alpha smoke checks passed against ${baseUrl}.`)
