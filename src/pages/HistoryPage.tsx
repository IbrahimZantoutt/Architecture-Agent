import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, MessageSquare, Clock } from 'lucide-react'
import { Logo } from '../components/ui/Logo'
import { useAuth } from '../contexts/AuthContext'
import { useSession } from '../contexts/SessionContext'
import { getUserSessions, deleteSession } from '../lib/firestore'
import { MODES } from '../lib/modes'
import type { StoredSession } from '../types'

// ─── Date formatting ──────────────────────────────────────────────────────────
function formatDate(ms: number): string {
  const date = new Date(ms)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) return `Today at ${time}`
  if (diffDays === 1) return `Yesterday at ${time}`
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' }) + ` at ${time}`
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function countUserMessages(stored: StoredSession): number {
  return Object.values(stored.messagesByMode)
    .flat()
    .filter((m) => m?.role === 'user').length
}

// ─── Session card ─────────────────────────────────────────────────────────────
function SessionCard({
  stored,
  onContinue,
  onDelete,
}: {
  stored: StoredSession
  onContinue: (s: StoredSession) => void
  onDelete: (s: StoredSession) => void
}) {
  const modeConfig = MODES.find((m) => m.id === stored.mode) ?? MODES[0]
  const msgCount = countUserMessages(stored)

  return (
    <div
      className="bg-bg-card border border-border rounded-2xl flex items-start gap-4 transition-shadow hover:shadow-sm"
      style={{ padding: '18px 20px' }}
    >
      {/* Left accent bar */}
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: 4,
          height: 40,
          backgroundColor: modeConfig.color,
          marginTop: 2,
        }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 6 }}>
        {/* Mode pill */}
        <div className="flex items-center gap-2">
          <span
            className="font-outfit font-semibold rounded-full"
            style={{
              fontSize: 11,
              padding: '2px 10px',
              backgroundColor: modeConfig.softColor,
              color: modeConfig.color,
            }}
          >
            {modeConfig.label}
          </span>
        </div>

        {/* Title */}
        <p
          className="font-outfit font-medium text-text-primary"
          style={{ fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word' }}
        >
          {stored.title}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 font-outfit text-text-muted" style={{ fontSize: 12 }}>
            <Clock size={12} color="#9CA3AF" />
            {formatDate(stored.updatedAt)}
          </span>
          <span className="flex items-center gap-1 font-outfit text-text-muted" style={{ fontSize: 12 }}>
            <MessageSquare size={12} color="#9CA3AF" />
            {msgCount} {msgCount === 1 ? 'message' : 'messages'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onContinue(stored)}
          className="font-outfit font-semibold text-white rounded-[10px] transition-opacity hover:opacity-80"
          style={{
            padding: '7px 14px',
            fontSize: 13,
            backgroundColor: '#E8607A',
          }}
        >
          Continue
        </button>
        <button
          onClick={() => onDelete(stored)}
          className="flex items-center justify-center rounded-[10px] border border-border hover:border-border-strong transition-colors"
          style={{ width: 34, height: 34 }}
          title="Delete session"
        >
          <Trash2 size={15} color="#9CA3AF" />
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function HistoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { loadStoredSession } = useSession()

  const [sessions, setSessions] = useState<StoredSession[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getUserSessions(user.uid)
      .then(setSessions)
      .finally(() => setLoading(false))
  }, [user])

  const handleContinue = (stored: StoredSession) => {
    loadStoredSession(stored)          // flushSync inside — state is committed before navigate
    navigate(`/chat/${stored.mode}`)
  }

  const handleDelete = async (stored: StoredSession) => {
    if (!user) return
    setDeletingId(stored.id)
    try {
      await deleteSession(user.uid, stored.id)
      setSessions((prev) => prev.filter((s) => s.id !== stored.id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-bg-soft font-outfit flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* ─── Desktop ─── */}
      <div className="hidden md:flex flex-col flex-1">
        {/* Header */}
        <header
          className="flex items-center justify-between w-full anim-fade-in"
          style={{ padding: '16px 48px' }}
        >
          <Logo size="lg" />
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 bg-bg-card rounded-[10px] border border-border font-outfit font-medium text-text-secondary hover:border-border-strong transition-colors"
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            <ArrowLeft size={15} color="#6B7280" />
            Back to home
          </button>
        </header>

        {/* Main */}
        <main
          className="flex flex-col w-full mx-auto anim-fade-up"
          style={{ maxWidth: 760, padding: '24px 24px 48px', animationDelay: '60ms', flex: 1 }}
        >
          <h1
            className="font-outfit font-bold text-text-primary"
            style={{ fontSize: 26, marginBottom: 6 }}
          >
            Your sessions
          </h1>
          <p className="font-outfit text-text-secondary" style={{ fontSize: 14, marginBottom: 28 }}>
            Last 5 sessions — pick up where you left off.
          </p>

          {loading && (
            <p className="font-outfit text-text-muted text-center" style={{ fontSize: 14, marginTop: 60 }}>
              Loading…
            </p>
          )}

          {!loading && sessions.length === 0 && (
            <div
              className="flex flex-col items-center justify-center text-center"
              style={{ marginTop: 80, gap: 12 }}
            >
              <MessageSquare size={36} color="#D1B3BD" />
              <p className="font-outfit font-medium text-text-secondary" style={{ fontSize: 15 }}>
                No saved sessions yet
              </p>
              <p className="font-outfit text-text-muted" style={{ fontSize: 13 }}>
                Start a new chat — your sessions will appear here.
              </p>
              <button
                onClick={() => navigate('/')}
                className="font-outfit font-semibold text-white rounded-[10px] transition-opacity hover:opacity-80"
                style={{ padding: '9px 20px', fontSize: 13, backgroundColor: '#E8607A', marginTop: 8 }}
              >
                Start chatting
              </button>
            </div>
          )}

          {!loading && sessions.length > 0 && (
            <div className="flex flex-col" style={{ gap: 12 }}>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  style={{ opacity: deletingId === s.id ? 0.4 : 1, transition: 'opacity 200ms' }}
                >
                  <SessionCard
                    stored={s}
                    onContinue={handleContinue}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ─── Mobile ─── */}
      <div className="flex flex-col md:hidden flex-1" style={{ minHeight: '100dvh' }}>
        {/* Mobile Header */}
        <header
          className="flex items-center justify-between w-full anim-fade-in"
          style={{ padding: '14px 20px' }}
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-text-primary"
          >
            <ArrowLeft size={20} color="#1A1A2E" />
            <span className="font-outfit font-semibold" style={{ fontSize: 16 }}>
              ArchPal
            </span>
          </button>
          <Logo size="sm" />
        </header>

        <main className="flex flex-col flex-1" style={{ padding: '12px 20px 32px' }}>
          <h1
            className="font-outfit font-bold text-text-primary anim-fade-up"
            style={{ fontSize: 22, marginBottom: 4 }}
          >
            Your sessions
          </h1>
          <p
            className="font-outfit text-text-secondary anim-fade-up"
            style={{ fontSize: 13, marginBottom: 20, animationDelay: '40ms' }}
          >
            Last 5 sessions — tap to continue.
          </p>

          {loading && (
            <p className="font-outfit text-text-muted text-center" style={{ fontSize: 14, marginTop: 40 }}>
              Loading…
            </p>
          )}

          {!loading && sessions.length === 0 && (
            <div
              className="flex flex-col items-center justify-center text-center"
              style={{ marginTop: 60, gap: 10 }}
            >
              <MessageSquare size={32} color="#D1B3BD" />
              <p className="font-outfit font-medium text-text-secondary" style={{ fontSize: 14 }}>
                No saved sessions yet
              </p>
              <p className="font-outfit text-text-muted" style={{ fontSize: 12 }}>
                Start a new chat to get going.
              </p>
            </div>
          )}

          {!loading && sessions.length > 0 && (
            <div className="flex flex-col" style={{ gap: 10 }}>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  style={{ opacity: deletingId === s.id ? 0.4 : 1, transition: 'opacity 200ms' }}
                >
                  <SessionCard
                    stored={s}
                    onContinue={handleContinue}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
