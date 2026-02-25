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

// ─── Firestore-serializable message (Date → number) ───────────────────────────
export interface StoredMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: number       // ms since epoch
  status?: MessageStatus
}

// ─── A full session document stored in Firestore ──────────────────────────────
export interface StoredSession {
  id: string              // Firestore doc ID (same as sessionId)
  userId: string
  sessionId: string
  mode: Mode              // last active mode
  title: string           // first user message (truncated)
  projectContext: ProjectContext
  messagesByMode: Partial<Record<Mode, StoredMessage[]>>
  planCompleted: boolean
  createdAt: number       // ms since epoch
  updatedAt: number
}
