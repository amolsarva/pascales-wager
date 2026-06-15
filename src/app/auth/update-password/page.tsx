'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react'
import { CouncilLogo } from '@/components/council-logo'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password.length < 6) {
      setError('Use at least 6 characters.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setMessage('Password updated. Returning you to the app.')
    setTimeout(() => router.push('/home'), 800)
  }

  return (
    <main className="page-grain landing-background flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px] rise-in">
        <div className="text-center">
          <CouncilLogo />
          <p className="eyebrow mt-12">Account recovery</p>
          <h1 className="mt-4 font-serif text-4xl tracking-[-0.04em] text-ivory">Set a new password.</h1>
          <p className="mt-3 text-sm leading-6 text-mist">Choose a new password for your private council account.</p>
        </div>

        <form onSubmit={updatePassword} className="glass-card-raised mt-8 p-5 sm:p-6">
          <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
            New password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              required
              minLength={6}
              className="mt-2 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-3.5 text-sm font-normal tracking-normal text-parchment outline-none transition placeholder:text-mist/50 focus:border-gold/40"
            />
          </label>
          <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              required
              minLength={6}
              className="mt-2 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-3.5 text-sm font-normal tracking-normal text-parchment outline-none transition placeholder:text-mist/50 focus:border-gold/40"
            />
          </label>

          {error && <p className="mt-4 text-xs leading-5 text-[#d28e7d]">{error}</p>}
          {message && (
            <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-[#9fbf9d]">
              <CheckCircle2 size={14} /> {message}
            </p>
          )}

          <button type="submit" disabled={loading} className="button-primary mt-6 w-full disabled:opacity-50">
            {loading ? 'Updating...' : 'Update password'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-mist">
          <LockKeyhole size={13} className="text-gold" />
          <Link href="/auth/login" className="text-gold transition hover:text-gold-light">Back to login</Link>
        </div>
      </div>
    </main>
  )
}
