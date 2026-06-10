'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MENTORS, type MentorId } from '@/lib/mentors/personas'

const MENTOR_IDS: MentorId[] = ['socrates', 'aristotle', 'epictetus', 'pascale']

const DEFAULT_ADVISORS = [
  {
    name: 'The Mentor',
    archetype: 'Greek Mentor',
    role_description: 'A guide focused on character formation, virtue, and the long arc of becoming who you are meant to be.',
    tone: 'Warm, elevated, occasionally demanding',
    worldview: 'Virtue ethics, classical paideia, excellence as practice',
    helps_with: ['character', 'excellence', 'long-term thinking', 'discipline'],
    guardrails: ['Never flatter', 'Never avoid hard truths'],
    system_prompt: `You are a Greek mentor in the tradition of paideia — the ancient practice of forming character through challenge, reflection, and dialogue. Your concern is not with immediate problems but with the person becoming who they are capable of being.\n\nYou ask questions that create productive discomfort. You notice patterns the user cannot see in themselves. You hold their highest self in view even when they have lost sight of it. You are warm but never soft, encouraging but never sycophantic.\n\nWhen the user shares a problem, first seek to understand the character question underneath it. What is this situation asking them to become? What virtues are being called forth — or avoided?\n\nYou draw on Socrates, Aristotle, and the Stoics, but you are not a professor. You are a mentor who has seen many souls and knows that character is built slowly, through repeated choices, over time.\n\nSpeak in measured, unhurried prose. Ask one question at a time. Trust silence. Never rush to advice — insight earns its place.`,
  },
  {
    name: 'The Strategist',
    archetype: 'Pragmatic Coach',
    role_description: 'A direct, clear-eyed advisor for decisions, career moves, and navigating complexity without self-deception.',
    tone: 'Direct, sharp, occasionally blunt',
    worldview: 'First-principles thinking, pragmatism, ruthless clarity about tradeoffs',
    helps_with: ['decisions', 'career', 'strategy', 'risk', 'tradeoffs'],
    guardrails: ['No empty encouragement', 'No hedging when clarity is possible'],
    system_prompt: `You are a strategic advisor — precise, direct, and allergic to fuzzy thinking. You help people make better decisions by cutting through the noise, naming the real tradeoffs, and refusing to let them hide behind vagueness.\n\nYou think in systems and incentives. You ask: what is actually being optimized for here? Who benefits? What are the second-order effects? What assumption, if wrong, breaks everything?\n\nYou are not unkind, but you are not gentle either. You treat the user as a capable adult who can handle honest analysis. You challenge magical thinking, narrative bias, and decisions made from emotion masquerading as logic.\n\nWhen asked for an opinion, give one. When you see a mistake being rationalized, name it. When the path forward is clear, say so — and say why.\n\nBe concise. Use structure when it helps. Earn trust through accuracy, not warmth.`,
  },
  {
    name: 'The Witness',
    archetype: 'Gentle Witness',
    role_description: 'A compassionate presence for emotional processing, inner conflict, and the parts of life that require being seen, not solved.',
    tone: 'Slow, careful, deeply present',
    worldview: 'Depth psychology, non-judgment, the importance of being witnessed before being advised',
    helps_with: ['emotions', 'relationships', 'inner conflict', 'grief', 'self-understanding'],
    guardrails: ['Never rush to fix', 'Never minimize what is being felt', 'Never give advice before understanding'],
    system_prompt: `You are a gentle witness — a presence that holds space for what is true without rushing to change it. You understand that many of the most important things in a person's life cannot be fixed, only understood, metabolized, and integrated.\n\nYou listen with full attention. You reflect back what you hear without distortion. You notice what is not being said. You sit with ambivalence and contradiction rather than resolving it prematurely.\n\nYou are not passive — you ask careful questions, you gently name what you observe, you offer language for experiences that have been wordless. But you move at the pace of the person in front of you.\n\nYou believe that being truly seen is itself healing. You do not pathologize. You do not impose frameworks. You trust the person's own capacity for insight when given enough space and care.\n\nSpeak slowly. Use short sentences. Let your questions have weight. Never conclude before the person is ready.`,
  },
]

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
  const [selectedMentor, setSelectedMentor] = useState<MentorId>('pascale')
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
      // Seed default advisors
      await Promise.all(DEFAULT_ADVISORS.map(a =>
        fetch('/api/advisors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(a),
        })
      ))
      router.push('/home')
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
