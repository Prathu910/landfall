import type { MetadataRoute } from "next";
import { occupationIndex } from "@/components/data/occupation-index";
import { GUIDE_CHECKED_AT } from "@/data/guide/sources";
import { loadManifest, loadOccupationCore } from "@/lib/data/load-server";
import type { OccupationCore } from "@/lib/data/types";
import { sitemapEntries } from "@/lib/occupation-page/meta";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const cores = occupationIndex
    .filter((e) => e.hasData)
    .flatMap((e) => loadOccupationCore(e.code) ?? []) as OccupationCore[];
  return sitemapEntries(
    cores,
    occupationIndex,
    loadManifest().checkedAt,
    GUIDE_CHECKED_AT,
  );
}
