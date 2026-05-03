# 09 — Coerce AI LP JSON when strict Zod parse fails

## Evidence

Debug NDJSON showed **`saveOrUpdateLandingPage` ran** after raising `maxSteps`, but **`schemaOk: false`** and **`usedDefaultBecauseSchema: true`** with **`titleSample: "Your campaign"`** — the server discarded the model’s payload and saved **`defaultLpContent()`**, so the Preview never showed generated copy.

## Done

- **`src/lib/lp-persist-normalize.ts`**: **`coerceAiLpContentShape(raw)`** maps common LLM drift (section type synonyms, `phone`→`tel`, partial theme, missing ids) then validates with **`sectionSchema` / `lpContentSchema`**. **`parseLpContentJson`** uses coercion after strict parse fails.
- **`src/app/api/chat/route.ts`**: On **`safeParse` failure**, persist **`coerceAiLpContentShape(content)`** instead of defaults. Debug payload adds **`aiCoercionApplied`**.

## Limits

Garbage payloads may still fall back to **`defaultLpContent()`** if coercion cannot produce valid **`LpContent`**.

## Update — debug instrumentation removed

Temporary NDJSON/fetch logging was removed from **`src/app/api/chat/route.ts`**, **`src/components/app/agent-chat.tsx`**, and **`src/app/app/lp/[id]/lp-editor.tsx`** after the fix was confirmed.
