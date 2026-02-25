import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore'
import { app } from './firebase'
import type { Mode, ProjectContext, Message, StoredMessage, StoredSession } from '../types'

export const db = getFirestore(app)

// ─── Serialization helpers ────────────────────────────────────────────────────

// Firestore rejects `undefined` values — only include defined fields.
function serializeMessage(msg: Message): StoredMessage {
  const out: StoredMessage = {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp.getTime() : Number(msg.timestamp),
  }
  if (msg.status !== undefined) out.status = msg.status
  return out
}

// Strip undefined values from an object so Firestore never sees them.
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) out[key] = obj[key]
  }
  return out
}

export function deserializeMessage(msg: StoredMessage): Message {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    status: msg.status,
  }
}

function deriveTitle(messagesByMode: Partial<Record<Mode, Message[]>>): string {
  const order: Mode[] = ['plan', 'help', 'critic', 'research', 'writing', 'program', 'devils-advocate']
  for (const m of order) {
    const msgs = messagesByMode[m]
    const firstUser = msgs?.find((msg) => msg.role === 'user')
    if (firstUser?.content) {
      const t = firstUser.content.trim()
      return t.length > 70 ? t.slice(0, 70) + '…' : t
    }
  }
  return 'Untitled session'
}

// The sessionId encodes its own creation time: "session_<timestamp>_<rand>"
function sessionCreatedAt(sessionId: string): number {
  const match = sessionId.match(/session_(\d+)_/)
  return match ? parseInt(match[1], 10) : Date.now()
}

const MAX_SESSIONS = 5

// ─── Save / upsert a session ──────────────────────────────────────────────────

export async function saveSession(
  userId: string,
  sessionId: string,
  currentMode: Mode,
  projectContext: ProjectContext,
  messagesByMode: Partial<Record<Mode, Message[]>>,
  planCompleted: boolean,
): Promise<void> {
  // Only save if there is at least one real user message
  const hasContent = Object.values(messagesByMode).some(
    (msgs) => msgs?.some((m) => m.role === 'user'),
  )
  if (!hasContent) return

  const serialized: Partial<Record<Mode, StoredMessage[]>> = {}
  for (const [m, msgs] of Object.entries(messagesByMode)) {
    if (msgs?.length) serialized[m as Mode] = msgs.map(serializeMessage)
  }

  const sessionsRef = collection(db, 'users', userId, 'sessions')
  const docRef = doc(sessionsRef, sessionId)

  try {
    await setDoc(
      docRef,
      {
        userId,
        sessionId,
        mode: currentMode,
        title: deriveTitle(messagesByMode),
        projectContext: stripUndefined(projectContext as Record<string, unknown>),
        messagesByMode: serialized,
        planCompleted,
        createdAt: sessionCreatedAt(sessionId),
        updatedAt: Date.now(),
      },
      { merge: true },
    )
  } catch (err) {
    console.error('[ArchPal] Firestore setDoc failed:', err)
    throw err
  }

  await pruneOldSessions(userId)
}

async function pruneOldSessions(userId: string): Promise<void> {
  const sessionsRef = collection(db, 'users', userId, 'sessions')
  const q = query(sessionsRef, orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  const toDelete = snap.docs.slice(MAX_SESSIONS)
  await Promise.all(toDelete.map((d) => deleteDoc(d.ref)))
}

// ─── Fetch last N sessions ────────────────────────────────────────────────────

export async function getUserSessions(userId: string): Promise<StoredSession[]> {
  const sessionsRef = collection(db, 'users', userId, 'sessions')
  const q = query(sessionsRef, orderBy('updatedAt', 'desc'), limit(MAX_SESSIONS))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<StoredSession, 'id'>),
  }))
}

// ─── Delete a session ─────────────────────────────────────────────────────────

export async function deleteSession(userId: string, sessionId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'sessions', sessionId)
  await deleteDoc(docRef)
}
