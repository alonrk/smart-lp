import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { wixAuthorizeUrl } from "@/lib/wix/client";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const sp = await searchParams;
  const wix = typeof sp.wix === "string" ? sp.wix : undefined;
  const conn = await prisma.wixConnection.findUnique({
    where: { userId: session.user.id },
  });
  const connectUrl = wixAuthorizeUrl();
  const isOAuthConfigured = connectUrl.startsWith("https://");
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {wix ? (
        <p className="text-sm text-amber-800">
          {wix === "connected" && "Wix connected successfully."}
          {wix === "error" && "Wix connection error. Check env and redirect URL."}
          {wix === "missing" && "Set WIX_CLIENT_ID, WIX_CLIENT_SECRET, and WIX_REDIRECT_URI in .env"}
        </p>
      ) : null}
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="text-lg">Wix</CardTitle>
          <p className="text-sm text-zinc-600">
            Connect your Wix account so the agent can list your sites and align
            your landing page with on-brand assets. Configure a Wix OAuth app and
            add the keys to your environment (see <code className="rounded bg-zinc-100 px-1">.env.example</code>).
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-zinc-600">
            Status:{" "}
            <strong>{conn ? "Connected" : "Not connected"}</strong>
            {conn?.lastSiteName ? ` · last site: ${conn.lastSiteName}` : null}
          </p>
          {isOAuthConfigured ? (
            <Button asChild>
              <Link href="/api/wix/authorize">Connect Wix</Link>
            </Button>
          ) : (
            <p className="text-sm text-zinc-500">
              Add Wix OAuth credentials to enable the Connect button.
            </p>
          )}
        </CardContent>
      </Card>
      <p>
        <Button variant="outline" asChild>
          <Link href="/app">Back to pages</Link>
        </Button>
      </p>
    </div>
  );
}
