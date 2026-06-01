'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { CouncilLogo } from '@/components/council-logo'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    router.push('/council')
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
            Password
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

          <button type="submit" disabled={loading} className="button-primary mt-6 w-full disabled:opacity-50">
            {loading ? 'Entering...' : 'Enter your council'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-mist">
          <LockKeyhole size={13} className="text-gold" />
          <span>Private by design.</span>
          <Link href="/auth/signup" className="text-gold transition hover:text-gold-light">Create an account</Link>
        </div>
      </div>
    </main>
  )
}
