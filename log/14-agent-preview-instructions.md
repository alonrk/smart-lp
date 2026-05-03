## Planned

- Align agent instructions with the side-by-side editor: replace obsolete “scroll up to Preview” copy with guidance that matches desktop (Preview beside chat, typically left) and small screens (stacked; scroll if needed).

## Done

- Updated `src/lib/ai/prompts.ts` (`lpAgentSystem` editor context).
- Updated both `nextStepForAssistant` strings in `src/app/api/chat/route.ts` for create and update paths.
- Kept the rule: never invent public https URLs for the draft.
