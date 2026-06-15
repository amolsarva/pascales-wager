import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getBypassCode() {
  return process.env.BYPASS_CODE || 'Morrissey'
}

function getBypassEmail() {
  return process.env.BYPASS_EMAIL || 'alpha-bypass@pascales-wager.local'
}

function getBypassPassword() {
  return process.env.BYPASS_PASSWORD || `${getBypassCode()}-Pascales-Alpha-2026!`
}

function getRequestOrigin(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
  return host ? `${protocol}://${host}` : request.nextUrl.origin
}

async function ensureBypassUser(email: string, password: string) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) return

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false } }
  )

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  let userId = created.data.user?.id

  if (created.error) {
    const { data: listed, error: listError } = await admin.auth.admin.listUsers()
    if (listError) throw listError

    userId = listed.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id
    if (!userId) throw created.error

    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    })
    if (updateError) throw updateError
  }

  if (userId) {
    const { error: profileError } = await admin
      .from('users')
      .upsert({
        id: userId,
        email,
        display_name: 'Alpha Bypass',
        onboarding_complete: true,
      }, { onConflict: 'id' })

    if (profileError) throw profileError
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  const requestedNext = typeof body.next === 'string' && body.next.startsWith('/') ? body.next : '/home'

  if (code !== getBypassCode()) {
    return NextResponse.json({ error: 'Invalid bypass code.' }, { status: 401 })
  }

  const email = getBypassEmail()
  const password = getBypassPassword()

  try {
    await ensureBypassUser(email, password)
  } catch (error) {
    console.error('Bypass user setup error:', error)
    return NextResponse.json(
      { error: 'Bypass user is not configured yet.' },
      { status: 503 }
    )
  }

  let response = NextResponse.json({
    success: true,
    next: requestedNext,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('Bypass sign-in error:', error)
    return NextResponse.json(
      { error: 'Bypass sign-in is not available yet.' },
      { status: 503 }
    )
  }

  response.headers.set('x-bypass-origin', getRequestOrigin(request))
  return response
}
