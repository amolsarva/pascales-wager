import Link from 'next/link'
import { BookOpen, Flame, Home, MessageCircle, Settings2, UsersRound } from 'lucide-react'
import { CouncilLogo } from '@/components/council-logo'

type AppNavigationProps = {
  active?: 'home' | 'advisors' | 'council' | 'sessions' | 'settings' | 'admin'
}

const items = [
  { id: 'home', label: 'Home', href: '/home', icon: Home },
  { id: 'advisors', label: 'Advisors', href: '/advisors', icon: BookOpen },
  { id: 'council', label: 'Council', href: '/council', icon: UsersRound },
  { id: 'sessions', label: 'Sessions', href: '/timeline', icon: MessageCircle },
  { id: 'settings', label: 'Settings', href: '/mirror', icon: Settings2 },
] as const

const adminItem = { id: 'admin', label: 'Admin', href: '/admin', icon: Flame } as const

export function AppNavigation({ active }: AppNavigationProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[238px] border-r border-white/[0.06] bg-[#10100f] px-5 py-6 lg:flex lg:flex-col">
        <CouncilLogo href="/home" />

        <nav className="mt-14 flex flex-col gap-1">
          {items.map(({ id, label, href, icon: Icon }) => (
            <Link
              key={id}
              href={href}
              className={`app-nav-link ${active === id ? 'app-nav-link-active' : ''}`}
            >
              <Icon size={16} strokeWidth={1.6} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <Link
            href={adminItem.href}
            className={`mb-4 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] transition ${
              active === 'admin'
                ? 'border-[#ff9b45]/45 bg-[#ff8a2a]/18 text-[#ffb26f]'
                : 'border-[#ff8a2a]/25 bg-[#ff8a2a]/10 text-[#ff9b45] hover:border-[#ff9b45]/45 hover:bg-[#ff8a2a]/16'
            }`}
          >
            <Flame size={15} strokeWidth={1.8} />
            <span>ADMIN</span>
          </Link>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70">Private by design</p>
            <p className="mt-2 text-xs leading-5 text-mist">
              Your memories remain yours. Review, edit, or remove them at any time.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 font-serif text-sm text-gold">
            A
          </div>
          <div>
            <p className="text-xs font-medium text-ivory">Alexandra</p>
            <p className="mt-0.5 text-[10px] text-mist">Member since May</p>
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-[74px] items-start justify-around border-t border-white/[0.08] bg-[#11110f]/95 px-2 pt-2 backdrop-blur-xl lg:hidden">
        {items.slice(0, 4).map(({ id, label, href, icon: Icon }) => (
          <Link
            key={id}
            href={href}
            className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] transition ${
              active === id ? 'text-gold' : 'text-mist'
            }`}
          >
            <Icon size={18} strokeWidth={active === id ? 2 : 1.5} />
            <span>{label}</span>
          </Link>
        ))}
        <Link
          href={adminItem.href}
          className={`flex min-w-16 flex-col items-center gap-1 rounded-xl border px-2 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] transition ${
            active === 'admin'
              ? 'border-[#ff9b45]/45 bg-[#ff8a2a]/18 text-[#ffb26f]'
              : 'border-[#ff8a2a]/25 bg-[#ff8a2a]/10 text-[#ff9b45]'
          }`}
        >
          <Flame size={18} strokeWidth={active === 'admin' ? 2 : 1.5} />
          <span>ADMIN</span>
        </Link>
      </nav>
    </>
  )
}
