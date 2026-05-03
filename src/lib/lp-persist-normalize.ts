import { nanoid } from "nanoid";
import { z } from "zod";
import {
  defaultLeadFormFields,
  defaultLpContent,
  lpContentSchema,
  sectionSchema,
  type LpContent,
  type LpTheme,
} from "@/types/lp";
import { sanitizeLpHtml } from "@/lib/sanitize-lp-html";
import { resolveLpTheme } from "@/lib/lp-theme";

/** Models sometimes emit `sections: []`; merge default sections so preview is never blank. */
export function normalizeSavedLpContent(parsed: LpContent): LpContent {
  if (parsed.sections.length > 0) return parsed;
  const base = defaultLpContent();
  return {
    ...parsed,
    bodyHtml: parsed.bodyHtml,
    sections: base.sections,
    theme: {
      ...base.theme,
      ...parsed.theme,
      primary: parsed.theme.primary || base.theme.primary,
      background: parsed.theme.background || base.theme.background,
      fontFamily: parsed.theme.fontFamily || base.theme.fontFamily,
    },
  };
}

/** Persist theme colors that stay readable on light/dark backgrounds. */
export function applyResolvedTheme(content: LpContent): LpContent {
  const r = resolveLpTheme(content.theme);
  return {
    ...content,
    theme: {
      ...content.theme,
      background: r.background,
      text: r.text,
      primary: r.primary,
    },
  };
}

export function finalizeParsedContent(content: LpContent): LpContent {
  const raw = content.bodyHtml?.trim();
  if (!raw) {
    return { ...content, bodyHtml: undefined };
  }
  const bodyHtml = sanitizeLpHtml(raw);
  return {
    ...content,
    bodyHtml: bodyHtml || undefined,
  };
}

/** Models often emit `type: "form"` with headline only and omit `formFields`; fill defaults so the preview shows inputs. */
export function ensureFormSectionsHaveFields(content: LpContent): LpContent {
  return {
    ...content,
    sections: content.sections.map((s) =>
      s.type === "form" && (!s.formFields || s.formFields.length === 0)
        ? { ...s, formFields: defaultLeadFormFields() }
        : s,
    ),
  };
}

/** Full pipeline used when saving or cleaning persisted LP JSON. */
export function normalizePersistedLpContent(content: LpContent): LpContent {
  return finalizeParsedContent(
    ensureFormSectionsHaveFields(
      applyResolvedTheme(normalizeSavedLpContent(content)),
    ),
  );
}

/** Parse raw JSON string; on failure returns default LP with optional title. */
export function parseLpContentJson(
  raw: string,
  fallbackTitle?: string,
): LpContent {
  try {
    const data: unknown = JSON.parse(raw);
    const r = lpContentSchema.safeParse(data);
    if (r.success) return ensureFormSectionsHaveFields(r.data);
    return ensureFormSectionsHaveFields(coerceAiLpContentShape(data));
  } catch {
    /* ignore */
  }
  return defaultLpContent(
    fallbackTitle ? { title: fallbackTitle } : undefined,
  );
}

const SECTION_TYPES = [
  "hero",
  "features",
  "testimonial",
  "cta",
  "form",
  "footer",
] as const;

type SectionType = (typeof SECTION_TYPES)[number];

function coerceSectionType(raw: unknown): SectionType {
  const s = String(raw ?? "")
    .toLowerCase()
    .trim();
  if (SECTION_TYPES.includes(s as SectionType)) return s as SectionType;
  const alias: Record<string, SectionType> = {
    header: "hero",
    banner: "hero",
    intro: "hero",
    main: "hero",
    benefits: "features",
    feature: "features",
    quote: "testimonial",
    reviews: "testimonial",
    contact: "form",
    signup: "form",
    lead: "form",
    legal: "footer",
    bottom: "footer",
    copyright: "footer",
  };
  return alias[s] ?? "hero";
}

function coerceFormFieldType(raw: unknown): "text" | "email" | "tel" | "textarea" {
  const s = String(raw ?? "")
    .toLowerCase()
    .trim();
  if (s === "email") return "email";
  if (s === "tel" || s === "phone" || s === "mobile") return "tel";
  if (
    s === "textarea" ||
    s === "message" ||
    s === "multiline" ||
    s === "comments"
  )
    return "textarea";
  return "text";
}

function coerceThemeSource(raw: unknown): LpTheme["source"] | undefined {
  if (raw === "crawl" || raw === "wix" || raw === "default") return raw;
  return undefined;
}

/**
 * Map common LLM JSON drift (enum synonyms, extra theme.source, phone vs tel)
 * into a valid LpContent. Used when strict lpContentSchema.safeParse fails.
 */
export function coerceAiLpContentShape(raw: unknown): LpContent {
  const base = defaultLpContent();
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return base;
  }
  const o = raw as Record<string, unknown>;

  const title =
    typeof o.title === "string" && o.title.trim()
      ? o.title.trim()
      : base.title;
  const description =
    typeof o.description === "string" ? o.description : base.description;
  const bodyHtml =
    typeof o.bodyHtml === "string" && o.bodyHtml.trim()
      ? o.bodyHtml
      : undefined;

  const themeIn = o.theme;
  const theme = { ...base.theme };
  if (themeIn && typeof themeIn === "object" && !Array.isArray(themeIn)) {
    const t = themeIn as Record<string, unknown>;
    if (typeof t.primary === "string" && t.primary.trim())
      theme.primary = t.primary.trim();
    if (typeof t.background === "string" && t.background.trim())
      theme.background = t.background.trim();
    if (typeof t.text === "string" && t.text.trim()) theme.text = t.text.trim();
    if (typeof t.fontFamily === "string" && t.fontFamily.trim())
      theme.fontFamily = t.fontFamily.trim();
    if (t.logoUrl === null || typeof t.logoUrl === "string")
      theme.logoUrl = t.logoUrl as string | null;
    const src = coerceThemeSource(t.source);
    if (src) theme.source = src;
  }

  let sections = base.sections;
  if (Array.isArray(o.sections) && o.sections.length > 0) {
    const mapped = o.sections
      .filter((s) => s && typeof s === "object" && !Array.isArray(s))
      .map((s) => {
        const sec = s as Record<string, unknown>;
        const id =
          typeof sec.id === "string" && sec.id.trim()
            ? sec.id.trim()
            : `sec-${nanoid(8)}`;
        const type = coerceSectionType(sec.type);
        const out: Record<string, unknown> = {
          id,
          type,
          headline:
            typeof sec.headline === "string" ? sec.headline : undefined,
          subheadline:
            typeof sec.subheadline === "string" ? sec.subheadline : undefined,
          bullets: Array.isArray(sec.bullets)
            ? sec.bullets.filter((b): b is string => typeof b === "string")
            : undefined,
          ctaLabel:
            typeof sec.ctaLabel === "string" ? sec.ctaLabel : undefined,
          ctaUrl: typeof sec.ctaUrl === "string" ? sec.ctaUrl : undefined,
          quote: typeof sec.quote === "string" ? sec.quote : undefined,
          author: typeof sec.author === "string" ? sec.author : undefined,
          legalText:
            typeof sec.legalText === "string" ? sec.legalText : undefined,
        };
        if (Array.isArray(sec.formFields)) {
          out.formFields = sec.formFields
            .filter((f) => f && typeof f === "object")
            .map((f) => {
              const ff = f as Record<string, unknown>;
              return {
                name:
                  typeof ff.name === "string" && ff.name.trim()
                    ? ff.name.trim()
                    : "field",
                label:
                  typeof ff.label === "string" && ff.label.trim()
                    ? ff.label.trim()
                    : "Field",
                type: coerceFormFieldType(ff.type),
                required: typeof ff.required === "boolean" ? ff.required : undefined,
              };
            });
        }
        return out;
      });
    const asArray = z.array(sectionSchema).safeParse(mapped);
    if (asArray.success) {
      sections = asArray.data;
    } else {
      const piecemeal = mapped
        .map((m) => sectionSchema.safeParse(m))
        .filter((r): r is z.SafeParseSuccess<z.infer<typeof sectionSchema>> => r.success)
        .map((r) => r.data);
      sections = piecemeal.length > 0 ? piecemeal : base.sections;
    }
  }

  const merged = { title, description, bodyHtml, theme, sections };
  const again = lpContentSchema.safeParse(merged);
  return ensureFormSectionsHaveFields(again.success ? again.data : base);
}
