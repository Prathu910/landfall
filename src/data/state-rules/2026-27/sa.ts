import type {
  Requirement,
  Sourced,
  StateVisaRules,
  Stream,
} from "../../../lib/state-outlook/rules-types";
import {
  experience,
  IN_STATE,
  list,
  LIVES_REGIONAL,
  livingInState,
  OFFSHORE,
  secondary,
  STUDIED_IN_STATE,
  verified,
  visaExpiryBy,
  workingInState,
} from "./sourced";

// Research §SA: every item was read directly ([D]).
const UPDATE =
  "https://migration.sa.gov.au/news/south-australias-general-skilled-migration-program-update";
const SKILLED =
  "https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants";
const EMPLOYMENT = `${SKILLED}/skilled-employment-in-south-australia`;
const GRADUATES = `${SKILLED}/south-australian-graduates`;
const OUTER = `${SKILLED}/outer-regional-skilled-employment`;
const OFFSHORE_PAGE = `${SKILLED}/moving-to-south-australia-from-overseas`;
const LIST =
  "https://migration.sa.gov.au/before-applying/work-in-sa/occupation-lists/occupations-list";
const NEWS = "https://migration.sa.gov.au/news";

const RELATED_WORK =
  "Work must be in the same ANZSCO sub-major group (first 2 digits) as the nominated occupation.";

const STUDY_UNTESTED =
  "Landfall asks only which state you studied in, so it cannot test the 46 weeks, the 75% or the year living in South Australia, and this check is not applied as verified.";
const AFTER_COURSE_UNTESTED =
  "Landfall's months answer does not say whether those months came after completing the course, so this check is not applied as verified.";

// Research §SA items 1 and 7: the 22 Oct 2026 update gates every onshore stream.
const onshoreStatus = verified(
  "restricted" as const,
  UPDATE,
  "Onshore ROIs are restricted from 22 October 2026.",
);
const onshoreRestriction = verified(
  "Onshore ROIs are open only to those living and working in South Australia whose current visa expires by 31 January 2027.",
  UPDATE,
);
const expiryGate = verified(
  visaExpiryBy("2027-01-31"),
  UPDATE,
  "Current visa expires on or before 31 January 2027.",
);
const onshoreCohorts = verified(
  IN_STATE,
  EMPLOYMENT,
  "EOI with South Australia as first preference, under 45 when nomination is approved, competent English and 65+ points including nomination points.",
);

function onshore(
  id: string,
  name: string,
  tag: string,
  requirements: Sourced<Requirement>[],
): Stream {
  return {
    id,
    name,
    cohorts: onshoreCohorts,
    status: onshoreStatus,
    restrictions: [onshoreRestriction],
    occupations: verified(list("sa", [tag]), LIST),
    requirements: [expiryGate, ...requirements],
  };
}

// Research §SA items 3 and 4. The list's "Applying from" column decides each
// occupation's onshore and offshore availability per visa (e.g. Chef and
// Accountant are 491 only, and Chef is not in the Graduates stream).
const streams: Stream[] = [
  onshore(
    "sa-graduates",
    "South Australian Graduates",
    "South Australian Graduates",
    // Ruling P28: read directly, but Landfall asks only which state you
    // studied in and for months up to now, so it cannot test the course rules
    // or whether the months came after the course. All held as secondary.
    [
      secondary(
        STUDIED_IN_STATE,
        GRADUATES,
        `Read directly: a CRICOS course of at least 46 weeks, at least 75% completed in South Australia, with at least 1 year living in South Australia during study. ${STUDY_UNTESTED}`,
      ),
      secondary(
        livingInState(6),
        GRADUATES,
        `Read directly: lived in South Australia for the last 6 months, after completing the course. ${AFTER_COURSE_UNTESTED}`,
      ),
      secondary(
        workingInState(6, "anzsco-2-digit"),
        GRADUATES,
        `Read directly: worked full-time for 6 months after completing the course. ${RELATED_WORK} ${AFTER_COURSE_UNTESTED}`,
      ),
    ],
  ),
  onshore(
    "sa-skilled-employment",
    "Skilled Employment in South Australia",
    "Skilled Employment in South Australia",
    [
      verified(
        livingInState(12),
        EMPLOYMENT,
        "Lived in South Australia for the last 12 months.",
      ),
      verified(
        workingInState(12, "anzsco-2-digit"),
        EMPLOYMENT,
        `Worked full-time (30+ hours a week) for the last 12 months in a related job. ${RELATED_WORK}`,
      ),
    ],
  ),
  // Judgement (research §SA item 4): "outer regional" South Australia is
  // narrower than "regional" (all of SA, Adelaide included, counts as regional
  // for 491), so the regional question cannot test it: held as secondary.
  onshore(
    "sa-outer-regional",
    "Outer Regional Skilled Employment",
    "Outer Regional Skilled Employment",
    [
      secondary(
        LIVES_REGIONAL,
        OUTER,
        "Read directly: living and working in outer-regional South Australia. That area is narrower than 'regional', which Landfall's question asks about, so this check is not applied as verified. The page still says invitations are issued 'throughout 2025–26'.",
      ),
      verified(
        livingInState(9),
        OUTER,
        "Lived in outer-regional South Australia for the past 9 months.",
      ),
      verified(
        workingInState(9, "anzsco-2-digit"),
        OUTER,
        `Worked full-time in outer-regional South Australia for the past 9 months. ${RELATED_WORK}`,
      ),
    ],
  ),
  {
    id: "sa-offshore",
    name: "Offshore",
    cohorts: verified(OFFSHORE, OFFSHORE_PAGE),
    status: verified(
      "open",
      UPDATE,
      "No ROI: offshore candidates are invited straight from their SkillSelect EOI.",
    ),
    occupations: verified(list("sa", ["Offshore"]), LIST),
    requirements: [
      // Judgement (research §SA item 4): everyone needs at least 1 year in the
      // last 3 (3 years within 5 always includes 1 within the last 3), so that
      // check is verified. The 3-in-5 rule exempts listed construction and
      // trades occupations, which the imported list does not mark.
      // Ruling P31: the page asks for "skilled experience" without naming an
      // occupation, so any skilled work counts.
      verified(
        experience(1, 3, "any-skilled"),
        OFFSHORE_PAGE,
        "The minimum for every occupation: listed construction and trades occupations need 1 year of skilled experience in the last 3. Full-time here means 20 hours a week.",
      ),
      secondary(
        experience(3, 5, "any-skilled"),
        OFFSHORE_PAGE,
        "Read directly: at least 3 years of skilled experience in the last 5, except listed construction and trades occupations. The imported SA list does not mark those occupations, so this check is not applied as verified.",
      ),
    ],
  },
];

// Research §SA items 5 and 7. Contradiction: priority sectors differ between
// the news post ("defence") and the stream pages ("trades").
const selectionSystem = secondary(
  "South Australia selects on merit. Onshore factors, in no particular order: English, years of experience, qualification level, salary and an assessment of the employer; EOI points are not a determining factor above 65. Offshore factors: English, years and field of employment, qualifications and EOI points. Priority-industry candidates whose occupation is 190-eligible may get a 190; others may get a 491.",
  EMPLOYMENT,
  "Priority industries differ between official pages: the 22 Oct 2026 update names building and construction, defence, education, engineering, health and manufacturing; the stream pages name construction, engineering, manufacturing, trades, health and education. 'High-ranking' candidates in other industries may also be considered. Fees: ROIs are free; $394 per nomination application.",
);

// Research §SA item 6: "Invitations issued" news posts by ANZSCO sub-major
// group; none yet for 2026–27 as at 17 Nov 2026.
export const saRules: StateVisaRules[] = (["190", "491"] as const).map(
  (visa) => ({ state: "SA", visa, selectionSystem, streams, resultsUrl: NEWS }),
);
