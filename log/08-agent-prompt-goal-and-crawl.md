# 08 — Agent prompt: campaign goal + homepage extraction

## Planned

- Improve LP quality by making the system prompt **prioritize the user’s campaign goal** and **use homepage crawl data correctly** (brand vs campaign).
- Give the model **richer tool output** from the real HTML fetch when possible.

## Done

- **`src/lib/ai/prompts.ts`**: Rewrote `lpAgentSystem` with explicit sections: **goal** (outcome, audience, offer, single CTA; ban generic filler), **extractThemeFromUrl** (how to use title, ogTitle, metaDescription, firstHeading, theme; homepage ≠ campaign), Wix note, and output rules. Updated layout wording for side-by-side Preview.
- **`src/lib/theme-extract.ts`**: Return **ogTitle**, **metaDescription** (meta + og:description), **firstHeading** (h1 then h2 text). Fixed naming for heading **style** vs visible headline text. Documented return fields in the type.
- **`src/app/api/chat/route.ts`**: **extractThemeFromUrl** tool description lists returned fields and warns not to equate homepage headline with campaign. **saveOrUpdateLandingPage** description asks to pass **campaignGoal** and **sourceUrl** when known.

## Limits

- **firstHeading** / **metaDescription** are still **static HTML**; JS-only homepages may return little text—prompt tells the model to fall back to title, URL, and user goal.
