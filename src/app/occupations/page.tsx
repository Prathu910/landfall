import type { Metadata } from "next";
import { occupationIndex } from "@/components/data/occupation-index";
import { OccupationSearch } from "@/components/occupation/occupation-search";
import { Guilloche } from "@/components/guilloche/guilloche";
import Link from "next/link";
import { LargestPools } from "@/components/occupation/largest-pools";
import { occupationPath } from "@/lib/occupation-page/slug";
import { loadManifest, loadOccupationCore } from "@/lib/data/load-server";
import {
  currentEntries,
  directoryAnswer,
  largest189Pools,
} from "@/lib/occupation-page/directory";
import { loadLatestRound } from "@/lib/updates/load-server";
import { formatDate } from "@/lib/migration";
import { formatMonth } from "@/lib/report/copy";
import styles from "@/components/occupation/occupation-shell.module.css";
import { monthEnd } from "@/lib/data/report-source";
import { sitePageMetadata } from "@/lib/seo/page-meta";
import { occupationsPage, sitePageJsonLd } from "@/lib/seo/site-pages";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_INDEXABLE } from "@/lib/site";

const ITEMS = [...occupationIndex]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((e) => ({ ...e, path: occupationPath(e) }));

// Counts and rankings read only the occupations still in the snapshot.
const CURRENT = currentEntries(ITEMS);
const PUBLISHED = CURRENT.filter((item) => item.hasData);

const PAGE = occupationsPage(
  PUBLISHED.length,
  formatDate(monthEnd(loadManifest().asAt)),
);

export const metadata: Metadata = sitePageMetadata(
  PAGE,
  SITE_INDEXABLE ? {} : { robots: { index: false, follow: false } },
);

export default function OccupationsPage() {
  const manifest = loadManifest();
  const published = PUBLISHED.length;
  const round = loadLatestRound();
  const answer = directoryAnswer({
    total: CURRENT.length,
    withData: published,
    asAt: monthEnd(manifest.asAt),
    round,
  });
  const pools = largest189Pools(
    PUBLISHED.flatMap((item) => {
      const core = loadOccupationCore(item.code);
      return core ? [{ core, path: item.path }] : [];
    }),
    manifest.asAt,
  );
  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.directoryHead}>
          <Guilloche
            art="report-passport-corner"
            className={styles.directoryArt}
          />
          <h1>Start with your occupation.</h1>
          <p className={styles.intro}>
            {answer} Each page shows the published EOI pools by points, recent
            189 cut-offs and state nomination evidence; every occupation’s
            recent cut-offs are also in{" "}
            <Link href="/occupations/189-cut-offs/">one table</Link>.
          </p>
          <div className={styles.directoryMeta}>
            <span>{published} occupations with published data</span>
            <span>
              Snapshot ·{" "}
              <time dateTime={manifest.asAt}>{formatMonth(manifest.asAt)}</time>
            </span>
            <span>
              Checked ·{" "}
              <time dateTime={manifest.checkedAt}>
                {formatDate(manifest.checkedAt)}
              </time>
            </span>
          </div>
        </header>
        <OccupationSearch items={ITEMS} />
        <LargestPools pools={pools} month={formatMonth(manifest.asAt)} />
        <aside className={styles.directoryNote}>
          <h2>A starting point for your PR research.</h2>
          <p>
            189 and 190 are permanent visas; 491 is provisional. An occupation
            appearing here or on a state list does not establish eligibility.
            Counts are expressions of interest (EOIs), not unique people.
          </p>
          <a href="/check/">
            Check your own points <span aria-hidden="true">↗</span>
          </a>
        </aside>
      </div>
      <JsonLd
        data={sitePageJsonLd(PAGE, {
          type: "CollectionPage",
          breadcrumb: false,
          dateModified: manifest.checkedAt,
        })}
      />
    </main>
  );
}
