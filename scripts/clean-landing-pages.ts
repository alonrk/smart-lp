/**
 * Normalize persisted LP JSON, or fully reset to the default template.
 *
 *   npm run db:clean-lp          # schema/theme/bodyHtml fixes only
 *   npm run db:reset-lp         # wipe each LP to a fresh default + clear version history
 *
 * Loads `.env` first (tsx does not use Next.js env).
 */
import { loadEnvAndResolveDatabaseUrl } from "./load-env-and-db";

const reset = process.argv.includes("--reset");

loadEnvAndResolveDatabaseUrl();

async function main() {
  const { prisma } = await import("../src/lib/db");
  const { defaultLpContent } = await import("../src/types/lp");
  const {
    normalizePersistedLpContent,
    parseLpContentJson,
  } = await import("../src/lib/lp-persist-normalize");

  const pages = await prisma.landingPage.findMany();
  let landingPages = 0;

  if (reset) {
    for (const p of pages) {
      const fresh = defaultLpContent({
        title: p.name,
        description: p.campaignGoal || undefined,
      });
      const out = normalizePersistedLpContent(fresh);
      await prisma.landingPageVersion.deleteMany({
        where: { landingPageId: p.id },
      });
      await prisma.landingPage.update({
        where: { id: p.id },
        data: {
          contentJson: JSON.stringify(out),
          currentVersion: 1,
        },
      });
      landingPages += 1;
      console.log("Reset LandingPage → default template", p.id, p.name);
    }
    console.log(
      `Done. Reset ${landingPages} landing page(s); version snapshots removed.`,
    );
    return;
  }

  let versions = 0;
  for (const p of pages) {
    const parsed = parseLpContentJson(p.contentJson, p.name);
    const out = normalizePersistedLpContent({
      ...parsed,
      title: parsed.title?.trim() || p.name,
    });
    await prisma.landingPage.update({
      where: { id: p.id },
      data: { contentJson: JSON.stringify(out) },
    });
    landingPages += 1;
    console.log("LandingPage", p.id, p.name);
  }

  const verRows = await prisma.landingPageVersion.findMany();
  for (const v of verRows) {
    const parsed = parseLpContentJson(v.contentJson);
    const out = normalizePersistedLpContent(parsed);
    await prisma.landingPageVersion.update({
      where: { id: v.id },
      data: { contentJson: JSON.stringify(out) },
    });
    versions += 1;
    console.log("LandingPageVersion", v.id, "v" + v.version);
  }

  console.log(
    `Done. Updated ${landingPages} landing page(s), ${versions} version snapshot(s).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/db");
    await prisma.$disconnect();
  });
