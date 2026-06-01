'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, LockKeyhole } from 'lucide-react'
import { CouncilLogo } from '@/components/council-logo'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    router.push('/onboarding')
  }

  return (
    <main className="page-grain landing-background min-h-screen px-5 py-6 sm:px-8">
      <header className="mx-auto max-w-6xl">
        <CouncilLogo />
      </header>

      <div className="mx-auto grid max-w-5xl items-center gap-10 py-12 lg:grid-cols-[1fr_430px] lg:py-20">
        <section className="rise-in">
          <p className="eyebrow">A private school for the self</p>
          <h1 className="mt-5 max-w-xl font-serif text-5xl leading-[1.02] tracking-[-0.05em] text-ivory sm:text-6xl">
            Begin with one <span className="italic text-gold-light">real question.</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-mist">
            Build the advisors you wish you had. Return over time for wiser decisions, deeper reflection, and a life that feels more deliberately yours.
          </p>
          <div className="mt-8 space-y-3">
            {['Shape your first council in under three minutes', 'Approve every memory your advisors carry forward', 'No public profile, no social feed, no borrowed authority'].map((item) => (
              <p key={item} className="flex items-center gap-3 text-xs leading-5 text-parchment/80">
                <span className="grid h-5 w-5 place-items-center rounded-full border border-gold/25 text-gold"><Check size={11} /></span>
                {item}
              </p>
            ))}
          </div>
        </section>

        <form onSubmit={handleSignup} className="glass-card-raised rise-in p-5 sm:p-6 [animation-delay:100ms]">
          <p className="eyebrow">Create your account</p>
          <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-ivory">Your council begins here.</h2>
          <p className="mt-2 text-xs leading-5 text-mist">We will start by finding the kind of counsel you need now.</p>

          <label className="mt-6 block text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
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
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a password"
              required
              minLength={6}
              className="mt-2 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-3.5 text-sm font-normal tracking-normal text-parchment outline-none transition placeholder:text-mist/50 focus:border-gold/40"
            />
          </label>

          {error && <p className="mt-4 text-xs leading-5 text-[#d28e7d]">{error}</p>}

          <button type="submit" disabled={loading} className="button-primary mt-6 w-full disabled:opacity-50">
            {loading ? 'Preparing...' : 'Build your council'} <ArrowRight size={14} />
          </button>
          <p className="mt-4 text-center text-[10px] leading-5 text-mist/60">
            By continuing, you acknowledge this is a reflective tool, not therapy or emergency support.
          </p>
        </form>
      </div>

      <p className="flex items-center justify-center gap-2 text-xs text-mist">
        <LockKeyhole size={13} className="text-gold" />
        Already have an account?
        <Link href="/auth/login" className="text-gold transition hover:text-gold-light">Sign in</Link>
      </p>
    </main>
  )
}
