"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function deleteLandingPage(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Unauthorized" };
  }
  const result = await prisma.landingPage.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (result.count === 0) {
    return { ok: false as const, error: "Not found" };
  }
  revalidatePath("/app");
  return { ok: true as const };
}
