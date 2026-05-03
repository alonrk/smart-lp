import { google } from "@ai-sdk/google";
import { convertToCoreMessages, streamText, tool, type Message } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractThemeFromUrl } from "@/lib/theme-extract";
import {
  defaultLpContent,
  lpContentSchema,
  type LpContent,
} from "@/types/lp";
import {
  coerceAiLpContentShape,
  normalizePersistedLpContent,
} from "@/lib/lp-persist-normalize";
import { lpAgentSystem } from "@/lib/ai/prompts";
import { nanoid } from "nanoid";
import { listWixSitesForUser, wixSiteTheme } from "@/lib/wix/user-sites";

export const maxDuration = 60;

/** Gemini via Google Generative AI — set `GOOGLE_GENERATIVE_AI_API_KEY` in `.env`. */
function model() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "Set GOOGLE_GENERATIVE_AI_API_KEY (e.g. from https://aistudio.google.com/apikey).",
    );
  }
  return google("gemini-2.5-flash");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const body = await req.json();
  const raw = (body.messages ?? []) as Message[];
  let messages: ReturnType<typeof convertToCoreMessages>;
  try {
    messages = convertToCoreMessages(
      raw.map((m) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip client message id
        const { id, ...rest } = m;
        return rest;
      }) as Array<Omit<Message, "id">>,
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid message format" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const lpId: string | undefined = body.landingPageId;

  let result;
  try {
    result = streamText({
    model: model(),
    system: lpAgentSystem,
    messages,
    /** Must be ≥ client useChat maxSteps (12) so tool chain (e.g. extract + save) is not cut off. */
    maxSteps: 16,
    tools: {
      extractThemeFromUrl: tool({
        description:
          "Fetch the site's homepage HTML and return branding + content hints: document title, og:title, meta/og description, first visible h1/h2 text (when static HTML), plus theme (colors, font hint, logo URL). Use these hints together with the user's stated campaign goal—do not assume the homepage headline equals the campaign angle.",
        parameters: z.object({ url: z.string() }),
        execute: async ({ url }) => {
          try {
            const t = await extractThemeFromUrl(url);
            return t;
          } catch (e) {
            return { error: String(e) };
          }
        },
      }),
      wixListSites: tool({
        description:
          "List Wix sites for the connected user. Requires Wix account connection in settings.",
        parameters: z.object({ nameSearch: z.string().optional() }),
        execute: async ({ nameSearch }) => {
          return listWixSitesForUser(userId, nameSearch);
        },
      }),
      wixGetSiteTheme: tool({
        description:
          "Get human-readable theme summary for a Wix site the user selected (name, id).",
        parameters: z.object({ siteId: z.string() }),
        execute: async ({ siteId }) => wixSiteTheme(userId, siteId),
      }),
      saveOrUpdateLandingPage: tool({
        description:
          "Persist landing page JSON. Pass campaignGoal and sourceUrl when you know them so the editor tracks intent and source site. Include content.bodyHtml (semantic HTML aligned with that goal) plus sections with at least form+footer; merge full theme from extractThemeFromUrl (logoUrl, colors, fontFamily). Sanitized on save. Return value includes nextStepForAssistant.",
        parameters: z.object({
          name: z.string().optional(),
          campaignGoal: z.string().optional(),
          sourceUrl: z.string().optional(),
          content: z.unknown().optional(),
        }),
        execute: async ({ name, campaignGoal, sourceUrl, content }) => {
          let parsed: LpContent;
          if (content) {
            const r = lpContentSchema.safeParse(content);
            parsed = r.success ? r.data : coerceAiLpContentShape(content);
          } else {
            parsed = defaultLpContent();
          }
          parsed = normalizePersistedLpContent(parsed);
          if (lpId) {
            const existing = await prisma.landingPage.findFirst({
              where: { id: lpId, userId },
            });
            if (!existing) return { error: "Landing page not found" };
            const nextVersion = existing.currentVersion + 1;
            await prisma.landingPageVersion.deleteMany({
              where: {
                landingPageId: existing.id,
                version: { gt: existing.currentVersion },
              },
            });
            await prisma.landingPageVersion.deleteMany({
              where: {
                landingPageId: existing.id,
                version: existing.currentVersion,
              },
            });
            await prisma.landingPageVersion.create({
              data: {
                landingPageId: existing.id,
                version: existing.currentVersion,
                contentJson: existing.contentJson,
                trackingJson: JSON.stringify({
                  gtmId: existing.gtmId,
                  gtagId: existing.gtagId,
                  metaPixelId: existing.metaPixelId,
                  tiktokPixelId: existing.tiktokPixelId,
                  useGtm: existing.useGtm,
                }),
              },
            });
            const updated = await prisma.landingPage.update({
              where: { id: lpId },
              data: {
                name: name ?? existing.name,
                campaignGoal: campaignGoal ?? existing.campaignGoal,
                sourceUrl: sourceUrl ?? existing.sourceUrl,
                contentJson: JSON.stringify(parsed),
                currentVersion: nextVersion,
              },
            });
            return {
              id: updated.id,
              slug: updated.slug,
              version: nextVersion,
              nextStepForAssistant:
                "Acknowledge save briefly. Do not repeat Preview-panel instructions. Do not invent public https URLs for the page.",
            };
          }
          const slug = nanoid(10);
          const created = await prisma.landingPage.create({
            data: {
              userId,
              name: name ?? parsed.title,
              slug,
              contentJson: JSON.stringify(parsed),
              campaignGoal: campaignGoal ?? null,
              sourceUrl: sourceUrl ?? null,
            },
          });
          return {
            id: created.id,
            slug: created.slug,
            version: 1,
            created: true,
            nextStepForAssistant:
              "Acknowledge save briefly. Do not repeat Preview-panel instructions. Do not invent public https URLs for the page.",
          };
        },
      }),
    },
  });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Chat failed";
    return new Response(JSON.stringify({ error: msg }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  const useData = typeof result.toDataStreamResponse === "function";
  if (useData) {
    return result.toDataStreamResponse({
      getErrorMessage: (err: unknown) =>
        err instanceof Error ? err.message : String(err ?? "Stream error"),
    });
  }
  return result.toTextStreamResponse();
}
