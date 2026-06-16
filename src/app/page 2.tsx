import Link from 'next/link'
import {
  ArrowRight,
  BookOpenText,
  Check,
  ChevronRight,
  Compass,
  Feather,
  LockKeyhole,
  MessagesSquare,
  Sparkles,
} from 'lucide-react'
import { AdvisorAvatar } from '@/components/advisor-avatar'
import { CouncilLogo } from '@/components/council-logo'
import { advisors } from '@/lib/council-data'

const philosophy = [
  {
    icon: Compass,
    title: 'Advice with an orientation',
    copy: 'Choose the principles you want your advisors to reason from: Stoic, spiritual, pragmatic, literary, or entirely your own.',
  },
  {
    icon: BookOpenText,
    title: 'Memory that earns its place',
    copy: 'Your sessions become a living record of decisions, commitments, and recurring patterns. You decide what remains.',
  },
  {
    icon: MessagesSquare,
    title: 'A council, not a chatbot',
    copy: 'Invite several advisors into the same question. See where they agree, where they differ, and what is yours to decide.',
  },
]

export default function LandingPage() {
  return (
    <main className="page-grain landing-background overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8 lg:px-10">
        <CouncilLogo />
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#philosophy" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-mist transition hover:text-ivory">
            Philosophy
          </Link>
          <Link href="#advisors" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-mist transition hover:text-ivory">
            Advisors
          </Link>
          <Link href="#privacy" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-mist transition hover:text-ivory">
            Privacy
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="hidden text-[11px] font-semibold uppercase tracking-[0.15em] text-mist transition hover:text-ivory sm:inline">
            Sign in
          </Link>
          <Link href="/auth/signup" className="button-secondary !px-4 !py-2">
            Enter <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[730px] max-w-7xl items-center gap-12 px-5 pb-20 pt-16 md:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-2xl rise-in">
          <div className="mb-7 flex items-center gap-3">
            <span className="h-px w-9 bg-gold/60" />
            <p className="eyebrow">A private school for the self</p>
          </div>
          <h1 className="font-serif text-[68px] leading-[0.97] tracking-[-0.06em] text-ivory sm:text-[88px] lg:text-[104px]">
            Build your
            <span className="block italic text-gold-light">inner council.</span>
          </h1>
          <p className="mt-7 max-w-xl text-[16px] leading-8 text-parchment/75 sm:text-[18px]">
            Personal AI advisors for decisions, reflection, ambition, and moral clarity. Chosen by you. Shaped over time.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/signup" className="button-primary">
              Start your first session <ArrowRight size={14} />
            </Link>
            <Link href="#advisors" className="button-secondary">
              Meet the advisors
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-mist">
            <span className="flex items-center gap-2"><Check size={13} className="text-gold" /> Private by design</span>
            <span className="flex items-center gap-2"><Check size={13} className="text-gold" /> You control memory</span>
            <span className="flex items-center gap-2"><Check size={13} className="text-gold" /> Built for reflection</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[590px] rise-in [animation-delay:120ms]">
          <div className="absolute -left-8 top-[14%] h-52 w-52 rounded-full bg-gold/10 blur-[90px]" />
          <div className="absolute -right-20 bottom-[5%] h-64 w-64 rounded-full bg-[#45625e]/10 blur-[100px]" />

          <div className="relative rounded-[30px] border border-white/[0.09] bg-[#1a1915]/90 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:p-6">
            <div className="rounded-[22px] border border-gold/15 bg-[#11110f]/80 p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow !text-[9px]">Council Session</p>
                  <h2 className="mt-2 font-serif text-2xl text-ivory">A question worth sitting with</h2>
                </div>
                <div className="flex -space-x-2">
                  {advisors.slice(0, 3).map((advisor) => (
                    <AdvisorAvatar key={advisor.id} advisor={advisor} size="sm" active />
                  ))}
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 sm:p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">Your question</p>
                <p className="mt-2 font-serif text-xl leading-7 text-parchment">
                  Should I stay where I am useful, or leave to build the thing I cannot stop thinking about?
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                {advisors.slice(0, 3).map((advisor, index) => (
                  <div
                    key={advisor.id}
                    className={`flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 ${
                      index === 2 ? 'hidden sm:flex' : ''
                    }`}
                  >
                    <AdvisorAvatar advisor={advisor} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-ivory">{advisor.name}</p>
                        <span className="h-1 w-1 rounded-full bg-gold/70" />
                        <p className="truncate text-[10px] uppercase tracking-[0.12em] text-mist">{advisor.archetype.replace('The ', '')}</p>
                      </div>
                      <p className="mt-1 truncate text-xs leading-5 text-mist">
                        {index === 0 && 'The question is not whether leaving is safe...'}
                        {index === 1 && 'Treat this as a staged decision, not a leap...'}
                        {index === 2 && 'Notice which part of you still wants permission...'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">Synthesis</p>
                  <p className="mt-1 text-xs text-mist">Three perspectives, one clearer next step.</p>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/25 text-gold">
                  <Sparkles size={15} strokeWidth={1.5} />
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-9 -left-4 hidden items-center gap-3 rounded-2xl border border-gold/15 bg-[#201d17]/95 px-4 py-3 shadow-2xl sm:flex">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gold/10 text-gold"><Feather size={15} /></span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">Memory saved</p>
              <p className="mt-1 text-xs text-parchment/70">You decide what your advisors remember.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="philosophy" className="paper-section px-5 py-24 sm:py-28 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow !text-gold-dark">Not another chatbot</p>
            <h2 className="mt-5 font-serif text-4xl leading-tight tracking-[-0.04em] text-ink sm:text-5xl">
              Advice should have a memory, a character, and a point of view.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#5f584e]">
              A better question deserves more than a generic answer. The Council helps you build a durable practice of reflection around the life only you can live.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[22px] border border-[#8f7a5f]/15 bg-[#8f7a5f]/15 md:grid-cols-3">
            {philosophy.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="bg-[#ede5d8] p-7 sm:p-8">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-gold-dark/20 text-gold-dark">
                  <Icon size={18} strokeWidth={1.5} />
                </span>
                <h3 className="mt-7 font-serif text-[25px] leading-7 text-ink">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#665e53]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="advisors" className="px-5 py-24 md:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Your private faculty</p>
              <h2 className="mt-4 max-w-xl font-serif text-4xl tracking-[-0.04em] text-ivory sm:text-5xl">
                The advisors you wish you had.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-mist">
              Begin with a carefully shaped set. Refine their worldview, voice, strengths, and boundaries as the relationship deepens.
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {advisors.slice(0, 3).map((advisor) => (
              <article key={advisor.id} className="advisor-card p-6">
                <AdvisorAvatar advisor={advisor} size="lg" />
                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">{advisor.archetype}</p>
                <h3 className="mt-2 font-serif text-[30px] text-ivory">{advisor.name}</h3>
                <p className="mt-3 text-sm leading-6 text-mist">{advisor.description}</p>
                <div className="mt-6 border-t border-white/[0.07] pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-mist/65">Best for</p>
                  <p className="mt-2 text-xs text-parchment/80">{advisor.bestFor}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-gold transition hover:text-gold-light">
              Build your council <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section id="privacy" className="px-5 pb-24 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 rounded-[26px] border border-gold/15 bg-[#1a1915] p-6 sm:p-9 md:grid-cols-[auto_1fr_auto] md:items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full border border-gold/20 bg-gold/5 text-gold">
            <LockKeyhole size={23} strokeWidth={1.5} />
          </span>
          <div>
            <p className="eyebrow">Private by design</p>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-ivory">Your interior life is not a feed.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-mist">
              You control what becomes memory, what gets edited, and what gets deleted. No public profile. No social performance. No borrowed authority.
            </p>
          </div>
          <Link href="/auth/signup" className="button-secondary whitespace-nowrap">
            Begin privately
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-xs text-mist sm:flex-row sm:items-center sm:justify-between">
          <CouncilLogo />
          <p className="font-serif italic text-parchment/60">A more coherent life, considered slowly.</p>
          <p className="text-[10px] uppercase tracking-[0.14em]">Not therapy. Not emergency support.</p>
        </div>
      </footer>
    </main>
  )
}
