import { load } from "cheerio";
import type { LpTheme } from "@/types/lp";

const UA =
  "Mozilla/5.0 (compatible; SmartLP/1.0; +https://localhost) AppleWebKit/537.36";

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("URL is required");
  const u = new URL(
    trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
  );
  return u.toString();
}

function parseColorFromText(text: string | undefined | null): string | null {
  if (!text) return null;
  const m = text.match(
    /#([0-9a-fA-F]{3,6})|rgb\([^)]+\)|hsl\([^)]+\)/,
  );
  return m ? m[0] : null;
}

export async function extractThemeFromUrl(urlInput: string): Promise<{
  sourceUrl: string;
  title: string | null;
  /** Open Graph title when present; often cleaner than document title. */
  ogTitle: string | null;
  metaDescription: string | null;
  /** First h1 or h2 text from HTML; may be empty on JS-rendered sites. */
  firstHeading: string | null;
  theme: LpTheme;
}> {
  const sourceUrl = normalizeUrl(urlInput);
  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch page: ${res.status}`);
  }
  const html = await res.text();
  const $ = load(html);
  const title = $("title").first().text().trim() || null;
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;
  /** Visible hero headline text from static HTML (SPA shells may be empty). */
  const firstHeading =
    $("h1").first().text().trim() ||
    $("h2").first().text().trim() ||
    null;
  const metaTheme = parseColorFromText(
    $('meta[name="theme-color"]').attr("content") ?? null,
  );
  let fontFamily = "ui-sans-serif, system-ui, sans-serif";
  const fontLink = $('link[rel="stylesheet"]')
    .toArray()
    .map((el) => $(el).attr("href"))
    .find(
      (href) => href && /fonts\.(googleapis|gstatic)/.test(href) && href,
    );
  if (fontLink) {
    const f = /family=([^&]+)/.exec(fontLink);
    if (f) {
      try {
        fontFamily = decodeURIComponent(f[1].replace(/\+/g, " "));
      } catch {
        /* keep default */
      }
    }
  }
  const bodyStyle = $("body").attr("style");
  const bodyBg = parseColorFromText(bodyStyle);
  const headingStyleAttr = $("h1, h2").first().attr("style");
  const headingColor = parseColorFromText(headingStyleAttr);
  const theme: LpTheme = {
    primary: headingColor ?? "#0f766e",
    background: bodyBg ?? "#fafafa",
    text: "#0a0a0a",
    fontFamily,
    logoUrl: null,
    source: "crawl",
  };
  if (metaTheme) theme.primary = metaTheme;
  const ogImage = $('meta[property="og:image"]').attr("content");
  const appleIcon = $('link[rel="apple-touch-icon"]').attr("href");
  const icon = $('link[rel="icon"]').attr("href");
  const tryResolve = (h?: string) => {
    if (!h) return null;
    try {
      return new URL(h, sourceUrl).toString();
    } catch {
      return h;
    }
  };

  /** Prefer real header logos over og:image (often a 1200×630 social image, not the wordmark). */
  let headerLogoSrc: string | undefined;
  $("header img[src], [role='banner'] img[src]").each((_, el) => {
    if (headerLogoSrc) return;
    const $el = $(el);
    const src = $el.attr("src");
    if (!src || /pixel|tracker|spacer|1x1/i.test(src)) return;
    const cls = ($el.attr("class") || "").toLowerCase();
    const alt = ($el.attr("alt") || "").toLowerCase();
    const pid = ($el.parent().attr("class") || "").toLowerCase();
    if (
      cls.includes("logo") ||
      alt.includes("logo") ||
      alt.includes("brand") ||
      pid.includes("logo")
    ) {
      headerLogoSrc = src;
    }
  });
  if (!headerLogoSrc) {
    const first = $("header img[src]").first().attr("src");
    if (first && !/pixel|tracker|1x1/i.test(first)) headerLogoSrc = first;
  }

  theme.logoUrl =
    tryResolve(headerLogoSrc) ??
    tryResolve(appleIcon) ??
    tryResolve(icon) ??
    tryResolve(ogImage) ??
    null;
  return {
    sourceUrl,
    title,
    ogTitle,
    metaDescription,
    firstHeading,
    theme,
  };
}
