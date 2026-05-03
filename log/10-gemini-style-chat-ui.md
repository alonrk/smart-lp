## Goal

Align the campaign agent chat UI with patterns familiar from Gemini-style chats (without copying Google trademarks).

## Changes

- Replaced shadcn `Card` layout with a rounded panel on `#f0f4f9`-style surface.
- Header: compact row with sparkle icon in a round badge and subtitle.
- Messages: user turns as right-aligned `#d3e3fd` bubbles; assistant turns left-aligned with small sparkle avatar and plain flowing text (no role chips).
- Composer: pill-shaped white bar, border/shadow on focus, circular blue send button (`#1a73e8`).
- Errors in a soft red panel; loading shows subtle pulse dots.
- SSR skeleton updated to match structure.

## File

- `src/components/app/agent-chat.tsx`
