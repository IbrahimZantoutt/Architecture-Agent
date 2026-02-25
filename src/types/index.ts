export type Mode =
  | 'plan'
  | 'help'
  | 'critic'
  | 'research'
  | 'writing'
  | 'program'
  | 'devils-advocate'

export interface ModeConfig {
  id: Mode
  label: string
  shortLabel?: string
  description: string
  shortDescription?: string
  icon: string
  color: string
  softColor: string
}

export interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
}

export interface ChatSession {
  id: string
  mode: Mode
  messages: Message[]
  createdAt: Date
}
