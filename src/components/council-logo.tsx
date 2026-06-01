import Link from 'next/link'

type CouncilLogoProps = {
  href?: string
  compact?: boolean
}

export function CouncilLogo({ href = '/', compact = false }: CouncilLogoProps) {
  return (
    <Link href={href} className="group inline-flex items-center gap-3">
      <span className="council-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>
        <span className="block font-serif text-[17px] leading-none tracking-[0.08em] text-ivory transition-colors group-hover:text-gold">
          THE COUNCIL
        </span>
        {!compact && (
          <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.28em] text-gold/65">
            Paideia
          </span>
        )}
      </span>
    </Link>
  )
}
