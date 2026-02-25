import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Menu, Calculator } from 'lucide-react'
import { Logo } from '../components/ui/Logo'
import { ChatInput } from '../components/ui/ChatInput'
import { ModeCard } from '../components/ui/ModeCard'
import { MODES } from '../lib/modes'
import type { Mode } from '../types'

// Infer the best mode from a free-form message. Falls back to 'plan' for
// anything generic or ambiguous.
function detectMode(message: string): Mode {
  const t = message.toLowerCase()

  // Devil's Advocate — stress-testing, arguing against decisions
  if (/\b(devil|stress.?test|argue|argue against|flaw|weakness|weaknesses|counter|play devil)\b/.test(t))
    return 'devils-advocate'

  // Critic — asking for feedback, review, or jury-style critique
  if (/\b(review|critique|critiqu|feedback|what do you think|thoughts on|evaluate|assess|jury|opinion on|rate my|judge)\b/.test(t))
    return 'critic'

  // Research — exploring topics, precedents, materials, theory
  if (/\b(research|tell me about|what is|what are|history of|precedent|case stud|material|typolog|how does|examples of|learn about|explain what|who designed|famous)\b/.test(t))
    return 'research'

  // Writing — concept statements, descriptions, text polish
  if (/\b(write|writing|statement|narrative|describe|put into words|concept note|design statement|help me write|rewrite|paraphrase|articulate)\b/.test(t))
    return 'writing'

  // Program — space lists, areas, adjacencies, brief numbers
  if (/\b(program|space list|adjacen|circulation|square meter|sqm|sq ft|sqft|floor area|room list|how many rooms|how many spaces|space requirements|brief|accommodate)\b/.test(t))
    return 'program'

  // Help — specific design problem needing a solution approach
  if (/\b(how do i|how to|help me|stuck|problem with|struggling|can't figure|what should i|advice on|suggest|approach to|deal with|fix)\b/.test(t))
    return 'help'

  // Default: plan
  return 'plan'
}

export function HomePage() {
  const navigate = useNavigate()
  const [inputValue, setInputValue] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSubmit = () => {
    if (!inputValue.trim()) return
    const mode = detectMode(inputValue)
    navigate(`/chat/${mode}`, { state: { initialMessage: inputValue } })
  }

  const handleModeSelect = (modeId: Mode) => {
    navigate(`/chat/${modeId}`)
  }

  return (
    <div className="min-h-screen bg-bg-soft font-outfit flex flex-col">
      {/* ─── Desktop Layout ─── */}
      <div className="hidden md:flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between w-full anim-fade-in" style={{ padding: '16px 48px' }}>
          <Logo size="lg" />
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/calculators')}
              className="flex items-center gap-1.5 bg-bg-card rounded-[10px] border border-border font-outfit font-medium text-text-secondary hover:border-border-strong transition-colors"
              style={{ padding: '8px 14px', fontSize: 13 }}
            >
              <Calculator size={16} color="#6B7280" />
              Calculators
            </button>
            <button
              className="flex items-center gap-1.5 bg-bg-card rounded-[10px] border border-border font-outfit font-medium text-text-secondary hover:border-border-strong transition-colors"
              style={{ padding: '8px 14px', fontSize: 13 }}
            >
              <Clock size={16} color="#6B7280" />
              History
            </button>
          </div>
        </header>

        {/* Hero */}
        <section
          className="flex flex-col items-center text-center w-full anim-fade-up"
          style={{ padding: '40px 48px 24px', animationDelay: '60ms' }}
        >
          <h1
            className="font-outfit font-bold text-text-primary"
            style={{ fontSize: 36, marginBottom: 12 }}
          >
            What are you working on today?
          </h1>
          <p
            className="font-outfit text-text-secondary"
            style={{ fontSize: 16 }}
          >
            Choose a mode to get started, or just describe your project below.
          </p>
        </section>

        {/* Input */}
        <div
          className="flex justify-center w-full anim-fade-up"
          style={{ padding: '0 48px 24px', animationDelay: '150ms' }}
        >
          <div style={{ width: 680 }}>
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSubmit}
            />
          </div>
        </div>

        {/* Mode Cards */}
        <section
          className="flex flex-col items-center w-full"
          style={{ padding: '0 48px 32px', gap: 20 }}
        >
          <span
            className="font-outfit font-semibold text-text-muted uppercase tracking-widest anim-fade-up"
            style={{ fontSize: 13, letterSpacing: 1, animationDelay: '230ms' }}
          >
            or pick a mode
          </span>

          {/* Row 1 — 4 cards */}
          <div
            className="grid w-full"
            style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, maxWidth: 1200 }}
          >
            {MODES.slice(0, 4).map((mode, i) => (
              <div key={mode.id} className="anim-fade-up" style={{ animationDelay: `${290 + i * 55}ms` }}>
                <ModeCard mode={mode} onClick={() => handleModeSelect(mode.id)} />
              </div>
            ))}
          </div>

          {/* Row 2 — 3 cards centered */}
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 900, width: '100%' }}
          >
            {MODES.slice(4).map((mode, i) => (
              <div key={mode.id} className="anim-fade-up" style={{ animationDelay: `${510 + i * 55}ms` }}>
                <ModeCard mode={mode} onClick={() => handleModeSelect(mode.id)} />
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer
          className="flex items-center justify-center mt-auto"
          style={{ padding: '20px 48px' }}
        >
          <span className="font-outfit text-text-muted" style={{ fontSize: 12 }}>
            ArchPal — Your AI thinking partner for architecture studio
          </span>
        </footer>
      </div>

      {/* ─── Mobile Layout ─── */}
      <div className="flex flex-col min-h-screen md:hidden">
        {/* Mobile Header */}
        <header
          className="flex items-center justify-between w-full anim-fade-in"
          style={{ padding: '14px 20px' }}
        >
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/calculators')}
              className="flex items-center gap-1.5 bg-bg-card rounded-[10px] border border-border font-outfit font-medium text-text-secondary hover:border-border-strong transition-colors"
              style={{ padding: '8px 14px', fontSize: 13 }}
            >
              <Calculator size={16} color="#6B7280" />
              Calculators
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center bg-bg-card rounded-[10px] border border-border"
              style={{ width: 36, height: 36 }}
            >
              <Menu size={18} color="#6B7280" />
            </button>
          </div>
        </header>

        {/* Mobile Hero */}
        <section
          className="flex flex-col items-center text-center w-full anim-fade-up"
          style={{ padding: '28px 20px 16px', animationDelay: '60ms' }}
        >
          <h1
            className="font-outfit font-bold text-text-primary"
            style={{ fontSize: 28, lineHeight: 1.2, marginBottom: 8 }}
          >
            What are you{'\n'}working on?
          </h1>
          <p className="font-outfit text-text-secondary" style={{ fontSize: 14 }}>
            Choose a mode or describe your project
          </p>
        </section>

        {/* Mobile Input */}
        <div className="w-full anim-fade-up" style={{ padding: '0 20px 16px', animationDelay: '140ms' }}>
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Mobile Cards */}
        <section className="flex flex-col w-full" style={{ padding: '0 20px', gap: 12 }}>
          <span
            className="font-outfit font-semibold text-text-muted uppercase tracking-widest text-center anim-fade-up"
            style={{ fontSize: 12, letterSpacing: 1, animationDelay: '200ms' }}
          >
            or pick a mode
          </span>

          {/* 2-column grid rows */}
          <div className="grid grid-cols-2" style={{ gap: 12 }}>
            {MODES.map((mode, i) => (
              <div key={mode.id} className="anim-fade-up" style={{ animationDelay: `${250 + i * 45}ms` }}>
                <ModeCard
                  mode={mode}
                  compact
                  onClick={() => handleModeSelect(mode.id)}
                />
              </div>
            ))}
          </div>

          {/* Bottom spacer */}
          <div style={{ height: 24 }} />
        </section>
      </div>
    </div>
  )
}
