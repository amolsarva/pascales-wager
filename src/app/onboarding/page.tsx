'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MENTORS, type MentorId } from '@/lib/mentors/personas'

const MENTOR_IDS: MentorId[] = ['socrates', 'aristotle', 'epictetus', 'pascal']

const SEED_QUESTIONS = [
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
  const [phase, setPhase] = useState<'mentor' | 'questions'>('mentor')
  const [selectedMentor, setSelectedMentor] = useState<MentorId>('pascal')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const current = SEED_QUESTIONS[step]
  const isLast = step === SEED_QUESTIONS.length - 1

  const handleMentorConfirm = () => setPhase('questions')

  const handleNext = async () => {
    if (isLast) {
      setLoading(true)
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...answers, mentor_id: selectedMentor }),
      })
      router.push('/chat')
    } else {
      setStep(s => s + 1)
    }
  }

  if (phase === 'mentor') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="fade-in w-full max-w-2xl">
          <p className="sans text-xs tracking-[0.2em] uppercase text-center mb-4" style={{ color: 'var(--accent)', opacity: 0.6 }}>
            Choose your mentor
          </p>
          <h2 className="text-2xl font-normal text-center mb-3 leading-relaxed" style={{ color: 'var(--foreground)' }}>
            Who will guide your formation?
          </h2>
          <p className="sans text-sm text-center mb-10" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
            Each mentor brings a distinct method. You can change this later.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-10">
            {MENTOR_IDS.map(id => {
              const mentor = MENTORS[id]
              const isSelected = selectedMentor === id
              return (
                <button
                  key={id}
                  onClick={() => setSelectedMentor(id)}
                  className="text-left px-5 py-5 transition-all duration-200"
                  style={{
                    background: isSelected ? 'var(--surface-raised)' : 'var(--surface)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '2px',
                    outline: 'none',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-base font-normal" style={{ color: 'var(--foreground)' }}>
                      {mentor.name}
                    </span>
                    <span className="sans text-xs" style={{ color: 'var(--muted)', marginTop: '2px' }}>
                      {mentor.era}
                    </span>
                  </div>
                  <p className="sans text-xs mb-3" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                    {mentor.tagline}
                  </p>
                  <p className="sans text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    {mentor.approach}
                  </p>
                </button>
              )
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleMentorConfirm}
              className="sans px-8 py-3 text-sm tracking-wide transition-all duration-200"
              style={{
                background: 'var(--accent)',
                color: 'var(--background)',
                borderRadius: '2px',
                letterSpacing: '0.05em',
              }}
            >
              Continue with {MENTORS[selectedMentor].name}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="fade-in w-full max-w-lg">

        {/* Progress */}
        <div className="flex gap-1.5 mb-12 justify-center">
          {SEED_QUESTIONS.map((_, i) => (
            <div
              key={i}
              className="h-0.5 w-8 transition-all duration-500"
              style={{ background: i <= step ? 'var(--accent)' : 'var(--border)' }}
            />
          ))}
        </div>

        <p className="sans text-xs tracking-[0.2em] uppercase text-center mb-8" style={{ color: 'var(--accent)', opacity: 0.6 }}>
          {step + 1} of {SEED_QUESTIONS.length}
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
            <button
              onClick={() => setPhase('mentor')}
              className="sans text-sm"
              style={{ color: 'var(--muted)' }}
            >
              Back
            </button>
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
            {loading ? 'Beginning...' : isLast ? `Meet ${MENTORS[selectedMentor].name}` : 'Continue'}
          </button>
        </div>

        {step === 0 && (
          <p className="sans text-xs text-center mt-8" style={{ color: 'var(--muted)', opacity: 0.5 }}>
            {MENTORS[selectedMentor].name} will use these to understand who you are becoming.
            <br />You can always revise as you go.
          </p>
        )}
      </div>
    </main>
  )
}
