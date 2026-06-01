import Link from 'next/link'
import { ArrowLeft, ChevronRight, Plus, SlidersHorizontal } from 'lucide-react'
import { AdvisorAvatar } from '@/components/advisor-avatar'
import { AppNavigation } from '@/components/app-navigation'
import { CouncilLogo } from '@/components/council-logo'
import { advisors } from '@/lib/council-data'

export default function AdvisorsPage() {
  return (
    <main className="page-grain min-h-screen bg-[#131310] pb-24 lg:pl-[238px] lg:pb-0">
      <AppNavigation active="advisors" />
      <header className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 lg:hidden">
        <CouncilLogo href="/home" compact />
        <Link href="/home" className="text-mist"><ArrowLeft size={18} /></Link>
      </header>

      <div className="mx-auto max-w-[1120px] px-5 py-8 md:px-8 lg:px-10 lg:py-11">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Your private faculty</p>
            <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-ivory sm:text-5xl">Your advisors</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-mist">
              Each advisor carries a distinct worldview, voice, and purpose. Return to the right one for the question at hand.
            </p>
          </div>
          <button className="button-primary w-fit">
            Create advisor <Plus size={14} />
          </button>
        </section>

        <section className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {advisors.map((advisor) => (
            <article key={advisor.id} className="advisor-card flex flex-col p-5">
              <div className="flex items-start justify-between">
                <AdvisorAvatar advisor={advisor} size="lg" />
                <button className="text-mist transition hover:text-gold" aria-label={`Edit ${advisor.name}`}>
                  <SlidersHorizontal size={15} strokeWidth={1.5} />
                </button>
              </div>
              <p className="mt-6 text-[9px] font-bold uppercase tracking-[0.16em] text-gold">{advisor.archetype}</p>
              <h2 className="mt-2 font-serif text-[29px] text-ivory">{advisor.name}</h2>
              <p className="mt-3 text-xs leading-5 text-mist">{advisor.description}</p>
              <div className="mt-5 border-t border-white/[0.07] pt-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-mist/60">Best for</p>
                <p className="mt-2 text-xs leading-5 text-parchment/80">{advisor.bestFor}</p>
              </div>
              <div className="mt-auto flex items-center justify-between pt-5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-mist/55">Asked {advisor.lastAsked}</p>
                <Link href={`/chat?advisor=${advisor.id}`} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
                  Ask <ChevronRight size={12} />
                </Link>
              </div>
            </article>
          ))}

          <button className="flex min-h-[325px] flex-col items-center justify-center rounded-[20px] border border-dashed border-white/[0.12] p-6 text-center transition hover:border-gold/35 hover:bg-gold/[0.025]">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/25 text-gold">
              <Plus size={18} />
            </span>
            <p className="mt-5 font-serif text-2xl text-ivory">Create an advisor</p>
            <p className="mt-2 max-w-[210px] text-xs leading-5 text-mist">
              Shape a voice for the questions your current council cannot answer.
            </p>
          </button>
        </section>
      </div>
    </main>
  )
}
