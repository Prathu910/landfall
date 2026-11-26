import { cohortWindowStart } from "../data/months";
import type { OccupationCore, OccupationIndexEntry } from "../data/types";
import { SITE_NAME, SITE_URL } from "../site";
import { monthEnd } from "../data/report-source";
import { formatDate } from "../migration";
import { formatMonth } from "../report/copy";
import { wholeSentences } from "../seo/description";
import { breadcrumbLd, datasetLd, faqPageLd } from "../seo/json-ld";
import type { Faq } from "./faq";
import { occupationPath } from "./slug";
import { has189Rounds } from "./summary";

/** The PR guide's pages, dated by the day their official sources were read. */
const GUIDE_PATHS = ["/guide/", "/guide/189/", "/guide/190/", "/guide/491/"];
const STATIC_PAGES = [
  "/",
  "/check/",
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

const TITLE_MAX = 60;
const BRAND = ` · ${SITE_NAME}`;

/**
 * The full `<title>` (routes set it as `title.absolute`), at most 60
 * characters: the longest topic that fits, then the bare name. The code and
 * month live in the h1 and the description, so the title never goes stale.
 */
/**
 * An all-"<20" page stays out of the index but its links are followed, so
 * related occupations still get crawled (audit T-P2-4). With the site
 * switch off, nothing is indexed or followed.
 */
export function occupationRobots(
  siteIndexable: boolean,
  pageIndexable: boolean,
): { index: boolean; follow: boolean } | undefined {
  if (!siteIndexable) return { index: false, follow: false };
  return pageIndexable ? undefined : { index: false, follow: true };
}

export function pageTitle(core: OccupationCore): string {
  const { name } = core;
  const rounds = has189Rounds(core);
  const candidates = [
    rounds
      ? `${name}: 189, 190 and 491 EOIs and cut-offs${BRAND}`
      : `${name}: 189, 190 and 491 EOI data${BRAND}`,
    rounds
      ? `${name}: 189 cut-offs and EOI pools${BRAND}`
      : `${name}: 189, 190 and 491 EOI pools${BRAND}`,
    rounds
      ? `${name}: 189 cut-offs and EOIs${BRAND}`
      : `${name}: EOI pools${BRAND}`,
    `${name}${BRAND}`,
  ];
  return candidates.find((title) => title.length <= TITLE_MAX) ?? name;
}

/** The Dataset's name: the long form, with the code and the snapshot month. */
export function datasetName(core: OccupationCore): string {
  return `${core.name} (${core.code}): 189, 190 and 491 EOIs and cut-offs, ${formatMonth(core.asAt)}`;
}

/**
 * The meta description: the summary's whole sentences (120–160 characters),
 * topped up with fixed sentences that are true of every occupation page.
 */
export function pageDescription(
  core: OccupationCore,
  summary: string[],
): string {
  const asAt = formatDate(monthEnd(core.asAt));
  return wholeSentences(summary, [
    `ANZSCO ${core.code}, from SkillSelect data as at ${asAt}.`,
    has189Rounds(core)
      ? "See EOIs by points, recent 189 rounds and state evidence."
      : "See EOIs by points and the state nomination evidence.",
    "Check your own points free.",
  ]);
}

export function occupationJsonLd(
  core: OccupationCore,
  faq: Faq[],
  summary: string[],
  checkedAt: string,
): object[] {
  const url = SITE_URL + occupationPath(core);
  return [
    datasetLd({
      name: datasetName(core),
      description: summary.join(" "),
      url,
      // From the oldest stored submission month to the snapshot (docs/DATA.md R8).
      temporalCoverage: `${cohortWindowStart(core.asAt)}/${core.asAt}`,
      dateModified: checkedAt,
    }),
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
