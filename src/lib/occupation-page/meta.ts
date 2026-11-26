import { cohortWindowStart } from "../data/months";
import type { OccupationCore, OccupationIndexEntry } from "../data/types";
import { SITE_NAME, SITE_URL } from "../site";
import { monthEnd } from "../data/report-source";
import { formatDate } from "../migration";
import { formatMonth } from "../report/copy";
import { wholeSentences } from "../seo/description";
import { BRAND_SUFFIX, fitTitle } from "../seo/title";
import { breadcrumbLd, datasetLd, faqPageLd } from "../seo/json-ld";
import type { Faq } from "./faq";
import { occupationPath } from "./slug";
import { has189Rounds } from "./summary";

/** The PR guide's pages, dated by the day their official sources were read. */
const GUIDE_PATHS = [
  "/guide/",
  "/guide/189/",
  "/guide/190/",
  "/guide/491/",
  "/guide/points-table/",
  "/guide/glossary/",
];
const STATIC_PAGES = [
  "/",
  "/check/",
  "/sample/",
  "/states/",
  "/methodology/",
  "/about/",
  "/occupations/",
  "/occupations/189-cut-offs/",
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
      ? `${name}: 189, 190 and 491 EOIs and cut-offs${BRAND_SUFFIX}`
      : `${name}: 189, 190 and 491 EOI data${BRAND_SUFFIX}`,
    rounds
      ? `${name}: 189 cut-offs and EOI pools${BRAND_SUFFIX}`
      : `${name}: 189, 190 and 491 EOI pools${BRAND_SUFFIX}`,
    rounds
      ? `${name}: 189 cut-offs and EOIs${BRAND_SUFFIX}`
      : `${name}: EOI pools${BRAND_SUFFIX}`,
    `${name}${BRAND_SUFFIX}`,
  ];
  return fitTitle([...candidates, name]);
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

/** What an occupation's Dataset measures (docs/DATA.md). */
export const OCCUPATION_VARIABLES = [
  "EOIs by points score (189, 190 and 491 pools)",
  "189 invitation round cut-offs (lowest points invited)",
  "EOIs in invited status at month-end, by state (190 and 491)",
  "189 EOI statuses by submission month",
];

/** `sources` are the published pages the snapshot was read from. */
export function occupationJsonLd(
  core: OccupationCore,
  faq: Faq[],
  summary: string[],
  checkedAt: string,
  sources: string[],
): object[] {
  const url = SITE_URL + occupationPath(core);
  return [
    datasetLd({
      name: datasetName(core),
      description: summary.join(" "),
      url,
      identifier: `ANZSCO ${core.code}`,
      version: core.snapshotId,
      // From the oldest stored submission month to the snapshot (docs/DATA.md R8).
      temporalCoverage: `${cohortWindowStart(core.asAt)}/${core.asAt}`,
      dateModified: checkedAt,
      isBasedOn: sources,
      variableMeasured: OCCUPATION_VARIABLES,
      catalog: {
        name: `${SITE_NAME} SkillSelect occupation data`,
        url: `${SITE_URL}/occupations/`,
      },
      distribution: {
        contentUrl: `${SITE_URL}/data/occupations/${core.code}.json`,
        description: `${SITE_NAME}'s import of the published SkillSelect counts for this occupation; masked counts are kept as "<20".`,
      },
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
