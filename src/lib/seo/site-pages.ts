/**
 * Titles and descriptions of the site's own pages (audit T-P1-4, T-P2-2,
 * T-P2-8): each description is unique and 120–160 characters. The free
 * part is the points check and its result; the full report is paid (free
 * for founding readers while places last), so no description calls the
 * report free, and none states a price.
 */

export type SitePage = {
  path: string;
  /** The `<title>` before the layout's "· MigrateLens", unless `absolute`. */
  title: string;
  absolute?: boolean;
  description: string;
  /** The page's name in breadcrumbs and WebPage JSON-LD. */
  name: string;
};

export const HOME_PAGE: SitePage = {
  path: "/",
  title: "Australian PR: will my points get me invited? · MigrateLens",
  absolute: true,
  description:
    "Check your Australian PR points free, then see where they sit in official SkillSelect data for the 189, 190 and 491 visas, occupation by occupation.",
  name: "MigrateLens",
};

export const CHECK_PAGE: SitePage = {
  path: "/check/",
  title: "Australian PR points calculator (free check)",
  description:
    "Calculate your Australian skilled migration points for the 189, 190 and provisional 491 pathways, and see where they put you for each visa, free.",
  name: "Points check",
};

export const FEEDBACK_PAGE: SitePage = {
  path: "/feedback/",
  title: "Send feedback",
  description:
    "Tell us what worked, report a problem or suggest what MigrateLens could cover next, from the points check to the PR guide and the occupation pages.",
  name: "Feedback",
};

export const METHODOLOGY_PAGE: SitePage = {
  path: "/methodology/",
  title: "Methodology and sources",
  description:
    "How MigrateLens reads SkillSelect data: its sources, masked “<20” counts, why EOIs are not individuals, how points and labels are worked out, and its limits.",
  name: "Methodology",
};

export const NOT_FOUND_PAGE = {
  title: "Page not found",
  description:
    "That page isn't on MigrateLens. Check the address, or start again from the homepage, the points check or the occupation index.",
};

/** The sample reports are frozen on one snapshot month, e.g. "Oct 2026". */
export function samplePage(snapshotMonth: string): SitePage {
  return {
    path: "/sample/",
    title: "Sample Australian PR report",
    description: `Four example MigrateLens PR reports on ${snapshotMonth} SkillSelect data, for fictional profiles from strong to nothing suits, with every section shown.`,
    name: "Sample reports",
  };
}

/** `programYear` as printed, e.g. "2026–27". */
export function statesPage(programYear: string): SitePage {
  return {
    path: "/states/",
    title: "State and territory nomination (190 and 491)",
    description: `How the eight Australian states and territories nominate for the 190 and 491 visas in ${programYear}: their streams, priorities and selection, from official pages.`,
    name: "States",
  };
}

/** `count` occupations with published data, as at `asAt` ("31 Oct 2026"). */
export function occupationsPage(count: number, asAt: string): SitePage {
  return {
    path: "/occupations/",
    title: "Skilled occupations: 189, 190 and 491 EOI data",
    description: `189, 190 and 491 data for ${count} skilled occupations: recent 189 cut-offs, the EOI pool by points and state evidence, from SkillSelect as at ${asAt}.`,
    name: "Occupations",
  };
}
