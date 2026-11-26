import type { MetadataRoute } from "next";
import { occupationIndex } from "../components/data/occupation-index";
import { GUIDE_CHECKED_AT } from "../data/guide/sources";
import { loadManifest, loadOccupationCore } from "../lib/data/load-server";
import { LEGAL_SLUGS, LEGAL_UPDATED } from "../lib/legal/copy";
import type { OccupationCore } from "../lib/data/types";
import { sitemapEntries } from "../lib/occupation-page/meta";
import { SITE_URL } from "../lib/site";
import { listRecapMonths, loadRecap } from "../lib/updates/load-server";
import { updatesSitemapEntries } from "../lib/updates/sitemap";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const cores = occupationIndex
    .filter((e) => e.hasData)
    .flatMap((e) => loadOccupationCore(e.code) ?? []) as OccupationCore[];
  return [
    ...sitemapEntries(
      cores,
      occupationIndex,
      loadManifest().checkedAt,
      GUIDE_CHECKED_AT,
    ),
    ...updatesSitemapEntries(listRecapMonths().map((m) => loadRecap(m))),
    // The legal pages are dated by their last revision, not the data.
    ...LEGAL_SLUGS.map((slug) => ({
      url: `${SITE_URL}/${slug}/`,
      lastModified: LEGAL_UPDATED,
    })),
  ];
}
