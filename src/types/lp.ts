import { z } from "zod";

export const themeSchema = z.object({
  primary: z.string(),
  background: z.string(),
  text: z.string().optional(),
  fontFamily: z.string(),
  logoUrl: z.string().optional().nullable(),
  source: z.enum(["crawl", "wix", "default"]).optional(),
});

export const sectionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "hero",
    "features",
    "testimonial",
    "cta",
    "form",
    "footer",
  ]),
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
  formFields: z
    .array(
      z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(["text", "email", "tel", "textarea"]),
        required: z.boolean().optional(),
      }),
    )
    .optional(),
  quote: z.string().optional(),
  author: z.string().optional(),
  legalText: z.string().optional(),
});

export const lpContentSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  /** Sanitized server-side. Main landing narrative (headlines, body, benefits). */
  bodyHtml: z.string().optional(),
  theme: themeSchema,
  sections: z.array(sectionSchema),
});

export type LpContent = z.infer<typeof lpContentSchema>;
export type LpTheme = z.infer<typeof themeSchema>;

/** Standard lead fields when the model omits `formFields` (preview API requires non-empty). */
export function defaultLeadFormFields(): NonNullable<
  z.infer<typeof sectionSchema>["formFields"]
> {
  return [
    { name: "name", label: "Full name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "tel", required: false },
    { name: "message", label: "Message", type: "textarea", required: false },
  ];
}

export function defaultLpContent(overrides?: Partial<LpContent>): LpContent {
  return {
    title: "Your campaign",
    description: "Built with Smart LP",
    bodyHtml: undefined,
    theme: {
      primary: "#0f766e",
      background: "#fafafa",
      text: "#0a0a0a",
      fontFamily: "system-ui, sans-serif",
      logoUrl: null,
      source: "default",
    },
    sections: [
      {
        id: "hero-1",
        type: "hero",
        headline: "Solve your main pain in one line",
        subheadline: "Clarify the offer and who it is for.",
        ctaLabel: "Get started",
        ctaUrl: "#form",
      },
      {
        id: "form-1",
        type: "form",
        headline: "Get in touch",
        subheadline: "We will reach out shortly.",
        formFields: defaultLeadFormFields(),
        ctaLabel: "Request info",
        ctaUrl: "",
      },
      {
        id: "footer-1",
        type: "footer",
        legalText: "© Your company. All rights reserved.",
      },
    ],
    ...overrides,
  };
}
