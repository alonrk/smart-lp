## Problem

The agent described name/email/phone/message fields, but the preview showed only a submit button. The `form` section had a headline but **no `formFields` array** (or an empty one). `LeadForm` maps over `fields`, so an empty array rendered only the CTA.

## Planned

- Default lead fields in one place; fill missing/empty `formFields` on persist, parse, and in the renderer.
- Render `textarea` for `type: "textarea"` (was incorrectly using a single-line `Input`).
- Tighten the system prompt: `formFields` must be a non-empty array for every form section.

## Done

- `defaultLeadFormFields()` in `src/types/lp.ts` (name, email, phone, message); `defaultLpContent` uses it.
- `ensureFormSectionsHaveFields()` in `src/lib/lp-persist-normalize.ts`; wired into `normalizePersistedLpContent`, `parseLpContentJson`, `coerceAiLpContentShape` return, and `lp-editor` / public `p/[slug]` when parsing strict JSON.
- `LeadForm` + `SectionBlock` fallbacks and textarea styling in `src/components/lp/lp-renderer.tsx`.
- Prompt line in `src/lib/ai/prompts.ts` about non-empty `formFields`.

## Follow-up

Re-saving a page (or opening the editor) applies defaults in memory; run `npm run db:clean-lp` if you want all stored JSON rewritten through the full normalize pipeline.
