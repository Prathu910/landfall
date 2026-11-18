import type {
  Requirement,
  Sourced,
  StateVisaRules,
  Stream,
} from "../../../lib/state-outlook/rules-types";
import type { StateVisa } from "../../../lib/data/types";
import {
  experience,
  IN_STATE,
  livingInState,
  livingOffshore,
  NOT_IMPORTED,
  OFFSHORE,
  secondary,
} from "./sourced";

// Research §ACT: the site blocked automated reads (HTTP 403), so every item is
// a search extract ([S]) and every rule here is secondary.
const MIGRATION = "https://www.act.gov.au/migration";
const ROUNDS = `${MIGRATION}/resources/canberra-matrix-invitation-round`;
const PATHWAYS = `${MIGRATION}/skilled-migrants/act-government-nomination/act-nomination-pathways`;
const LIST_PAGE = `${MIGRATION}/skilled-migrants/act-nominated-migration-program-occupation-list`;
const MATRIX = `${MIGRATION}/skilled-migrants/canberra-matrix`;
const RESIDENT_190 = `${MIGRATION}/skilled-migrants/190-nomination-criteria/canberra-resident-applicant-eligibility`;
const OVERSEAS_190 = `${MIGRATION}/skilled-migrants/190-nomination-criteria/overseas-applicant-eligibility`;
const RESIDENT_491 = `${MIGRATION}/skilled-migrants/491-nomination-criteria/491-nomination-canberra-resident-applicant-eligibility`;
const OVERSEAS_491 = `${MIGRATION}/skilled-migrants/491-nomination-criteria/491-nomination-overseas-applicant-eligibility`;
const GUIDELINES_FEB =
  "https://www.act.gov.au/__data/assets/pdf_file/0008/2992049/ACT-Nomination-Guidelines-Canberra-Resident-February-2026.pdf";

const ALLOCATION_NOTE =
  "Allocation status conflicts: the home page reportedly says the 2026–27 allocation 'has not yet been finalised' (next round 12 Nov 2026) while the rounds page shows remaining places, and one extract cites 600/200 there.";

const LIST_NOTE =
  "The ACT Nominated Migration Program Occupation List (formerly the Critical Skills List), reportedly last updated 10 Oct 2025, is not imported: the site blocked automated reads. Whether it splits Canberra residents and overseas candidates, or 190 and 491, is not confirmed.";

const occupations = secondary(NOT_IMPORTED, LIST_PAGE, LIST_NOTE);
const residentOccupations = secondary(
  NOT_IMPORTED,
  LIST_PAGE,
  `${LIST_NOTE} Canberra residents who are majority owners of an eligible ACT business can claim small-business points instead of using the list.`,
);

// Research §ACT item 4. Contradiction: the 491 resident page says 3 months of
// residence at Matrix submission; the Feb 2026 resident guidelines say 6
// months. Judgement: each visa takes the reading of its most specific source
// (491 page → 3; resident-wide guidelines → 6 for 190); both are in the note.
const RESIDENCE_CONFLICT =
  "Sources conflict: the 491 Canberra resident page says 3 months of residence at Matrix submission; the February 2026 resident guidelines say 6 months. Newer guidelines dated 27 July 2026 are reported. Minimum work periods also apply but were not recorded.";

function residentMonths(visa: StateVisa): Sourced<Requirement> {
  return visa === "491"
    ? secondary(livingInState(3), RESIDENT_491, RESIDENCE_CONFLICT)
    : secondary(livingInState(6), GUIDELINES_FEB, RESIDENCE_CONFLICT);
}

function resident(visa: StateVisa): Stream {
  return {
    id: `act-${visa}-canberra-resident`,
    name: "Canberra residents",
    cohorts: secondary(IN_STATE, visa === "190" ? RESIDENT_190 : RESIDENT_491),
    status: status(visa),
    occupations: residentOccupations,
    requirements: [residentMonths(visa)],
  };
}

function status(visa: StateVisa): Stream["status"] {
  return visa === "190"
    ? secondary(
        "open",
        ROUNDS,
        `Monthly rounds against a pro-rata monthly allocation. 12 Oct 2026 round: 126 invitations for Canberra residents and 63 for overseas candidates; 480 places shown as remaining. ${ALLOCATION_NOTE}`,
      )
    : secondary(
        "open",
        ROUNDS,
        `Monthly rounds, but the 12 Oct 2026 round issued 0 invitations for 491 to either cohort (critical-skill occupations); 249 places shown as remaining. ${ALLOCATION_NOTE}`,
      );
}

const overseas190: Stream = {
  id: "act-190-overseas",
  name: "Overseas candidates",
  cohorts: secondary(OFFSHORE, PATHWAYS),
  status: status("190"),
  restrictions: [
    secondary(
      "Proficient English or above (except Chef 351311 and ANZSCO skill levels 3–5), an employment statement showing research into Canberra jobs, a commitment to live in Canberra for 2 years, and settlement funds.",
      OVERSEAS_190,
    ),
  ],
  occupations,
  requirements: [
    secondary(
      experience(3, 5, "same-occupation"),
      OVERSEAS_190,
      "3 years of full-time, post-graduate work in the occupation within the last 5 years.",
    ),
    secondary(
      livingOffshore(12),
      OVERSEAS_190,
      "Has not lived in Australia in the last 12 months, and holds no Australian visa other than a visitor visa.",
    ),
  ],
};

// Research §ACT item 4: "otherwise similar rules" are not itemised, so only
// the 1-year experience rule is encoded for 491.
const overseas491: Stream = {
  id: "act-491-overseas",
  name: "Overseas candidates",
  cohorts: secondary(OFFSHORE, PATHWAYS),
  status: status("491"),
  occupations,
  requirements: [
    secondary(
      experience(1, 5, "same-occupation"),
      OVERSEAS_491,
      "1 year of experience in the last 5 years, with otherwise similar rules to the 190 overseas cohort (not itemised in the extract).",
    ),
  ],
};

const selectionSystem = secondary(
  "The Canberra Matrix: a points-scored submission. Cut-offs depend on the monthly allocation, the date and time of submission, occupation caps and demand. Matrix submissions in critical sectors may be prioritised: care, education, construction, renewables, experience and advanced technology.",
  MATRIX,
  "Separate Matrix calculators exist for overseas candidates and Canberra residents; their values were not verified. A rankings PDF gives the minimum Matrix score by occupation unit group per round (2025–26); whether a 2026–27 version exists is not confirmed.",
);

const ownScoreSystem = secondary(
  { name: "Canberra Matrix", url: MATRIX },
  MATRIX,
);

export const actRules: StateVisaRules[] = [
  {
    state: "ACT",
    visa: "190",
    selectionSystem,
    ownScoreSystem,
    resultsUrl: ROUNDS,
    streams: [resident("190"), overseas190],
  },
  {
    state: "ACT",
    visa: "491",
    selectionSystem,
    ownScoreSystem,
    resultsUrl: ROUNDS,
    streams: [resident("491"), overseas491],
  },
];
