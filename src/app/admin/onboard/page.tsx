'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, MailPlus, UserPlus } from 'lucide-react'
import { AppNavigation } from '@/components/app-navigation'
import { CouncilLogo } from '@/components/council-logo'

type OnboardResult = {
  user: {
    id: string
    email: string
    displayName: string
    onboardingComplete: boolean
  }
  inviteSent: boolean
  temporaryPassword: string | null
  loginUrl: string
  onboardingUrl: string
}

const inputClass = 'mt-2 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-3 text-sm text-parchment outline-none transition placeholder:text-mist/45 focus:border-[#ff8a2a]/45'

export default function AdminOnboardPage() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [sendInvite, setSendInvite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<OnboardResult | null>(null)
  const [copied, setCopied] = useState('')

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setCopied('')

    const response = await fetch('/api/admin/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        displayName,
        temporaryPassword,
        sendInvite,
      }),
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(data.error || 'Unable to onboard user.')
      setLoading(false)
      return
    }

    setResult(data)
    setLoading(false)
  }

  const copyText = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
  }

  const credentialBlock = result
    ? [
        `Email: ${result.user.email}`,
        result.temporaryPassword ? `Temporary password: ${result.temporaryPassword}` : 'Invite email sent.',
        `Login: ${result.loginUrl}`,
        `Onboarding: ${result.onboardingUrl}`,
      ].join('\n')
    : ''

  return (
    <main className="page-grain min-h-screen bg-[#131310] pb-28 lg:pl-[238px] lg:pb-0">
      <AppNavigation active="admin" />

      <header className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 lg:hidden">
        <CouncilLogo href="/home" compact />
        <Link href="/admin" className="text-mist" aria-label="Back to admin">
          <ArrowLeft size={18} />
        </Link>
      </header>

      <div className="mx-auto max-w-[960px] px-5 py-8 md:px-8 lg:px-10 lg:py-11">
        <Link href="/admin" className="hidden w-fit items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#ff9b45] transition hover:text-[#ffb26f] lg:flex">
          <ArrowLeft size={14} /> Admin
        </Link>

        <section className="mt-4 border-b border-white/[0.07] pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff8a2a]/25 bg-[#ff8a2a]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#ff9b45]">
            <UserPlus size={14} /> New alpha user
          </div>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl tracking-[-0.05em] text-ivory sm:text-6xl">
            Onboard a new user.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-mist">
            Create a Supabase auth user and a matching profile with onboarding marked incomplete, so the next login lands in first-run setup.
          </p>
        </section>

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={createUser} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
            <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff9b45]">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="new-user@example.com"
                className={inputClass}
              />
            </label>

            <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff9b45]">
              Display name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Alexandra"
                className={inputClass}
              />
            </label>

            <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff9b45]">
              Temporary password
              <input
                value={temporaryPassword}
                onChange={(event) => setTemporaryPassword(event.target.value)}
                disabled={sendInvite}
                placeholder={sendInvite ? 'Invite email sets access' : 'Leave blank to generate'}
                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-45`}
              />
            </label>

            <label className="mt-5 flex items-start gap-3 rounded-xl border border-white/[0.08] bg-black/10 p-3">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(event) => setSendInvite(event.target.checked)}
                className="mt-1 accent-[#ff8a2a]"
              />
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff9b45]">Send Supabase invite</span>
                <span className="mt-1 block text-xs leading-5 text-mist">Use email invite instead of creating a confirmed temp-password login.</span>
              </span>
            </label>

            {error && <p className="mt-4 text-xs leading-5 text-[#d28e7d]">{error}</p>}

            <button type="submit" disabled={loading} className="button-primary mt-6 w-full justify-center disabled:opacity-50">
              {loading ? 'Creating...' : sendInvite ? 'Send invite' : 'Create user'} {sendInvite ? <MailPlus size={14} /> : <UserPlus size={14} />}
            </button>
          </form>

          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
            <p className="eyebrow">Result</p>
            {result ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-[#9fbf9d]/25 bg-[#9fbf9d]/10 p-4">
                  <p className="text-sm font-semibold text-[#c6e0c4]">
                    {result.inviteSent ? 'Invite sent.' : 'User created.'}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-mist">
                    Profile is marked incomplete, so the user should complete onboarding after login.
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#181711] p-4">
                  <dl className="space-y-3 text-xs">
                    <div>
                      <dt className="font-bold uppercase tracking-[0.12em] text-[#ff9b45]">Email</dt>
                      <dd className="mt-1 text-parchment">{result.user.email}</dd>
                    </div>
                    {result.temporaryPassword && (
                      <div>
                        <dt className="font-bold uppercase tracking-[0.12em] text-[#ff9b45]">Temporary password</dt>
                        <dd className="mt-1 text-parchment">{result.temporaryPassword}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="font-bold uppercase tracking-[0.12em] text-[#ff9b45]">Login URL</dt>
                      <dd className="mt-1 break-all text-parchment">{result.loginUrl}</dd>
                    </div>
                  </dl>
                </div>

                <button
                  onClick={() => copyText('credentials', credentialBlock)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ff8a2a]/25 bg-[#ff8a2a]/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.13em] text-[#ff9b45] transition hover:bg-[#ff8a2a]/15"
                >
                  <Copy size={14} /> {copied === 'credentials' ? 'Copied' : 'Copy handoff'}
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#181711] p-5">
                <p className="text-sm leading-6 text-mist">
                  Create a user on the left. The generated handoff will appear here with a login URL and temporary password or invite status.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
