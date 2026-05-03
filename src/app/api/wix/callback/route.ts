import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exchangeWixCode } from "@/lib/wix/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const u = new URL(req.url);
  const code = u.searchParams.get("code");
  const err = u.searchParams.get("error");
  if (err || !code) {
    return NextResponse.redirect(
      new URL(`/app/settings?wix=error&reason=${encodeURIComponent(err ?? "no_code")}`, req.url),
    );
  }
  try {
    const tokens = await exchangeWixCode(code);
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;
    await prisma.wixConnection.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt,
      },
    });
  } catch (e) {
    return NextResponse.redirect(
      new URL(
        `/app/settings?wix=error&reason=${encodeURIComponent(String(e))}`,
        req.url,
      ),
    );
  }
  return NextResponse.redirect(new URL("/app/settings?wix=connected", req.url));
}
