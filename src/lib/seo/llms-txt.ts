import { monthEnd } from "../data/report-source";
import type { MonthKey } from "../data/types";
import { GUIDE_PAGES, GUIDE_VISAS } from "../guide/meta";
import { formatDate } from "../migration";
import { formatLongMonth } from "../report/copy";
import { SITE_NAME, SITE_URL } from "../site";
import { CONTACT_EMAIL } from "./json-ld";
import { STATE_PAGES, statePath } from "../state-page/slug";

export type LlmsTxtInput = {
  /** The data month, e.g. "2026-10". */
  asAt: MonthKey;
  occupationCount: number;
  /** The newest monthly recap, if any. */
  latestRecap: MonthKey | null;
};

const link = (name: string, path: string, note?: string): string =>
  `- [${name}](${SITE_URL}${path})${note ? `: ${note}` : ""}`;

/**
 * /llms.txt (llmstxt.org): what the site is, its main sections and the facts
 * a model needs to quote its numbers correctly (audit A-P2-5). Built from the
 * data at build time, so its dates and counts never go stale.
 */
export function buildLlmsTxt(input: LlmsTxtInput): string {
  const dataDate = formatDate(monthEnd(input.asAt));
  const recap = input.latestRecap;
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> An independent Australian skilled-migration information site. It compares points for the 189, 190 and 491 visas with published SkillSelect data from the Department of Home Affairs. Data as at ${dataDate}, updated monthly. ${SITE_NAME} is not a registered migration agent; this is general information, not migration advice.`,
    "",
    "Key facts for citation:",
    "",
    "- Counts are EOIs (expressions of interest), not individuals: one person can hold several EOIs.",
    '- SkillSelect masks counts under 20; MigrateLens shows them as "<20" (0 to 19, which may be zero).',
    '- A 189 cut-off is the lowest points score invited for an occupation in one round. "Not listed" means the round did not include the occupation; it is not a cut-off of zero.',
    "- MigrateLens publishes no percentage chances of an invitation.",
    `- Contact: ${CONTACT_EMAIL}`,
    "",
    "## Data",
    "",
    link(
      "189 cut-offs by occupation",
      "/occupations/189-cut-offs/",
      "every occupation listed in the last four 189 rounds, with its cut-off and tie-break date",
    ),
    link(
      "Occupations",
      "/occupations/",
      `${input.occupationCount} skilled occupations with 189, 190 and 491 EOI pools by points, recent 189 cut-offs and state evidence`,
    ),
    ...(recap
      ? [
          link(
            `Latest monthly update: ${formatLongMonth(recap)}`,
            `/updates/${recap}/`,
            "the 189 round, the 189 pool by points, and 190 and 491 by state",
          ),
        ]
      : []),
    link("All monthly updates", "/updates/"),
    "",
    "## Guides",
    "",
    ...[GUIDE_PAGES.hub, ...GUIDE_VISAS.map((visa) => GUIDE_PAGES[visa])].map(
      (page) => link(page.heading, page.path),
    ),
    link(
      "Points table",
      "/guide/points-table/",
      "every factor in the points test and the points it gives",
    ),
    link(
      "Glossary",
      "/guide/glossary/",
      "one-sentence definitions of EOI, invitation round, cut-off, tie-break date, <20 and other terms",
    ),
    link(
      "State and territory nomination",
      "/states/",
      "how each state and territory nominates for the 190 and 491",
    ),
    ...STATE_PAGES.map((page) =>
      link(
        `${page.fullName} (${page.code}) 190 and 491`,
        statePath(page.code),
        "EOIs holding a state invitation at each month end for 12 months, by points and occupation, with the 2026–27 rules",
      ),
    ),
    "",
    "## About and method",
    "",
    link(
      "Methodology and limitations",
      "/methodology/",
      "sources, masked counts, how points and labels are worked out, and what the data cannot tell you",
    ),
    link(
      "About and editorial policy",
      "/about/",
      "who runs MigrateLens, how it earns, its data policy and corrections",
    ),
    "",
    "## Optional",
    "",
    link(
      "Points check",
      "/check/",
      "free points and a result for each visa, with no email",
    ),
    link("Sample reports", "/sample/"),
    "",
  ];
  return lines.join("\n");
}
