import type {
  Requirement,
  Sourced,
  StateVisaRules,
  Stream,
} from "../../../lib/state-outlook/rules-types";
import {
  ALL_COHORTS,
  experience,
  JOB_OFFER,
  list,
  secondary,
  STUDIED_IN_STATE,
  verified,
} from "./sourced";

// Research §WA: every item was read directly ([D]).
const PAGE =
  "https://migration.wa.gov.au/our-services-support/state-nominated-migration-program";
const ELIGIBILITY = `${PAGE}#eligibility`;
const ROUNDS = `${PAGE}#invitation-rounds`;
const FAQ = `${PAGE}#snmp-frequently-asked-questions`;
const CRITERIA =
  "https://migration.wa.gov.au/sites/default/files/2026-11/SNMP%20Criteria%2026-27.pdf";
const DEFENCE_NEWS =
  "https://migration.wa.gov.au/news/defence-industry-stream-now-available-under-state-nominated-migration-program";
const LIST =
  "https://migration.wa.gov.au/v2_occupation_search/occupation-search?combine=&_format=csv";

const RESIDENCE_NOTE =
  "No minimum residence, and offshore candidates are accepted. Those living in WA are ranked first and must show 3 months' continuous WA residence immediately before the invitation; those living interstate or overseas must show a genuine commitment to WA.";

// Research §WA item 4: residence affects ranking, not eligibility.
const cohorts190 = verified(ALL_COHORTS, CRITERIA, RESIDENCE_NOTE);
const cohorts491 = verified(
  ALL_COHORTS,
  CRITERIA,
  `${RESIDENCE_NOTE} Perth counts as regional for 491.`,
);

const open = verified(
  "open" as const,
  ROUNDS,
  "Invitation rounds ran in September and October 2026 (1,100 and 1,227 invitations), most recently on 14 October 2026.",
);

// Research §WA item 4. Judgement: the contract rule was read directly, but
// building and construction sector occupations are exempt and the imported WA
// list carries no sector, so MigrateLens cannot tell who needs a contract. Held as
// secondary so it never decides eligibility.
const contract190 = secondary(
  JOB_OFFER,
  ELIGIBILITY,
  "Read directly: a full-time (35+ hours a week) employment contract in WA for at least 6 months. Building and construction sector occupations are exempt, and the imported WA list has no sector column, so this check is not applied as verified.",
);

// Research §WA item 4. The window is 10 years; a "last 5 years" answer can
// show a pass but not a fail (carry to the evaluator).
const schedule1Experience = verified(
  experience(1, 10, "anzsco-4-digit"),
  ELIGIBILITY,
  "At least 1 year in the nominated or a closely related occupation (same first 4 ANZSCO digits) in the last 10 years. Only paid, post-qualification work of 20+ hours a week counts, and Australian and overseas experience cannot be combined.",
);

// Ruling P28: the rule was read directly, but MigrateLens asks only which state
// you studied in, so it cannot test the length, mode or level of the study.
const waStudy = secondary(
  STUDIED_IN_STATE,
  ELIGIBILITY,
  "Read directly: at least two academic years (87 weeks or more) of face-to-face study in WA, and a WA qualification at Certificate III or above; no employment contract is needed. MigrateLens asks only which state you studied in, so it cannot test the 87 weeks, face-to-face study or the qualification level, and this check is not applied as verified.",
);

// Research §WA item 2: the imported list records membership per code, so a
// code's visa flags are the union of its rows across WA's schedules.
const LIST_NOTE =
  "One WA table covers Schedules 1–3 and the Graduate list; minimum 65 points on every row.";

function stream(
  id: string,
  name: string,
  cohorts: Sourced<Stream["cohorts"]["value"]>,
  tags: string[],
  requirements: Sourced<Requirement>[],
  status: Stream["status"] = open,
): Stream {
  return {
    id,
    name,
    cohorts,
    status,
    occupations: verified(list("wa", tags), LIST, LIST_NOTE),
    requirements,
  };
}

// Research §WA items 5 and 7. Contradiction: the web FAQ ranks sector before
// residence; the October 2026 PDF lists residence first. Both readings kept.
const selectionSystem = secondary(
  "WA ranks EOIs with no state score: by sector tier (building and construction trades; then building and construction non-trades, healthcare and social assistance, hospitality and tourism, education and training; then all other sectors), by WA residence, then by EOI points and EOI date. The Graduate stream ranks qualification level before points, with up to 75% of graduate places for higher-education graduates. Candidates eligible for both visas are generally invited for 491 first.",
  FAQ,
  "Official pages conflict: the web FAQ ranks sector before residence, while the October 2026 last-invited PDF lists residence first, then sector. The PDF names four priority sectors without the trades/non-trades split; the web page has five tiers. WA's last-invited figures do not take occupation or visa caps into account.",
);

const wa190: StateVisaRules = {
  state: "WA",
  visa: "190",
  selectionSystem,
  resultsUrl: ROUNDS,
  streams: [
    stream(
      "wa-general-schedule-1",
      "General stream (Schedule 1)",
      cohorts190,
      ["schedule-1"],
      [contract190, schedule1Experience],
    ),
    stream(
      "wa-general-schedule-2",
      "General stream (Schedule 2)",
      cohorts190,
      ["schedule-2"],
      [contract190],
    ),
    // Research §WA item 1: Schedule 3 is 190 only. No defence-specific
    // criteria beyond the contract are recorded.
    stream(
      "wa-defence",
      "Defence industry stream (Schedule 3)",
      cohorts190,
      ["schedule-3"],
      [contract190],
      verified(
        "open",
        DEFENCE_NEWS,
        "Announced as now available on 13 November 2026.",
      ),
    ),
    stream(
      "wa-graduate",
      "Graduate stream",
      cohorts190,
      ["graduate"],
      [waStudy],
    ),
  ],
};

// Research §WA item 4: no contract is needed for 491.
const wa491: StateVisaRules = {
  state: "WA",
  visa: "491",
  selectionSystem,
  resultsUrl: ROUNDS,
  streams: [
    stream(
      "wa-general-schedule-1",
      "General stream (Schedule 1)",
      cohorts491,
      ["schedule-1"],
      [schedule1Experience],
    ),
    stream(
      "wa-general-schedule-2",
      "General stream (Schedule 2)",
      cohorts491,
      ["schedule-2"],
      [],
    ),
    stream(
      "wa-graduate",
      "Graduate stream",
      cohorts491,
      ["graduate"],
      [waStudy],
    ),
  ],
};

export const waRules: StateVisaRules[] = [wa190, wa491];
