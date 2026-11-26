import { POINTS_TABLE, PASS_MARK } from "../../data/guide/points-table";
import { GUIDE_CHECKED_AT, SOURCES } from "../../data/guide/sources";
import { breadcrumbLd, definedTermSetLd } from "../seo/json-ld";
import { SITE_NAME, SITE_URL } from "../site";
import { GUIDE_PAGES } from "./meta";
import { rowPoints } from "./points-table";

/**
 * The glossary (/guide/glossary/, audit A-P2-3): one typed list of terms,
 * each with an anchor, a one-sentence definition that names its subject
 * (so it can be quoted on its own) and the page it comes from. The
 * methodology page shows a short list from the same entries. EOI statuses
 * follow docs/DATA.md ("EOI statuses").
 */
export type GlossaryTerm = {
  /** The anchor, e.g. /guide/glossary/#eoi. */
  id: string;
  term: string;
  definition: string;
  source: { label: string; href: string };
};

/** The SkillSelect pages the data terms come from (the manifest's sources). */
export type DataSources = { dashboard: string; currentRounds: string };

export const GLOSSARY_PAGE = {
  path: "/guide/glossary/",
  title: "Skilled migration glossary: EOI, cut-off, <20",
  description:
    "Plain definitions of the terms used for Australian skilled visas and SkillSelect data: EOI, invitation round, cut-off, tie-break date, <20, ANZSCO and more.",
  heading: "Glossary of skilled migration terms",
  crumb: "Glossary",
  publishedAt: "2026-11-26",
} as const;

const nominationPoints = (rowId: string): number =>
  rowPoints(POINTS_TABLE, rowId);

const HOME_AFFAIRS = (label: string, href: string) => ({
  label: `Home Affairs: ${label}`,
  href,
});

/** Every term, A to Z by its display name. */
export function glossaryTerms(data: DataSources): GlossaryTerm[] {
  const dashboard = {
    label: "SkillSelect EOI dashboard",
    href: data.dashboard,
  };
  const rounds = HOME_AFFAIRS(
    "SkillSelect invitation rounds",
    data.currentRounds,
  );
  const skillSelect = HOME_AFFAIRS("SkillSelect", SOURCES.skillSelect);
  const method = (anchor: string) => ({
    label: "MigrateLens methodology",
    href: `/methodology/#${anchor}`,
  });
  const terms: GlossaryTerm[] = [
    {
      id: "masked-count",
      term: "<20 (masked count)",
      definition:
        "“<20” means SkillSelect published a count of fewer than 20 EOIs without the exact figure; MigrateLens keeps it as a range of 0 to 19, which may be zero.",
      source: dashboard,
    },
    {
      id: "visa-191",
      term: "191 visa",
      definition:
        "The 191 (Permanent Residence (Skilled Regional)) visa is the permanent visa a 491 holder can apply for after holding the 491 for at least 3 years and meeting its income and regional conditions.",
      source: HOME_AFFAIRS("191 visa", SOURCES.visa191),
    },
    {
      id: "anzsco-code",
      term: "ANZSCO code",
      definition:
        "An ANZSCO code is the six-digit code from the Australian and New Zealand Standard Classification of Occupations that the skilled occupation lists and SkillSelect use to identify an occupation.",
      source: HOME_AFFAIRS("skilled occupation list", SOURCES.occupationList),
    },
    {
      id: "closed",
      term: "Closed (EOI status)",
      definition:
        "A closed EOI has left the SkillSelect pool because it expired, was withdrawn or was finalised; the dashboard doesn’t say which.",
      source: dashboard,
    },
    {
      id: "cut-off",
      term: "Cut-off (189)",
      definition:
        "A 189 cut-off is the lowest points score Home Affairs invited for an occupation in one invitation round; it describes that round only, not a later one.",
      source: rounds,
    },
    {
      id: "date-of-effect",
      term: "Date of effect",
      definition:
        "An EOI’s date of effect is the date it reached its current points score; SkillSelect ranks EOIs with equal points by it, and it changes when the score changes.",
      source: skillSelect,
    },
    {
      id: "designated-regional-area",
      term: "Designated regional area",
      definition:
        "A designated regional area is a part of Australia, set by Home Affairs, where a 491 holder and family on the visa must live, work and study.",
      source: HOME_AFFAIRS("designated regional areas", SOURCES.regionalAreas),
    },
    {
      id: "eoi",
      term: "EOI (expression of interest)",
      definition:
        "An EOI (expression of interest) is the free SkillSelect record that asks to be considered for a points-tested skilled visa such as the 189, 190 or 491; it is not a visa application, and one person can hold several.",
      source: skillSelect,
    },
    {
      id: "hold",
      term: "Hold (EOI status)",
      definition:
        "An EOI on hold has the HOLD status in SkillSelect; the dashboard doesn’t publish why.",
      source: dashboard,
    },
    {
      id: "invitation-round",
      term: "Invitation round",
      definition:
        "An invitation round is a date on which Home Affairs invites EOIs from the SkillSelect pool for the 189 visa, by occupation and points, and later publishes each occupation’s cut-off.",
      source: rounds,
    },
    {
      id: "invited",
      term: "Invited (EOI status)",
      definition:
        "An invited EOI has received an invitation and has not yet led to a lodged application, lapsed or closed; a count of invited EOIs is a month-end snapshot, not the invitations issued that month.",
      source: dashboard,
    },
    {
      id: "lodged",
      term: "Lodged (EOI status)",
      definition:
        "A lodged EOI is one from which a visa application was lodged after an invitation.",
      source: dashboard,
    },
    {
      id: "nomination-points",
      term: "Nomination points",
      definition: `Nomination points are the ${nominationPoints("nomination-190")} points a 190 state nomination adds, or the ${nominationPoints("nomination-491")} points a 491 nomination or eligible relative’s sponsorship adds, to the points-test score.`,
      source: HOME_AFFAIRS("points table (190)", SOURCES.pointsTable190),
    },
    {
      id: "not-listed",
      term: "Not listed",
      definition:
        "“Not listed” means an invitation round’s published results had no row for the occupation; it is not a cut-off of zero.",
      source: method("pool"),
    },
    {
      id: "points-test",
      term: "Points test",
      definition: `The points test scores age, English, skilled employment, qualifications and other factors for the 189, 190 and 491 visas, with a pass mark of ${PASS_MARK} points.`,
      source: HOME_AFFAIRS("points table (189)", SOURCES.pointsTable),
    },
    {
      id: "pool-snapshot",
      term: "Pool snapshot",
      definition:
        "A pool snapshot is the published count of EOIs in SkillSelect at one month-end, by occupation, points and visa; it is not a live queue.",
      source: dashboard,
    },
    {
      id: "roi",
      term: "ROI (Registration of Interest)",
      definition:
        "A Registration of Interest (ROI) is a state or territory’s own application, separate from the SkillSelect EOI, that some states ask for before they consider nominating for the 190 or 491.",
      source: { label: "MigrateLens: state nomination", href: "/states/" },
    },
    {
      id: "skills-assessment",
      term: "Skills assessment",
      definition:
        "A skills assessment is an assessing authority’s decision that a qualification and experience suit a nominated occupation; a suitable one is needed before a points-tested skilled visa invitation.",
      source: HOME_AFFAIRS("skills assessment", SOURCES.skillsAssessment),
    },
    {
      id: "skillselect",
      term: "SkillSelect",
      definition:
        "SkillSelect is the Department of Home Affairs online system where EOIs for points-tested skilled visas are submitted, ranked and invited.",
      source: skillSelect,
    },
    {
      id: "state-nomination",
      term: "State nomination",
      definition:
        "State nomination is a state or territory government’s selection of an EOI for the 190 or 491, under its own criteria and occupation list, separate from federal points.",
      source: HOME_AFFAIRS("190 visa", SOURCES.visa190),
    },
    {
      id: "submitted",
      term: "Submitted (EOI status)",
      definition:
        "A submitted EOI is in the SkillSelect pool and can be invited; the published pool counts submitted EOIs.",
      source: dashboard,
    },
    {
      id: "tie-break-date",
      term: "Tie-break date",
      definition:
        "A tie-break date is the date of effect of the last EOI invited at an occupation’s cut-off score in a round, because EOIs with equal points are ranked by date of effect, earliest first.",
      source: rounds,
    },
  ];
  return terms.sort((a, b) => a.term.localeCompare(b.term));
}

/** The methodology page's short list: the terms its sections rely on. */
export const METHOD_TERM_IDS = [
  "eoi",
  "date-of-effect",
  "pool-snapshot",
  "masked-count",
  "cut-off",
  "state-nomination",
];

/** The page's DefinedTermSet, each term addressable by its anchor, and breadcrumbs. */
export function glossaryJsonLd(terms: GlossaryTerm[]): object[] {
  const url = SITE_URL + GLOSSARY_PAGE.path;
  return [
    definedTermSetLd({
      name: GLOSSARY_PAGE.heading,
      description: GLOSSARY_PAGE.description,
      url,
      dateModified: GUIDE_CHECKED_AT,
      terms: terms.map((t) => ({
        id: t.id,
        name: t.term,
        description: t.definition,
      })),
    }),
    breadcrumbLd([
      { name: SITE_NAME, item: `${SITE_URL}/` },
      { name: GUIDE_PAGES.hub.crumb, item: SITE_URL + GUIDE_PAGES.hub.path },
      { name: GLOSSARY_PAGE.crumb, item: url },
    ]),
  ];
}
