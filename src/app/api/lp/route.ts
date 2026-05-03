import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { defaultLpContent } from "@/types/lp";
import { nanoid } from "nanoid";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await prisma.landingPage.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      campaignGoal: true,
      viewCount: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ items });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const content = defaultLpContent();
  const lp = await prisma.landingPage.create({
    data: {
      userId: session.user.id,
      name: content.title,
      slug: nanoid(10),
      contentJson: JSON.stringify(content),
    },
  });
  return NextResponse.json({ id: lp.id, slug: lp.slug });
}
