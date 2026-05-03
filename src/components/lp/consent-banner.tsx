"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Optional cookie/consent notice for third-party marketing pixels. SMBs are responsible
 * for legal compliance; this is a light UI placeholder.
 */
export function ConsentBanner() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-zinc-900 p-3 text-left text-sm text-zinc-50 shadow-lg">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          We use cookies and similar tools for campaign measurement. By continuing, you
          accept analytics as configured by the page owner.
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpen(false)}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
