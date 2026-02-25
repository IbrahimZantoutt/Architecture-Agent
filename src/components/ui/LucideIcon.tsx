import {
  Map,
  LifeBuoy,
  Shield,
  BookOpen,
  FileText,
  LayoutGrid,
  Swords,
  PenTool,
  Send,
  ArrowRight,
  Clock,
  Plus,
  ChevronLeft,
  Menu,
  Compass,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string; className?: string }>> = {
  map: Map,
  'life-buoy': LifeBuoy,
  shield: Shield,
  'book-open': BookOpen,
  'file-text': FileText,
  'layout-grid': LayoutGrid,
  swords: Swords,
  'pen-tool': PenTool,
  send: Send,
  'arrow-right': ArrowRight,
  clock: Clock,
  plus: Plus,
  'chevron-left': ChevronLeft,
  menu: Menu,
  compass: Compass,
}

interface LucideIconProps {
  name: string
  size?: number
  color?: string
  className?: string
}

export function LucideIcon({ name, size = 16, color, className }: LucideIconProps) {
  const Icon = iconMap[name]
  if (!Icon) return null
  return <Icon size={size} color={color} className={className} />
}
