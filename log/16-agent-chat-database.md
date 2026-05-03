## Planned

- Store the campaign agent transcript per landing page in the database instead of (only) `localStorage`, so conversations follow the user across devices and sessions.

## Done

- **Schema**: `LandingPage.agentChatJson` (`String`, default `"[]"`) — JSON array compatible with Vercel AI `UIMessage` shapes.
- **API**: `PATCH /api/lp/[id]` accepts optional `agentMessages` (array); server stringifies to `agentChatJson` with a max payload guard (~500KB) via `src/lib/agent-chat-persist.ts`.
- **Client**: `AgentChat` loads `initialMessages` from `serverAgentChatJson` (from `GET /api/lp/:id`). If the DB transcript is empty, it falls back once to legacy `localStorage` (`smart-lp-agent-chat:${id}`), then debounced `PATCH` (800ms) writes the current `messages` to the DB and clears `localStorage` on success.
- **Editor**: `lp-editor` passes `serverAgentChatJson={lp.agentChatJson}`; `Lp` type includes `agentChatJson`.

## Notes

- Run `npx prisma db push` (or migrate) after pull so the new column exists.
- Chat is still updated in the client during streaming; persistence runs after the debounce window, so a hard refresh mid-stream may lose the in-progress assistant turn until the next save.
