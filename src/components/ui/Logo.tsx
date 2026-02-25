import { PenTool } from 'lucide-react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { icon: 32, iconInner: 18, title: 18, credit: 11, gap: 6 },
  md: { icon: 32, iconInner: 18, title: 18, credit: 12, gap: 8 },
  lg: { icon: 36, iconInner: 20, title: 20, credit: 13, gap: 8 },
}

export function Logo({ size = 'md' }: LogoProps) {
  const s = sizes[size]

  return (
    <div className="flex items-center" style={{ gap: s.gap }}>
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-[10px] bg-accent flex-shrink-0"
        style={{ width: s.icon, height: s.icon, borderRadius: size === 'lg' ? 10 : 8 }}
      >
        <PenTool size={s.iconInner} color="#FFFFFF" />
      </div>

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
