import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-6 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-zinc-600">This landing page is not available or is not published.</p>
      <Button asChild>
        <Link href="/">Home</Link>
      </Button>
    </div>
  );
}
