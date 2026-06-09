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

## Current Roadmap

- [ ] Add authenticated smoke checks for chat, Council, summaries, dashboard, and timeline.
- [ ] Backfill old message-only conversations into `sessions` more aggressively.
- [ ] Add resilient failure states for OpenAI/Supabase errors.

## Later

- [ ] Add advisor creation/editing backed by the `advisors` table.
- [ ] Add production analytics and reliability monitoring.
- [ ] Add export/share workflows once the private record model is stable.
