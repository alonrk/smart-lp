import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

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
  const versions = await prisma.landingPageVersion.findMany({
    where: { landingPageId: id },
    orderBy: { version: "desc" },
    select: { id: true, version: true, createdAt: true },
  });
  return NextResponse.json({ currentVersion: lp.currentVersion, versions });
}

const revertSchema = z.object({ version: z.number().int().positive() });

export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = revertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const v = parsed.data.version;
  const existing = await prisma.landingPage.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  /**
   * Persist the **current head** as a snapshot row (`version === currentVersion`) before
   * jumping to another version. Otherwise the live draft only lived on `LandingPage` and
   * never had a `LandingPageVersion` row — redo had no `version > current` to restore.
   */
  if (existing.currentVersion !== v) {
    await prisma.landingPageVersion.deleteMany({
      where: {
        landingPageId: id,
        version: existing.currentVersion,
      },
    });
    await prisma.landingPageVersion.create({
      data: {
        landingPageId: id,
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
  }

  const snap = await prisma.landingPageVersion.findFirst({
    where: { landingPageId: id, version: v },
  });
  if (!snap) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }
  /** Keep snapshots newer than `v` so undo/redo can move forward again. Saving new edits trims the redo branch (see chat + PATCH). */
  const t = snap.trackingJson
    ? (JSON.parse(snap.trackingJson) as Record<string, unknown>)
    : {};
  /** Restore snapshot `v` without bumping version or inserting a new snapshot row. */
  const lp = await prisma.landingPage.update({
    where: { id },
    data: {
      contentJson: snap.contentJson,
      currentVersion: v,
      gtmId: (t.gtmId as string) ?? null,
      gtagId: (t.gtagId as string) ?? null,
      metaPixelId: (t.metaPixelId as string) ?? null,
      tiktokPixelId: (t.tiktokPixelId as string) ?? null,
      useGtm: Boolean(t.useGtm),
    },
  });
  return NextResponse.json({ lp });
}
