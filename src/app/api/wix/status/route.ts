import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const conn = await prisma.wixConnection.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({
    connected: !!conn,
    lastSiteId: conn?.lastSiteId ?? null,
    lastSiteName: conn?.lastSiteName ?? null,
  });
}
