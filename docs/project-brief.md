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
- ~~Remove degraded Council schema fallback now that production Supabase schema is applied.~~ Done.
- ~~Add onboarding redirect logic so new users complete setup before landing in the app.~~ Done.
- ~~Add alpha smoke checks for schema, protected redirects, public pages, and private API auth.~~ Done.

## Open Requirements

- Add advisor creation/editing backed by the `advisors` table.
- Add deeper authenticated tests around session loading, memory persistence, Council persistence, and summary parsing.
- Improve user-facing failure states for OpenAI/Supabase errors.
- Backfill old message-only conversations into `sessions`.

## Production Hardening Sprint Completed

Focus: get the app over the private-alpha reliability bar after production schema setup.

1. Removed the temporary missing-schema degraded mode from the Council API.
2. Added root `proxy.ts` auth/onboarding enforcement for protected app routes.
3. Routed fresh signups to onboarding and made login honor protected-route `next` redirects.
4. Added `npm run smoke:alpha` for repeatable schema, route, redirect, and private API auth checks.
5. Verified production Supabase tables are present.

## Roadmap

### Next Ten-Day Candidate

Focus: authenticated end-to-end confidence and failure-state polish.

1. Add authenticated test-user smoke checks for chat, Council, summaries, memories, dashboard, and timeline.
2. Add lightweight failure states for OpenAI/Supabase errors in chat, Council, and summaries.
3. Tighten old-session backfill for records created before session rows existed.
4. Make onboarding status visible on Home and profile-dependent prompts.
5. Add advisor creation/editing backed by the `advisors` table.

### Later

- Advisor creation/editing backed by the `advisors` table.
- Production analytics, billing, sharing/export, and richer safety review.
