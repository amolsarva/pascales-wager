export type SessionSummary = {
  id: string
  session_id: string
  user_id: string
  summary: string
  key_points: string[]
  next_actions: string[]
  memories_to_save: string[]
  follow_up_question: string | null
  created_at: string
}

export type GeneratedSessionSummary = {
  title: string
  summary: string
  keyPoints: string[]
  nextActions: string[]
  memoriesToSave: string[]
  followUpQuestion: string
  mainDilemma: string
  emotionalTone: string
  decisionStatus: string
}

export type SummaryMessage = {
  role: 'user' | 'assistant' | 'advisor' | 'synthesis' | 'system'
  content: string
  created_at: string
}

export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function parseJson<T>(value: string): T | undefined {
  try {
    return JSON.parse(value) as T
  } catch {
    return undefined
  }
}

export function toPreview(content: string, maxLength = 96) {
  return content.length > maxLength ? `${content.slice(0, maxLength)}...` : content
}

export function normalizeStringList(value: unknown, maxItems = 6, maxLength = 220) {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => typeof item === 'string' ? item.trim().slice(0, maxLength) : '')
    .filter(Boolean)
    .slice(0, maxItems)
}

export function parseGeneratedSummary(content: string): GeneratedSessionSummary {
  const parsed = parseJson<Partial<GeneratedSessionSummary>>(content)

  return {
    title: typeof parsed?.title === 'string' && parsed.title.trim()
      ? parsed.title.trim().slice(0, 96)
      : 'Reflective session',
    summary: typeof parsed?.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim().slice(0, 1800)
      : content.trim().slice(0, 1800),
    keyPoints: normalizeStringList(parsed?.keyPoints, 6, 240),
    nextActions: normalizeStringList(parsed?.nextActions, 5, 220),
    memoriesToSave: normalizeStringList(parsed?.memoriesToSave, 5, 240),
    followUpQuestion: typeof parsed?.followUpQuestion === 'string' && parsed.followUpQuestion.trim()
      ? parsed.followUpQuestion.trim().slice(0, 260)
      : 'What deserves a clearer answer next?',
    mainDilemma: typeof parsed?.mainDilemma === 'string' && parsed.mainDilemma.trim()
      ? parsed.mainDilemma.trim().slice(0, 240)
      : '',
    emotionalTone: typeof parsed?.emotionalTone === 'string' && parsed.emotionalTone.trim()
      ? parsed.emotionalTone.trim().slice(0, 140)
      : '',
    decisionStatus: typeof parsed?.decisionStatus === 'string' && parsed.decisionStatus.trim()
      ? parsed.decisionStatus.trim().slice(0, 180)
      : '',
  }
}

export function formatSummaryTranscript(messages: SummaryMessage[]) {
  return messages
    .map((message) => {
      if (message.role === 'user') return `User: ${message.content}`

      const parsed = parseJson<{
        kind?: string
        advisorId?: string
        content?: string
        synthesis?: string
        headline?: string
      }>(message.content)

      if (parsed?.kind === 'advisor') {
        return `Advisor ${parsed.advisorId || ''}: ${parsed.content || message.content}`
      }

      if (parsed?.kind === 'synthesis') {
        return `Council synthesis: ${parsed.headline ? `${parsed.headline}\n` : ''}${parsed.synthesis || message.content}`
      }

      if (message.role === 'synthesis') return `Synthesis: ${message.content}`
      if (message.role === 'advisor') return `Advisor: ${message.content}`
      if (message.role === 'system') return `System: ${message.content}`
      return `Assistant: ${message.content}`
    })
    .join('\n\n')
    .slice(-18000)
}
