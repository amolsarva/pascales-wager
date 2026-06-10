import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
        <span className="text-base font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
          Pascale&apos;s Wager
        </span>
        <div className="flex gap-4 items-center">
          <Link href="/auth/login" className="sans text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="sans text-sm px-4 py-2 transition-all"
            style={{
              background: 'var(--accent)',
              color: 'var(--background)',
              borderRadius: '2px',
            }}
          >
            Begin
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <p className="sans text-xs tracking-[0.3em] uppercase mb-6 fade-in" style={{ color: 'var(--accent)', opacity: 0.7 }}>
          An AI Paideia Companion
        </p>
        <h1
          className="font-normal mb-6 fade-in"
          style={{
            color: 'var(--foreground)',
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          Build your<br />inner council.
        </h1>
        <p
          className="text-lg mb-4 fade-in"
          style={{ color: 'var(--muted-foreground)', lineHeight: 1.8, maxWidth: '540px', margin: '0 auto 1rem' }}
        >
          Personal AI advisors for decisions, reflection, ambition, and moral clarity. Each with a distinct worldview and voice. Each remembering who you are becoming.
        </p>
        <p
          className="sans text-sm mb-12 fade-in"
          style={{ color: 'var(--muted)', lineHeight: 1.7, maxWidth: '440px', margin: '0 auto 3rem' }}
        >
          Not another chatbot. A private council of advisors that knows you, challenges you, and holds your story across time.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center fade-in">
          <Link
            href="/auth/signup"
            className="sans px-8 py-3.5 text-sm tracking-wide transition-all duration-200"
            style={{
              background: 'var(--accent)',
              color: 'var(--background)',
              borderRadius: '2px',
              letterSpacing: '0.05em',
            }}
          >
            Start your first session
          </Link>
          <Link
            href="/auth/login"
            className="sans px-8 py-3.5 text-sm tracking-wide transition-all duration-200"
            style={{
              color: 'var(--muted-foreground)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              letterSpacing: '0.05em',
            }}
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-6">
        <div style={{ height: '1px', background: 'var(--border)' }} />
      </div>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-20 grid grid-cols-1 sm:grid-cols-3 gap-12">
        {[
          {
            label: 'Advisors with memory',
            body: 'Your advisors remember what you share across sessions — values, struggles, decisions, patterns. They do not start from zero each time.',
          },
          {
            label: 'Choose your worldview',
            body: 'Stoic elder. Pragmatic strategist. Gentle witness. Greek mentor. Create advisors shaped by the philosophical and ethical traditions you trust.',
          },
          {
            label: 'Return to your questions',
            body: 'The app builds continuity over time. Unresolved decisions, recurring themes, commitments you made — your advisors hold the thread.',
          },
        ].map(f => (
          <div key={f.label}>
            <p className="sans text-xs tracking-[0.15em] uppercase mb-3" style={{ color: 'var(--accent)', opacity: 0.7 }}>
              {f.label}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)', lineHeight: 1.75 }}>
              {f.body}
            </p>
          </div>
        ))}
      </section>

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-6">
        <div style={{ height: '1px', background: 'var(--border)' }} />
      </div>

      {/* Advisor archetypes */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <p className="sans text-xs tracking-[0.3em] uppercase mb-10 text-center" style={{ color: 'var(--accent)', opacity: 0.6 }}>
          Your council
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { name: 'The Mentor', for: 'Character · Excellence · Long arc' },
            { name: 'The Strategist', for: 'Decisions · Career · Tradeoffs' },
            { name: 'The Witness', for: 'Emotions · Relationships · Inner conflict' },
            { name: 'The Skeptic', for: 'Assumptions · Risk · Self-deception' },
          ].map(a => (
            <div
              key={a.name}
              className="px-5 py-4"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '2px',
              }}
            >
              <p className="text-base font-normal mb-1" style={{ color: 'var(--foreground)' }}>{a.name}</p>
              <p className="sans text-xs" style={{ color: 'var(--muted)' }}>{a.for}</p>
            </div>
          ))}
        </div>
        <p className="sans text-xs text-center mt-6" style={{ color: 'var(--muted)', opacity: 0.5 }}>
          Start with these or create advisors entirely your own.
        </p>
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 pb-12 text-center">
        <p className="sans text-xs" style={{ color: 'var(--muted)', opacity: 0.4 }}>
          &ldquo;Wie word je aan het worden?&rdquo; &mdash; Who are you becoming?
        </p>
      </footer>
    </main>
  )
}
