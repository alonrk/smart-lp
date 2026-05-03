"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteLandingPage } from "@/app/app/delete-lp-action";

type Props = {
  id: string;
  name: string;
};

export function DeleteLpButton({ id, name }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!confirm(`Delete “${name}”? This cannot be undone.`)) return;
    setPending(true);
    try {
      const r = await deleteLandingPage(id);
      if (r.ok) {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={pending}
      className="h-9 w-9 shrink-0 text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
      title="Delete landing page"
      aria-label={`Delete ${name}`}
      onClick={() => void handleClick()}
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </Button>
  );
}
