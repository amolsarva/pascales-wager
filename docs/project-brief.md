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
- ~~Replace static home content with user-specific recent sessions, emerging themes, next actions, and record counts.~~ Done.
- ~~Convert `/council` from browser-local storage to authenticated Supabase-backed Council threads.~~ Done.
- ~~Add session summaries with key points, next actions, saved memories, and follow-up questions.~~ Done.

## Open Requirements

- Add advisor creation/editing backed by the `advisors` table.
- Add onboarding redirect logic so new users complete setup before landing in the app.
- Add tests around API auth, session loading, memory persistence, and chat stream parsing.

## Ten-Day Engineering Sprint Completed

Focus: complete the first session-intelligence layer.

1. Added `/api/session-summaries` for authenticated summary listing and generation.
2. Generate structured titles, summaries, key points, next actions, memories to save, follow-up questions, dilemmas, tone, and decision status.
3. Persist generated records into `session_summaries` and update parent `sessions`.
4. Create durable narrative memory rows from summary-level memories to save.
5. Added working summarize controls and summary cards in chat and Council.
6. Added summaries to Home record counts and latest summary display.
7. Added session summaries to Timeline with filters and reopen links.
8. Upgraded chat persistence so new chat messages attach to real `sessions` rows.
9. Updated repo and in-app recordkeeping for the shipped sprint.

## Roadmap

### Next Ten-Day Candidate

Focus: onboarding enforcement and product hardening.

1. Add onboarding redirect logic for incomplete profiles.
2. Make onboarding status visible on Home and profile-dependent prompts.
3. Add focused tests for API auth, session summary generation, session loading, Council persistence, and dashboard routing.
4. Add lightweight failure states for OpenAI/Supabase errors in chat, Council, and summaries.
5. Tighten old-session backfill for records created before session rows existed.

### Later

- Advisor creation/editing backed by the `advisors` table.
- Production analytics, billing, sharing/export, and richer safety review.
