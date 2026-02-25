import { ArrowRight } from 'lucide-react'
import { LucideIcon } from './LucideIcon'
import type { ModeConfig } from '../../types'

interface ModeCardProps {
  mode: ModeConfig
  onClick?: () => void
  /** Compact layout for mobile 2-column grid */
  compact?: boolean
}

export function ModeCard({ mode, onClick, compact = false }: ModeCardProps) {
  if (compact) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left bg-bg-card rounded-[20px] border border-border shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
        style={{ padding: 16, gap: 10, display: 'flex', flexDirection: 'column' }}
      >
        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: 40,
            height: 40,
            backgroundColor: mode.softColor,
          }}
        >
          <LucideIcon name={mode.icon} size={20} color={mode.color} />
        </div>

        {/* Title */}
        <span
          className="font-outfit font-semibold leading-tight"
          style={{ fontSize: 16, color: '#1A1A2E' }}
        >
          {mode.shortLabel ?? mode.label}
        </span>

        {/* Desc */}
        <span
          className="font-outfit leading-snug"
          style={{ fontSize: 12, color: '#6B7280' }}
        >
          {mode.shortDescription ?? mode.description}
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-bg-card rounded-[20px] border border-border shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
      style={{ padding: 24 }}
    >
      <div className="flex flex-col gap-4">
        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: 48,
            height: 48,
            backgroundColor: mode.softColor,
          }}
        >
          <LucideIcon name={mode.icon} size={20} color={mode.color} />
        </div>

        {/* Title */}
        <span
          className="font-outfit font-semibold"
          style={{ fontSize: 20, color: '#1A1A2E' }}
        >
          {mode.label}
        </span>

        {/* Description */}
        <span
          className="font-outfit leading-relaxed"
          style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}
        >
          {mode.description}
        </span>

        {/* Arrow */}
        <div className="flex justify-end">
          <ArrowRight size={18} color="#E8607A" />
        </div>
      </div>
    </button>
  )
}
