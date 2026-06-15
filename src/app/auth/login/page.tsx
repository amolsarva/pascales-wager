'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, KeyRound, LockKeyhole, Mail } from 'lucide-react'
import { CouncilLogo } from '@/components/council-logo'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bypassCode, setBypassCode] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [bypassLoading, setBypassLoading] = useState(false)

  const getRequestedNext = () => {
    const requestedNext = new URLSearchParams(window.location.search).get('next')
    return requestedNext?.startsWith('/') ? requestedNext : '/home'
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    router.push(getRequestedNext())
  }

  const sendPasswordReset = async () => {
    setResetLoading(true)
    setError('')
    setMessage('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Enter your email first, then request a recovery link.')
      setResetLoading(false)
      return
    }

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: new URL('/auth/callback?next=/auth/update-password', window.location.origin).toString(),
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setMessage('Recovery link sent. Check your email, then return here to set a new password.')
    }

    setResetLoading(false)
  }

  const useBypassCode = async (event: React.FormEvent) => {
    event.preventDefault()
    setBypassLoading(true)
    setError('')
    setMessage('')

    const response = await fetch('/api/auth/bypass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: bypassCode,
        next: getRequestedNext(),
      }),
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(data.error || 'Bypass code did not work.')
      setBypassLoading(false)
      return
    }

    router.push(data.next || '/home')
  }

  return (
    <main className="page-grain landing-background flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px] rise-in">
        <div className="text-center">
          <CouncilLogo />
          <p className="eyebrow mt-12">Return to your council</p>
          <h1 className="mt-4 font-serif text-4xl tracking-[-0.04em] text-ivory">Welcome back.</h1>
          <p className="mt-3 text-sm leading-6 text-mist">Your questions and remembered threads are waiting.</p>
        </div>

        <form onSubmit={handleLogin} className="glass-card-raised mt-8 p-5 sm:p-6">
          <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              className="mt-2 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-3.5 text-sm font-normal tracking-normal text-parchment outline-none transition placeholder:text-mist/50 focus:border-gold/40"
            />
          </label>
          <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
            <span className="flex items-center justify-between gap-3">
              Password
              <button
                type="button"
                onClick={sendPasswordReset}
                disabled={resetLoading}
                className="flex items-center gap-1 text-[10px] text-mist transition hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Mail size={11} /> {resetLoading ? 'Sending...' : 'Recover'}
              </button>
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              required
              className="mt-2 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-3.5 text-sm font-normal tracking-normal text-parchment outline-none transition placeholder:text-mist/50 focus:border-gold/40"
            />
          </label>

          {error && <p className="mt-4 text-xs leading-5 text-[#d28e7d]">{error}</p>}
          {message && <p className="mt-4 text-xs leading-5 text-[#9fbf9d]">{message}</p>}

          <button type="submit" disabled={loading} className="button-primary mt-6 w-full disabled:opacity-50">
            {loading ? 'Entering...' : 'Enter your council'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-mist">
          <LockKeyhole size={13} className="text-gold" />
          <span>Private by design.</span>
          <Link href="/auth/signup" className="text-gold transition hover:text-gold-light">Create an account</Link>
        </div>

        <form onSubmit={useBypassCode} className="mx-auto mt-10 max-w-[300px] rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <label className="block text-[9px] font-bold uppercase tracking-[0.14em] text-mist/65">
            Bypass code
            <div className="mt-2 flex items-center gap-2">
              <input
                type="password"
                value={bypassCode}
                onChange={(event) => setBypassCode(event.target.value)}
                placeholder="Code"
                className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2 text-xs font-normal tracking-normal text-parchment outline-none transition placeholder:text-mist/35 focus:border-gold/35"
              />
              <button
                type="submit"
                disabled={bypassLoading || !bypassCode.trim()}
                className="grid h-9 w-9 place-items-center rounded-lg border border-gold/20 text-gold transition hover:bg-gold/[0.08] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Use bypass code"
              >
                <KeyRound size={14} />
              </button>
            </div>
          </label>
        </form>
      </div>
    </main>
  )
}
