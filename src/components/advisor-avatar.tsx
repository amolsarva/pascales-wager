import type { Advisor } from '@/lib/council-data'
import type { CSSProperties } from 'react'

type AdvisorAvatarProps = {
  advisor: Advisor
  size?: 'sm' | 'md' | 'lg' | 'xl'
  active?: boolean
}

const sizeClasses = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-3xl',
}

export function AdvisorAvatar({ advisor, size = 'md', active = false }: AdvisorAvatarProps) {
  return (
    <div
      className={`advisor-avatar ${sizeClasses[size]} ${active ? 'advisor-avatar-active' : ''}`}
      style={
        {
          '--avatar-accent': advisor.accent,
          '--avatar-shadow': advisor.shadow,
        } as CSSProperties
      }
      aria-label={`${advisor.name}, ${advisor.archetype}`}
    >
      <span className="advisor-avatar-halo" />
      <span className="advisor-avatar-letter">{advisor.monogram}</span>
    </div>
  )
}
