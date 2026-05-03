# Smart LP

Conversational landing page builder for paid campaigns (Google, Meta, TikTok) with theme extraction, optional Wix connection, and conversion tags (GTM, gtag, Meta Pixel, TikTok).

## Setup

1. **Node.js:** 20+ (see `.nvmrc` for fnm/nvm; 22 LTS recommended).
2. **Install dependencies:** `npm install` (if this fails, see [Troubleshooting](#troubleshooting) below).
3. **Environment:** copy `.env.example` to `.env` and set `AUTH_SECRET` (e.g. `openssl rand -base64 32`), `NEXTAUTH_URL`, and `GOOGLE_GENERATIVE_AI_API_KEY` (Gemini, from [Google AI Studio](https://aistudio.google.com/apikey)). For Wix, set `WIX_CLIENT_ID`, `WIX_CLIENT_SECRET`, and `WIX_REDIRECT_URI` (see [Wix authentication](https://dev.wix.com/docs/api-reference/authentication)).
4. **Database:** `npx prisma db push` — **use one SQLite file only:** `DATABASE_URL=file:./prisma/dev.db` → **`prisma/dev.db`**. Do not open or maintain `prisma/prisma/dev.db` (legacy); the app normalizes to `prisma/dev.db` on startup.
5. **Run:** `npm run dev` and open [http://localhost:3000](http://localhost:3000). Register, create a page, use the **Agent** tab, then **Publish** and open the public URL from the editor. Delete a page from the **Landing pages** list (trash icon) or **Delete** in the editor toolbar (`DELETE /api/lp/[id]`).

## Troubleshooting

**`curl -I https://registry.npmjs.org/` fails (timeout, connection refused, or `Bad file descriptor` on connect):**  
npm cannot work until plain HTTPS to the public registry succeeds. This is a **network or OS security** issue on your machine, not this repo. Try: another network (e.g. phone hotspot), disable VPN temporarily, relax or bypass firewall / “internet security” / filtering tools that intercept HTTPS, or set your corporate **HTTPS proxy** if required (`npm config set https-proxy …` and often `proxy` for http). Confirm with:

```bash
curl -I https://registry.npmjs.org/
```

You should see HTTP `200` or `301` and headers.

**On a Wix network:** public `registry.npmjs.org` is often unreachable; `npm.dev.wixpress.com` works. This repo does **not** pin the registry in `.npmrc`, so set yours once (e.g. `npm config set registry https://npm.dev.wixpress.com`) or use your usual internal alias, then run `npm install`. Restore public npm when off-VPN with `npm config set registry https://registry.npmjs.org/` if needed.

**`curl` works but `npm install` still reports `EBADF`:** use **Node 22 LTS** in this directory (`fnm install 22 && fnm use`), then `npm cache clean --force` and `npm install` again.

## Scripts

- `npm run dev` — development server (Turbopack)
- `npm run build` — Prisma client + production build
- `npm start` — production server
- `npm run db:clean-lp` — normalize stored LP JSON (theme/bodyHtml/schema); loads `.env` and resolves **`prisma/dev.db`**
- `npm run db:reset-lp` — **hard reset**: each LP becomes the default template (name + campaign goal), version snapshots deleted; use when content is still junk after normalize

## Project layout (high level)

- `src/app/app/` — authenticated dashboard and LP editor
- `src/app/p/[slug]/` — published landing pages (tracking + consent banner)
- `src/app/api/chat/` — AI agent with tools (theme, Wix, save LP)
- `src/lib/wix/` — Wix OAuth helper and site/theme helpers
- `prisma/` — schema and local SQLite
