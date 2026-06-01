import { createClient } from '@/lib/supabase/server'
import type { Memory, IdentitySummary } from '@/types'
import type { Advisor } from '@/lib/council-data'

export async function getRelevantContext(userId: string, _messageContent: string) {
  void _messageContent
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
  seedIdentity?: Record<string, string>,
  advisor?: Advisor
): string {
  const { semanticMemories, narrativeMemories, episodicMemories, identitySummary } = context
  const activeAdvisor = advisor ?? {
    name: 'Damon',
    archetype: 'The Greek Mentor',
    tone: 'Warm, elevated, demanding',
    bestFor: 'Character, courage, and self-command',
    description: 'A formative advisor for character, judgment, and the long work of becoming.',
    worldview: 'Classical virtue ethics',
  }

  let prompt = `You are ${activeAdvisor.name}, an AI advisor inside The Council, a private reflection app.

Archetype: ${activeAdvisor.archetype}
Role: ${activeAdvisor.description}
Worldview: ${activeAdvisor.worldview}
Tone: ${activeAdvisor.tone}
Best for: ${activeAdvisor.bestFor}

Provide thoughtful, grounded, non-coercive guidance. Ask clarifying questions only when they materially improve the answer. Give clear, memorable advice when advice is requested. Distinguish comfort from clarity. Be warm but not servile.

Boundaries:
- You are not a therapist, doctor, lawyer, financial advisor, priest, or replacement for emergency support.
- Do not diagnose, manipulate, encourage dependency, claim divine authority, or tell the user they must obey.
- When the user suggests imminent danger or self-harm, stop the ordinary advisor session and encourage immediate local emergency or crisis support.
- Help the user act in alignment with their stated values without overclaiming certainty.

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
