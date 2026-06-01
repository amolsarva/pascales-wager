import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Feather,
  MessageCircle,
  Plus,
  Sparkles,
} from 'lucide-react'
import { AdvisorAvatar } from '@/components/advisor-avatar'
import { AppNavigation } from '@/components/app-navigation'
import { CouncilLogo } from '@/components/council-logo'
import { advisors, recentSessions } from '@/lib/council-data'

export default function HomePage() {
  return (
    <main className="page-grain min-h-screen bg-[#131310] pb-24 lg:pl-[238px] lg:pb-0">
      <AppNavigation active="home" />

      <header className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 lg:hidden">
        <CouncilLogo href="/home" compact />
        <Link href="/chat" className="grid h-9 w-9 place-items-center rounded-full border border-gold/20 text-gold">
          <Plus size={17} />
        </Link>
      </header>

      <div className="mx-auto max-w-[1240px] px-5 py-8 md:px-8 lg:px-10 lg:py-10">
        <section className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Sunday, May 31</p>
            <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-ivory sm:text-5xl">Good evening, Alexandra.</h1>
            <p className="mt-3 text-sm leading-6 text-mist">What deserves your attention before the week begins?</p>
          </div>
          <Link href="/chat" className="button-primary w-fit">
            New session <Plus size={15} />
          </Link>
        </section>

        <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_315px]">
          <div className="space-y-7">
            <section className="grid gap-4 md:grid-cols-[1.12fr_0.88fr]">
              <Link href="/chat" className="glass-card-raised group relative overflow-hidden p-6 sm:p-7">
                <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gold/10 blur-[45px]" />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <p className="eyebrow">Continue your session</p>
                    <ArrowRight size={16} className="text-gold transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="mt-7 flex items-center gap-4">
                    <AdvisorAvatar advisor={advisors[0]} size="lg" active />
                    <div>
                      <p className="font-serif text-2xl text-ivory">{advisors[0].name}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gold">{advisors[0].archetype}</p>
                    </div>
                  </div>
                  <p className="mt-6 font-serif text-xl leading-7 text-parchment">
                    A clean exit or a brave beginning?
                  </p>
                  <p className="mt-2 text-sm leading-6 text-mist">
                    You were separating the need to be validated from the desire to begin.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">
                    Resume conversation <ChevronRight size={14} />
                  </div>
                </div>
              </Link>

              <Link href="/council" className="group relative overflow-hidden rounded-[22px] border border-gold/20 bg-[#242018] p-6 sm:p-7">
                <div className="absolute -bottom-6 -right-5 h-32 w-32 rounded-full border border-gold/10" />
                <div className="absolute -bottom-1 right-7 h-20 w-20 rounded-full border border-gold/10" />
                <p className="eyebrow">Multiple perspectives</p>
                <h2 className="mt-5 font-serif text-3xl tracking-[-0.03em] text-ivory">Ask the Council</h2>
                <p className="mt-3 max-w-[270px] text-sm leading-6 text-mist">
                  Bring one question to several minds. Find the agreement and the useful tension.
                </p>
                <div className="mt-8 flex items-end justify-between">
                  <div className="flex -space-x-2">
                    {advisors.slice(0, 4).map((advisor) => (
                      <AdvisorAvatar key={advisor.id} advisor={advisor} size="sm" />
                    ))}
                  </div>
                  <ArrowRight size={16} className="text-gold transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Your advisors</p>
                  <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-ivory">Who would you like to ask?</h2>
                </div>
                <Link href="/advisors" className="hidden items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-gold sm:flex">
                  View all <ChevronRight size={13} />
                </Link>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {advisors.slice(0, 3).map((advisor) => (
                  <Link key={advisor.id} href={`/chat?advisor=${advisor.id}`} className="advisor-card p-4">
                    <div className="flex items-center gap-3">
                      <AdvisorAvatar advisor={advisor} size="md" />
                      <div className="min-w-0">
                        <p className="font-serif text-lg text-ivory">{advisor.name}</p>
                        <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.15em] text-gold">{advisor.archetype}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs leading-5 text-mist">{advisor.bestFor}</p>
                    <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-mist/55">Last asked: {advisor.lastAsked}</p>
                  </Link>
                ))}
              </div>
              <Link href="/advisors" className="mt-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-gold sm:hidden">
                View all advisors <ChevronRight size={13} />
              </Link>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Your recent questions</p>
                  <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-ivory">Return to a thread.</h2>
                </div>
                <Link href="/timeline" className="hidden items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-gold sm:flex">
                  All sessions <ChevronRight size={13} />
                </Link>
              </div>
              <div className="mt-5 overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.02]">
                {recentSessions.map((session, index) => (
                  <Link
                    key={session.title}
                    href="/chat"
                    className={`group flex gap-4 p-4 transition hover:bg-white/[0.025] sm:items-center sm:p-5 ${
                      index > 0 ? 'border-t border-white/[0.07]' : ''
                    }`}
                  >
                    <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-full border border-white/[0.08] text-gold sm:mt-0">
                      <MessageCircle size={15} strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-lg text-ivory">{session.title}</h3>
                        <span className="rounded-full border border-gold/15 bg-gold/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-gold">
                          {session.mode}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs leading-5 text-mist">{session.summary}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-mist/60">{session.date}</p>
                      <p className="mt-1 text-xs text-parchment/75">{session.advisor}</p>
                    </div>
                    <ChevronRight size={15} className="mt-2 flex-none text-mist transition group-hover:translate-x-1 group-hover:text-gold sm:mt-0" />
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="glass-card p-5">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Themes emerging</p>
                <Sparkles size={15} className="text-gold" strokeWidth={1.5} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Permission', 'Meaningful work', 'Courage', 'Boundaries', 'Timing'].map((theme) => (
                  <span key={theme} className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[11px] text-parchment/75">
                    {theme}
                  </span>
                ))}
              </div>
              <Link href="/mirror" className="mt-5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.13em] text-gold">
                Open the mirror <ChevronRight size={12} />
              </Link>
            </section>

            <section className="glass-card p-5">
              <div className="flex items-center justify-between">
                <p className="eyebrow">One next action</p>
                <CircleCheck size={15} className="text-gold" strokeWidth={1.5} />
              </div>
              <p className="mt-4 font-serif text-xl leading-7 text-parchment">
                Write the one-page plan for the first thirty days.
              </p>
              <p className="mt-3 text-xs leading-5 text-mist">From your session with Mara</p>
            </section>

            <Link href="/rituals" className="glass-card group block p-5 transition hover:border-gold/20">
              <div className="flex items-center gap-2 text-gold">
                <Feather size={15} strokeWidth={1.5} />
                <p className="eyebrow">Sunday reflection</p>
              </div>
              <p className="mt-4 font-serif text-xl leading-7 text-parchment">What are you carrying into the new week?</p>
              <p className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.13em] text-gold">
                Begin ritual <ChevronRight size={12} className="transition-transform group-hover:translate-x-1" />
              </p>
            </Link>

            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] p-4 text-mist">
              <CalendarDays size={16} className="text-gold" strokeWidth={1.5} />
              <p className="text-xs leading-5">Weekly review arrives each Sunday evening.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
