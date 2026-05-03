"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AgentChat } from "@/components/app/agent-chat";
import { LpRenderer } from "@/components/lp/lp-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ensureFormSectionsHaveFields } from "@/lib/lp-persist-normalize";
import { lpContentSchema, type LpContent } from "@/types/lp";
import { ExternalLink, Play, Redo2, Settings2, Trash2, Undo2 } from "lucide-react";

type Lp = {
  id: string;
  name: string;
  slug: string;
  status: string;
  campaignGoal: string | null;
  sourceUrl: string | null;
  contentJson: string;
  metaPixelId: string | null;
  gtagId: string | null;
  gtmId: string | null;
  tiktokPixelId: string | null;
  useGtm: boolean;
  leadWebhookUrl: string | null;
  consentBannerEnabled: boolean;
  wixSiteId: string | null;
  viewCount: number;
  currentVersion: number;
  agentChatJson: string;
};

type VersionRow = { id: string; version: number; createdAt: string };

export function LpEditor({ id }: { id: string }) {
  const router = useRouter();
  const [lp, setLp] = useState<Lp | null>(null);
  const [content, setContent] = useState<LpContent | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch(`/api/lp/${id}`);
    if (!res.ok) {
      setErr("Failed to load page");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { lp: Lp };
    setLp(data.lp);
    try {
      setContent(
        ensureFormSectionsHaveFields(
          lpContentSchema.parse(JSON.parse(data.lp.contentJson)),
        ),
      );
    } catch {
      setErr("Invalid page content");
      setLoading(false);
      return;
    }
    const v = await fetch(`/api/lp/${id}/versions`);
    if (v.ok) {
      const j = (await v.json()) as { versions: VersionRow[] };
      setVersions(j.versions);
    }
    setLoading(false);
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);

  const versionNumbers = useMemo(
    () => versions.map((v) => v.version).sort((a, b) => a - b),
    [versions],
  );

  const prevVersion = useMemo(() => {
    if (!lp) return undefined;
    const older = versionNumbers.filter((n) => n < lp.currentVersion);
    return older.length ? Math.max(...older) : undefined;
  }, [versionNumbers, lp]);

  const nextVersion = useMemo(() => {
    if (!lp) return undefined;
    const newer = versionNumbers.filter((n) => n > lp.currentVersion);
    return newer.length ? Math.min(...newer) : undefined;
  }, [versionNumbers, lp]);

  async function saveTracking(): Promise<boolean> {
    if (!lp) return false;
    const res = await fetch(`/api/lp/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metaPixelId: lp.metaPixelId,
        gtagId: lp.gtagId,
        gtmId: lp.gtmId,
        tiktokPixelId: lp.tiktokPixelId,
        useGtm: lp.useGtm,
        leadWebhookUrl: lp.leadWebhookUrl,
        consentBannerEnabled: lp.consentBannerEnabled,
        wixSiteId: lp.wixSiteId,
      }),
    });
    if (res.ok) {
      const j = (await res.json()) as { lp: Lp };
      setLp(j.lp);
      return true;
    }
    return false;
  }

  async function publish() {
    await fetch(`/api/lp/${id}/publish`, { method: "POST" });
    await load();
  }

  async function deletePage() {
    if (
      !confirm(
        `Delete “${lp?.name ?? "this page"}”? This cannot be undone.`,
      )
    ) {
      return;
    }
    const res = await fetch(`/api/lp/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/app");
      router.refresh();
      return;
    }
    setErr("Could not delete page");
  }

  async function revert(ver: number) {
    const res = await fetch(`/api/lp/${id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: ver }),
    });
    if (res.ok) {
      const j = (await res.json()) as { lp: Lp };
      setLp(j.lp);
      setContent(
        ensureFormSectionsHaveFields(
          lpContentSchema.parse(JSON.parse(j.lp.contentJson)),
        ),
      );
      const v = await fetch(`/api/lp/${id}/versions`);
      if (v.ok) {
        const jj = (await v.json()) as { versions: VersionRow[] };
        setVersions(jj.versions);
      }
    }
  }

  if (loading || !lp || !content) {
    return <p className="text-zinc-600">{err ?? "Loading…"}</p>;
  }
  if (err && !lp) {
    return <p className="text-red-600">{err}</p>;
  }
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${origin}/p/${lp.slug}`;

  return (
    <div className="flex min-h-0 flex-col gap-6">
      <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{lp.name}</h1>
          <p className="text-sm text-zinc-500">
            Status: <strong>{lp.status}</strong> · v{lp.currentVersion} ·{" "}
            {lp.viewCount} views
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-0.5 rounded-md border border-zinc-200 bg-white p-0.5 shadow-sm"
            role="group"
            aria-label="Version history"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Go to older snapshot"
              disabled={prevVersion === undefined}
              onClick={() =>
                prevVersion !== undefined && void revert(prevVersion)
              }
            >
              <Undo2 className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Go to newer snapshot"
              disabled={nextVersion === undefined}
              onClick={() =>
                nextVersion !== undefined && void revert(nextVersion)
              }
            >
              <Redo2 className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            title="Tags & webhooks"
            onClick={() => setTagsOpen(true)}
          >
            <Settings2 className="h-4 w-4" aria-hidden />
          </Button>
          {lp.status !== "published" ? (
            <Button onClick={() => void publish()}>
              <Play className="mr-1 h-4 w-4" />
              Publish
            </Button>
          ) : null}
          {lp.status === "published" ? (
            <Button variant="outline" asChild>
              <Link href={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" />
                Public URL
              </Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => void deletePage()}
          >
            <Trash2 className="mr-1 h-4 w-4" aria-hidden />
            Delete
          </Button>
        </div>
      </div>

      <section
        className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] lg:grid-rows-1 lg:gap-6 lg:overflow-hidden lg:h-[min(78vh,calc(100dvh-12.5rem))] lg:max-h-[min(78vh,calc(100dvh-12.5rem))] lg:min-h-[min(78vh,calc(100dvh-12.5rem))]"
        aria-label="Preview and campaign agent"
      >
        <div className="flex min-h-[min(50vh,520px)] flex-col gap-2 lg:min-h-0 lg:overflow-hidden">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-800">Preview</h2>
            <span className="text-xs text-zinc-500">
              Draft (not published) · scroll inside the frame
            </span>
          </div>
          <div className="isolate min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-xl border-2 border-zinc-200 bg-zinc-100 shadow-inner ring-1 ring-zinc-900/5 lg:min-h-0">
            <LpRenderer
              content={content}
              slug={lp.slug}
              consentBannerEnabled={lp.consentBannerEnabled}
              variant="embedded"
            />
          </div>
        </div>

        <div className="flex min-h-[min(50vh,560px)] flex-col overflow-hidden lg:h-full lg:min-h-0">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <AgentChat
              key={id}
              landingPageId={id}
              serverAgentChatJson={lp.agentChatJson}
              className="min-h-0 flex-1 overflow-hidden"
              onAssistantTurnComplete={() => void load()}
            />
            <p className="mt-2 shrink-0 text-sm text-zinc-500 lg:mt-3">
              The preview updates when the agent saves your page.
            </p>
          </div>
        </div>
      </section>

      <Dialog open={tagsOpen} onOpenChange={setTagsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tags &amp; webhooks</DialogTitle>
            <DialogDescription>
              Prefer <strong>either</strong> GTM <strong>or</strong> direct gtag and
              pixels, to avoid double counting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="dlg-useGtm">Use GTM (loads container)</Label>
              <Switch
                id="dlg-useGtm"
                checked={lp.useGtm}
                onCheckedChange={(c) => setLp({ ...lp, useGtm: c })}
              />
            </div>
            {lp.useGtm ? (
              <div className="space-y-1">
                <Label htmlFor="dlg-gtm">GTM container ID</Label>
                <Input
                  id="dlg-gtm"
                  value={lp.gtmId ?? ""}
                  onChange={(e) =>
                    setLp({ ...lp, gtmId: e.target.value || null })
                  }
                  placeholder="GTM-XXXX"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="dlg-gtag">GA4 / gtag (measurement ID)</Label>
                  <Input
                    id="dlg-gtag"
                    value={lp.gtagId ?? ""}
                    onChange={(e) =>
                      setLp({ ...lp, gtagId: e.target.value || null })
                    }
                    placeholder="G-XXXX"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dlg-fb">Meta Pixel ID</Label>
                  <Input
                    id="dlg-fb"
                    value={lp.metaPixelId ?? ""}
                    onChange={(e) =>
                      setLp({ ...lp, metaPixelId: e.target.value || null })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dlg-tt">TikTok Pixel ID</Label>
                  <Input
                    id="dlg-tt"
                    value={lp.tiktokPixelId ?? ""}
                    onChange={(e) =>
                      setLp({ ...lp, tiktokPixelId: e.target.value || null })
                    }
                  />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="dlg-hook">Lead webhook URL (optional)</Label>
              <Input
                id="dlg-hook"
                value={lp.leadWebhookUrl ?? ""}
                onChange={(e) =>
                  setLp({ ...lp, leadWebhookUrl: e.target.value || null })
                }
                placeholder="https://…"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="dlg-consent">Consent banner</Label>
              <Switch
                id="dlg-consent"
                checked={lp.consentBannerEnabled}
                onCheckedChange={(c) =>
                  setLp({ ...lp, consentBannerEnabled: c })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dlg-wix">Wix site ID (optional)</Label>
              <Input
                id="dlg-wix"
                value={lp.wixSiteId ?? ""}
                onChange={(e) =>
                  setLp({ ...lp, wixSiteId: e.target.value || null })
                }
              />
            </div>
            <Button
              type="button"
              onClick={() =>
                void saveTracking().then((ok) => ok && setTagsOpen(false))
              }
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
