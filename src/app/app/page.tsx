import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { createLandingPage } from "./create-lp-action";
import { DeleteLpButton } from "@/components/app/delete-lp-button";

export default async function AppHomePage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const items = await prisma.landingPage.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Landing pages</h1>
        <form action={createLandingPage}>
          <Button type="submit" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            New page
          </Button>
        </form>
      </div>
      {items.length === 0 ? (
        <p className="text-zinc-600">No pages yet. Create one to get started.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((it) => (
            <li key={it.id} className="flex gap-2">
              <Link href={`/app/lp/${it.id}`} className="min-w-0 flex-1">
                <Card className="h-full border-zinc-200 transition hover:border-zinc-300">
                  <CardHeader>
                    <CardTitle className="text-base">{it.name}</CardTitle>
                    <p className="text-xs text-zinc-500">
                      {it.status} · {it.viewCount} views · {it.slug}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {it.campaignGoal ? (
                      <p className="text-sm text-zinc-600 line-clamp-2">
                        {it.campaignGoal}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
              <DeleteLpButton id={it.id} name={it.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
