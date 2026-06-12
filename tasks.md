# Pascale's Wager Tasks

## Completed

- [x] Define the project brief and target audience.
- [x] Choose the initial technology stack.
- [x] Add setup and deployment instructions.
- [x] Ship authenticated chat with persisted message history.
- [x] Add memory extraction, Mirror, Timeline, and ritual persistence.
- [x] Add memory review controls for editing and deleting stored memories.
- [x] Replace static Home with a user-specific operating dashboard.
- [x] Convert `/council` from browser-local storage to authenticated Supabase-backed threads.
- [x] Update dashboard/session routing so Council records reopen in the Council room.
- [x] Generate structured session summaries for chat and Council sessions.
- [x] Persist key points, next actions, memories to save, and follow-up questions in `session_summaries`.
- [x] Surface session summaries on Home, Timeline, chat, and Council threads.
- [x] Remove temporary Council degraded mode after production Supabase schema setup.
- [x] Add onboarding redirect enforcement for incomplete profiles.
- [x] Add alpha smoke checks for schema, protected redirects, public pages, and private API auth.
- [x] Add authenticated smoke checks for chat, Council, summaries, dashboard, and timeline.
- [x] Add schema-tolerant message persistence for production databases without `messages.session_id`.
- [x] Add a `backfill:sessions` operator script for legacy message-only conversations.
- [x] Add resilient failure payloads for OpenAI/Supabase errors in chat, Council, and summaries.
- [x] Surface API failure messages in the chat stream UI.
- [x] Populate Vercel production Supabase/OpenAI environment variables after discovering they were empty.
- [x] Keep core chat/Council flows working when `sessions` is unavailable through authenticated Supabase REST.
- [x] Store Council advisor/synthesis records under the production-allowed `assistant` message role.
- [x] Return transient generated summaries when `session_summaries` is readable but not writable.
- [x] Omit optional memory columns such as `importance` and `session_id` when production schema lacks them.
- [x] Add authenticated custom advisor API endpoints.
- [x] Replace the static Advisors page with a create/edit custom advisor workflow.
- [x] Add Supabase alpha readiness SQL for sessions, summaries, memories, and advisors.
- [x] Add `npm run audit:schema` for production schema capability checks.

## Current Roadmap

- [ ] Run the expanded alpha smoke against the freshly deployed production build.
- [ ] Add production analytics and reliability monitoring.
- [ ] Align the production Supabase schema with app expectations, or formally keep the current compatibility fallbacks.

## Later

- [ ] Add export/share workflows once the private record model is stable.
