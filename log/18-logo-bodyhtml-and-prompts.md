## Problem

- With **bodyHtml**, only **form** + **footer** sections render; **hero** (where `theme.logoUrl` was shown) was skipped—so the preview never displayed the extracted logo even when saved on `theme`.
- The agent repeated Preview boilerplate and claimed logos/colors were visible when extraction or merge could be missing.

## Done

- **`lp-renderer.tsx`**: If `bodyHtml` is used and `theme.logoUrl` is set, render a **brand image strip above** the generated HTML (same role as hero logo).
- **`theme-extract.ts`**: Prefer **header** `<img>` (logo class/alt/parent) over **og:image** (often a social banner); fallback chain: header → apple-touch-icon → favicon → og:image.
- **`prompts.ts`**: Stop instructing repetitive Preview copy; add **branding honesty** and require merging **full theme** from `extractThemeFromUrl`; do not claim logo visibility unless `logoUrl` is saved.
- **`api/chat/route.ts`**: Shorter `nextStepForAssistant`; tool description reminds to merge theme including `logoUrl`.

## Follow-up

JS-heavy sites (e.g. some Wix shells) may still yield **no** static header logo—then `logoUrl` can remain null until we add Wix asset APIs or user-supplied logo URL.
