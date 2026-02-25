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

export type MessageStatus = 'thinking' | 'searching' | 'calculating' | 'writing' | 'done' | 'error'

export interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  status?: MessageStatus
}

export interface ChatSession {
  id: string
  mode: Mode
  messages: Message[]
  createdAt: Date
}

// Project context shared across all modes
export interface ProjectContext {
  typology?: string
  scale?: string
  site?: string
  client?: string
  stage?: string
  decisions?: string
  challenges?: string
  deadline?: string
  concept?: string
  summary?: string     // Full Project Summary Card text from Plan Mode
  [key: string]: string | undefined
}

export interface SessionState {
  sessionId: string
  projectContext: ProjectContext
  messagesByMode: Partial<Record<Mode, Message[]>>
  planCompleted: boolean
}
