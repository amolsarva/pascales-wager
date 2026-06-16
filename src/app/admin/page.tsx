import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Database,
  Flame,
  KeyRound,
  ShieldCheck,
  UserPlus,
  UsersRound,
  Wrench,
} from 'lucide-react'
import { AppNavigation } from '@/components/app-navigation'
import { CouncilLogo } from '@/components/council-logo'

type AdminLink = {
  title: string
  href: string
  description: string
  icon: typeof ArrowRight
  badge?: string
}

const adminGroups: Array<{ title: string; description: string; links: AdminLink[] }> = [
  {
    title: 'User Access',
    description: 'Fast paths for account setup, onboarding, recovery, and dev-mode entry.',
    links: [
      {
        title: 'Onboard a new user',
        href: '/auth/signup',
        description: 'Create a new account and send the user through first-run onboarding.',
        icon: UserPlus,
        badge: 'Signup',
      },
      {
        title: 'Onboarding screen',
        href: '/onboarding',
        description: 'Jump directly to the identity setup flow while testing incomplete profiles.',
        icon: ClipboardCheck,
      },
      {
        title: 'Login and bypass',
        href: '/auth/login',
        description: 'Use email/password, password recovery, or the dev bypass code box.',
        icon: KeyRound,
        badge: 'Morrissey',
      },
      {
        title: 'Update password',
        href: '/auth/update-password',
        description: 'Recovery-link landing page for setting a replacement password.',
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: 'Product Admin',
    description: 'Developer-facing product screens that need frequent QA during alpha.',
    links: [
      {
        title: 'Advisor management',
        href: '/advisors',
        description: 'Create and edit custom advisors once the Supabase advisors table is live.',
        icon: UsersRound,
      },
      {
        title: 'Council room',
        href: '/council',
        description: 'Exercise multi-advisor answers, synthesis, and Council history.',
        icon: Flame,
      },
      {
        title: 'Timeline',
        href: '/timeline',
        description: 'Review memories, rituals, identity summaries, and session summaries.',
        icon: BookOpen,
      },
      {
        title: 'Mirror and memory review',
        href: '/mirror',
        description: 'Inspect identity synthesis and edit or delete remembered items.',
        icon: Wrench,
      },
    ],
  },
  {
    title: 'Project Ops',
    description: 'Status, roadmap, schema, and verification surfaces referenced in this thread.',
    links: [
      {
        title: 'PRD and roadmap',
        href: '/docs/project-brief',
        description: 'The in-app product record with completed work and next alpha tasks.',
        icon: BookOpen,
      },
      {
        title: 'Task tracker',
        href: '/tasks',
        description: 'Current implementation checklist and later roadmap.',
        icon: ClipboardCheck,
      },
      {
        title: 'Schema readiness SQL',
        href: '/admin#schema',
        description: 'Copy the local SQL file path and run it in Supabase before full persistence.',
        icon: Database,
        badge: 'Local file',
      },
      {
        title: 'Production smoke',
        href: '/admin#testing',
        description: 'Commands for smoke, schema audit, and deploy verification.',
        icon: ShieldCheck,
        badge: '27 checks',
      },
    ],
  },
]

const apiRoutes = [
  '/api/advisors',
  '/api/auth/bypass',
  '/api/chat',
  '/api/council',
  '/api/dashboard',
  '/api/memories',
  '/api/onboarding',
  '/api/rituals',
  '/api/session-summaries',
  '/api/sessions',
  '/api/synthesis',
]

export default function AdminPage() {
  return (
    <main className="page-grain min-h-screen bg-[#131310] pb-28 lg:pl-[238px] lg:pb-0">
      <AppNavigation active="admin" />

      <header className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 lg:hidden">
        <CouncilLogo href="/home" compact />
        <Link
          href="/home"
          className="rounded-full border border-[#ff8a2a]/30 bg-[#ff8a2a]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#ff9b45]"
        >
          ADMIN
        </Link>
      </header>

      <div className="mx-auto max-w-[1180px] px-5 py-8 md:px-8 lg:px-10 lg:py-11">
        <section className="border-b border-white/[0.07] pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff8a2a]/25 bg-[#ff8a2a]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#ff9b45]">
            <Flame size={14} /> Heavy dev mode
          </div>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl tracking-[-0.05em] text-ivory sm:text-6xl">
            Admin shortcuts for alpha operations.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-mist">
            This page is intentionally visible while the app is in heavy development. Later it should move behind a real admin role or feature flag.
          </p>
        </section>

        <div className="mt-8 grid gap-5">
          {adminGroups.map((group) => (
            <section key={group.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="eyebrow">{group.title}</p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-mist">{group.description}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {group.links.map(({ title, href, description, icon: Icon, badge }) => (
                  <Link
                    key={`${group.title}-${title}`}
                    href={href}
                    className="group flex min-h-[168px] flex-col rounded-xl border border-white/[0.08] bg-[#181711] p-4 transition hover:border-[#ff8a2a]/35 hover:bg-[#201b13]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full border border-[#ff8a2a]/25 bg-[#ff8a2a]/10 text-[#ff9b45]">
                        <Icon size={17} strokeWidth={1.7} />
                      </span>
                      {badge && (
                        <span className="rounded-full border border-gold/20 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-gold">
                          {badge}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-4 font-serif text-2xl tracking-[-0.03em] text-ivory">{title}</h2>
                    <p className="mt-2 text-xs leading-5 text-mist">{description}</p>
                    <span className="mt-auto flex items-center gap-1 pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff9b45]">
                      Open <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section id="schema" className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
          <p className="eyebrow">Supabase readiness</p>
          <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-ivory">Local schema files and commands</h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-white/[0.08] bg-[#181711] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff9b45]">Run in Supabase SQL editor</p>
              <code className="mt-3 block overflow-x-auto rounded-lg border border-white/[0.08] bg-black/20 p-3 text-xs text-parchment">
                docs/supabase-alpha-readiness.sql
              </code>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#181711] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff9b45]">Verify locally</p>
              <code className="mt-3 block overflow-x-auto rounded-lg border border-white/[0.08] bg-black/20 p-3 text-xs text-parchment">
                npm run audit:schema
              </code>
            </div>
          </div>
        </section>

        <section id="testing" className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
          <p className="eyebrow">Testing and API routes</p>
          <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-ivory">Production checks</h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-[0.8fr_1fr]">
            <div className="rounded-xl border border-white/[0.08] bg-[#181711] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff9b45]">Release gate</p>
              <code className="mt-3 block overflow-x-auto rounded-lg border border-white/[0.08] bg-black/20 p-3 text-xs text-parchment">
                npm run smoke:alpha
              </code>
              <p className="mt-3 text-xs leading-5 text-mist">Currently covers public pages, protected redirects, private API auth, onboarding, dashboard, Council, advisors, summaries, and timeline.</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#181711] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff9b45]">Admin-mentioned API routes</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {apiRoutes.map((route) => (
                  <code key={route} className="rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2 text-xs text-parchment">
                    {route}
                  </code>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
