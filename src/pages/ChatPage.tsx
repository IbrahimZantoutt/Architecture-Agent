import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Plus, ChevronLeft, Calculator, ChevronDown } from 'lucide-react'
import { Logo } from '../components/ui/Logo'
import { ChatInput } from '../components/ui/ChatInput'
import { ModePill } from '../components/ui/ModePill'
import { MessageBubble } from '../components/ui/MessageBubble'
import { LucideIcon } from '../components/ui/LucideIcon'
import { MODES } from '../lib/modes'
import { runAgent, type AgentStatus } from '../lib/agent'
import { useSession } from '../contexts/SessionContext'
import type { Message, Mode } from '../types'

// ─── Welcome messages per mode ────────────────────────────────────────────────
function getWelcomeMessage(mode: Mode, hasPlanContext: boolean): string {
  const hasContext = hasPlanContext
  const map: Record<Mode, string> = {
    plan: "Welcome! I'm here to help you think through your architecture project. Let's start at the beginning — what's the building type or typology you're working on?",
    help: hasContext
      ? "I've got your project context ready. What specific design challenge are you facing right now?"
      : "Hello! Bring me your design challenge and I'll help you think through structured approaches. What specific problem are you working on?",
    critic: hasContext
      ? "I'm ready to put your project through its paces. Let's start with your concept — describe it in one or two sentences."
      : "I'm in Critic Mode — I'll give you rigorous, jury-level feedback on your design. Describe your project and tell me what stage you're at.",
    research: hasContext
      ? "What would you like to research? I can look into typologies, precedents, materials, structural systems, climate strategies, or theory."
      : "Let's explore. What topic, typology, or precedent would you like to research? I can look into materials, history, case studies, and more.",
    writing: hasContext
      ? "Ready to help you write. Describe your project or concept casually — like you're explaining it to a friend — and I'll help you turn it into something polished."
      : "Ready to help you write. Share your rough ideas or concept notes and I'll help you develop precise, confident architectural language.",
    program: hasContext
      ? "Let's work on your spatial program. Should I start with a typical space list for your building type, or do you already have a draft to refine?"
      : "Let's build your program. Tell me about your project — the building type, brief, and approximate scale — and I'll help you develop space lists, adjacencies, and circulation logic.",
    'devils-advocate': hasContext
      ? "I've got your project context. Tell me the specific design decision you want stress-tested and I'll find the weakest points."
      : "Devil's Advocate mode — tell me a design decision you're committed to. I'll argue against it to help you find and close the gaps.",
  }
  return map[mode] ?? map['plan']
}

// ─── Convert our Message[] to Groq conversation history ──────────────────────
function toConversationHistory(messages: Message[]) {
  // Skip the welcome message (first agent message)
  return messages
    .filter((m) => m.id !== 'welcome' && m.status !== 'thinking' && m.status !== 'searching' && m.status !== 'calculating' && m.status !== 'writing')
    .map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    }))
    .filter((m) => m.content.trim() !== '')
}

export function ChatPage() {
  const navigate = useNavigate()
  const { mode: modeParam } = useParams<{ mode: string }>()
  const location = useLocation()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Guard against React StrictMode double-invoking the initial message effect
  const initialMessageSentRef = useRef(false)

  const {
    projectContext,
    planCompleted,
    getMessagesForMode,
    setMessagesForMode,
    updateProjectContext,
    markPlanCompleted,
    resetSession,
  } = useSession()

  const activeMode = MODES.find((m) => m.id === modeParam) ?? MODES[0]
  const mode = activeMode.id as Mode
  const hasPlanContext = planCompleted || Object.keys(projectContext).length > 0

  // Read initial message from location state once during render (before any hooks)
  const pendingMsg = ((location.state as { initialMessage?: string } | null)?.initialMessage ?? '').trim()

  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Initialize messages — include the initial user message immediately so it is
  // always visible regardless of StrictMode double-invoke timing.
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = getMessagesForMode(mode)
    if (saved.length > 0) return saved
    const welcome: Message = {
      id: 'welcome',
      role: 'agent',
      content: getWelcomeMessage(mode, hasPlanContext),
      timestamp: new Date(),
    }
    if (pendingMsg) {
      return [welcome, { id: 'user_initial', role: 'user', content: pendingMsg, timestamp: new Date() }]
    }
    return [welcome]
  })

  // Persist messages to session whenever they change
  useEffect(() => {
    setMessagesForMode(mode, messages)
  }, [messages, mode, setMessagesForMode])

  // Handle initial message passed from HomePage.
  // The user bubble is already in state (initialized above). This effect only
  // adds the thinking placeholder and fires the agent — never calls sendMessage,
  // so there is no risk of a duplicate user bubble.
  useEffect(() => {
    if (!pendingMsg || initialMessageSentRef.current) return
    initialMessageSentRef.current = true
    window.history.replaceState(null, '', location.pathname)

    const thinkingId = `thinking_${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: 'agent', content: '', timestamp: new Date(), status: 'thinking' as const },
    ])
    setIsLoading(true)

    const history = toConversationHistory([
      { id: 'user_initial', role: 'user', content: pendingMsg, timestamp: new Date() },
    ])

    runAgent(pendingMsg, history, mode, projectContext, {
      onStatus: (status: AgentStatus) => {
        setMessages((prev) => prev.map((m) => (m.id === thinkingId ? { ...m, status } : m)))
      },
      onContextUpdate: (updates) => {
        updateProjectContext(updates)
        if (mode === 'plan' && (updates.summary || updates.typology)) markPlanCompleted()
      },
    })
      .then((response) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinkingId
              ? { ...m, content: response, status: 'done' as const, timestamp: new Date() }
              : m
          )
        )
      })
      .catch(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinkingId
              ? {
                  ...m,
                  content: 'Something went wrong. Please check your API key configuration and try again.',
                  status: 'error' as const,
                  timestamp: new Date(),
                }
              : m
          )
        )
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Send message + run agent ───────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      }

      // Placeholder "thinking" message
      const thinkingId = `thinking_${Date.now()}`
      const thinkingMsg: Message = {
        id: thinkingId,
        role: 'agent',
        content: '',
        timestamp: new Date(),
        status: 'thinking',
      }

      setMessages((prev) => [...prev, userMsg, thinkingMsg])
      setIsLoading(true)

      // Build conversation history (without the placeholder)
      const history = toConversationHistory([...messages, userMsg])

      try {
        const response = await runAgent(text.trim(), history, mode, projectContext, {
          onStatus: (status: AgentStatus, _detail?: string) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === thinkingId ? { ...m, status, content: '' } : m
              )
            )
          },
          onContextUpdate: (updates) => {
            updateProjectContext(updates)
            if (mode === 'plan' && (updates.summary || updates.typology)) {
              markPlanCompleted()
            }
          },
        })

        // Replace the thinking placeholder with the real response
        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinkingId
              ? { ...m, content: response, status: 'done', timestamp: new Date() }
              : m
          )
        )
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinkingId
              ? {
                  ...m,
                  content: 'Something went wrong. Please check your API key configuration and try again.',
                  status: 'error',
                  timestamp: new Date(),
                }
              : m
          )
        )
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, messages, mode, projectContext, updateProjectContext, markPlanCompleted]
  )

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text) return
    setInputValue('')
    sendMessage(text)
  }

  const handleModeSwitch = (modeId: Mode) => {
    // Messages are already persisted to session via useEffect
    navigate(`/chat/${modeId}`)
  }

  const handleNewChat = () => {
    resetSession()
    navigate('/')
  }

  // Reload messages when mode changes (navigating between mode pills).
  // Use prevModeRef so this skips on first mount AND on StrictMode double-invoke
  // (both cases have prevMode === mode), and only fires on real mode changes.
  const prevModeRef = useRef(mode)
  useEffect(() => {
    const prevMode = prevModeRef.current
    prevModeRef.current = mode
    if (prevMode === mode) return
    const saved = getMessagesForMode(mode)
    if (saved.length > 0) {
      setMessages(saved)
    } else {
      setMessages([
        {
          id: 'welcome',
          role: 'agent',
          content: getWelcomeMessage(mode, hasPlanContext),
          timestamp: new Date(),
        },
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const inputPlaceholder = isLoading
    ? 'ArchPal is thinking...'
    : `Message ${activeMode.label.replace(' Mode', '').replace(' & Writing', '')}...`

  return (
    <div className="flex flex-col bg-bg-card font-outfit" style={{ minHeight: '100vh', height: '100dvh' }}>
      {/* ─── Desktop Layout (1200px+) ─── */}
      <div className="hidden desktop:flex flex-col h-screen">
        {/* Chat Header */}
        <header
          className="flex items-center justify-between w-full flex-shrink-0 border-b border-border"
          style={{ padding: '14px 48px' }}
        >
          <Logo size="md" onClick={() => navigate('/')} />

          {/* Mode Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {MODES.map((m) => (
              <ModePill
                key={m.id}
                mode={m}
                active={m.id === activeMode.id}
                short
                onClick={() => handleModeSwitch(m.id as Mode)}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Calculators link */}
            <button
              onClick={() => navigate('/calculators')}
              className="flex items-center gap-1.5 rounded-[10px] border border-border font-outfit font-medium text-text-secondary hover:border-border-strong transition-colors"
              style={{ padding: '8px 14px', fontSize: 13 }}
            >
              <Calculator size={15} color="#6B7280" />
              Calculators
            </button>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 rounded-[10px] border border-border font-outfit font-medium text-text-secondary hover:border-border-strong transition-colors"
              style={{ padding: '8px 14px', fontSize: 13 }}
            >
              <Plus size={16} color="#6B7280" />
              New Chat
            </button>
          </div>
        </header>

        {/* Chat Body */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto" style={{ padding: '32px 200px' }}>
            <div className="flex flex-col gap-5">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-center" style={{ padding: '16px 200px 24px' }}>
            <div className="w-full">
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSend}
                placeholder={inputPlaceholder}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tablet Layout (768px–1200px) ─── */}
      <div className="hidden md:flex desktop:hidden flex-col" style={{ height: '100dvh' }}>
        {/* Two-row header */}
        <header className="flex-shrink-0 flex flex-col border-b border-border">
          {/* Row 1: Logo + action buttons */}
          <div className="flex items-center justify-between w-full" style={{ padding: '14px 32px' }}>
            <Logo size="md" onClick={() => navigate('/')} />
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => navigate('/calculators')}
                className="flex items-center gap-1.5 rounded-[10px] border border-border font-outfit font-medium text-text-secondary hover:border-border-strong transition-colors"
                style={{ padding: '8px 14px', fontSize: 13 }}
              >
                <Calculator size={15} color="#6B7280" />
                Calculators
              </button>
              <button
                onClick={handleNewChat}
                className="flex items-center gap-1.5 rounded-[10px] border border-border font-outfit font-medium text-text-secondary hover:border-border-strong transition-colors"
                style={{ padding: '8px 14px', fontSize: 13 }}
              >
                <Plus size={16} color="#6B7280" />
                New Chat
              </button>
            </div>
          </div>
          {/* Row 2: Mode pills */}
          <div
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide"
            style={{ padding: '0 32px 12px' }}
          >
            {MODES.map((m) => (
              <ModePill
                key={m.id}
                mode={m}
                active={m.id === activeMode.id}
                short
                onClick={() => handleModeSwitch(m.id as Mode)}
              />
            ))}
          </div>
        </header>

        {/* Chat Body */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto" style={{ padding: '32px 48px' }}>
            <div className="flex flex-col gap-5">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="flex-shrink-0 flex justify-center" style={{ padding: '16px 48px 24px' }}>
            <div className="w-full">
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSend}
                placeholder={inputPlaceholder}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Layout ─── */}
      <div className="flex flex-col md:hidden" style={{ height: '100dvh' }}>
        {/* Mobile Header */}
        <div className="flex-shrink-0 flex flex-col border-b border-border">
          <div className="flex items-center justify-between w-full" style={{ padding: '12px 16px' }}>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1 text-text-primary"
            >
              <ChevronLeft size={22} color="#1A1A2E" />
              <span className="font-outfit font-semibold" style={{ fontSize: 16 }}>
                ArchPal
              </span>
              <span className="font-outfit font-medium text-accent" style={{ fontSize: 10, opacity: 0.85 }}>
                by Ibrahim Zantout
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/calculators')}
                className="flex items-center justify-center rounded-[10px] border border-border"
                style={{ width: 34, height: 34 }}
              >
                <Calculator size={15} color="#6B7280" />
              </button>
              <button
                onClick={handleNewChat}
                className="flex items-center justify-center rounded-[10px] border border-border"
                style={{ width: 34, height: 34 }}
              >
                <Plus size={16} color="#6B7280" />
              </button>
            </div>
          </div>

          {/* Mode Dropdown */}
          <div style={{ padding: '0 16px 10px' }}>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setModeDropdownOpen((o) => !o)}
                className="flex items-center justify-between w-full rounded-[10px] border font-outfit font-semibold"
                style={{
                  padding: '9px 14px',
                  fontSize: 13,
                  backgroundColor: activeMode.softColor,
                  color: activeMode.color,
                  borderColor: activeMode.color + '40',
                }}
              >
                <div className="flex items-center gap-2">
                  <LucideIcon name={activeMode.icon} size={15} color={activeMode.color} />
                  {activeMode.shortLabel ?? activeMode.label}
                </div>
                <ChevronDown
                  size={15}
                  color={activeMode.color}
                  style={{
                    transform: modeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 150ms ease',
                  }}
                />
              </button>

              {modeDropdownOpen && (
                <div
                  className="absolute left-0 right-0 bg-bg-card border border-border rounded-[12px] overflow-hidden z-50"
                  style={{ top: 'calc(100% + 4px)', boxShadow: '0 8px 32px rgba(26,26,46,0.12)' }}
                >
                  {MODES.map((m, i) => {
                    const isActive = m.id === activeMode.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          handleModeSwitch(m.id as Mode)
                          setModeDropdownOpen(false)
                        }}
                        className="flex items-center gap-2.5 w-full font-outfit font-medium transition-colors"
                        style={{
                          padding: '10px 14px',
                          fontSize: 13,
                          color: isActive ? m.color : '#6B7280',
                          backgroundColor: isActive ? m.softColor : 'transparent',
                          borderBottom: i < MODES.length - 1 ? '1px solid #F3E8EB' : 'none',
                          textAlign: 'left',
                        }}
                      >
                        <LucideIcon name={m.icon} size={15} color={isActive ? m.color : '#9CA3AF'} />
                        {m.shortLabel ?? m.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '20px 16px' }}>
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Mobile Input */}
        <div className="flex-shrink-0" style={{ padding: '12px 16px 24px' }}>
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSend}
            placeholder={inputPlaceholder}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
