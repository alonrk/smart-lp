# 04 — Generated landing HTML (`bodyHtml`)

## Planned

- Let the campaign LP show **real generated markup** from user context (goal + URL/theme), not instructional placeholders.
- Keep leads via structured **form** section + sanitization.

## Done

- **`LpContent`**: optional **`bodyHtml`** string (stored in `contentJson`).
- **`lib/sanitize-lp-html.ts`**: strict allowlist sanitization on save (`finalizeParsedContent` in `/api/chat`) and again client-side before `dangerouslySetInnerHTML`.
- **`LpRenderer`**: If `bodyHtml` is non-empty after sanitize, render it as the main landing narrative; **sections** then only contribute **form** + **footer** (lead capture + legal). Without `bodyHtml`, behavior is the previous section-based layout (hero, features, …) with fallbacks from **`content.title`** for empty headlines—no “Add a headline in the Agent chat” copy.
- **`lpAgentSystem`**: Instructs the model to populate **`bodyHtml`** with semantic HTML derived from the user’s goal; require **form** + **footer** in `sections`; forbids empty instructional filler when using sections-only mode.
- **`normalizeSavedLpContent`**: Preserves **`bodyHtml`** when merging default sections.

## Follow-up

- Re-run the Agent after deploy so new saves include **`bodyHtml`**; older rows without it still render from **sections** only.
