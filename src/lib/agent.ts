// ArchPal Agent Loop — Cerebras (gpt-oss-120b) via OpenAI-compatible fetch
// Runs client-side. API key stored in .env (VITE_CEREBRAS_API_KEY).

import { getSystemPrompt } from './prompts'
import { TOOL_DEFINITIONS, executeTool, type ToolCallResult } from './tools'
import type { Mode, ProjectContext, MessageStatus } from '../types'

// ─── Config ──────────────────────────────────────────────────────────────────
const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY as string
const CEREBRAS_MODEL   = 'gpt-oss-120b'
const MAX_STEPS        = 6

// ─── Types (OpenAI-compatible shape) ─────────────────────────────────────────
interface ApiToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

type ApiMessage =
  | { role: 'system';    content: string }
  | { role: 'user';      content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ApiToolCall[] }
  | { role: 'tool';      tool_call_id: string; content: string }

interface ChatCompletion {
  choices: Array<{
    message: {
      content: string | null
      tool_calls?: ApiToolCall[]
    }
  }>
}

// ─── Cerebras fetch call ──────────────────────────────────────────────────────
async function callCerebras(messages: ApiMessage[], withTools: boolean): Promise<ChatCompletion> {
  const body: Record<string, unknown> = {
    model: CEREBRAS_MODEL,
    messages,
    temperature: 0.7,
    max_completion_tokens: 4096,
  }
  if (withTools) {
    body.tools = TOOL_DEFINITIONS
    body.tool_choice = 'auto'
  }

  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CEREBRAS_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cerebras ${res.status}: ${text}`)
  }

  return res.json() as Promise<ChatCompletion>
}

// ─── Public types ─────────────────────────────────────────────────────────────
export type AgentStatus = MessageStatus

export interface AgentCallbacks {
  onStatus: (status: AgentStatus, detail?: string) => void
  onContextUpdate: (updates: Partial<ProjectContext>) => void
  onToken?: (token: string) => void
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── Main agent loop ──────────────────────────────────────────────────────────
export async function runAgent(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  mode: Mode,
  projectContext: ProjectContext,
  callbacks: AgentCallbacks
): Promise<string> {
  callbacks.onStatus('thinking')

  const messages: ApiMessage[] = [
    { role: 'system', content: getSystemPrompt(mode, projectContext) },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ]

  let step = 0

  while (step < MAX_STEPS) {
    step++

    let response: ChatCompletion
    try {
      response = await callCerebras(messages, true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[agent] Cerebras error:', msg)
      callbacks.onStatus('error')
      if (msg.includes('401') || !CEREBRAS_API_KEY) {
        return 'API key error: please check your VITE_CEREBRAS_API_KEY in the .env file.'
      }
      return 'I encountered an error connecting to the AI. Please try again.'
    }

    const assistantMsg = response.choices[0].message

    // No tool calls → final response
    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      callbacks.onStatus('done')
      return assistantMsg.content ?? 'No response generated.'
    }

    // Tool calls → execute then loop
    messages.push({
      role: 'assistant',
      content: assistantMsg.content ?? null,
      tool_calls: assistantMsg.tool_calls,
    })

    for (const tc of assistantMsg.tool_calls) {
      const toolName = tc.function.name

      if (toolName === 'web_search') {
        callbacks.onStatus('searching', 'Searching the web...')
      } else if (toolName === 'architecture_calculate') {
        callbacks.onStatus('calculating', 'Running calculation...')
      } else {
        callbacks.onStatus('thinking')
      }

      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(tc.function.arguments)
      } catch {
        console.warn('[agent] Failed to parse tool args:', tc.function.arguments)
      }

      let result: ToolCallResult
      try {
        result = await executeTool(toolName, args, projectContext)
      } catch (err) {
        result = { output: `Tool ${toolName} failed: ${err instanceof Error ? err.message : String(err)}` }
      }

      if (result.contextUpdates) {
        callbacks.onContextUpdate(result.contextUpdates)
      }

      messages.push({ role: 'tool', tool_call_id: tc.id, content: result.output })
    }

    callbacks.onStatus('thinking')
  }

  // Hit max steps — final synthesis without tools
  callbacks.onStatus('writing', 'Preparing response...')
  try {
    const final = await callCerebras(
      [...messages, { role: 'user', content: 'Please provide your final response based on the research and calculations above.' }],
      false
    )
    callbacks.onStatus('done')
    return final.choices[0].message.content ?? 'No response generated.'
  } catch {
    callbacks.onStatus('error')
    return 'I had trouble generating a final response. Please try again.'
  }
}
