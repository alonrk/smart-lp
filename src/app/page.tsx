import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-8 px-6 py-24 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-teal-400">
          Smart campaign LPs
        </p>
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
          Build conversion-focused pages for your ads, fast.
        </h1>
        <p className="max-w-xl text-lg text-zinc-300">
          Tell the agent your campaign goal and your website. We pull your theme, wire the
          right CTA, and help you set Meta, Google, GTM, and TikTok tags—plus Wix
          when you need it.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {session?.user ? (
            <Button asChild className="bg-teal-500 text-white hover:bg-teal-400">
              <Link href="/app">Open dashboard</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                className="bg-teal-500 text-white hover:bg-teal-400"
              >
                <Link href="/register">Get started</Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="border-zinc-500 text-zinc-100 hover:bg-zinc-800"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
