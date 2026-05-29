import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="fade-in max-w-lg">
        <p className="sans text-xs tracking-[0.3em] uppercase mb-8" style={{ color: 'var(--accent)', opacity: 0.7 }}>
          An AI Paideia Companion
        </p>

        <h1 className="text-6xl font-normal mb-6 tracking-tight" style={{ color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
          Pascale
        </h1>

        <p className="text-lg mb-4" style={{ color: 'var(--muted-foreground)', lineHeight: 1.8 }}>
          A persistent, reflective, ethically-shaped mentor system.
        </p>

        <p className="text-base mb-12" style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
          Not another chatbot. A memory-forming companion that remembers who you are becoming.
        </p>

        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/auth/login"
            className="sans px-8 py-3 text-sm tracking-wide transition-all duration-200"
            style={{
              background: 'var(--accent)',
              color: 'var(--background)',
              borderRadius: '2px',
              letterSpacing: '0.05em',
            }}
          >
            Begin
          </Link>
          <Link
            href="/auth/signup"
            className="sans px-8 py-3 text-sm tracking-wide transition-all duration-200"
            style={{
              color: 'var(--muted-foreground)',
              letterSpacing: '0.05em',
            }}
          >
            Create account
          </Link>
        </div>

        <p className="sans text-xs mt-16" style={{ color: 'var(--muted)', opacity: 0.5 }}>
          &ldquo;Wie word je aan het worden?&rdquo; &mdash; Who are you becoming?
        </p>

        <p className="sans text-xs mt-4" style={{ color: 'var(--accent)', opacity: 0.6 }}>
          hello pascale — friday 7:30pm — whasssuup 👋
        </p>
      </div>
    </main>
  )
}
