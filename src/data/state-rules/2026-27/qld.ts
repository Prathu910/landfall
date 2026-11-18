import type {
  Cohort,
  OccupationListRef,
  Requirement,
  Sourced,
  StateVisaRules,
  Stream,
} from "../../../lib/state-outlook/rules-types";
import type { StateVisa } from "../../../lib/data/types";
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
  workingInState,
} from "./sourced";

// Research §QLD: every item was read directly ([D]).
const HOME = "https://www.migration.qld.gov.au/";
const SKILLED = "https://www.migration.qld.gov.au/visa-options/skilled-visas";
const ONSHORE = `${SKILLED}/skilled-workers-living-in-queensland`;
const OFFSHORE_PAGE = `${SKILLED}/skilled-workers-living-offshore`;
const GRADUATES = `${SKILLED}/graduates-of-a-queensland-university`;
const BUILDING = `${SKILLED}/building-and-construction-workers`;
const ONSHORE_LIST =
  "https://www.migration.qld.gov.au/occupation-lists/queensland-onshore-skilled-occupation-list";
const OFFSHORE_LIST =
  "https://www.migration.qld.gov.au/occupation-lists/offshore-queensland-skilled-occupation-lists-(qsol)";

const WORK_NOTE =
  "Post-qualification work of 20+ hours a week; casual work is accepted; 'closely related' means the same first 3 ANZSCO digits.";

const open = verified(
  "open" as const,
  HOME,
  "ROIs opened on 6 November 2026. Everyone must lodge a new 2026–27 ROI, and onshore candidates need a 2025–26 ATO Notice of Assessment before submitting one.",
);

const onshoreList = verified(
  list("qld", ["onshore"]),
  ONSHORE_LIST,
  "An occupation not on the list is not eligible in 2026–27. Chefs and Cooks in takeaway or fast-food businesses are excluded.",
);

const months = (visa: StateVisa) => (visa === "190" ? 9 : 6);
const window = (visa: StateVisa) =>
  visa === "190"
    ? "9 of the last 12 months living and working in Queensland"
    : "6 of the last 9 months living and working in regional Queensland";

// Research §QLD item 4: the rule is "N of the last M months"; Landfall's
// months questions count continuous months, which is stricter.
function living(visa: StateVisa, source: string): Sourced<Requirement> {
  return verified(livingInState(months(visa)), source, `${window(visa)}.`);
}

function working(visa: StateVisa, source: string): Sourced<Requirement> {
  return verified(
    workingInState(months(visa)),
    source,
    `${window(visa)}, for a Queensland employer. ${WORK_NOTE}`,
  );
}

function stream(
  id: string,
  name: string,
  cohorts: Sourced<Cohort[]>,
  occupations: Sourced<OccupationListRef>,
  requirements: Sourced<Requirement>[],
  visa: StateVisa,
  status: Stream["status"] = open,
): Stream {
  const s: Stream = { id, name, cohorts, status, occupations, requirements };
  // Research §QLD item 4: QLD will not nominate for 190 anyone nominated for,
  // applying for or holding a 491 or 489.
  if (visa === "190") {
    s.restriction = verified(
      "Not available to anyone nominated for, applying for or holding a 491 or 489 visa.",
      ONSHORE,
    );
  }
  return s;
}

function streams(visa: StateVisa): Stream[] {
  const regional = visa === "491" ? [verified(LIVES_REGIONAL, ONSHORE)] : [];
  return [
    stream(
      "qld-onshore",
      "Skilled workers living in Queensland",
      verified(
        IN_STATE,
        ONSHORE,
        "Must currently live and work in Queensland.",
      ),
      onshoreList,
      [living(visa, ONSHORE), working(visa, ONSHORE), ...regional],
      visa,
    ),
    stream(
      "qld-offshore",
      "Skilled workers living offshore",
      verified(OFFSHORE, OFFSHORE_PAGE),
      verified(list("qld", ["offshore"]), OFFSHORE_LIST),
      [
        verified(
          experience(1, 3),
          OFFSHORE_PAGE,
          `At least 1 year of skilled employment in the last 3 years; current employment is not required. ${WORK_NOTE}`,
        ),
      ],
      visa,
    ),
    // Judgement (research §QLD items 2 and 4): the lists do not name the
    // graduate pathway, so the onshore list is an inference; and any ANZSCO
    // Skill Level 1 job counts, which Landfall's nominated-occupation work
    // question cannot test. Both held as secondary.
    stream(
      "qld-graduate",
      "Graduates of a Queensland university",
      verified(IN_STATE, GRADUATES),
      secondary(
        list("qld", ["onshore"]),
        ONSHORE_LIST,
        "The QLD lists do not name the graduate pathway; the onshore list is assumed.",
      ),
      [
        verified(
          STUDIED_IN_STATE,
          GRADUATES,
          "A Bachelor's, Master's or PhD completed 100% in Queensland, graduating after 1 July 2022. Graduates may be prioritised.",
        ),
        living(visa, GRADUATES),
        ...regional,
        secondary(
          workingInState(months(visa)),
          GRADUATES,
          `${window(visa)}. Any ANZSCO Skill Level 1 job counts, not only the nominated occupation, so this check is not applied as verified.`,
        ),
      ],
      visa,
    ),
    // Research §QLD item 4: no regional-residence rule is recorded for this
    // pathway, so none is encoded for 491.
    stream(
      "qld-building",
      "Building and construction workers",
      verified(IN_STATE, BUILDING),
      verified(list("qld", ["building-and-construction"]), ONSHORE_LIST),
      [
        verified(
          workingInState(3),
          BUILDING,
          "3 continuous months of Queensland work, for both visas.",
        ),
      ],
      visa,
    ),
    // Judgement (research §QLD item 1): the pathway is named but none of its
    // criteria were recorded, so it can never pass; it only keeps a regional
    // Queensland resident from reading "not open" while it is unknown.
    stream(
      "qld-small-business",
      "Small business owners in regional Queensland",
      verified(IN_STATE, SKILLED),
      secondary(
        list("qld"),
        SKILLED,
        "Not confirmed whether the QLD lists cover this pathway.",
      ),
      [verified(LIVES_REGIONAL, SKILLED)],
      visa,
      secondary(
        "unknown",
        SKILLED,
        "The pathway is listed, but its criteria are not recorded in the research.",
      ),
    ),
  ];
}

const selectionSystem = verified(
  "Queensland selects from its own Registration of Interest (ROI) and does not primarily select on EOI points. Factors may include skills and qualifications, work experience, salary and employability, location within Queensland, age and English, a partner's skills and English, and workforce demand. The weights are not published.",
  ONSHORE,
  "An ROI names one visa subclass and cannot be edited; only the most recent ROI counts. QLD does not prioritise because a document is about to expire. After a grant: live in Queensland for 2 years (190) or regional Queensland for 3 years (491).",
);

export const qldRules: StateVisaRules[] = (["190", "491"] as const).map(
  (visa) => ({ state: "QLD", visa, selectionSystem, streams: streams(visa) }),
);
