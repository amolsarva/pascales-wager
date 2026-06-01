'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { AdvisorAvatar } from '@/components/advisor-avatar'
import { CouncilLogo } from '@/components/council-logo'
import { advisors } from '@/lib/council-data'

const intents = [
  'I need advice',
  'I am making a decision',
  'I want a personal mentor',
  'I want a council of advisors',
  'I want reflective journaling',
]

const tones = ['Warm', 'Direct', 'Philosophical', 'Practical', 'Spiritual', 'Challenging']
const worldviews = ['Secular humanist', 'Stoic', 'Buddhist', 'Christian', 'Jewish', 'Existentialist', 'Pragmatic', 'Custom']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState({
    intent: 'I am making a decision',
    tones: ['Philosophical', 'Practical'],
    worldview: 'Secular humanist',
    advisors: ['damon', 'mara', 'elis'],
  })

  const toggleTone = (tone: string) => {
    setAnswers((current) => ({
      ...current,
      tones: current.tones.includes(tone)
        ? current.tones.filter((item) => item !== tone)
        : [...current.tones, tone],
    }))
  }

  const toggleAdvisor = (id: string) => {
    setAnswers((current) => ({
      ...current,
      advisors: current.advisors.includes(id)
        ? current.advisors.filter((item) => item !== id)
        : [...current.advisors, id],
    }))
  }

  const continueFlow = async () => {
    if (step < 3) {
      setStep((current) => current + 1)
      return
    }

    setLoading(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      })
    } finally {
      router.push('/home')
    }
  }

  const steps = [
    {
      eyebrow: 'Begin with the need',
      title: 'What kind of counsel do you need right now?',
      copy: 'This helps us shape the first conversation. You can ask for something different whenever you return.',
    },
    {
      eyebrow: 'Shape the voice',
      title: 'How should your advisors speak with you?',
      copy: 'Choose a few qualities. Your council can comfort you without becoming agreeable, or challenge you without becoming cold.',
    },
    {
      eyebrow: 'Choose an orientation',
      title: 'What frame should guide the counsel?',
      copy: 'This is not doctrine. It is a starting orientation for the values and language that feel most useful to you.',
    },
    {
      eyebrow: 'Meet your first council',
      title: 'Begin with three distinct perspectives.',
      copy: 'These starter advisors create a balanced first council. Refine them, remove them, or create your own after the first session.',
    },
  ]

  return (
    <main className="page-grain landing-background min-h-screen px-5 py-5 sm:px-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <CouncilLogo />
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-mist">Private setup</p>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-74px)] max-w-3xl flex-col justify-center py-12">
        <div className="flex gap-1.5">
          {steps.map((_, index) => (
            <span key={index} className={`h-1 flex-1 rounded-full ${index <= step ? 'bg-gold' : 'bg-white/[0.08]'}`} />
          ))}
        </div>

        <div className="mt-12 rise-in" key={step}>
          <p className="eyebrow">{steps[step].eyebrow}</p>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-[1.05] tracking-[-0.04em] text-ivory sm:text-5xl">
            {steps[step].title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-mist">{steps[step].copy}</p>

          {step === 0 && (
            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              {intents.map((intent) => (
                <button
                  key={intent}
                  onClick={() => setAnswers((current) => ({ ...current, intent }))}
                  className={`flex items-center justify-between rounded-2xl border p-4 text-left text-sm transition ${
                    answers.intent === intent
                      ? 'border-gold/40 bg-gold/[0.08] text-parchment'
                      : 'border-white/[0.08] bg-white/[0.025] text-mist hover:border-white/[0.15]'
                  }`}
                >
                  {intent}
                  {answers.intent === intent && <Check size={15} className="text-gold" />}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {tones.map((tone) => {
                const selected = answers.tones.includes(tone)
                return (
                  <button
                    key={tone}
                    onClick={() => toggleTone(tone)}
                    className={`rounded-full border px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] transition ${
                      selected
                        ? 'border-gold/40 bg-gold/[0.09] text-gold-light'
                        : 'border-white/[0.08] bg-white/[0.025] text-mist hover:border-white/[0.15]'
                    }`}
                  >
                    {tone}
                  </button>
                )
              })}
            </div>
          )}

          {step === 2 && (
            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              {worldviews.map((worldview) => (
                <button
                  key={worldview}
                  onClick={() => setAnswers((current) => ({ ...current, worldview }))}
                  className={`flex items-center justify-between rounded-2xl border p-4 text-left text-sm transition ${
                    answers.worldview === worldview
                      ? 'border-gold/40 bg-gold/[0.08] text-parchment'
                      : 'border-white/[0.08] bg-white/[0.025] text-mist hover:border-white/[0.15]'
                  }`}
                >
                  {worldview}
                  {answers.worldview === worldview && <Check size={15} className="text-gold" />}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {advisors.slice(0, 3).map((advisor) => {
                const selected = answers.advisors.includes(advisor.id)
                return (
                  <button
                    key={advisor.id}
                    onClick={() => toggleAdvisor(advisor.id)}
                    className={`relative rounded-[20px] border p-4 text-left transition ${
                      selected ? 'border-gold/35 bg-gold/[0.07]' : 'border-white/[0.08] bg-white/[0.025] opacity-60'
                    }`}
                  >
                    {selected && <Check size={14} className="absolute right-4 top-4 text-gold" />}
                    <AdvisorAvatar advisor={advisor} size="md" active={selected} />
                    <p className="mt-4 font-serif text-xl text-ivory">{advisor.name}</p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gold">{advisor.archetype}</p>
                    <p className="mt-3 text-xs leading-5 text-mist">{advisor.bestFor}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-mist transition hover:text-ivory disabled:opacity-0"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button onClick={continueFlow} disabled={loading} className="button-primary">
            {loading ? 'Preparing...' : step === 3 ? 'Enter your council' : 'Continue'}
            {step === 3 ? <Sparkles size={14} /> : <ArrowRight size={14} />}
          </button>
        </div>
      </section>
    </main>
  )
}
