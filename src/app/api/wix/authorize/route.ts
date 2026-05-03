import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { wixAuthorizeUrl } from "@/lib/wix/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL));
  }
  const url = wixAuthorizeUrl();
  if (url.startsWith("/")) {
    return NextResponse.redirect(
      new URL(url, process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
    );
  }
  return NextResponse.redirect(url);
}
