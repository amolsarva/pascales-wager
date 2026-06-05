# Product Requirements Document

## Working Title

Pascale's Wager / The Council

## Product Goal

Create a private AI council for reflective decision-making: users bring a real question, receive distinct advisor perspectives, and build a remembered record of themes, memories, rituals, and identity synthesis over time.

## Current Product Shape

- ~~Next.js app shell with dark, serif Council design system.~~ Done.
- ~~Public entry redirects directly into the Council room prototype.~~ Done.
- ~~Auth surfaces for email/password sign in, signup, and Supabase callback.~~ Done.
- ~~Starter advisor faculty with distinct archetypes, tones, worldviews, and avatar treatment.~~ Done.
- ~~Browser-local multi-advisor Council room with selectable advisors, remembered rounds, parallel answers, and synthesis.~~ Done.
- ~~Single-advisor chat surface with streaming OpenAI responses and advisor-specific prompts.~~ Done.
- ~~Supabase-backed message persistence for single-advisor chat.~~ Done.
- ~~Memory extraction pipeline for chat conversations.~~ Done.
- ~~Mirror page for identity summaries, traits, contradictions, themes, and memory counts.~~ Done.
- ~~Timeline page merging memories, summaries, and rituals.~~ Done.
- ~~Daily ritual page with rotating Examen prompts.~~ Done.
- ~~PWA manifest and mobile-friendly shell metadata.~~ Done.

## Newly Completed

- ~~Replace the stub brief with a practical PRD/status tracker.~~ Done.
- ~~Add API-backed recent session listing and per-session message loading.~~ Done.
- ~~Make chat history selectable so users can reopen saved conversations.~~ Done.
- ~~Add manual "Remember this" persistence instead of local-only toggles.~~ Done.
- ~~Persist ritual responses before handing them to chat for reflection.~~ Done.
- ~~Bring `/timeline` and `/mirror` into the current app navigation/design system.~~ Done.
- ~~Add memory review controls for editing and deleting stored memories.~~ Done.

## Open Requirements

- Convert `/council` from browser-local storage to authenticated Supabase-backed sessions.
- Replace static home content with user-specific recent sessions, emerging themes, and next actions.
- Add advisor creation/editing backed by the `advisors` table.
- Add session summaries with key points, next actions, and follow-up questions.
- Add onboarding redirect logic so new users complete setup before landing in the app.
- Add tests around API auth, session loading, memory persistence, and chat stream parsing.

## Three-Day Engineering Slice In Progress

Focus: make memory review feel like a real product surface.

1. Bring Mirror and Timeline into the main app shell.
2. Add edit/delete APIs for user-owned memories.
3. Add memory review controls to the Mirror.
4. Keep the PRD updated as implemented work lands.

## Non-Goals For This Slice

- Full custom advisor builder.
- Supabase-backed multi-advisor Council persistence.
- New database schema.
- Production analytics, billing, or sharing.
