import { cohortWindowStart } from "../data/months";
import type { OccupationCore, OccupationIndexEntry } from "../data/types";
import { SITE_NAME, SITE_URL } from "../site";
import { formatMonth } from "../report/copy";
import type { Faq } from "./faq";
import { occupationPath } from "./slug";

const LICENSE = "https://creativecommons.org/licenses/by/3.0/au/";
const STATIC_PAGES = [
  "/",
  "/sample/",
  "/states/",
  "/methodology/",
  "/occupations/",
  "/feedback/",
];

export function relatedOccupations(
  code: string,
  index: OccupationIndexEntry[],
  limit = 6,
): { code: string; name: string; path: string }[] {
  return index
    .filter(
      (e) =>
        e.hasData && e.code !== code && e.code.slice(0, 4) === code.slice(0, 4),
    )
    .sort((a, b) => a.code.localeCompare(b.code))
    .slice(0, limit)
    .map((e) => ({ code: e.code, name: e.name, path: occupationPath(e) }));
}

/** False when there is no pool, or every pool total and score count is "<20". */
export function isIndexable(core: OccupationCore): boolean {
  return Object.values(core.pool).some(
    (pool) =>
      pool.total !== "<20" ||
      Object.values(pool.byScore).some((count) => count !== "<20"),
  );
}

export function pageTitle(core: OccupationCore): string {
  return `${core.name} (${core.code}): 189, 190 and 491 EOIs and cut-offs, ${formatMonth(core.asAt)}`;
}

export function pageDescription(summary: string[]): string {
  const text = summary.join(" ");
  if (text.length <= 160) return text;
  const cut = text.slice(0, 159);
  const space = cut.lastIndexOf(" ");
  const trimmed = (space > 0 ? cut.slice(0, space) : cut).replace(
    /[\s,;:.]+$/,
    "",
  );
  return `${trimmed}…`;
}

export function occupationJsonLd(
  core: OccupationCore,
  faq: Faq[],
  summary: string[],
  checkedAt: string,
): object[] {
  const url = SITE_URL + occupationPath(core);
  return [
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: pageTitle(core),
      description: pageDescription(summary),
      url,
      // From the oldest stored submission month to the snapshot (docs/DATA.md R8).
      temporalCoverage: `${cohortWindowStart(core.asAt)}/${core.asAt}`,
      isAccessibleForFree: true,
      license: LICENSE,
      creator: {
        "@type": "Organization",
        name: "Department of Home Affairs",
      },
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      dateModified: checkedAt,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: SITE_NAME, item: `${SITE_URL}/` },
        { name: "Occupations", item: `${SITE_URL}/occupations/` },
        { name: core.name, item: url },
      ].map((entry, i) => ({
        "@type": "ListItem",
        position: i + 1,
        ...entry,
      })),
    },
  ];
}

export function sitemapEntries(
  cores: OccupationCore[],
  index: OccupationIndexEntry[],
  checkedAt: string,
): { url: string; lastModified: string }[] {
  const withData = new Set(index.filter((e) => e.hasData).map((e) => e.code));
  const paths = [
    ...STATIC_PAGES,
    ...cores
      .filter((c) => withData.has(c.code) && isIndexable(c))
      .map((c) => occupationPath(c)),
  ];
  return paths.map((path) => ({
    url: SITE_URL + path,
    lastModified: checkedAt,
  }));
}
