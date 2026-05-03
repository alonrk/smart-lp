"use client";

import { defaultLeadFormFields, type LpContent } from "@/types/lp";
import type { z } from "zod";
import { sectionSchema } from "@/types/lp";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { ConsentBanner } from "./consent-banner";
import { resolveLpTheme } from "@/lib/lp-theme";
import { sanitizeLpHtml } from "@/lib/sanitize-lp-html";
import { cn } from "@/lib/utils";

type Props = {
  content: LpContent;
  slug: string;
  consentBannerEnabled?: boolean;
  /** `embedded` = editor preview (no full-viewport min-height). */
  variant?: "full" | "embedded";
};

type Section = z.infer<typeof sectionSchema>;

export function LpRenderer({
  content,
  slug,
  consentBannerEnabled,
  variant = "full",
}: Props) {
  const t = content.theme;
  const rt = resolveLpTheme(t);
  const embedded = variant === "embedded";

  const generatedHtml = useMemo(() => {
    const raw = content.bodyHtml?.trim();
    if (!raw) return "";
    return sanitizeLpHtml(raw);
  }, [content.bodyHtml]);

  const useHtml = generatedHtml.length > 0;
  const sectionsToRender: Section[] = useHtml
    ? content.sections.filter((s) => s.type === "form" || s.type === "footer")
    : content.sections;

  if (content.sections.length === 0 && !useHtml) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 px-6 py-16 text-center text-zinc-500 ${embedded ? "min-h-[280px]" : "min-h-screen"}`}
        style={{
          background: rt.background,
          color: rt.text,
          fontFamily: t.fontFamily,
        }}
      >
        <p className="text-base font-medium text-zinc-700">No content yet</p>
        <p className="max-w-sm text-sm">
          Use the <strong>Agent</strong> tab with your goal and site URL; it will
          generate your page copy and save it here.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "relative z-0 min-h-[400px] w-full [&_a]:no-underline"
          : "min-h-screen [&_a]:no-underline"
      }
      style={{
        background: rt.background,
        color: rt.text,
        fontFamily: t.fontFamily ?? "system-ui, sans-serif",
      }}
    >
      {consentBannerEnabled ? <ConsentBanner /> : null}
      {useHtml && t.logoUrl ? (
        <div className="flex justify-center px-4 pt-8 sm:pt-10">
          {/* Hero sections are omitted when bodyHtml drives the page; still show brand mark from theme.logoUrl */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={t.logoUrl}
            alt=""
            className="h-12 w-auto max-h-14 max-w-[min(100%,240px)] object-contain object-center"
          />
        </div>
      ) : null}
      {useHtml ? (
        <div
          className="lp-generated-html mx-auto max-w-3xl px-4 py-10 sm:px-6 [&_a]:font-medium [&_a]:text-[color:inherit] [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-current [&_blockquote]:pl-4 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:my-6 [&_img]:max-h-56 [&_img]:max-w-full [&_img]:rounded-md [&_img]:object-contain [&_li]:my-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_p]:leading-relaxed [&_section]:block [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: generatedHtml }}
        />
      ) : null}
      {sectionsToRender.map((s) => (
        <SectionBlock key={s.id} section={s} content={content} rt={rt} slug={slug} />
      ))}
    </div>
  );
}

function SectionBlock({
  section: s,
  content,
  rt,
  slug,
}: {
  section: Section;
  content: LpContent;
  rt: ReturnType<typeof resolveLpTheme>;
  slug: string;
}) {
  const t = content.theme;
  if (s.type === "hero") {
    return (
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {t.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.logoUrl}
              alt=""
              className="mx-auto mb-8 h-12 w-auto object-contain"
            />
          ) : null}
          <h1 className="text-4xl font-bold tracking-tight text-inherit sm:text-5xl">
            {s.headline?.trim() || content.title}
          </h1>
          {s.subheadline ? (
            <p className="mt-4 text-lg opacity-80">{s.subheadline}</p>
          ) : null}
          {s.ctaLabel ? (
            <div className="mt-8">
              <a
                href={s.ctaUrl || "#form"}
                className="inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium text-white shadow-sm"
                style={{ backgroundColor: rt.primary }}
              >
                {s.ctaLabel}
              </a>
            </div>
          ) : null}
        </div>
      </section>
    );
  }
  if (s.type === "features") {
    const bullets = s.bullets ?? [];
    return (
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {s.headline ? (
            <h2 className="text-2xl font-semibold text-inherit">{s.headline}</h2>
          ) : null}
          {bullets.length > 0 ? (
            <ul className="mt-6 list-disc space-y-2 pl-5 text-inherit">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    );
  }
  if (s.type === "form") {
    return (
      <section id="form" className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-md">
          <Card className="border-zinc-200 bg-white/90 shadow-md">
            <CardHeader>
              {s.headline ? (
                <CardTitle className="text-xl">{s.headline}</CardTitle>
              ) : null}
              {s.subheadline ? (
                <p className="text-sm text-zinc-500">{s.subheadline}</p>
              ) : null}
            </CardHeader>
            <CardContent>
              <LeadForm
                slug={slug}
                fields={
                  s.formFields?.length
                    ? s.formFields
                    : defaultLeadFormFields()
                }
                ctaLabel={s.ctaLabel ?? "Submit"}
                primaryColor={rt.primary}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }
  if (s.type === "testimonial") {
    return (
      <section className="px-4 py-10 sm:px-6">
        <blockquote className="mx-auto max-w-2xl text-center text-lg">
          {s.quote ? <p>“{s.quote}”</p> : null}
          {s.author ? (
            <footer className="mt-2 text-sm opacity-70">— {s.author}</footer>
          ) : null}
        </blockquote>
      </section>
    );
  }
  if (s.type === "footer") {
    return (
      <footer className="border-t border-black/5 px-4 py-8 text-center text-sm opacity-70">
        {s.legalText}
      </footer>
    );
  }
  if (s.type === "cta") {
    return (
      <section className="px-4 py-10 text-center">
        {s.headline ? (
          <h2 className="text-2xl font-semibold text-inherit">{s.headline}</h2>
        ) : null}
        {s.ctaLabel && s.ctaUrl ? (
          <a
            className="mt-4 inline-block rounded-full px-6 py-3 text-sm font-medium text-white shadow-sm"
            style={{ backgroundColor: rt.primary }}
            href={s.ctaUrl}
          >
            {s.ctaLabel}
          </a>
        ) : null}
      </section>
    );
  }
  return null;
}

function LeadForm({
  slug,
  fields,
  ctaLabel,
  primaryColor,
}: {
  slug: string;
  fields: { name: string; label: string; type: string; required?: boolean }[];
  ctaLabel: string;
  primaryColor: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">(
    "idle",
  );
  const [value, setValue] = useState<Record<string, string>>({});
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, fields: value }),
      });
      if (!res.ok) throw new Error("fail");
      setStatus("ok");
    } catch {
      setStatus("err");
    }
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {fields.map((f) => (
        <div key={f.name} className="space-y-1 text-left">
          <label className="text-sm font-medium text-zinc-700" htmlFor={f.name}>
            {f.label}
            {f.required ? " *" : null}
          </label>
          {f.type === "textarea" ? (
            <textarea
              id={f.name}
              required={f.required}
              name={f.name}
              rows={4}
              className={cn(
                "flex min-h-[88px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:opacity-50",
              )}
              value={value[f.name] ?? ""}
              onChange={(e) =>
                setValue((m) => ({ ...m, [f.name]: e.target.value }))
              }
            />
          ) : (
            <Input
              id={f.name}
              required={f.required}
              name={f.name}
              type={
                f.type === "email"
                  ? "email"
                  : f.type === "tel"
                    ? "tel"
                    : "text"
              }
              value={value[f.name] ?? ""}
              onChange={(e) =>
                setValue((m) => ({ ...m, [f.name]: e.target.value }))
              }
            />
          )}
        </div>
      ))}
      <div className="pt-2">
        <button
          type="submit"
          className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white shadow-sm disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
          disabled={status === "sending" || status === "ok"}
        >
          {status === "ok" ? "Thanks!" : ctaLabel}
        </button>
      </div>
      {status === "err" ? (
        <p className="text-center text-sm text-red-600">
          Something went wrong. Try again.
        </p>
      ) : null}
    </form>
  );
}
