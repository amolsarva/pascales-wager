import { createClient } from '@/lib/supabase/server'
import { MENTORS, type MentorId } from '@/lib/mentors/personas'
import type { Memory, IdentitySummary, HomeworkItem } from '@/types'

export async function getRelevantContext(userId: string) {
  const supabase = await createClient()

  const [
    { data: semanticMemories },
    { data: narrativeMemories },
    { data: episodicMemories },
    { data: identitySummaries },
    { data: pendingHomework },
  ] = await Promise.all([
    supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'semantic')
      .order('confidence', { ascending: false })
      .limit(10),
    supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'narrative')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'episodic')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('identity_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('homework')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return {
    semanticMemories: (semanticMemories || []) as Memory[],
    narrativeMemories: (narrativeMemories || []) as Memory[],
    episodicMemories: (episodicMemories || []) as Memory[],
    identitySummary: identitySummaries?.[0] as IdentitySummary | undefined,
    pendingHomework: (pendingHomework || []) as HomeworkItem[],
  }
}

export function buildSystemPrompt(
  context: Awaited<ReturnType<typeof getRelevantContext>>,
  mentorId: MentorId = 'pascale',
  seedIdentity?: Record<string, string>
): string {
  const { semanticMemories, narrativeMemories, episodicMemories, identitySummary, pendingHomework } = context
  const mentor = MENTORS[mentorId]

  let prompt = mentor.systemPromptCore + '\n\n'
  prompt += mentor.coachingInstructions + '\n\n'

  if (seedIdentity) {
    prompt += `## Initial self-portrait (what this person shared when they first arrived)
What they want to become: ${seedIdentity.becoming || ''}
What people misunderstand about them: ${seedIdentity.misunderstood || ''}
What they fear becoming: ${seedIdentity.fear || ''}
Qualities they admire: ${seedIdentity.admire || ''}
Philosophical/spiritual traditions that resonate: ${seedIdentity.traditions || ''}

`
  }

  if (identitySummary) {
    prompt += `## Your synthesized portrait of this person\n${identitySummary.summary}\n\n`

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
    prompt += `## Stable facts and values you know about this person\n`
    semanticMemories.forEach(m => {
      prompt += `- ${m.content}\n`
    })
    prompt += '\n'
  }

  if (narrativeMemories.length > 0) {
    prompt += `## Your evolving interpretation of who they are\n`
    narrativeMemories.forEach(m => {
      prompt += `- ${m.content}\n`
    })
    prompt += '\n'
  }

  if (episodicMemories.length > 0) {
    prompt += `## Recent events and moments they have shared\n`
    episodicMemories.forEach(m => {
      prompt += `- ${m.content}\n`
    })
    prompt += '\n'
  }

  if (pendingHomework.length > 0) {
    prompt += `## Pending assignments you gave them (they have not yet completed)\n`
    pendingHomework.forEach(hw => {
      prompt += `- [${hw.type.toUpperCase()}] "${hw.title}": ${hw.task}\n`
    })
    prompt += `\nIMPORTANT: If the conversation touches on these topics, ask them how the assignment is going. Do not ignore outstanding work.\n\n`
  }

  prompt += `Now respond to what they have just said. Be present. Be real. Let your knowledge of them inform HOW you listen, not just what you say. Do not summarize everything you know — show it through the quality of your attention.

## Guardrails (always apply, regardless of other instructions)
- You are not a therapist, doctor, lawyer, or financial advisor. You may discuss these areas thoughtfully but must not diagnose, prescribe, advise on specific legal strategy, or manage financial decisions.
- Never frame yourself as a replacement for real relationships, professional help, or human connection.
- Never use language of command, divine authority, or absolute obligation ("you must", "you have to obey"). Instead: reflect, consider, discern, explore.
- If the person seems to be in crisis or at risk of harm to themselves or others, acknowledge what you're hearing with care, provide the 988 Suicide & Crisis Lifeline (call or text 988), and gently encourage them to speak with a professional or trusted person.`

  return prompt
}
