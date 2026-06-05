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

## Open Requirements

- Add advisor creation/editing backed by the `advisors` table.
- Add session summaries with key points, next actions, and follow-up questions.
- Add onboarding redirect logic so new users complete setup before landing in the app.
- Add tests around API auth, session loading, memory persistence, and chat stream parsing.

## Seven-Day Engineering Sprint Completed

Focus: make the multi-advisor Council room a durable product surface instead of a browser-local prototype.

1. Replaced local Council room storage with authenticated `/api/council` loading and persistence.
2. Added Council thread creation, saved thread listing, and URL-addressable thread reopening.
3. Persisted Council questions, advisor responses, and synthesis output into Supabase `sessions` and `messages`.
4. Created episodic memory records from Council questions so Mirror/Timeline/Home can learn from multi-advisor work.
5. Updated Home and session APIs so Council threads route back to `/council` and do not pollute single-advisor chat history.
6. Updated repo recordkeeping in the PRD, task tracker, and README.

## Roadmap

### Next Seven-Day Candidate

Focus: complete the session intelligence layer.

1. Add session summary generation for chat and Council sessions.
2. Persist key points, next actions, memories to save, and follow-up questions into `session_summaries`.
3. Show summaries on Home, Timeline, and reopened threads.
4. Add explicit "end session / summarize" controls.
5. Add tests for auth, session loading, Council persistence, and summary parsing.

### Later

- Advisor creation/editing backed by the `advisors` table.
- Onboarding redirect logic so new users complete setup before landing in the app.
- Production analytics, billing, sharing/export, and richer safety review.
