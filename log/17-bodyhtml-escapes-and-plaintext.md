## Problem

Preview showed literal `\n`, broken layout, and unparsed-looking copy—often because the model stored **escaped newlines** (the two characters `\` + `n`) inside `bodyHtml`, or sent **Markdown/plain text** instead of HTML; sanitize-html then treated it as text nodes.

## Done

- **`src/lib/sanitize-lp-html.ts`**
  - **`unescapeModelStringEscapes`**: turns literal `\n`, `\r`, `\t` into real whitespace before sanitizing (exported for reuse/tests).
  - **`looksLikeHtmlFragment`**: if the string has no real tags, run light conversion.
  - **`plainOrMarkdownToSafeHtml`**: paragraphs split on blank lines, `#` headings (1–4), `-`/`*` bullet blocks → `ul`/`li`, inline newlines → `<br />`, with HTML escaping on text.
  - **`sanitizeLpHtml`**: unescape → plain/markdown path **or** raw HTML → existing sanitize-html allowlist.
- **`src/lib/ai/prompts.ts`**: instruct the model to output real HTML, not visible backslash-n tokens or Markdown-only blobs.

Existing drafts pick up the fix on **next preview render** (client sanitize). **Re-save** via the agent or `npm run db:clean-lp` if you want normalized HTML persisted in `contentJson`.

## Update — visible backslashes between bullets

Some models still emitted Markdown-style line continuations: a backslash at end of line, or a line that is only `\\` between `</li>` and `<li>`, which showed as stray slashes. **`stripArtifactBackslashes`** in `sanitize-lp-html.ts` runs after unescaping and removes those patterns, including `>\\<` between adjacent tags.
