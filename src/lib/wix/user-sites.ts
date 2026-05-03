import { prisma } from "@/lib/db";
import { wixAccountRequest } from "./client";

/**
 * List sites for the current user's stored Wix OAuth connection.
 */
export async function listWixSitesForUser(
  userId: string,
  nameSearch?: string,
) {
  const conn = await prisma.wixConnection.findUnique({ where: { userId } });
  if (!conn) {
    return {
      connected: false as const,
      message: "Connect Wix in Settings to list sites.",
      sites: [] as { id: string; name: string }[],
    };
  }
  const url = "https://www.wixapis.com/site-list/v2/sites/query";
  const body: Record<string, unknown> = { paging: { limit: 50 } };
  if (nameSearch) {
    body.search = { fieldName: "siteDisplayName", search: nameSearch };
  }
  const res = await wixAccountRequest("POST", url, conn, body, {
    sourceDocUrl: "https://dev.wix.com/docs/rest/business-solutions/site-list/query-sites",
  });
  if (!res.ok) {
    return {
      connected: true as const,
      error: await res.text(),
      sites: [] as { id: string; name: string }[],
    };
  }
  const data = (await res.json()) as {
    sites?: { id: string; siteDisplayName?: string; name?: string }[];
    siteList?: { id: string; siteDisplayName?: string; name?: string }[];
  };
  const raw = data.sites ?? data.siteList ?? [];
  const sites = raw.map((s) => ({
    id: s.id,
    name: s.siteDisplayName ?? s.name ?? s.id,
  }));
  return { connected: true as const, sites };
}

/**
 * Return a small theme object for the agent. Uses public site + optional Wix metadata.
 */
export async function wixSiteTheme(userId: string, siteId: string) {
  const conn = await prisma.wixConnection.findUnique({ where: { userId } });
  if (!conn) {
    return { error: "Wix not connected" };
  }
  const url = `https://www.wixapis.com/business-tools/v1/sites/${encodeURIComponent(
    siteId,
  )}`;
  const res = await wixAccountRequest("GET", url, conn, null, {
    sourceDocUrl: "https://dev.wix.com/docs/rest",
  });
  if (!res.ok) {
    return { error: await res.text(), siteId };
  }
  const site = (await res.json()) as { site?: { id: string } };
  return {
    siteId,
    note:
      "Use wixListSites to confirm the site. Theme colors can be taken from the published homepage or Wix site settings in a future iteration.",
    site: site.site ?? site,
  };
}
