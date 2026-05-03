import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  slug: z.string(),
  fields: z.record(z.string()),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { slug, fields } = parsed.data;
  const lp = await prisma.landingPage.findFirst({
    where: { slug, status: "published" },
  });
  if (!lp) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (lp.leadWebhookUrl) {
    try {
      await fetch(lp.leadWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "smart-lp",
          landingPageId: lp.id,
          slug: lp.slug,
          fields,
          createdAt: new Date().toISOString(),
        }),
      });
    } catch {
      return NextResponse.json(
        { error: "Webhook failed" },
        { status: 502 },
      );
    }
  }
  return NextResponse.json({ ok: true });
}
