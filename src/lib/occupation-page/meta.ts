import { cohortWindowStart } from "../data/months";
import type { OccupationCore, OccupationIndexEntry } from "../data/types";
import { SITE_NAME, SITE_URL } from "../site";
import { formatMonth } from "../report/copy";
import { breadcrumbLd, faqPageLd } from "../seo/json-ld";
import type { Faq } from "./faq";
import { occupationPath } from "./slug";

const LICENSE = "https://creativecommons.org/licenses/by/3.0/au/";
/** The PR guide's pages, dated by the day their official sources were read. */
const GUIDE_PATHS = ["/guide/", "/guide/189/", "/guide/190/", "/guide/491/"];
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
    faqPageLd(faq),
    breadcrumbLd([
      { name: SITE_NAME, item: `${SITE_URL}/` },
      { name: "Occupations", item: `${SITE_URL}/occupations/` },
      { name: core.name, item: url },
    ]),
  ];
}

/** `checkedAt` dates the data pages; `guideCheckedAt` dates the PR guide. */
export function sitemapEntries(
  cores: OccupationCore[],
  index: OccupationIndexEntry[],
  checkedAt: string,
  guideCheckedAt: string,
): { url: string; lastModified: string }[] {
  const withData = new Map(
    index.filter((e) => e.hasData).map((e) => [e.code, e]),
  );
  const [home, ...rest] = STATIC_PAGES;
  const dated = (path: string, lastModified: string) => ({
    url: SITE_URL + path,
    lastModified,
  });
  return [
    dated(home, checkedAt),
    ...GUIDE_PATHS.map((path) => dated(path, guideCheckedAt)),
    ...rest.map((path) => dated(path, checkedAt)),
    // A dropped occupation is dated by the last time its data was checked.
    ...cores
      .filter((c) => withData.has(c.code) && isIndexable(c))
      .map((c) =>
        dated(
          occupationPath(c),
          withData.get(c.code)?.lastCheckedAt ?? checkedAt,
        ),
      ),
  ];
}
