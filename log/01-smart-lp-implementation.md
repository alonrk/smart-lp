# 01 — Smart LP implementation

## Planned

- M1: Next.js (App Router), Prisma+SQLite (dev) / PostgreSQL (prod), NextAuth, Vercel AI SDK agent with tools (theme from URL, save LP), public `/p/[slug]`, tracking injection (Meta, gtag, GTM, TikTok).
- M2: Wix OAuth routes, connect UI, Wix site list + API proxy for theme/assets.
- M3: LP version snapshots, lead webhook, simple analytics (page views + optional consent banner).

## Done

- Next.js 15 (App Router) + Tailwind 4, Prisma + SQLite, NextAuth (credentials + JWT), Vercel AI SDK agent (`/api/chat`) with tools: `extractThemeFromUrl`, `wixListSites`, `wixGetSiteTheme`, `saveOrUpdateLandingPage`.
- Public pages at `/p/[slug]` with `TrackingHeadScripts` (GTM or gtag + Meta + TikTok) and optional consent banner; lead form posts to `/api/lead` with optional webhook.
- Wix: `/api/wix/authorize`, `/api/wix/callback`, `src/lib/wix/client.ts` + `user-sites.ts`; Settings UI for “Connect Wix” (requires env).
- M3: `LandingPageVersion` snapshots on content updates, `GET/POST /api/lp/[id]/versions` (revert), `viewCount` on published views, `leadWebhookUrl`, `consentBannerEnabled`.
- Marketing home, register/login, dashboard list + create, LP editor tabs (Agent, Preview, Tags, History).
- `README.md` for local setup; `.env.example` for variables.
- Chat response: `toDataStreamResponse({ getErrorMessage })` for clear provider errors; `model()` uses **Gemini** via `@ai-sdk/google` and `GOOGLE_GENERATIVE_AI_API_KEY` (default: `gemini-2.5-flash`).

## Follow-up (runtime / build)

- Chat API: use `convertToCoreMessages` + strip `id` from client messages for `streamText` (fixes type + stream protocol with `useChat`).
- Register page: removed stray `useRouter()` reference.
- Wix `refreshWixToken`: pass narrowed `refreshToken` (string).
- `next.config.ts`: `turbopack.root` = `process.cwd()` to avoid wrong workspace root when multiple lockfiles exist.
- ESLint: button `ref`, agent message typing, chat route unused `id`.
