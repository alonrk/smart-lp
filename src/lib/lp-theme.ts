import type { LpTheme } from "@/types/lp";

const FALLBACK_BG = "#fafafa";
const FALLBACK_FG = "#171717";
const FALLBACK_PRIMARY = "#0f766e";

/** Parse #rgb or #rrggbb; named colors return null. */
function parseHex(hex: string): [number, number, number] | null {
  const s = hex.trim();
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(bg: string, fg: string): number | null {
  const a = parseHex(bg);
  const b = parseHex(fg);
  if (!a || !b) return null;
  const L1 = luminance(a);
  const L2 = luminance(b);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function pickFgForBg(bg: string): string {
  const rgb = parseHex(bg);
  if (!rgb) return FALLBACK_FG;
  const L = luminance(rgb);
  return L > 0.45 ? "#171717" : "#fafafa";
}

/**
 * Ensures background / body text / primary are usable for LP preview + public page.
 * Fixes white-on-white and other low-contrast pairs from crawled themes or bad model output.
 */
export function resolveLpTheme(theme: LpTheme): {
  background: string;
  text: string;
  primary: string;
} {
  const background = theme.background?.trim() || FALLBACK_BG;
  let text = theme.text?.trim() || FALLBACK_FG;
  let primary = theme.primary?.trim() || FALLBACK_PRIMARY;

  const cText = contrastRatio(background, text);
  if (cText !== null && cText < 2.2) {
    text = pickFgForBg(background);
  }

  /** Primary is mostly used as solid fill behind white label — avoid near-white primaries. */
  let cPri = contrastRatio(background, primary);
  if (
    cPri !== null &&
    cPri < 1.25 &&
    parseHex(primary) &&
    luminance(parseHex(primary)!) > 0.85
  ) {
    primary = FALLBACK_PRIMARY;
  }

  return { background, text, primary };
}
