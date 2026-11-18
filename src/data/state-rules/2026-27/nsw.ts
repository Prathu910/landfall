import type {
  Cohort,
  Requirement,
  Sourced,
  StateVisaRules,
  Stream,
} from "../../../lib/state-outlook/rules-types";
import {
  IN_STATE,
  list,
  livingInState,
  livingOffshore,
  NONE_PUBLISHED,
  OFFSHORE,
  secondary,
  verified,
  workingInState,
} from "./sourced";

// Research §NSW: every item was read directly ([D]).
const BASE = "https://www.nsw.gov.au/visas-and-migration/skilled-visas";
const NSW_190 = `${BASE}/skilled-nominated-visa-subclass-190`;
const NSW_491 = `${BASE}/skilled-work-regional-visa-subclass-491`;
const LISTS = `${BASE}/nsw-skills-lists`;
const FAQ = `${BASE}/common-questions-about-skilled-visas`;

const skillsList = verified(
  list("nsw"),
  LISTS,
  "The NSW Skills List (190) names ANZSCO unit groups (80 counted in the research; the imported list has 78): an occupation qualifies when its unit group is listed and it is eligible for the visa. Onshore and offshore candidates use the same list.",
);

const open190 = verified(
  "open" as const,
  NSW_190,
  "By invitation only; NSW calls the program 'exceptionally competitive'. No predetermined or announced round dates.",
);

// Research §NSW item 4: NSW 190 asks for ONE of three residence options, so
// each option is its own stream (a state passes when any stream passes).
function option190(
  id: string,
  name: string,
  cohorts: Cohort[],
  requirement: Sourced<Requirement>,
  cohortNote?: string,
): Stream {
  return {
    id,
    name,
    cohorts: verified(cohorts, NSW_190, cohortNote),
    status: open190,
    occupations: skillsList,
    requirements: [requirement],
  };
}

// Research §NSW items 5 and 7. The FAQ (modified 16 Nov 2026) still says "For
// the 2025-26 program year": kept secondary with both readings.
const nsw190: StateVisaRules = {
  state: "NSW",
  visa: "190",
  selectionSystem: secondary(
    "NSW ranks EOIs within each ANZSCO unit group on multiple factors, including age, English, education, points and total years of skilled work. EOI submission date does not affect selection. The weights are not published.",
    FAQ,
    "Factors from the 190 page and the FAQ. The 190 page and Skills List (modified 15 Oct 2026) describe 2026–27, but the FAQ (modified 16 Nov 2026) still says 'For the 2025-26 program year' when describing which occupations are considered. FAQ points not re-confirmed elsewhere: the usual country of residence in the EOI decides onshore or offshore, and moving between NSW and offshore resets the residence clock.",
  ),
  streams: [
    // Ruling P13: NSW sets no minimum duration for this option, only current
    // work of 20+ hours a week (research §NSW item 4). "At least 1 month" is
    // MigrateLens's approximation, so it is secondary and never decides. No
    // residence condition is stated, so interstate residents count (P17).
    option190(
      "nsw-190-working",
      "Working in NSW",
      ["living-in-state", "living-in-other-state"],
      secondary(
        workingInState(1, "same-occupation"),
        NSW_190,
        "NSW's rule (read directly): currently working in NSW (20+ hours a week) in the nominated occupation, with no minimum duration. 'At least 1 month' is MigrateLens's approximation for its months-working question, so this check is not applied as verified.",
      ),
      "No residence condition is stated for this option; the work must be in NSW.",
    ),
    option190(
      "nsw-190-living",
      "Living in NSW",
      IN_STATE,
      verified(
        livingInState(6),
        NSW_190,
        "Living in NSW continuously for at least 6 months.",
      ),
    ),
    option190(
      "nsw-190-offshore",
      "Living offshore",
      OFFSHORE,
      verified(
        livingOffshore(6),
        NSW_190,
        "Living offshore continuously for at least 6 months.",
      ),
    ),
  ],
};

// Research §NSW items 1 and 7: the closure notice names no program year, but
// with no 2026–27 regional list either, the research treats 491 as not open.
const closed491 = verified(
  "closed" as const,
  NSW_491,
  "Applications are closed 'for the current program year' because all places are allocated; settings for the next program year are under review. The notice names no program year, and no 2026–27 Regional Skills List is published, so 491 is treated as not open.",
);

const noRegionalList = verified(
  NONE_PUBLISHED,
  LISTS,
  "No 2026–27 Regional Skills List (491) is published; NSW says an update 'will be provided'.",
);

function pathway491(
  id: string,
  name: string,
  cohorts: Cohort[],
  note: string,
): Stream {
  return {
    id,
    name,
    cohorts: verified(cohorts, NSW_491, note),
    status: closed491,
    occupations: noRegionalList,
    requirements: [],
  };
}

const nsw491: StateVisaRules = {
  state: "NSW",
  visa: "491",
  selectionSystem: verified(
    "Closed: no 2026–27 selection settings are published for 491.",
    NSW_491,
  ),
  streams: [
    pathway491(
      "nsw-491-pathway-1",
      "Pathway 1: regional employer",
      IN_STATE,
      "Marked 'Closed to new applications'. Required 6 months with the same regional employer, paid at least TSMIT/CSIT.",
    ),
    pathway491(
      "nsw-491-pathway-2",
      "Pathway 2: residence",
      ["living-in-state", "offshore"],
      "When open: the 190 residence options with a 3-month minimum (working in NSW, living in NSW, or living offshore).",
    ),
    pathway491(
      "nsw-491-pathway-3",
      "Pathway 3: regional graduate",
      IN_STATE,
      "Marked 'Closed to new applications'.",
    ),
  ],
};

export const nswRules: StateVisaRules[] = [nsw190, nsw491];
