import { useRef } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  placeholder?: string
}

export function ChatInput({ value, onChange, onSubmit, placeholder }: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div
      className="flex items-center gap-3 bg-bg-card rounded-2xl border border-border-strong"
      style={{ padding: '8px 8px 8px 20px' }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Describe your project or ask a question...'}
        className="flex-1 font-outfit bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
        style={{ fontSize: 15 }}
      />
      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        className="flex items-center justify-center rounded-xl bg-accent hover:bg-accent-hover transition-colors duration-150 disabled:opacity-40 flex-shrink-0"
        style={{ width: 40, height: 40 }}
      >
        <Send size={16} color="#FFFFFF" />
      </button>
    </div>
  )
}
