import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Plus, ChevronLeft } from 'lucide-react'
import { Logo } from '../components/ui/Logo'
import { ChatInput } from '../components/ui/ChatInput'
import { ModePill } from '../components/ui/ModePill'
import { MessageBubble } from '../components/ui/MessageBubble'
import { MODES } from '../lib/modes'
import type { Message, Mode } from '../types'


function getWelcomeMessage(mode: Mode): string {
  const map: Record<Mode, string> = {
    plan: "Welcome! I'm here to help you think through your architecture project. Let's start by understanding what you're working on. What's the project typology — is it residential, public, cultural, educational, or something else?",
    help: "Hello! Bring me your design challenge and I'll help you think through structured approaches. What specific problem are you working on?",
    critic: "I'm in Critic Mode — I'll give you rigorous, jury-level feedback on your design. Describe your project or share what you'd like evaluated.",
    research: "Let's explore. What topic, typology, or precedent would you like to research? I can help with materials, theory, case studies, and more.",
    writing: "Ready to help you write. Share your rough ideas or draft concept statement and I'll help you develop it into polished architectural language.",
    program: "Let's build your program. Tell me about your project — I'll help you develop space lists, adjacencies, and circulation logic.",
    'devils-advocate': "Devil's Advocate mode — I'll challenge your assumptions and stress-test your decisions. What design choice do you want to put on trial?",
  }
  return map[mode] ?? map['plan']
}

export function ChatPage() {
  const navigate = useNavigate()
  const { mode: modeParam } = useParams<{ mode: string }>()
  const location = useLocation()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeMode = MODES.find((m) => m.id === modeParam) ?? MODES[0]
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>(() => {
    // Start with welcome message
    return [
      {
        id: 'welcome',
        role: 'agent',
        content: getWelcomeMessage(activeMode.id as Mode),
        timestamp: new Date(),
      },
    ]
  })

  // If navigated with an initial message (from home input), add it
  useEffect(() => {
    const state = location.state as { initialMessage?: string } | null
    if (state?.initialMessage) {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: state.initialMessage,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      // Clear state so it doesn't repeat on re-render
      window.history.replaceState({}, '')
    }
  }, [])

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text) return
    setInputValue('')
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    // Agent response placeholder — will be replaced by real agent in Phase 5
    setTimeout(() => {
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: "I'm ArchPal — I'll connect to the AI agent soon. For now, you're seeing the UI prototype.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, agentMsg])
    }, 600)
  }

  const handleModeSwitch = (modeId: Mode) => {
    navigate(`/chat/${modeId}`)
  }

  const handleNewChat = () => {
    navigate('/')
  }

  return (
    <div className="flex flex-col bg-bg-card font-outfit" style={{ minHeight: '100vh', height: '100dvh' }}>
      {/* ─── Desktop Layout ─── */}
      <div className="hidden md:flex flex-col h-screen">
        {/* Chat Header */}
        <header
          className="flex items-center justify-between w-full flex-shrink-0 border-b border-border"
          style={{ padding: '14px 48px' }}
        >
          {/* Logo */}
          <Logo size="md" />

          {/* Mode Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {MODES.map((mode) => (
              <ModePill
                key={mode.id}
                mode={mode}
                active={mode.id === activeMode.id}
                short
                onClick={() => handleModeSwitch(mode.id as Mode)}
              />
            ))}
          </div>

          {/* New Chat */}
          <div className="flex items-center gap-3 flex-shrink-0">
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
          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ padding: '32px 200px' }}
          >
            <div className="flex flex-col gap-5">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div
            className="flex-shrink-0 flex justify-center"
            style={{ padding: '16px 200px 24px' }}
          >
            <div className="w-full">
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSend}
                placeholder={`Tell me about your ${activeMode.label.toLowerCase().replace(' mode', '')}...`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Layout ─── */}
      <div className="flex flex-col md:hidden" style={{ height: '100dvh' }}>
        {/* Mobile Header */}
        <div
          className="flex-shrink-0 flex flex-col border-b border-border"
        >
          {/* Top row */}
          <div
            className="flex items-center justify-between w-full"
            style={{ padding: '12px 16px' }}
          >
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1 text-text-primary"
            >
              <ChevronLeft size={22} color="#1A1A2E" />
              <span className="font-outfit font-semibold" style={{ fontSize: 16 }}>
                ArchPal
              </span>
              <span
                className="font-outfit font-medium text-accent"
                style={{ fontSize: 10, opacity: 0.85 }}
              >
                by Ibrahim Zantout
              </span>
            </button>

            <button
              onClick={handleNewChat}
              className="flex items-center justify-center rounded-[10px] border border-border"
              style={{ width: 34, height: 34 }}
            >
              <Plus size={16} color="#6B7280" />
            </button>
          </div>

          {/* Mode Pills row */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide"
            style={{ padding: '6px 16px 10px' }}
          >
            {MODES.map((mode) => (
              <ModePill
                key={mode.id}
                mode={mode}
                active={mode.id === activeMode.id}
                short
                onClick={() => handleModeSwitch(mode.id as Mode)}
              />
            ))}
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: '20px 16px' }}
        >
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Mobile Input */}
        <div
          className="flex-shrink-0"
          style={{ padding: '12px 16px 24px' }}
        >
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSend}
            placeholder="Type your reply..."
          />
        </div>
      </div>
    </div>
  )
}
