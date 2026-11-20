import type { Metadata } from "next";
import { occupationIndex } from "@/components/data/occupation-index";
import { OccupationSearch } from "@/components/occupation/occupation-search";
import { occupationPath } from "@/lib/occupation-page/slug";
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
  return (
    <main id="main" className="container">
      <div className="page-head">
        <h1>Occupations</h1>
        <p>
          Each occupation page shows the published SkillSelect pool, recent 189
          invitation rounds and which states list it. Counts are EOIs, not
          people.
        </p>
      </div>
      <OccupationSearch items={ITEMS} />
    </main>
  );
}
