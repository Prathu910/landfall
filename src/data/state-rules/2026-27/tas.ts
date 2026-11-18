import type {
  OccupationListRef,
  Requirement,
  Sourced,
  StateVisaRules,
  Stream,
} from "../../../lib/state-outlook/rules-types";
import type { StateVisa } from "../../../lib/data/types";
import {
  IN_STATE,
  JOB_OFFER,
  livingInState,
  NONE_PUBLISHED,
  NOT_IMPORTED,
  OFFSHORE,
  secondary,
  STUDIED_IN_STATE,
  workingInState,
} from "./sourced";

// Research §TAS: the site blocked automated reads (HTTP 403), so every item is
// a search extract ([S]) and every rule here is secondary.
const SITE = "https://www.migration.tas.gov.au";
const IN_TAS = `${SITE}/skilled_migration/skilled-workers-and-graduates-living-in-Tasmania`;
const OVERSEAS = `${SITE}/skilled_migration/skilled-workers-living-overseas`;
// The slug says 2024-25; the content is reportedly the August 2026 update.
const UPDATE = `${SITE}/news/2024-25_program_open_to_rois`;
const TSE = `${IN_TAS}/tasmanian-skilled-employment-pathways-tse`;
const TSE_190_MIN = `${TSE}/accordion/190-tse-minimum-requirements`;
const TSE_491 = `${TSE}/491-accordion/491-tse-priority-attributes`;
const TSG = `${IN_TAS}/tasmanian-skilled-graduate-pathways-tsg`;
const TER = `${IN_TAS}/tasmanian-established-resident-pathways-ter`;
const HOW_TO = `${IN_TAS}/how-to-apply`;
const CAVEATS = `${IN_TAS}/additional_information,_exclusions_and_definitions/accordion/occupational_caveats_for_tasmanian_skilled_employment_pathway`;
const OVERSEAS_190 = `${OVERSEAS}/subclass-190-overseas-applicant-health-or-education-sector-job-offer-pathway`;
const OSOP = `${OVERSEAS}/overseas-skilled-occupation-profiles-osop-invitation-only-pathway`;
const RESULTS = `${SITE}/news/processing_times_and_allocation_usage`;

const open = (visa: StateVisa) =>
  secondary(
    "open" as const,
    UPDATE,
    `Reopened to new ROIs on 17 August 2026 with 2,050 places (${visa === "190" ? "1,250 for 190" : "800 for 491"}); weekly invitations from 20 August 2026.`,
  );

// Research §TAS item 2: no general list for onshore pathways.
const onshoreOccupations = secondary(
  NONE_PUBLISHED,
  CAVEATS,
  "No general state occupation list for onshore pathways. 190 TSE 'Priority Roles' need a matching skills assessment and a closely related job (same 3-digit ANZSCO group). Occupational caveats apply (often that the employer has operated in Tasmania for 3 years), with caveat changes from 1 Dec 2026.",
);

function onshore(
  visa: StateVisa,
  slug: string,
  name: string,
  requirements: Sourced<Requirement>[],
  source: string,
  occupations: Sourced<OccupationListRef> = onshoreOccupations,
): Stream {
  return {
    id: `tas-${visa}-${slug}`,
    name,
    cohorts: secondary(IN_STATE, source),
    status: open(visa),
    occupations,
    requirements,
  };
}

// Research §TAS item 4: TSG rules are not split by visa in the extract.
const tsg = (visa: StateVisa) =>
  onshore(
    visa,
    "tsg",
    "Tasmanian Skilled Graduate (TSG)",
    [
      secondary(STUDIED_IN_STATE, TSG, "Full-time, on-site study in Tasmania."),
      secondary(
        livingInState(24),
        TSG,
        "Lived in Tasmania for at least 2 calendar years from the start of the course.",
      ),
    ],
    TSG,
  );

// Research §TAS item 1. Judgement: TER and TBO are named, but none of their
// criteria are recorded, so they carry no requirements and stay unverified.
const UNRECORDED = "Criteria are not recorded in the research.";
const ter = (visa: StateVisa) =>
  onshore(
    visa,
    "ter",
    "Tasmanian Established Resident (TER)",
    [],
    TER,
    secondary(NONE_PUBLISHED, TER, UNRECORDED),
  );
const tbo = (visa: StateVisa) =>
  onshore(
    visa,
    "tbo",
    "Tasmanian Business Operator (TBO)",
    [],
    UPDATE,
    secondary(NONE_PUBLISHED, UPDATE, UNRECORDED),
  );

const INCOME =
  "Average of at least 20 hours a week, at or above the 'priority income level' of $57,000 a year or $28.85 an hour.";

// Research §TAS items 4 and 7. Contradiction: the extracts conflict on the
// priority-option duration ("9 months" vs "the last nine months").
const tas190: StateVisaRules["streams"] = [
  onshore(
    "190",
    "tse-priority",
    "Tasmanian Skilled Employment (TSE): priority role",
    [
      secondary(
        workingInState(9, "anzsco-3-digit"),
        TSE_190_MIN,
        `At least 9 months working in Tasmania, or 6 months for teaching or health roles. The extracts conflict: '9 months' vs 'the last nine months'. ${INCOME}`,
      ),
    ],
    TSE_190_MIN,
  ),
  onshore(
    "190",
    "tse-long-term",
    "Tasmanian Skilled Employment (TSE): long-term",
    [
      secondary(
        workingInState(15, "same-occupation"),
        TSE_190_MIN,
        `At least 15 months working in Tasmania. ${INCOME}`,
      ),
    ],
    TSE_190_MIN,
  ),
  tsg("190"),
  ter("190"),
  tbo("190"),
  {
    id: "tas-190-overseas",
    name: "Overseas job offer in health or education",
    cohorts: secondary(
      OFFSHORE,
      OVERSEAS_190,
      "Has not lived in another Australian state in the last 12 months.",
    ),
    status: open("190"),
    occupations: secondary(
      NOT_IMPORTED,
      OVERSEAS_190,
      "Limited to ANZSCO groups 241 (school teachers), 251, 252, 253 and 254 (nursing and midwifery), from a truncated extract.",
    ),
    requirements: [
      secondary(
        JOB_OFFER,
        OVERSEAS_190,
        "A Tasmanian job offer of at least 30 hours a week, in the same 3-digit ANZSCO group as the skills assessment, from an employer that has operated in Tasmania for at least 12 months. Skills assessment and English test each dated within 3 years.",
      ),
    ],
  },
];

const tas491: StateVisaRules["streams"] = [
  onshore(
    "491",
    "tse",
    "Tasmanian Skilled Employment (TSE)",
    [
      secondary(
        workingInState(12, "same-occupation"),
        TSE_491,
        "At least 12 months working in Tasmania (average 20 hours a week), currently living in Tasmania, and intending to stay in the industry for 2 years.",
      ),
    ],
    TSE_491,
  ),
  tsg("491"),
  ter("491"),
  tbo("491"),
  {
    id: "tas-491-osop",
    name: "Overseas Skilled Occupation Profiles (OSOP)",
    cohorts: secondary(OFFSHORE, OSOP),
    status: secondary(
      "closed",
      OSOP,
      "No OSOP invitations in 2026–27: the Commonwealth is prioritising onshore processing.",
    ),
    occupations: secondary(
      NOT_IMPORTED,
      OSOP,
      "The OSOP profiles are not imported.",
    ),
    requirements: [],
  },
];

const selectionSystem = secondary(
  "Tasmania ranks ROIs by priority attributes. Points vary by pathway and visa and sort ROIs into Gold, Green, Orange and Orange-plus passes: Gold can lodge a nomination application immediately; Green is invited within about six months, subject to places; Orange may be invited.",
  HOW_TO,
  "Several attributes were rescored for 2026–27 (for example, 2 years' industry experience plus the priority income level dropped from 30 to 15 points for 190). Published cut-offs reportedly moved to a six-week rolling average, and the quoted 'minimum to nominate' figures (323 and 77) do not match the lowest scores invited (313 and 71).",
);

const ownScoreSystem = secondary(
  { name: "Tasmanian priority attributes", url: HOW_TO },
  HOW_TO,
);

export const tasRules: StateVisaRules[] = [
  {
    state: "TAS",
    visa: "190",
    selectionSystem,
    ownScoreSystem,
    resultsUrl: RESULTS,
    streams: tas190,
  },
  {
    state: "TAS",
    visa: "491",
    selectionSystem,
    ownScoreSystem,
    resultsUrl: RESULTS,
    streams: tas491,
  },
];
