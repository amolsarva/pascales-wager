export type Role = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  user_id: string
  role: Role
  content: string
  created_at: string
  conversation_id?: string
}

export interface Memory {
  id: string
  user_id: string
  type: 'episodic' | 'semantic' | 'narrative'
  content: string
  confidence: number
  embedding?: number[]
  created_at: string
  source_message_ids?: string[]
}

export interface IdentitySummary {
  id: string
  user_id: string
  summary: string
  traits: Trait[]
  themes: string[]
  contradictions: string[]
  created_at: string
}

export interface Trait {
  name: string
  confidence: number
  evidence: string[]
}

export interface UserProfile {
  id: string
  email: string
  display_name?: string
  onboarding_complete: boolean
  seed_identity?: SeedIdentity
  created_at: string
}

export interface SeedIdentity {
  becoming: string
  misunderstood: string
  fear: string
  admire: string
  traditions: string
}

export interface Ritual {
  id: string
  user_id: string
  prompt: string
  response?: string
  date: string
  created_at: string
}
