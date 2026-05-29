'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await createClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/onboarding')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="fade-in w-full max-w-sm">
        <Link href="/" className="sans text-xs tracking-[0.2em] uppercase block text-center mb-12" style={{ color: 'var(--accent)', opacity: 0.7 }}>
          Pascal
        </Link>

        <h2 className="text-2xl font-normal text-center mb-3" style={{ color: 'var(--foreground)' }}>
          Begin
        </h2>
        <p className="sans text-sm text-center mb-8" style={{ color: 'var(--muted)' }}>
          Pascal will remember who you are becoming.
        </p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="sans w-full px-4 py-3 text-sm outline-none"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              borderRadius: '2px',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="sans w-full px-4 py-3 text-sm outline-none"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              borderRadius: '2px',
            }}
          />

          {error && (
            <p className="sans text-xs text-center" style={{ color: '#c47070' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="sans w-full py-3 text-sm tracking-wide mt-2 transition-all duration-200"
            style={{
              background: loading ? 'var(--accent-dim)' : 'var(--accent)',
              color: 'var(--background)',
              borderRadius: '2px',
              letterSpacing: '0.05em',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p className="sans text-xs text-center mt-6" style={{ color: 'var(--muted)' }}>
          Already here?{' '}
          <Link href="/auth/login" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
