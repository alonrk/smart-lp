import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOutAction } from "./actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/app" className="font-semibold text-zinc-900">
            Smart LP
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="text-zinc-600 hover:text-zinc-900" href="/app">
              Pages
            </Link>
            <Link className="text-zinc-600 hover:text-zinc-900" href="/app/settings">
              Settings
            </Link>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
