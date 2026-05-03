import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ensureFormSectionsHaveFields } from "@/lib/lp-persist-normalize";
import { lpContentSchema } from "@/types/lp";
import { LpRenderer } from "@/components/lp/lp-renderer";
import {
  TrackingBodyNoscript,
  TrackingHeadScripts,
} from "@/lib/tracking-head";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lp = await prisma.landingPage.findFirst({
    where: { slug, status: "published" },
  });
  if (!lp) return { title: "Page" };
  try {
    const c = ensureFormSectionsHaveFields(
      lpContentSchema.parse(JSON.parse(lp.contentJson)),
    );
    return { title: c.title, description: c.description };
  } catch {
    return { title: lp.name };
  }
}

export default async function PublicLpPage({ params }: Props) {
  const { slug } = await params;
  const lp = await prisma.landingPage.findFirst({
    where: { slug, status: "published" },
  });
  if (!lp) notFound();
  const content = ensureFormSectionsHaveFields(
    lpContentSchema.parse(JSON.parse(lp.contentJson)),
  );
  await prisma.landingPage.update({
    where: { id: lp.id },
    data: { viewCount: { increment: 1 } },
  });
  return (
    <>
      <TrackingHeadScripts
        useGtm={lp.useGtm}
        gtmId={lp.gtmId}
        gtagId={lp.gtagId}
        metaPixelId={lp.metaPixelId}
        tiktokPixelId={lp.tiktokPixelId}
      />
      <TrackingBodyNoscript gtmId={lp.useGtm && lp.gtmId ? lp.gtmId : null} />
      <LpRenderer
        content={content}
        slug={slug}
        consentBannerEnabled={lp.consentBannerEnabled}
      />
    </>
  );
}
