import { describe, expect, it } from "vitest";
import { emptyProfile } from "../migration";
import type { Profile } from "../migration";
import { evaluateStream } from "./evaluate";
import type { StreamContext } from "./evaluate";
import type {
  Cohort,
  FederalList,
  ImportedList,
  OccupationListRef,
  RelatedWork,
  Requirement,
  Sourced,
  Stream,
} from "./rules-types";

const RULE_SOURCE = "https://migration.example.gov.au/rules";
const FEDERAL_SOURCE = "https://immi.example.gov.au/list";
const LIST_SOURCE = "https://migration.example.gov.au/list.csv";
const CHECKED = "2026-11-17";
const AS_OF = "2026-11-18";
const ALL: Cohort[] = ["living-in-state", "living-in-other-state", "offshore"];

function verified<T>(value: T, checkedAt = CHECKED): Sourced<T> {
  return { value, source: RULE_SOURCE, checkedAt, verification: "verified" };
}

function secondary<T>(value: T): Sourced<T> {
  return {
    value,
    source: RULE_SOURCE,
    checkedAt: CHECKED,
    verification: "secondary",
  };
}

const WA_LIST: OccupationListRef = { kind: "list", listId: "wa" };

function stream(overrides: Partial<Stream> = {}): Stream {
  return {
    id: "wa-test",
    name: "Test stream",
    cohorts: verified(ALL),
    status: verified("open"),
    occupations: verified(WA_LIST),
    requirements: [],
    ...overrides,
  };
}

const federal: FederalList = {
  source: FEDERAL_SOURCE,
  checkedAt: CHECKED,
  entries: {
    "261313": { "190": true, "491": true },
    "254418": { "190": true, "491": true },
    "111111": { "190": false, "491": false },
  },
};

const waList: ImportedList = {
  listId: "wa",
  source: LIST_SOURCE,
  checkedAt: CHECKED,
  entries: {
    "261313": {
      "190": ALL,
      "491": ALL,
      streams: { "190": ["schedule-2"], "491": ["graduate"] },
    },
    "254418": { "190": ["living-in-state"] },
    "111111": { "190": ALL },
  },
};

const livingInWa: Profile = {
  ...emptyProfile,
  occupation: "261313",
  onshore: true,
  state: "WA",
};
const livingInVic: Profile = { ...livingInWa, state: "VIC" };
const offshore: Profile = { ...livingInWa, onshore: false, state: "" };

function ctx(overrides: Partial<StreamContext> = {}): StreamContext {
  return {
    state: "WA",
    visa: "190",
    code: "261313",
    profile: livingInWa,
    lists: { wa: waList },
    federal,
    asOf: AS_OF,
    programYear: "2026–27",
    points: 90,
    eligibility: {
      eligible: true,
      ineligibleReasons: [],
      missing: [],
      uncheckedDates: [],
    },
    ...overrides,
  };
}

function requirementStream(
  requirement: Sourced<Requirement>,
  cohorts: Cohort[] = ALL,
): Stream {
  return stream({ cohorts: verified(cohorts), requirements: [requirement] });
}

// Check order: the two points-check checks, then the federal list, status,
// cohorts and occupation list, then each requirement.
const FEDERAL = 2;
const STATUS = 3;
const COHORT = 4;
const LIST = 5;

/** The evaluation of the stream's only requirement (always the last check). */
function lastCheck(s: Stream, context: StreamContext) {
  const result = evaluateStream(s, context);
  return result.checks[result.checks.length - 1];
}

describe("evaluateStream: federal baseline from the points check (ruling P27)", () => {
  it("starts every stream with the points check: eligibility, then the pass mark", () => {
    const result = evaluateStream(stream(), ctx());
    expect(result.outcome).toBe("pass");
    expect(result.checks.slice(0, 2)).toMatchObject([
      {
        label:
          "Age, English test and skills assessment within the federal limits",
        outcome: "pass",
        basis: "points-check",
      },
      {
        label: "At least 65 points for 190 with nomination",
        outcome: "pass",
        basis: "points-check",
      },
    ]);
  });

  it("fails on an ineligible points check and names the reason", () => {
    const result = evaluateStream(
      stream(),
      ctx({
        eligibility: {
          eligible: false,
          ineligibleReasons: ["age 45 or over", "English test expired"],
          missing: [],
          uncheckedDates: [],
        },
      }),
    );
    expect(result.outcome).toBe("fail");
    expect(result.checks[0]).toMatchObject({ outcome: "fail", stale: false });
    expect(result.checks[0].finding).toBe(
      "Your points check shows age 45 or over and English test expired",
    );
  });

  it("fails under the 65-point pass mark for the visa, and passes at 65", () => {
    const under = evaluateStream(stream(), ctx({ points: 64 }));
    expect(under.outcome).toBe("fail");
    expect(under.checks[1].outcome).toBe("fail");
    expect(under.checks[1].finding).toBe(
      "Under the 65-point pass mark for 190",
    );
    const at = evaluateStream(stream(), ctx({ visa: "491", points: 65 }));
    expect(at.checks[1].outcome).toBe("pass");
    expect(at.checks[1].label).toBe(
      "At least 65 points for 491 with nomination",
    );
  });

  it("names each missing points-check answer and its field when eligibility is unknown, never passing (ruling P32)", () => {
    const result = evaluateStream(
      stream(),
      ctx({
        eligibility: {
          eligible: null,
          ineligibleReasons: [],
          missing: ["Date of birth", "English proficiency"],
          uncheckedDates: ["assessmentDate"],
        },
      }),
    );
    expect(result.outcome).toBe("needs-answer");
    const asked = result.checks.filter((c) => c.outcome === "needs-answer");
    expect(asked.map((c) => [c.question, c.field, c.finding, c.basis])).toEqual(
      [
        [
          "Add your skills assessment issue date",
          "assessmentDate",
          "your skills assessment issue date",
          "points-check",
        ],
        [
          "Edit your answers to add your date of birth",
          "dob",
          "your date of birth",
          "points-check",
        ],
        [
          "Edit your answers to add your English level",
          "english",
          "your English level",
          "points-check",
        ],
      ],
    );
    // The pass mark still follows.
    expect(result.checks[3].label).toBe(
      "At least 65 points for 190 with nomination",
    );
  });

  it("asks for the English test date when that is all that is missing", () => {
    const result = evaluateStream(
      stream(),
      ctx({
        eligibility: {
          eligible: null,
          ineligibleReasons: [],
          missing: [],
          uncheckedDates: ["englishDate"],
        },
      }),
    );
    expect(result.checks[0]).toMatchObject({
      outcome: "needs-answer",
      question: "Add your English test date",
      field: "englishDate",
    });
  });

  it("still asks to complete the points check when it can't say what is missing", () => {
    const result = evaluateStream(
      stream(),
      ctx({
        eligibility: {
          eligible: null,
          ineligibleReasons: [],
          missing: [],
          uncheckedDates: [],
        },
      }),
    );
    expect(result.checks[0]).toMatchObject({
      outcome: "needs-answer",
      question: "Complete your points check",
      finding: "your points check",
    });
    expect(result.checks[0].field).toBeUndefined();
  });
});

describe("evaluateStream: federal list (ruling P6)", () => {
  it("fails a code absent from the federal list", () => {
    const result = evaluateStream(stream(), ctx({ code: "999999" }));
    expect(result.outcome).toBe("fail");
    expect(result.checks[FEDERAL]).toMatchObject({
      outcome: "fail",
      source: FEDERAL_SOURCE,
      checkedAt: CHECKED,
    });
    expect(result.checks[FEDERAL].finding).toBe(
      "Not on the federal list for 190",
    );
  });

  it("fails a code whose federal flag is false", () => {
    const result = evaluateStream(stream(), ctx({ code: "111111" }));
    expect(result.checks[FEDERAL].outcome).toBe("fail");
    expect(result.outcome).toBe("fail");
  });

  it("gives only an unverified check when the federal list is unavailable", () => {
    const closed = stream({ status: verified("closed") });
    const result = evaluateStream(closed, ctx({ federal: null }));
    expect(result.outcome).toBe("unverified");
    // Not even the points check: the global constraint is that every tile is
    // unverified without the federal list.
    expect(result.checks).toHaveLength(1);
    expect(result.checks[0].finding).toBe(
      "Federal occupation list not available",
    );
  });

  it("treats a stale federal list as unverified, not as a fail", () => {
    const old = { ...federal, checkedAt: "2026-09-01" };
    const result = evaluateStream(
      stream(),
      ctx({ code: "111111", federal: old }),
    );
    expect(result.checks[FEDERAL]).toMatchObject({
      outcome: "unverified",
      stale: true,
    });
  });
});

describe("evaluateStream: status", () => {
  it("fails a verified closed stream", () => {
    const result = evaluateStream(
      stream({ status: verified("closed") }),
      ctx({ visa: "491" }),
    );
    expect(result.outcome).toBe("fail");
    expect(result.checks[STATUS].finding).toBe("Closed for 491 in 2026–27");
  });

  it("never fails on a secondary closure", () => {
    const result = evaluateStream(
      stream({ status: secondary("closed") }),
      ctx(),
    );
    expect(result.checks[STATUS]).toMatchObject({
      outcome: "unverified",
      verification: "secondary",
    });
    expect(result.outcome).toBe("unverified");
    expect(result.checks[STATUS].finding).toBe(
      "Rules not yet verified on the official page",
    );
  });

  it("treats an unknown status as unverified", () => {
    const result = evaluateStream(
      stream({ status: verified("unknown") }),
      ctx(),
    );
    expect(result.checks[STATUS].outcome).toBe("unverified");
  });

  it("passes a verified restricted status (its rules are requirements)", () => {
    const result = evaluateStream(
      stream({ status: verified("restricted") }),
      ctx(),
    );
    expect(result.checks[STATUS].outcome).toBe("pass");
    expect(result.outcome).toBe("pass");
  });
});

describe("evaluateStream: cohort", () => {
  it("fails a user whose cohort a verified rule excludes", () => {
    const result = evaluateStream(
      stream({ cohorts: verified(["living-in-state"]) }),
      ctx({ profile: livingInVic }),
    );
    expect(result.checks[COHORT].outcome).toBe("fail");
    expect(result.checks[COHORT].finding).toBe(
      "Not open to those living elsewhere in Australia",
    );
  });

  it("names the offshore cohort when an onshore-only stream excludes it", () => {
    const result = evaluateStream(
      stream({ cohorts: verified(["living-in-state"]) }),
      ctx({ profile: offshore }),
    );
    expect(result.checks[COHORT].finding).toBe(
      "Not open to those living offshore",
    );
  });

  it("treats a secondary cohort rule as unverified even when it matches", () => {
    const result = evaluateStream(stream({ cohorts: secondary(ALL) }), ctx());
    expect(result.checks[COHORT].outcome).toBe("unverified");
  });

  it("asks for the current state when an onshore user has not given one", () => {
    const check = evaluateStream(
      stream({ cohorts: verified(["living-in-state"]) }),
      ctx({ profile: { ...livingInWa, state: "" } }),
    ).checks[COHORT];
    expect(check.outcome).toBe("needs-answer");
    expect(check.field).toBe("state");
    expect(check.question).toMatch(/state or territory/);
  });

  it("passes an onshore user with no state when every onshore cohort is open", () => {
    const result = evaluateStream(
      stream(),
      ctx({ profile: { ...livingInWa, state: "" } }),
    );
    expect(result.checks[COHORT].outcome).toBe("pass");
  });
});

describe("evaluateStream: occupation list", () => {
  it("fails a code absent from a verified imported list", () => {
    const result = evaluateStream(
      stream(),
      ctx({ code: "254499", federal: allEligible("254499") }),
    );
    expect(result.checks[LIST].outcome).toBe("fail");
    expect(result.checks[LIST].finding).toBe(
      "Not on the Western Australia 2026–27 list for 190",
    );
  });

  it("matches an interstate user against an in-state list entry (ruling P18)", () => {
    const result = evaluateStream(
      stream(),
      ctx({ code: "254418", profile: livingInVic }),
    );
    expect(result.checks[LIST].outcome).toBe("pass");
  });

  it("fails an offshore user on an onshore-only entry, naming the cohort", () => {
    const result = evaluateStream(
      stream(),
      ctx({ code: "254418", profile: offshore }),
    );
    expect(result.checks[LIST].outcome).toBe("fail");
    expect(result.checks[LIST].finding).toBe(
      "On the Western Australia 2026–27 list for 190 only for those living in Australia",
    );
  });

  it("applies a stream filter per visa (ruling P20)", () => {
    const schedule2 = stream({
      occupations: verified({
        kind: "list",
        listId: "wa",
        streams: ["schedule-2"],
      }),
    });
    expect(evaluateStream(schedule2, ctx()).checks[LIST]).toMatchObject({
      outcome: "pass",
      verification: "verified",
    });
    const for491 = evaluateStream(schedule2, ctx({ visa: "491" }));
    expect(for491.checks[LIST].outcome).toBe("fail");
    // Ruling P29: a filtered list names its stream, so a fail never reads
    // as the occupation missing from the whole list.
    expect(for491.checks[LIST].label).toBe(
      "On the Western Australia 2026–27 list for 491 under Test stream",
    );
    expect(for491.checks[LIST].finding).toBe(
      "Not on the Western Australia 2026–27 list for 491 under Test stream",
    );
  });

  it.each<[string, Sourced<OccupationListRef>]>([
    ["a not-imported list", verified({ kind: "not-imported" })],
    ["a none-published list", verified({ kind: "none-published" })],
    ["a secondary list reference", secondary(WA_LIST)],
    ["a list that is not loaded", verified({ kind: "list", listId: "sa" })],
    [
      "a secondary all-federal rule",
      secondary({ kind: "all-federally-eligible" }),
    ],
  ])("treats %s as unverified, never a fail", (_, occupations) => {
    const result = evaluateStream(
      stream({ occupations }),
      ctx({ code: "254499", federal: allEligible("254499") }),
    );
    expect(result.checks[LIST].outcome).toBe("unverified");
  });

  it("passes a verified all-federally-eligible rule for a federally eligible code", () => {
    const result = evaluateStream(
      stream({ occupations: verified({ kind: "all-federally-eligible" }) }),
      ctx({ code: "254499", federal: allEligible("254499") }),
    );
    expect(result.checks[LIST].outcome).toBe("pass");
    expect(result.outcome).toBe("pass");
  });

  it("treats a stale imported list as unverified", () => {
    const old = { ...waList, checkedAt: "2026-09-01" };
    const result = evaluateStream(
      stream(),
      ctx({
        code: "254499",
        federal: allEligible("254499"),
        lists: { wa: old },
      }),
    );
    expect(result.checks[LIST]).toMatchObject({
      outcome: "unverified",
      stale: true,
    });
  });

  it("never fails a stream on a stale federal list through an all-federal rule", () => {
    const old = { ...federal, checkedAt: "2026-09-01" };
    const result = evaluateStream(
      stream({ occupations: verified({ kind: "all-federally-eligible" }) }),
      ctx({ code: "111111", federal: old }),
    );
    expect(result.checks[FEDERAL]).toMatchObject({
      outcome: "unverified",
      stale: true,
    });
    expect(result.checks[LIST].outcome).not.toBe("fail");
    expect(result.outcome).toBe("unverified");
  });
});

function allEligible(code: string): FederalList {
  return {
    ...federal,
    entries: { ...federal.entries, [code]: { "190": true, "491": true } },
  };
}

const LIVING_12: Requirement = {
  kind: "min-months-living-in-state",
  months: 12,
};

describe("evaluateStream: unanswered requirements", () => {
  it.each<[Requirement, keyof Profile, Profile]>([
    [LIVING_12, "monthsLivingInState", livingInWa],
    [
      {
        kind: "min-months-working-in-state",
        months: 6,
        related: "same-occupation",
      },
      "monthsWorkingInState",
      livingInWa,
    ],
    [
      { kind: "min-months-living-offshore", months: 6 },
      "monthsLivingOffshore",
      offshore,
    ],
    [{ kind: "job-offer-in-state" }, "jobOfferState", livingInWa],
    [
      { kind: "visa-expiry-before", date: "2027-01-31" },
      "visaExpiry",
      livingInWa,
    ],
    [
      {
        kind: "min-years-experience",
        years: 1,
        withinYears: 3,
        related: "same-occupation",
      },
      "yearsExperienceLast3",
      livingInWa,
    ],
    [{ kind: "lives-regional" }, "livesRegional", livingInWa],
    [{ kind: "studied-in-state" }, "studyState", livingInWa],
  ])("asks a question for an unanswered %o", (requirement, field, profile) => {
    const check = lastCheck(
      requirementStream(verified(requirement)),
      ctx({ profile }),
    );
    expect(check.outcome).toBe("needs-answer");
    expect(check.field).toBe(field);
    expect(check.question).toMatch(/\?$/);
  });

  it("treats null as unanswered", () => {
    const check = lastCheck(
      requirementStream(verified(LIVING_12)),
      ctx({ profile: { ...livingInWa, monthsLivingInState: null } }),
    );
    expect(check.outcome).toBe("needs-answer");
    expect(check.finding).toBe("months living in Western Australia");
  });

  it("never asks about a secondary requirement", () => {
    const check = lastCheck(requirementStream(secondary(LIVING_12)), ctx());
    expect(check.outcome).toBe("unverified");
    expect(check.question).toBeUndefined();
  });

  it.each<[Requirement, RegExp]>([
    [
      {
        kind: "min-months-working-in-state",
        months: 6,
        related: "same-occupation",
      },
      /in your nominated occupation\?$/,
    ],
    [
      {
        kind: "min-months-working-in-state",
        months: 6,
        related: "anzsco-2-digit",
      },
      /one Western Australia treats as related \(same first 2 ANZSCO digits\)\?$/,
    ],
    [
      {
        kind: "min-months-working-in-state",
        months: 6,
        related: "anzsco-3-digit",
      },
      /one Western Australia treats as related \(same first 3 ANZSCO digits\)\?$/,
    ],
  ])(
    "words the work question with the state's relatedness (ruling P15)",
    (requirement, pattern) => {
      expect(
        lastCheck(requirementStream(verified(requirement)), ctx()).question,
      ).toMatch(pattern);
    },
  );
});

describe("evaluateStream: months in the state", () => {
  const living = (monthsLivingInState: number) =>
    ctx({ profile: { ...livingInWa, monthsLivingInState } });

  it("passes at the minimum and fails below it", () => {
    const s = requirementStream(verified(LIVING_12));
    expect(lastCheck(s, living(12)).outcome).toBe("pass");
    const below = lastCheck(s, living(11));
    expect(below.outcome).toBe("fail");
    expect(below.finding).toBe("Under 12 months living in Western Australia");
  });

  it("names the answer that decided a pass or fail, so it stays editable", () => {
    const s = requirementStream(verified(LIVING_12));
    expect(lastCheck(s, living(12)).field).toBe("monthsLivingInState");
    expect(lastCheck(s, living(11)).field).toBe("monthsLivingInState");
  });

  it("names no answer when residence, not the answer, decided", () => {
    const s = requirementStream(verified(LIVING_12), ["living-in-state"]);
    const elsewhere = ctx({
      profile: { ...livingInVic, monthsLivingInState: 30 },
    });
    expect(lastCheck(s, elsewhere).field).toBeUndefined();
  });

  it("never fails a short streak on an N-of-the-last-M rule (ruling P16)", () => {
    const s = requirementStream(
      verified({
        kind: "min-months-living-in-state",
        months: 9,
        ofLastMonths: 12,
      }),
    );
    expect(lastCheck(s, living(8)).outcome).toBe("unverified");
    expect(lastCheck(s, living(9)).outcome).toBe("pass");
  });

  it("does not check in-state months for an interstate user on a stream open to them (ruling P19)", () => {
    const s = requirementStream(
      verified({
        kind: "min-months-working-in-state",
        months: 3,
        related: "anzsco-3-digit",
      }),
      ["living-in-state", "living-in-other-state"],
    );
    const check = lastCheck(
      s,
      ctx({ profile: { ...livingInVic, monthsWorkingInState: 0 } }),
    );
    expect(check.outcome).toBe("unverified");
  });

  it("fails in-state months for an interstate user on an in-state-only stream (ruling P2)", () => {
    const s = requirementStream(verified(LIVING_12), ["living-in-state"]);
    const check = lastCheck(s, ctx({ profile: livingInVic }));
    expect(check.outcome).toBe("fail");
    expect(check.finding).toBe("You don't currently live in Western Australia");
  });

  it("fails in-state months for an offshore user", () => {
    const check = lastCheck(
      requirementStream(verified(LIVING_12)),
      ctx({ profile: offshore }),
    );
    expect(check.outcome).toBe("fail");
  });
});

describe("evaluateStream: other requirements", () => {
  const OFFSHORE_6: Requirement = {
    kind: "min-months-living-offshore",
    months: 6,
  };

  it("checks months offshore and fails an onshore user", () => {
    const s = requirementStream(verified(OFFSHORE_6));
    const at = (monthsLivingOffshore: number) =>
      ctx({ profile: { ...offshore, monthsLivingOffshore } });
    expect(lastCheck(s, at(6)).outcome).toBe("pass");
    expect(lastCheck(s, at(5)).outcome).toBe("fail");
    expect(lastCheck(s, ctx()).outcome).toBe("fail");
  });

  it("keeps the related-work definition on an answered work check", () => {
    const s = requirementStream(
      verified({
        kind: "min-months-working-in-state",
        months: 6,
        related: "anzsco-3-digit",
      }),
    );
    const check = lastCheck(
      s,
      ctx({ profile: { ...livingInWa, monthsWorkingInState: 8 } }),
    );
    expect(check).toMatchObject({
      outcome: "pass",
      field: "monthsWorkingInState",
      related: "anzsco-3-digit",
    });
  });

  it("passes a job offer only in the rule's state", () => {
    const s = requirementStream(verified({ kind: "job-offer-in-state" }));
    const offer = (jobOfferState: Profile["jobOfferState"]) =>
      ctx({ profile: { ...livingInWa, jobOfferState } });
    expect(lastCheck(s, offer("WA")).outcome).toBe("pass");
    expect(lastCheck(s, offer("VIC")).outcome).toBe("fail");
    expect(lastCheck(s, offer("none")).outcome).toBe("fail");
  });

  it("passes a visa expiring on or before the date", () => {
    const s = requirementStream(
      verified({ kind: "visa-expiry-before", date: "2027-01-31" }),
    );
    const expiring = (visaExpiry: string) =>
      ctx({ profile: { ...livingInWa, visaExpiry } });
    expect(lastCheck(s, expiring("2027-01-31")).outcome).toBe("pass");
    expect(lastCheck(s, expiring("2026-12-01")).outcome).toBe("pass");
    expect(lastCheck(s, expiring("2027-02-01")).outcome).toBe("fail");
    expect(lastCheck(s, expiring("")).outcome).toBe("needs-answer");
  });

  it.each<[number, keyof Profile]>([
    [3, "yearsExperienceLast3"],
    [4, "yearsExperienceLast5"],
    [5, "yearsExperienceLast5"],
    [10, "yearsExperienceLast10"],
  ])(
    "maps a %i-year experience window to %s (ruling P14)",
    (withinYears, field) => {
      const s = requirementStream(
        verified({
          kind: "min-years-experience",
          years: 1,
          withinYears,
          related: "same-occupation",
        }),
      );
      expect(lastCheck(s, ctx()).field).toBe(field);
      const answered = (value: number) =>
        ctx({ profile: { ...livingInWa, [field]: value } });
      expect(lastCheck(s, answered(1)).outcome).toBe("pass");
      expect(lastCheck(s, answered(0.5)).outcome).toBe("fail");
    },
  );

  it("names which work counts in the experience rule and keeps it on the check (ruling P31)", () => {
    const s = requirementStream(
      verified({
        kind: "min-years-experience",
        years: 1,
        withinYears: 10,
        related: "anzsco-4-digit",
      }),
    );
    const check = lastCheck(s, ctx());
    expect(check.label).toBe(
      "At least 1 year of skilled work in the last 10 years in your nominated occupation or one Western Australia treats as related (same first 4 ANZSCO digits)",
    );
    expect(check.related).toBe("anzsco-4-digit");
    const any = requirementStream(
      verified({
        kind: "min-years-experience",
        years: 3,
        withinYears: 5,
        related: "any-skilled",
      }),
    );
    expect(lastCheck(any, ctx()).label).toBe(
      "At least 3 years of skilled work in the last 5 years in any skilled occupation",
    );
  });

  it.each<[RelatedWork, string]>([
    [
      "anzsco-4-digit",
      "Under 1 year in the last 10 years by your answer; Western Australia also counts work in a related occupation (same first 4 ANZSCO digits)",
    ],
    [
      "any-skilled",
      "Under 1 year in the last 10 years by your answer; Western Australia also counts skilled work in any occupation",
    ],
  ])(
    "never fails a %s experience rule on an answer below it (ruling P31)",
    (related, finding) => {
      const s = requirementStream(
        verified({
          kind: "min-years-experience",
          years: 1,
          withinYears: 10,
          related,
        }),
      );
      const answered = (value: number) =>
        ctx({ profile: { ...livingInWa, yearsExperienceLast10: value } });
      const below = lastCheck(s, answered(0.5));
      expect(below.outcome).toBe("unverified");
      expect(below.finding).toBe(finding);
      expect(below.field).toBe("yearsExperienceLast10");
      expect(lastCheck(s, answered(1)).outcome).toBe("pass");
    },
  );

  it("checks living regionally and studying in the state", () => {
    const regional = requirementStream(verified({ kind: "lives-regional" }));
    const studied = requirementStream(verified({ kind: "studied-in-state" }));
    const answers = (patch: Partial<Profile>) =>
      ctx({ profile: { ...livingInWa, ...patch } });
    expect(lastCheck(regional, answers({ livesRegional: true })).outcome).toBe(
      "pass",
    );
    expect(lastCheck(regional, answers({ livesRegional: false })).outcome).toBe(
      "fail",
    );
    expect(lastCheck(studied, answers({ studyState: "WA" })).outcome).toBe(
      "pass",
    );
    expect(lastCheck(studied, answers({ studyState: "SA" })).outcome).toBe(
      "fail",
    );
  });
});

describe("evaluateStream: staleness", () => {
  it("says the check date is unknown when it cannot be read", () => {
    const check = lastCheck(
      requirementStream(verified(LIVING_12, "not-a-date")),
      ctx(),
    );
    expect(check).toMatchObject({ outcome: "unverified", stale: true });
    expect(check.finding).toBe("Rules check date unknown; may have changed");
  });

  it("treats a rule checked 61 days before asOf as unverified", () => {
    const check = lastCheck(
      requirementStream(verified(LIVING_12, "2026-09-18")),
      ctx({ profile: { ...livingInWa, monthsLivingInState: 1 } }),
    );
    expect(check).toMatchObject({ outcome: "unverified", stale: true });
    expect(check.finding).toBe(
      "Rules last checked 18 Sep 2026; may have changed",
    );
  });

  it("still applies a rule checked exactly 60 days before asOf", () => {
    const check = lastCheck(
      requirementStream(verified(LIVING_12, "2026-09-19")),
      ctx({ profile: { ...livingInWa, monthsLivingInState: 1 } }),
    );
    expect(check).toMatchObject({ outcome: "fail", stale: false });
  });
});

describe("evaluateStream: aggregation", () => {
  it("takes the worst check: fail over unverified over needs-answer", () => {
    const mixed = stream({
      requirements: [
        verified(LIVING_12),
        secondary<Requirement>({ kind: "lives-regional" }),
      ],
    });
    expect(evaluateStream(mixed, ctx()).outcome).toBe("unverified");
    const failing = { ...mixed, status: verified("closed" as const) };
    expect(evaluateStream(failing, ctx()).outcome).toBe("fail");
  });

  it("gives needs-answer when only answers are missing", () => {
    const result = evaluateStream(
      requirementStream(verified(LIVING_12)),
      ctx(),
    );
    expect(result).toMatchObject({
      streamId: "wa-test",
      name: "Test stream",
      outcome: "needs-answer",
    });
  });
});
