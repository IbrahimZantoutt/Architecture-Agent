import { LucideIcon } from './LucideIcon'
import type { ModeConfig } from '../../types'

interface ModePillProps {
  mode: ModeConfig
  active?: boolean
  onClick?: () => void
  /** Shorter label variant for mobile */
  short?: boolean
}

export function ModePill({ mode, active = false, onClick, short = false }: ModePillProps) {
  const label = short ? (mode.shortLabel ?? mode.label) : (mode.shortLabel ?? mode.label)

  if (active) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 rounded-full font-outfit font-semibold transition-all duration-150 flex-shrink-0"
        style={{
          padding: '8px 16px',
          fontSize: 13,
          backgroundColor: '#FFE4EC',
          color: '#E8607A',
        }}
      >
        <LucideIcon name={mode.icon} size={16} color="#E8607A" />
        {label}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-full font-outfit font-medium border border-border transition-all duration-150 flex-shrink-0 hover:bg-bg-soft"
      style={{
        padding: '8px 16px',
        fontSize: 13,
        backgroundColor: 'transparent',
        color: '#6B7280',
      }}
    >
      <LucideIcon name={mode.icon} size={16} color="#9CA3AF" />
      {label}
    </button>
  )
}
