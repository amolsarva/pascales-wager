'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const questions = [
  {
    key: 'becoming',
    question: 'What kind of person do you want to become?',
    placeholder: 'Someone who acts from depth rather than fear...',
  },
  {
    key: 'misunderstood',
    question: 'What do people most misunderstand about you?',
    placeholder: 'They see the surface intensity but not the...',
  },
  {
    key: 'fear',
    question: 'What do you fear becoming?',
    placeholder: 'Comfortable. Numb. Going through motions...',
  },
  {
    key: 'admire',
    question: 'What qualities do you most admire in others?',
    placeholder: 'The courage to disappoint people for the right reasons...',
  },
  {
    key: 'traditions',
    question: 'What philosophical or spiritual traditions resonate with you?',
    placeholder: 'Stoicism, Jungian psychology, Buddhist detachment...',
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const current = questions[step]
  const isLast = step === questions.length - 1

  const handleNext = async () => {
    if (isLast) {
      setLoading(true)
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      })
      router.push('/chat')
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="fade-in w-full max-w-lg">

        {/* Progress */}
        <div className="flex gap-1.5 mb-12 justify-center">
          {questions.map((_, i) => (
            <div
              key={i}
              className="h-0.5 w-8 transition-all duration-500"
              style={{ background: i <= step ? 'var(--accent)' : 'var(--border)' }}
            />
          ))}
        </div>

        <p className="sans text-xs tracking-[0.2em] uppercase text-center mb-8" style={{ color: 'var(--accent)', opacity: 0.6 }}>
          {step + 1} of {questions.length}
        </p>

        <h2 className="text-2xl font-normal text-center mb-8 leading-relaxed" style={{ color: 'var(--foreground)' }}>
          {current.question}
        </h2>

        <textarea
          value={answers[current.key] || ''}
          onChange={e => setAnswers(a => ({ ...a, [current.key]: e.target.value }))}
          placeholder={current.placeholder}
          rows={4}
          className="sans w-full px-4 py-3 text-sm outline-none resize-none transition-all"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            borderRadius: '2px',
            lineHeight: 1.7,
          }}
        />

        <div className="flex justify-between items-center mt-6">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="sans text-sm"
              style={{ color: 'var(--muted)' }}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={loading}
            className="sans px-6 py-2.5 text-sm tracking-wide transition-all duration-200"
            style={{
              background: loading ? 'var(--accent-dim)' : 'var(--accent)',
              color: 'var(--background)',
              borderRadius: '2px',
              letterSpacing: '0.05em',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Beginning...' : isLast ? 'Meet Pascal' : 'Continue'}
          </button>
        </div>

        {step === 0 && (
          <p className="sans text-xs text-center mt-8" style={{ color: 'var(--muted)', opacity: 0.5 }}>
            Pascal will use these to understand who you are becoming.
            <br />You can always revise as you go.
          </p>
        )}
      </div>
    </main>
  )
}
