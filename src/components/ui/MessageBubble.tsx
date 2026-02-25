import { PenTool } from 'lucide-react'
import type { Message } from '../../types'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end w-full">
        <div
          className="font-outfit bg-accent text-text-on-accent leading-relaxed"
          style={{
            padding: '12px 18px',
            borderRadius: '16px 16px 4px 16px',
            fontSize: 14,
            lineHeight: 1.5,
            maxWidth: 400,
          }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 w-full">
      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-full bg-accent flex-shrink-0"
        style={{ width: 28, height: 28 }}
      >
        <PenTool size={14} color="#FFFFFF" />
      </div>

      {/* Bubble */}
      <div
        className="font-outfit bg-bg-soft text-text-primary leading-relaxed"
        style={{
          padding: '14px 18px',
          borderRadius: '16px 16px 16px 4px',
          fontSize: 14,
          lineHeight: 1.5,
          maxWidth: 480,
        }}
      >
        {message.content}
      </div>
    </div>
  )
}
