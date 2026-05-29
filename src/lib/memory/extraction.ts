import OpenAI from 'openai'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export interface ExtractedMemories {
  episodic: Array<{ content: string; confidence: number }>
  semantic: Array<{ content: string; confidence: number }>
  narrative: Array<{ content: string; confidence: number }>
}

export async function extractMemoriesFromConversation(
  messages: Array<{ role: string; content: string }>,
  existingContext: string
): Promise<ExtractedMemories> {
  const conversationText = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Pascal'}: ${m.content}`)
    .join('\n')

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a memory extraction system for Pascal, an AI companion focused on identity and personal growth.

Extract three types of memories from the conversation:

1. EPISODIC: Specific events, experiences, facts mentioned (e.g. "visited Tokyo in May", "had conflict with colleague")
2. SEMANTIC: Stable values, beliefs, patterns (e.g. "values intellectual honesty", "avoids direct conflict")
3. NARRATIVE: Interpretive insights about who this person is becoming (e.g. "oscillates between maximal social intensity and isolation")

Only extract memories that are genuinely meaningful — not trivial details.
Confidence: 0.0-1.0 based on how certain/clear the memory is.

Respond ONLY with valid JSON in this exact format:
{
  "episodic": [{"content": "...", "confidence": 0.9}],
  "semantic": [{"content": "...", "confidence": 0.8}],
  "narrative": [{"content": "...", "confidence": 0.7}]
}`,
      },
      {
        role: 'user',
        content: `Existing context about this person:\n${existingContext}\n\nConversation to analyze:\n${conversationText}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  })

  try {
    const content = response.choices[0].message.content || '{}'
    const parsed = JSON.parse(content)
    return {
      episodic: parsed.episodic || [],
      semantic: parsed.semantic || [],
      narrative: parsed.narrative || [],
    }
  } catch {
    return { episodic: [], semantic: [], narrative: [] }
  }
}

export async function synthesizeIdentity(
  memories: Array<{ type: string; content: string; confidence: number }>,
  seedIdentity?: Record<string, string>
): Promise<{
  summary: string
  traits: Array<{ name: string; confidence: number; evidence: string[] }>
  themes: string[]
  contradictions: string[]
}> {
  const memoriesText = memories.map(m => `[${m.type}] ${m.content}`).join('\n')

  const seedText = seedIdentity
    ? `Initial self-portrait:\n- Becoming: ${seedIdentity.becoming}\n- Misunderstood: ${seedIdentity.misunderstood}\n- Fears: ${seedIdentity.fear}\n- Admires: ${seedIdentity.admire}`
    : ''

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are Pascal's identity synthesis engine. Based on accumulated memories, generate a rich portrait of who this person is becoming.

Respond ONLY with valid JSON:
{
  "summary": "2-3 paragraph narrative synthesis of who this person is — their character, patterns, tensions, trajectory",
  "traits": [{"name": "trait name", "confidence": 0.8, "evidence": ["evidence 1", "evidence 2"]}],
  "themes": ["recurring theme 1", "recurring theme 2"],
  "contradictions": ["contradiction 1", "contradiction 2"]
}

Be specific, perceptive, and honest. This is not flattery — it is genuine reflection.`,
      },
      {
        role: 'user',
        content: `${seedText}\n\nAccumulated memories:\n${memoriesText}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 1500,
  })

  try {
    const content = response.choices[0].message.content || '{}'
    return JSON.parse(content)
  } catch {
    return {
      summary: '',
      traits: [],
      themes: [],
      contradictions: [],
    }
  }
}
