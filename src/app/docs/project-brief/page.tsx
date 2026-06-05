import Link from 'next/link'
import { AppNavigation } from '@/components/app-navigation'

const completedItems = [
  'Authenticated app shell, advisor faculty, and Supabase user records',
  'Single-advisor chat with persisted history and memory extraction',
  'Mirror, Timeline, rituals, and memory review controls',
  'User-specific Home dashboard with themes, counts, and next action',
  'Supabase-backed Council threads with saved questions, advisor replies, and syntheses',
  'Structured session summaries with key points, next actions, saved memories, and follow-up questions',
]

const roadmapItems = [
  'Add onboarding redirect logic for incomplete profiles',
  'Make onboarding status visible in Home and advisor prompts',
  'Add focused auth, session, Council, dashboard, and summary parsing tests',
  'Add resilient OpenAI/Supabase failure states',
  'Add advisor creation and editing after the core record model stabilizes',
]

export default function ProjectBriefPage() {
  return (
    <main className="page-grain min-h-screen bg-[#131310] pb-24 lg:pl-[238px] lg:pb-0">
      <AppNavigation active="settings" />

      <div className="mx-auto max-w-[920px] px-5 py-8 md:px-8 lg:px-10 lg:py-11">
        <section className="border-b border-white/[0.07] pb-8">
          <p className="eyebrow">Project brief</p>
          <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-ivory sm:text-5xl">
            Pascale&apos;s Wager / The Council
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-mist">
            A private AI council for reflective decision-making: users bring a real question, receive distinct advisor perspectives, and build a remembered record of themes, memories, rituals, and identity synthesis over time.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="glass-card p-5">
            <p className="eyebrow">Done</p>
            <div className="mt-5 space-y-3">
              {completedItems.map((item) => (
                <div key={item} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <p className="text-sm leading-6 text-parchment">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <p className="eyebrow">Roadmap</p>
            <div className="mt-5 space-y-3">
              {roadmapItems.map((item) => (
                <div key={item} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <p className="text-sm leading-6 text-mist">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[22px] border border-gold/20 bg-gold/[0.05] p-5">
          <p className="eyebrow">Latest sprint</p>
          <h2 className="mt-3 font-serif text-2xl tracking-[-0.03em] text-ivory">
            Sessions now summarize into durable records.
          </h2>
          <p className="mt-3 text-sm leading-7 text-mist">
            The latest ten-day-equivalent sprint added session intelligence: chat and Council sessions can now generate structured summaries, persist key points and next actions, save durable memories, and appear on Home and Timeline.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/council" className="button-primary">
              Open Council
            </Link>
            <Link href="/timeline" className="button-secondary">
              View record
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
