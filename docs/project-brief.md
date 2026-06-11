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
- ~~Add authenticated alpha smoke coverage for dashboard, chat session loading, Council history, summaries, memory reads, and timeline access.~~ Done.
- ~~Make chat and Council message persistence tolerate production schemas without `messages.session_id`.~~ Done.
- ~~Add an operator backfill for legacy message-only conversations into `sessions`.~~ Done.
- ~~Return user-facing OpenAI/Supabase failure payloads from chat, Council, and summary endpoints.~~ Done.
- ~~Display chat API failure messages in the streaming UI instead of a generic quiet-room fallback.~~ Done.
- ~~Populate Vercel production Supabase/OpenAI environment variables after discovering they were empty.~~ Done.
- ~~Keep chat, Council, and summaries functional when `sessions` is readable but not writable through Supabase REST.~~ Done.
- ~~Store Council advisor/synthesis records under the production-allowed `assistant` message role.~~ Done.
- ~~Return transient generated summaries when `session_summaries` is readable but not writable.~~ Done.

## Open Requirements

- Add advisor creation/editing backed by the `advisors` table.
- Run the expanded authenticated smoke suite against the freshly deployed production build.
- Decide whether to grant Supabase REST writes for `sessions` and `session_summaries`, or keep the current transient/fallback behavior.
- Add production analytics and reliability monitoring.

## Production Hardening Sprint Completed

Focus: get the app over the private-alpha reliability bar after production schema setup.

1. Removed the temporary missing-schema degraded mode from the Council API.
2. Added root `proxy.ts` auth/onboarding enforcement for protected app routes.
3. Routed fresh signups to onboarding and made login honor protected-route `next` redirects.
4. Added `npm run smoke:alpha` for repeatable schema, route, redirect, and private API auth checks.
5. Verified production Supabase tables are present.

## Production Readiness Sprint Completed

Focus: remove the main alpha breakage path and make production verification stronger.

1. Added schema-tolerant message writes so chat and Council continue working on the current production schema, where `messages.session_id` is not present.
2. Added a shared API error mapper so OpenAI and Supabase failures return stable `{ error, code }` responses instead of opaque 500s.
3. Improved chat UI failure handling so server-provided messages are shown to the user.
4. Expanded `npm run smoke:alpha` to create a temporary authenticated user, seed a realistic private record, and verify dashboard, session loading, summaries, synthesis/memory reads, Council history, and timeline access.
5. Added `npm run backfill:sessions` with `--dry-run` support for legacy message-only conversations.
6. Fixed live Vercel environment configuration after production Supabase/OpenAI variables were found to be empty.
7. Added read-only `sessions` tolerance after Supabase REST accepted message writes but rejected `sessions` inserts.
8. Adjusted Council persistence to respect the production `messages.role` constraint while retaining structured advisor/synthesis payloads.
9. Added transient summary fallback after Supabase REST rejected `session_summaries` inserts.

## Roadmap

### Next Alpha Candidate

Focus: make the alpha administrable and observable.

1. Run the expanded smoke suite after each production deploy and wire it into a release checklist.
2. Add advisor creation/editing backed by the `advisors` table.
3. Add production analytics and reliability monitoring.
4. Make onboarding status visible on Home and profile-dependent prompts.
5. Choose and document the long-term session model: grant table writes or standardize on `conversation_id` plus transient summaries.

### Later

- Billing, sharing/export, and richer safety review.
