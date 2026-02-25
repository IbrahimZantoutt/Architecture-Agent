import { PenTool } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message, MessageStatus } from '../../types'

interface MessageBubbleProps {
  message: Message
}

// Animated dots for thinking/searching states
function StatusIndicator({ status }: { status: MessageStatus }) {
  const labels: Record<MessageStatus, string> = {
    thinking: 'Thinking',
    searching: 'Searching the web',
    calculating: 'Calculating',
    writing: 'Preparing response',
    done: '',
    error: 'Error',
  }
  const label = labels[status]
  if (!label) return null

  return (
    <span className="flex items-center gap-1.5 text-text-muted font-outfit" style={{ fontSize: 13 }}>
      {label}
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block rounded-full bg-text-muted"
            style={{
              width: 4,
              height: 4,
              animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              opacity: 0.6,
            }}
          />
        ))}
      </span>
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </span>
  )
}

// Prose styles for markdown content inside agent bubbles
const proseStyles: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.65,
  color: '#1A1A2E',
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isThinking =
    message.status &&
    message.status !== 'done' &&
    message.status !== 'error' &&
    !message.content

  if (message.role === 'user') {
    return (
      <div className="flex justify-end w-full anim-msg-user">
        <div
          className="font-outfit bg-accent text-white leading-relaxed"
          style={{
            padding: '12px 18px',
            borderRadius: '16px 16px 4px 16px',
            fontSize: 14,
            lineHeight: 1.5,
            maxWidth: 400,
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 w-full anim-msg-agent">
      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-full bg-accent flex-shrink-0"
        style={{ width: 28, height: 28 }}
      >
        <PenTool size={14} color="#FFFFFF" />
      </div>

      {/* Bubble */}
      <div
        className="font-outfit bg-bg-soft text-text-primary"
        style={{
          padding: '14px 18px',
          borderRadius: '16px 16px 16px 4px',
          fontSize: 14,
          maxWidth: 600,
          minWidth: 120,
        }}
      >
        {isThinking ? (
          <StatusIndicator status={message.status!} />
        ) : message.status && message.status !== 'done' && message.content ? (
          <>
            <StatusIndicator status={message.status} />
          </>
        ) : (
          <div style={proseStyles} className="arch-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Headings
                h1: ({ children }) => (
                  <h1 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, marginTop: 4, color: '#1A1A2E' }}>{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, marginTop: 12, color: '#1A1A2E' }}>{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, marginTop: 10, color: '#1A1A2E' }}>{children}</h3>
                ),
                // Paragraphs
                p: ({ children }) => (
                  <p style={{ marginBottom: 8, marginTop: 0, lineHeight: 1.65 }}>{children}</p>
                ),
                // Lists
                ul: ({ children }) => (
                  <ul style={{ paddingLeft: 20, marginBottom: 8, marginTop: 4 }}>{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol style={{ paddingLeft: 20, marginBottom: 8, marginTop: 4 }}>{children}</ol>
                ),
                li: ({ children }) => (
                  <li style={{ marginBottom: 4, lineHeight: 1.55 }}>{children}</li>
                ),
                // Bold / italic
                strong: ({ children }) => (
                  <strong style={{ fontWeight: 700, color: '#1A1A2E' }}>{children}</strong>
                ),
                em: ({ children }) => (
                  <em style={{ fontStyle: 'italic', color: '#6B7280' }}>{children}</em>
                ),
                // Horizontal rule
                hr: () => (
                  <hr style={{ border: 'none', borderTop: '1px solid #F3E8EB', margin: '12px 0' }} />
                ),
                // Code (inline and block)
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-')
                  if (isBlock) {
                    return (
                      <pre style={{
                        background: '#FFF5F7',
                        border: '1px solid #F3E8EB',
                        borderRadius: 8,
                        padding: '10px 14px',
                        overflowX: 'auto',
                        fontSize: 12.5,
                        marginBottom: 8,
                      }}>
                        <code>{children}</code>
                      </pre>
                    )
                  }
                  return (
                    <code style={{
                      background: '#FFE4EC',
                      color: '#E8607A',
                      borderRadius: 4,
                      padding: '1px 5px',
                      fontSize: 12.5,
                      fontFamily: 'monospace',
                    }}>{children}</code>
                  )
                },
                // Tables
                table: ({ children }) => (
                  <div style={{ overflowX: 'auto', marginBottom: 8 }}>
                    <table style={{
                      borderCollapse: 'collapse',
                      width: '100%',
                      fontSize: 13,
                    }}>{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th style={{
                    padding: '6px 10px',
                    background: '#FFE4EC',
                    color: '#1A1A2E',
                    fontWeight: 600,
                    textAlign: 'left',
                    border: '1px solid #F3E8EB',
                    whiteSpace: 'nowrap',
                  }}>{children}</th>
                ),
                td: ({ children }) => (
                  <td style={{
                    padding: '5px 10px',
                    border: '1px solid #F3E8EB',
                    verticalAlign: 'top',
                  }}>{children}</td>
                ),
                tr: ({ children }) => <tr>{children}</tr>,
                // Blockquote
                blockquote: ({ children }) => (
                  <blockquote style={{
                    borderLeft: '3px solid #E8607A',
                    paddingLeft: 12,
                    margin: '8px 0',
                    color: '#6B7280',
                    fontStyle: 'italic',
                  }}>{children}</blockquote>
                ),
                // Links
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#E8607A', textDecoration: 'underline' }}
                  >{children}</a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
