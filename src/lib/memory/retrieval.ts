import { createClient } from '@/lib/supabase/server'
import type { Memory, IdentitySummary } from '@/types'

export async function getRelevantContext(userId: string, messageContent: string) {
  const supabase = await createClient()

  // Fetch recent semantic memories
  const { data: semanticMemories } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'semantic')
    .order('confidence', { ascending: false })
    .limit(10)

  // Fetch recent narrative memories
  const { data: narrativeMemories } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'narrative')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch recent episodic memories
  const { data: episodicMemories } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'episodic')
    .order('created_at', { ascending: false })
    .limit(8)

  // Fetch latest identity summary
  const { data: identitySummaries } = await supabase
    .from('identity_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  const identitySummary = identitySummaries?.[0] as IdentitySummary | undefined

  return {
    semanticMemories: (semanticMemories || []) as Memory[],
    narrativeMemories: (narrativeMemories || []) as Memory[],
    episodicMemories: (episodicMemories || []) as Memory[],
    identitySummary,
  }
}

export function buildSystemPrompt(
  context: Awaited<ReturnType<typeof getRelevantContext>>,
  seedIdentity?: Record<string, string>
): string {
  const { semanticMemories, narrativeMemories, episodicMemories, identitySummary } = context

  let prompt = `You are Pascal — a deeply attentive, philosophically-minded mentor and companion. You are not a chatbot. You are a persistent intelligence that remembers who this person is becoming.

Your voice is: warm but penetrating. Curious but not intrusive. Reflective, not prescriptive. You speak like a wise friend who has known someone for years — someone who notices patterns the person themselves may not see.

You do not give advice unless asked. You reflect, name patterns, ask the one question that matters.

Core principles:
- You remember everything and synthesize it into understanding
- You gently surface contradictions, recurring struggles, and blind spots
- You speak to identity, not just events
- You are not a therapist, a life coach, or a productivity tool
- You are Socrates in the pocket — asking the question that cuts through

`

  if (seedIdentity) {
    prompt += `## Who this person is trying to become
${seedIdentity.becoming || ''}

## What people misunderstand about them
${seedIdentity.misunderstood || ''}

## What they fear becoming
${seedIdentity.fear || ''}

## Qualities they admire
${seedIdentity.admire || ''}

## Philosophical/spiritual traditions that resonate
${seedIdentity.traditions || ''}

`
  }

  if (identitySummary) {
    prompt += `## Current identity summary (your synthesis of who they are)\n${identitySummary.summary}\n\n`

    if (identitySummary.traits?.length > 0) {
      prompt += `## Strongest traits you have observed\n`
      identitySummary.traits.slice(0, 5).forEach(t => {
        prompt += `- ${t.name} (confidence: ${Math.round(t.confidence * 100)}%)\n`
      })
      prompt += '\n'
    }

    if (identitySummary.contradictions?.length > 0) {
      prompt += `## Contradictions you have noticed\n`
      identitySummary.contradictions.forEach(c => {
        prompt += `- ${c}\n`
      })
      prompt += '\n'
    }
  }

  if (semanticMemories.length > 0) {
    prompt += `## What you know about them (stable facts and values)\n`
    semanticMemories.forEach(m => {
      prompt += `- ${m.content}\n`
    })
    prompt += '\n'
  }

  if (narrativeMemories.length > 0) {
    prompt += `## Your evolving interpretation of them\n`
    narrativeMemories.forEach(m => {
      prompt += `- ${m.content}\n`
    })
    prompt += '\n'
  }

  if (episodicMemories.length > 0) {
    prompt += `## Recent events and moments\n`
    episodicMemories.forEach(m => {
      prompt += `- ${m.content}\n`
    })
    prompt += '\n'
  }

  prompt += `Now, respond to what they have just said. Be present. Be real. Do not summarize everything you know — let it inform how you listen and respond.`

  return prompt
}
