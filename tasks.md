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

## Current Roadmap

- [ ] Add onboarding redirect logic for incomplete profiles.
- [ ] Add API and UI tests for auth, session loading, memory persistence, Council persistence, and summary parsing.
- [ ] Backfill old message-only conversations into `sessions` more aggressively.
- [ ] Add resilient failure states for OpenAI/Supabase errors.

## Later

- [ ] Add advisor creation/editing backed by the `advisors` table.
- [ ] Add production analytics and reliability monitoring.
- [ ] Add export/share workflows once the private record model is stable.
