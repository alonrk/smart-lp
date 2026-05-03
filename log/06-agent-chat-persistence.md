# 06 — Agent chat survives tab switches and navigation

## Planned

- Stop losing `useChat` message history when leaving the Agent tab or the LP editor (unmount / full navigation).
- Keep one thread per landing page without server changes.

## Done

- **`src/components/app/agent-chat.tsx`**: Persist `UIMessage[]` to `localStorage` under `smart-lp-agent-chat:<landingPageId>`. Client-only shell (`mounted` gate) loads persisted messages into `useChat` via `initialMessages` and `id: lp-agent-${landingPageId}` so hydration stays consistent. Save on every `messages` update.
- **`src/app/app/lp/[id]/lp-editor.tsx`**: `TabsContent` for Agent uses **`forceMount`** + **`data-[state=inactive]:hidden`** so the chat stays mounted when switching to Tags/History (in-memory state preserved). **`key={id}`** on `AgentChat` resets chat state correctly when opening another LP.

## Limits

- History is **per browser** (localStorage), not synced across devices.
- Clearing site data removes chat history.
