import sanitizeHtml from "sanitize-html";

/** Escape text nodes for plain-text → HTML conversion (defense before sanitize). */
function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Models often emit JSON-ish strings with literal two-character `\n` instead of real newlines,
 * which then render visibly in the preview. Normalize those before parsing HTML.
 */
export function unescapeModelStringEscapes(s: string): string {
  if (!s.includes("\\")) return s;
  return s
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t");
}

/**
 * Models often leave Markdown “hard break” backslashes (\\ before newline) or a whole line
 * that is only `\\` between &lt;li&gt; blocks—those render as visible slashes in HTML.
 */
export function stripArtifactBackslashes(s: string): string {
  if (!s.includes("\\")) return s;
  let out = s
    // `\` at end of line (markdown line continuation)
    .replace(/\\\s*\r?\n/g, "\n")
    // line that contains only optional whitespace + backslash
    .replace(/(^|\n)(\s*)\\(\s*)(?=\n|$)/g, "$1");
  // trim stray backslashes before tags: `>\\` newline `<`, or `></li>\\<li>` on one line
  out = out.replace(/>\s*\\\s*\r?\n\s*</g, ">\n<");
  out = out.replace(/(>)\s*\\\s*(<)/g, "$1$2");
  out = out.replace(/\n{3,}/g, "\n\n");
  return out;
}

/** True if the string likely contains real HTML tags (not plain/markdown copy). */
function looksLikeHtmlFragment(s: string): boolean {
  return /<[a-z][a-z0-9!\-.]*\b/i.test(s.trim());
}

/**
 * When the model sends Markdown or plain text instead of HTML, convert to a minimal safe
 * fragment so the preview is structured instead of one broken blob.
 */
function plainOrMarkdownToSafeHtml(raw: string): string {
  const t = raw.trim();
  if (!t) return "";

  const blocks = t.split(/\n\n+/);
  const parts: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim());
    const nonEmpty = lines.filter((l) => l.length > 0);

    if (
      nonEmpty.length >= 2 &&
      nonEmpty.every((l) => /^[-*]\s+/.test(l))
    ) {
      const items = nonEmpty.map((l) =>
        escapeHtmlText(l.replace(/^[-*]\s+/, "")),
      );
      parts.push(`<ul>${items.map((it) => `<li>${it}</li>`).join("")}</ul>`);
      continue;
    }

    const first = nonEmpty[0] ?? "";
    const hm = first.match(/^(#{1,4})\s+(.+)$/);
    if (hm && nonEmpty.length === 1) {
      const level = Math.min(hm[1].length, 4);
      parts.push(`<h${level}>${escapeHtmlText(hm[2])}</h${level}>`);
      continue;
    }
    if (hm && nonEmpty.length > 1) {
      const level = Math.min(hm[1].length, 4);
      parts.push(`<h${level}>${escapeHtmlText(hm[2])}</h${level}>`);
      const rest = nonEmpty.slice(1).join("\n");
      parts.push(`<p>${escapeHtmlText(rest).replace(/\n/g, "<br />")}</p>`);
      continue;
    }

    parts.push(`<p>${escapeHtmlText(block).replace(/\n/g, "<br />")}</p>`);
  }

  return parts.join("");
}

/**
 * Safe subset for LLM-generated landing HTML (no scripts, safe links).
 */
export function sanitizeLpHtml(raw: string): string {
  let trimmed = stripArtifactBackslashes(unescapeModelStringEscapes(raw.trim()));
  if (!trimmed) return "";
  if (!looksLikeHtmlFragment(trimmed)) {
    trimmed = plainOrMarkdownToSafeHtml(trimmed);
  }
  if (!trimmed) return "";
  return sanitizeHtml(trimmed, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "p",
      "ul",
      "ol",
      "li",
      "a",
      "strong",
      "em",
      "b",
      "i",
      "blockquote",
      "br",
      "hr",
      "section",
      "article",
      "header",
      "footer",
      "main",
      "div",
      "span",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel", "title"],
      img: ["src", "alt", "width", "height", "loading", "decoding"],
      "*": ["class", "id"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          ...(attribs.target === "_blank"
            ? { rel: "noopener noreferrer" }
            : {}),
        },
      }),
    },
  });
}
