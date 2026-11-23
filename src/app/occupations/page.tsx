import type { Metadata } from "next";
import { occupationIndex } from "@/components/data/occupation-index";
import { OccupationSearch } from "@/components/occupation/occupation-search";
import { occupationPath } from "@/lib/occupation-page/slug";
import { loadManifest } from "@/lib/data/load-server";
import { formatDate } from "@/lib/migration";
import { formatMonth } from "@/lib/report/copy";
import styles from "@/components/occupation/occupation-shell.module.css";
import { SITE_INDEXABLE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Occupations: 189, 190 and 491 data for every skilled occupation",
  alternates: { canonical: "/occupations/" },
  robots: SITE_INDEXABLE ? undefined : { index: false, follow: false },
};

const ITEMS = [...occupationIndex]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((e) => ({ ...e, path: occupationPath(e) }));

export default function OccupationsPage() {
  const manifest = loadManifest();
  const published = ITEMS.filter((item) => item.hasData).length;
  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.directoryHead}>
          <h1>Start with your occupation.</h1>
          <p className={styles.intro}>
            Look beyond the minimum points. Explore published EOI pools, 189
            invitation rounds and state nomination evidence for Australian
            skilled migration.
          </p>
          <div className={styles.directoryMeta}>
            <span>{published} occupations with published data</span>
            <span>Snapshot · {formatMonth(manifest.asAt)}</span>
            <span>Checked · {formatDate(manifest.checkedAt)}</span>
          </div>
        </header>
        <OccupationSearch items={ITEMS} />
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
    </main>
  );
}
