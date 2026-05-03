"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { defaultLpContent } from "@/types/lp";
import { nanoid } from "nanoid";
import { redirect } from "next/navigation";

export async function createLandingPage() {
  const s = await auth();
  if (!s?.user?.id) return;
  const c = defaultLpContent();
  const lp = await prisma.landingPage.create({
    data: {
      userId: s.user.id,
      name: c.title,
      slug: nanoid(10),
      contentJson: JSON.stringify(c),
    },
  });
  redirect(`/app/lp/${lp.id}`);
}
