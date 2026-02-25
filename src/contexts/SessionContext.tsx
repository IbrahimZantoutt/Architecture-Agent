// SessionContext — shared cross-mode memory for ArchPal
// Project context persists when switching between modes so students never repeat themselves.

import { createContext, useContext, useCallback, useState, useRef } from 'react'
import { flushSync } from 'react-dom'
import type { ReactNode } from 'react'
import type { Mode, Message, ProjectContext, SessionState, StoredSession } from '../types'
import { deserializeMessage } from '../lib/firestore'

// ─── Context shape ────────────────────────────────────────────────────────────
interface SessionContextValue {
  sessionId: string
  projectContext: ProjectContext
  messagesByMode: Partial<Record<Mode, Message[]>>
  planCompleted: boolean

  // Actions
  updateProjectContext: (updates: Partial<ProjectContext>) => void
  getMessagesForMode: (mode: Mode) => Message[]
  setMessagesForMode: (mode: Mode, messages: Message[]) => void
  markPlanCompleted: () => void
  resetSession: () => void
  loadStoredSession: (stored: StoredSession) => void
}

const SessionCtx = createContext<SessionContextValue | null>(null)

// ─── Generate a simple session ID ─────────────────────────────────────────────
function makeSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ─── Initial state ────────────────────────────────────────────────────────────
function makeInitialState(): SessionState {
  return {
    sessionId: makeSessionId(),
    projectContext: {},
    messagesByMode: {},
    planCompleted: false,
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(makeInitialState)

  // Use a ref so callbacks always see the latest state without re-creating
  const stateRef = useRef(state)
  stateRef.current = state

  const updateProjectContext = useCallback((updates: Partial<ProjectContext>) => {
    setState((prev) => ({
      ...prev,
      projectContext: { ...prev.projectContext, ...updates },
    }))
  }, [])

  const getMessagesForMode = useCallback((mode: Mode): Message[] => {
    return stateRef.current.messagesByMode[mode] ?? []
  }, [])

  const setMessagesForMode = useCallback((mode: Mode, messages: Message[]) => {
    setState((prev) => ({
      ...prev,
      messagesByMode: { ...prev.messagesByMode, [mode]: messages },
    }))
  }, [])

  const markPlanCompleted = useCallback(() => {
    setState((prev) => ({ ...prev, planCompleted: true }))
  }, [])

  const resetSession = useCallback(() => {
    setState(makeInitialState())
  }, [])

  // Load a stored Firestore session into local state synchronously (use flushSync
  // at call-site when navigating immediately after to guarantee context is updated
  // before the new route mounts).
  const loadStoredSession = useCallback((stored: StoredSession) => {
    const restoredMessages: Partial<Record<Mode, Message[]>> = {}
    for (const [m, msgs] of Object.entries(stored.messagesByMode)) {
      if (msgs?.length) {
        restoredMessages[m as Mode] = msgs.map(deserializeMessage)
      }
    }
    flushSync(() => {
      setState({
        sessionId: stored.sessionId,
        projectContext: stored.projectContext,
        messagesByMode: restoredMessages,
        planCompleted: stored.planCompleted,
      })
    })
  }, [])

  return (
    <SessionCtx.Provider
      value={{
        sessionId: state.sessionId,
        projectContext: state.projectContext,
        messagesByMode: state.messagesByMode,
        planCompleted: state.planCompleted,
        updateProjectContext,
        getMessagesForMode,
        setMessagesForMode,
        markPlanCompleted,
        resetSession,
        loadStoredSession,
      }}
    >
      {children}
    </SessionCtx.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSession() {
  const ctx = useContext(SessionCtx)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}
