## Goal

Keep the campaign agent chat message list scrolling inside the right column instead of growing the page when conversation length exceeds the viewport.

## First attempt (insufficient)

Flex/`min-h-0` alone did not fix it: the **grid row height** stayed `auto`, so it grew with the chat content. Radix `ScrollArea` also depended on a height chain that never received a definite pixel cap.

## Fix that works

1. **`lp-editor.tsx`**: On `lg`, give the preview/agent **section** a fixed viewport-bound box so the row is not content-sized:
   - `lg:h-[min(78vh,calc(100dvh-12.5rem))]` + matching `max-h` / `min-h`, `lg:overflow-hidden`, `lg:grid-rows-1`.
   - Offset `12.5rem` approximates header + main padding + title/toolbar + gaps (tweak if content clips).
2. **Columns**: `overflow-hidden` + `min-h-0` where needed so children clip instead of expanding the grid.
3. **`agent-chat.tsx`**: Replace Radix `ScrollArea` with a native `div` using `overflow-y-auto`, `flex-1`, `min-h-0` (lg), `overscroll-y-contain`, `[scrollbar-gutter:stable]`. Card: `overflow-hidden`, `lg:h-full`.

## Files

- `src/app/app/lp/[id]/lp-editor.tsx`
- `src/components/app/agent-chat.tsx`
