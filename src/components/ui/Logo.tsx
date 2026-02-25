interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const sizes = {
  sm: { icon: 32, iconInner: 18, title: 18, credit: 11, gap: 6 },
  md: { icon: 32, iconInner: 18, title: 18, credit: 12, gap: 8 },
  lg: { icon: 36, iconInner: 20, title: 20, credit: 13, gap: 8 },
}

export function Logo({ size = 'md', onClick }: LogoProps) {
  const s = sizes[size]

  return (
    <div
      className={`flex items-center${onClick ? ' cursor-pointer' : ''}`}
      style={{ gap: s.gap }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Text */}
      <span
        className="font-outfit font-bold text-text-primary"
        style={{ fontSize: s.title }}
      >
        ArchPal
      </span>

      <span
        className="font-outfit font-medium text-accent"
        style={{ fontSize: s.credit, opacity: 0.85 }}
      >
        by Ibrahim Zantout
      </span>
    </div>
  )
}
