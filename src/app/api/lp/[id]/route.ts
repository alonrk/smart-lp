import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  agentChatJsonTooLarge,
} from "@/lib/agent-chat-persist";
import { ensureSqliteDatabaseUrl } from "@/lib/sqlite-database-url";
import { lpContentSchema } from "@/types/lp";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const patchSchema = z.object({
  name: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  campaignGoal: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  content: z.unknown().optional(),
  metaPixelId: z.string().nullable().optional(),
  gtagId: z.string().nullable().optional(),
  gtmId: z.string().nullable().optional(),
  tiktokPixelId: z.string().nullable().optional(),
  useGtm: z.boolean().optional(),
  leadWebhookUrl: z.string().nullable().optional(),
  consentBannerEnabled: z.boolean().optional(),
  wixSiteId: z.string().nullable().optional(),
  /** Replaces stored campaign agent transcript for this page (UIMessage-like JSON array). */
  agentMessages: z.array(z.unknown()).max(4000).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const lp = await prisma.landingPage.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!lp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lp });
}

export async function PATCH(req: Request, ctx: Ctx) {
  ensureSqliteDatabaseUrl();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await prisma.landingPage.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const d = parsed.data;
  if (d.agentMessages !== undefined && agentChatJsonTooLarge(d.agentMessages)) {
    return NextResponse.json(
      { error: "Agent chat too large" },
      { status: 413 },
    );
  }
  let contentJson: string | undefined;
  let nextVersion = existing.currentVersion;
  if (d.content !== undefined) {
    const c = lpContentSchema.safeParse(d.content);
    if (!c.success) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }
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
    contentJson = JSON.stringify(c.data);
    nextVersion = existing.currentVersion + 1;
  }
  let agentChatJson: string | undefined;
  if (d.agentMessages !== undefined) {
    try {
      agentChatJson = JSON.stringify(d.agentMessages);
    } catch {
      return NextResponse.json(
        { error: "Could not serialize agent messages" },
        { status: 400 },
      );
    }
  }

  try {
    const lp = await prisma.landingPage.update({
      where: { id },
      data: {
        ...(agentChatJson !== undefined && { agentChatJson }),
        ...(d.name !== undefined && { name: d.name }),
        ...(d.status !== undefined && { status: d.status }),
        ...(d.campaignGoal !== undefined && { campaignGoal: d.campaignGoal }),
        ...(d.sourceUrl !== undefined && { sourceUrl: d.sourceUrl }),
        ...(d.metaPixelId !== undefined && { metaPixelId: d.metaPixelId }),
        ...(d.gtagId !== undefined && { gtagId: d.gtagId }),
        ...(d.gtmId !== undefined && { gtmId: d.gtmId }),
        ...(d.tiktokPixelId !== undefined && {
          tiktokPixelId: d.tiktokPixelId,
        }),
        ...(d.useGtm !== undefined && { useGtm: d.useGtm }),
        ...(d.leadWebhookUrl !== undefined && {
          leadWebhookUrl: d.leadWebhookUrl,
        }),
        ...(d.consentBannerEnabled !== undefined && {
          consentBannerEnabled: d.consentBannerEnabled,
        }),
        ...(d.wixSiteId !== undefined && { wixSiteId: d.wixSiteId }),
        ...(contentJson !== undefined && { contentJson }),
        ...(contentJson !== undefined && { currentVersion: nextVersion }),
      },
    });
    return NextResponse.json({ lp });
  } catch (e) {
    console.error("PATCH /api/lp/[id]", e);
    const msg = e instanceof Error ? e.message : "Update failed";
    const code =
      e instanceof Prisma.PrismaClientKnownRequestError ? e.code : undefined;
    const meta =
      e instanceof Prisma.PrismaClientKnownRequestError
        ? e.meta
        : undefined;
    return NextResponse.json(
      {
        error: msg,
        ...(code && { prismaCode: code }),
        ...(meta && Object.keys(meta).length > 0 && { prismaMeta: meta }),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const result = await prisma.landingPage.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
