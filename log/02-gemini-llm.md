# 02 — Switch campaign agent to Gemini

## Planned

- Replace OpenAI and Anthropic with Google Gemini in `/api/chat` and dependencies.
- Document `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.example` and README; adjust user-facing quota hint in the agent chat UI.

## Done

- `package.json`: added `@ai-sdk/google`, removed `@ai-sdk/openai` and `@ai-sdk/anthropic`.
- `src/app/api/chat/route.ts`: `import { google } from '@ai-sdk/google'`, `model()` returns `google("gemini-2.5-flash")` when `GOOGLE_GENERATIVE_AI_API_KEY` is set. (Switched from `gemini-2.0-flash` because Google no longer serves 2.0 Flash to new API users.)
- `.env.example` and `README.md` updated; `agent-chat` quota copy targets Gemini / Google Cloud.

## Note

- Copy a valid API key from [Google AI Studio](https://aistudio.google.com/apikey) (or your GCP project) into `GOOGLE_GENERATIVE_AI_API_KEY` in `.env`; remove any legacy `OPENAI_*` / `ANTHROPIC_*` lines.

## npm install `EBADF` when fetching the registry

If the npm debug log shows `http fetch GET https://registry.npmjs.org/... failed with EBADF` (same stack as `minipass-fetch`), that is a **socket / bad file descriptor** failure during the HTTP request—often seen with **Node.js 24** and npm’s fetch path.

**Fix that usually works:** use an LTS line (e.g. **22**), then reinstall:

```bash
fnm install 22
fnm use 22
cd /path/to/smart-lp
npm cache clean --force
npm install
```

The repo includes `.nvmrc` with `22` so `fnm use` / `nvm use` can pick it automatically in this directory.

**If it still fails:** try `pnpm install` or `yarn` after `corepack enable`, or check VPN/proxy/antivirus interference with HTTPS to `registry.npmjs.org`.

## When `curl` to the registry also fails

If `curl -I https://registry.npmjs.org/` (or the scoped URL) cannot connect, **npm/pnpm/yarn will all fail** until outbound HTTPS to Cloudflare-hosted `registry.npmjs.org` works. That is outside Node version choice: fix network path (hotspot, VPN off, firewall/security suite, corporate proxy env vars and `npm config set https-proxy`), then retry installs.

**Wix corporate network:** public npm is blocked but `https://npm.dev.wixpress.com` works. A root `.npmrc` that forced `registry=https://registry.npmjs.org/` overrode user config and kept installs broken; it was **removed** so `npm config set registry https://npm.dev.wixpress.com` (or internal aliases) applies when installing this project.
