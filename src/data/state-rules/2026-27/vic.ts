import type { StateVisaRules } from "../../../lib/state-outlook/rules-types";
import { ALL_COHORTS, ALL_FEDERAL, secondary } from "./sourced";

// Research §VIC: the site blocked automated reads (HTTP 403), so every item is
// a search extract ([S]) and every rule here is secondary.
const SKILLED =
  "https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas";
const PROGRAM = `${SKILLED}/2026-27-skilled-visa-nomination-program`;
const PAGE_491 = `${SKILLED}/491`;
const VPT = `${SKILLED}/vpt`;

const selectionSystem = secondary(
  "Victoria ranks Registrations of Interest with the Victorian Points Test (VPT), which has no pass mark; the highest VPT totals within each priority industry or subgroup are invited. Factors: age, English, years of experience in the occupation, education, occupation skill level, a partner's skills and Victorian skilled earnings.",
  VPT,
  "The weightings were reportedly updated for 2026–27, so the extract may mix old and new values. No official invitation statistics were found, and Victoria reportedly announces no round dates.",
);

const ownScoreSystem = secondary(
  { name: "Victorian Points Test (VPT)", url: VPT },
  VPT,
);

// Research §VIC item 2: no state list; "all occupations" on the relevant Home
// Affairs list are eligible.
const occupations = secondary(
  ALL_FEDERAL,
  PROGRAM,
  "Victoria has no state occupation list: all occupations on the relevant Home Affairs list are eligible, with certain occupations or industries prioritised. The 2026–27 priority industries were not found.",
);

const vic190: StateVisaRules = {
  state: "VIC",
  visa: "190",
  selectionSystem,
  ownScoreSystem,
  streams: [
    {
      id: "vic-190-roi",
      name: "Skilled Nominated (190) Registration of Interest",
      // Research §VIC item 4: residence rules for those living outside
      // Victoria are not confirmed; every cohort is listed, unverified.
      cohorts: secondary(
        ALL_COHORTS,
        PROGRAM,
        "Offshore candidates are accepted for 190 and must be committed to living in Victoria. Rules for those living in another state are not confirmed.",
      ),
      status: secondary(
        "open",
        PROGRAM,
        "Open for ROIs with 900 places. The opening date is not confirmed from an official extract. 900 is far below the 2025–26 federal allocation of 2,700 (Home Affairs), plausible as an interim figure but not confirmed. New 2026–27 fees: $60 per ROI and $180 per nomination application (excluding GST). Everyone must lodge a new ROI.",
      ),
      restriction: secondary(
        "65+ points including nomination points and a valid skills assessment. Earnings claimed in the ROI must come from skilled employment (ANZSCO skill levels 1–3) in Victoria. No minimum work experience or hours.",
        PROGRAM,
      ),
      occupations,
      requirements: [],
    },
  ],
};

const vic491: StateVisaRules = {
  state: "VIC",
  visa: "491",
  selectionSystem,
  ownScoreSystem,
  streams: [
    {
      id: "vic-491-roi",
      name: "Skilled Work Regional (491) Registration of Interest",
      cohorts: secondary(
        ALL_COHORTS,
        PROGRAM,
        "Cohorts are not confirmed while the 491 program is not open.",
      ),
      status: secondary(
        "closed",
        PAGE_491,
        "491 places have 'not yet been finalised' and ROIs are not being accepted. One extract describes the 491 page as dated.",
      ),
      occupations,
      requirements: [],
    },
  ],
};

export const vicRules: StateVisaRules[] = [vic190, vic491];
