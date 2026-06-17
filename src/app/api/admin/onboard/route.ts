import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function getRequestOrigin(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
  return host ? `${protocol}://${host}` : request.nextUrl.origin
}

function generatedPassword() {
  return `Council-${crypto.randomUUID().slice(0, 8)}!`
}

async function currentUserIsAuthenticated() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return Boolean(user)
}

export async function POST(request: NextRequest) {
  if (!(await currentUserIsAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is required for admin onboarding.' },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const email = cleanText(body.email, 180).toLowerCase()
  const displayName = cleanText(body.displayName, 100)
  const sendInvite = body.sendInvite === true
  const temporaryPassword = cleanText(body.temporaryPassword, 120) || generatedPassword()
  const origin = getRequestOrigin(request)

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false } }
  )

  let userId = ''
  let inviteSent = false

  if (sendInvite) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/onboarding`,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    userId = data.user?.id || ''
    inviteSent = true
  } else {
    const created = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: displayName ? { display_name: displayName } : undefined,
    })

    userId = created.data.user?.id || ''

    if (created.error) {
      const { data: listed, error: listError } = await admin.auth.admin.listUsers()
      if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })

      userId = listed.users.find((user) => user.email?.toLowerCase() === email)?.id || ''
      if (!userId) return NextResponse.json({ error: created.error.message }, { status: 500 })

      const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: displayName ? { display_name: displayName } : undefined,
      })
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unable to create onboarding user.' }, { status: 500 })
  }

  const { error: profileError } = await admin
    .from('users')
    .upsert({
      id: userId,
      email,
      display_name: displayName || email.split('@')[0],
      onboarding_complete: false,
    }, { onConflict: 'id' })

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  return NextResponse.json({
    user: {
      id: userId,
      email,
      displayName: displayName || email.split('@')[0],
      onboardingComplete: false,
    },
    inviteSent,
    temporaryPassword: sendInvite ? null : temporaryPassword,
    loginUrl: `${origin}/auth/login?next=/onboarding`,
    onboardingUrl: `${origin}/onboarding`,
  })
}
