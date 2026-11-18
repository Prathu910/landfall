import type { StateVisaRules } from "../../../lib/state-outlook/rules-types";
import {
  experience,
  IN_STATE,
  livingInState,
  NONE_PUBLISHED,
  NOT_IMPORTED,
  OFFSHORE,
  secondary,
  workingInState,
} from "./sourced";

// Research §NT: both NT sites blocked automated reads (HTTP 403), so every
// rule here is a search extract ([S]) and secondary. Two official domains host
// NT pages and it is not confirmed which is canonical.
const OLD = "https://theterritory.com.au/migrate/migrate-to-work";
const NOMINATION = `${OLD}/northern-territory-government-visa-nomination`;
const ELIGIBILITY = `${NOMINATION}/eligibility`;
const ONSHORE_EXTRA = `${OLD}/additional-requirements-for-onshore-applicants`;
const NTOMOL =
  "https://australiasnorthernterritory.com.au/move/migrate-to-work/nt-government-visa-nomination/nt-offshore-migration-occupation-list";

const CLOSURE =
  "The NT reportedly 'has now received sufficient applications' for 2026–27. The notice's date is not confirmed: one extract flagged the cached page as old, and third-party sites cite an official update on 13 Oct 2026. A StudyNT post saying the 491 program 'is now open' (read directly) is dated 15 November 2023 and is stale.";

// Research §NT item 2: onshore streams reportedly have no NT list; federal
// eligibility applies.
const onshoreOccupations = secondary(
  NONE_PUBLISHED,
  NOMINATION,
  "Onshore streams reportedly have no NT list; federal eligibility applies.",
);

// Research §NT item 2: the NT Offshore Migration Occupation List applies only
// to the offshore priority-occupation stream.
const offshoreOccupations = secondary(
  NOT_IMPORTED,
  NTOMOL,
  "The NT Offshore Migration Occupation List (NTOMOL, split into A–F, G–O and P–Z pages) applies only to the offshore priority-occupation stream and is not imported.",
);

const offshoreClosed = secondary(
  "closed" as const,
  NOMINATION,
  `No offshore streams in 2026–27 (priority occupation, job offer and family). ${CLOSURE}`,
);

// Research §NT item 1: a "visa deadline" is not only visa expiry (turning 45,
// or a birthday that drops 491 points below 65, also count), so it stays
// restriction text rather than a visa-expiry requirement.
const exception491 = secondary(
  "By exception only: onshore NT Graduate or NT Resident candidates with a 'visa deadline' before 30 September 2027 (a substantive visa expiring with no 485 option, turning 45, or a birthday that drops 491 points below 65).",
  NOMINATION,
);

const selectionSystem = secondary(
  "Application-based assessment against criteria; there is no published points or ranking system.",
  NOMINATION,
  "Allocation not confirmed (third-party sites quote 850 for 190 and 1,000 for 491). No published invitation data found.",
);

const nt190: StateVisaRules = {
  state: "NT",
  visa: "190",
  selectionSystem,
  streams: [
    {
      id: "nt-190-resident",
      name: "NT resident",
      cohorts: secondary(IN_STATE, ELIGIBILITY),
      status: secondary(
        "closed",
        NOMINATION,
        `No new 190 applications in 2026–27. ${CLOSURE}`,
      ),
      occupations: onshoreOccupations,
      // Research §NT item 4: the criteria when the stream is open.
      requirements: [
        secondary(
          livingInState(24),
          ELIGIBILITY,
          "At least 2 consecutive years living in the NT.",
        ),
        secondary(
          workingInState(24),
          ELIGIBILITY,
          "At least 2 years of full-time NT employment.",
        ),
      ],
    },
    {
      id: "nt-190-offshore",
      name: "Offshore",
      cohorts: secondary(
        OFFSHORE,
        ELIGIBILITY,
        "Offshore candidates are 'generally' considered only for 491.",
      ),
      status: offshoreClosed,
      occupations: offshoreOccupations,
      requirements: [],
    },
  ],
};

const nt491: StateVisaRules = {
  state: "NT",
  visa: "491",
  selectionSystem,
  streams: [
    {
      id: "nt-491-resident",
      name: "NT resident (by exception)",
      cohorts: secondary(IN_STATE, ONSHORE_EXTRA),
      status: secondary("restricted", NOMINATION, CLOSURE),
      restriction: exception491,
      occupations: onshoreOccupations,
      requirements: [
        secondary(
          livingInState(12),
          ONSHORE_EXTRA,
          "At least 12 consecutive months living in the NT. No migrating dependants may live elsewhere in Australia.",
        ),
        secondary(
          workingInState(6),
          ONSHORE_EXTRA,
          "At least 6 months of full-time NT work.",
        ),
      ],
    },
    // Research §NT item 1: the NT Graduate criteria are not recorded.
    {
      id: "nt-491-graduate",
      name: "NT graduate (by exception)",
      cohorts: secondary(IN_STATE, NOMINATION),
      status: secondary("restricted", NOMINATION, CLOSURE),
      restriction: exception491,
      occupations: secondary(
        NONE_PUBLISHED,
        NOMINATION,
        "Onshore streams reportedly have no NT list. The NT Graduate criteria are not recorded in the research.",
      ),
      requirements: [],
    },
    {
      id: "nt-491-offshore",
      name: "Offshore",
      cohorts: secondary(OFFSHORE, ELIGIBILITY),
      status: offshoreClosed,
      occupations: offshoreOccupations,
      requirements: [
        secondary(
          experience(2, 5),
          ELIGIBILITY,
          "When open: at least 2 years of post-qualification experience in the last 5.",
        ),
      ],
    },
  ],
};

export const ntRules: StateVisaRules[] = [nt190, nt491];
