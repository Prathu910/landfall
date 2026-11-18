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
    ...overrides,
  };
}

function requirementStream(
  requirement: Sourced<Requirement>,
  cohorts: Cohort[] = ALL,
): Stream {
  return stream({ cohorts: verified(cohorts), requirements: [requirement] });
}

/** The evaluation of the stream's only requirement (always the last check). */
function lastCheck(s: Stream, context: StreamContext) {
  const { result, findings } = evaluateStream(s, context);
  const index = result.checks.length - 1;
  return { ...result.checks[index], finding: findings[index] };
}

describe("evaluateStream: federal list (ruling P6)", () => {
  it("fails a code absent from the federal list", () => {
    const { result, findings } = evaluateStream(
      stream(),
      ctx({ code: "999999" }),
    );
    expect(result.outcome).toBe("fail");
    expect(result.checks[0]).toMatchObject({
      outcome: "fail",
      source: FEDERAL_SOURCE,
      checkedAt: CHECKED,
    });
    expect(findings[0]).toBe("Not on the federal list for 190");
  });

  it("fails a code whose federal flag is false", () => {
    const { result } = evaluateStream(stream(), ctx({ code: "111111" }));
    expect(result.checks[0].outcome).toBe("fail");
    expect(result.outcome).toBe("fail");
  });

  it("gives only an unverified check when the federal list is unavailable", () => {
    const closed = stream({ status: verified("closed") });
    const { result, findings } = evaluateStream(closed, ctx({ federal: null }));
    expect(result.outcome).toBe("unverified");
    expect(result.checks).toHaveLength(1);
    expect(findings[0]).toBe("Federal occupation list not available");
  });

  it("treats a stale federal list as unverified, not as a fail", () => {
    const old = { ...federal, checkedAt: "2026-09-01" };
    const { result } = evaluateStream(
      stream(),
      ctx({ code: "111111", federal: old }),
    );
    expect(result.checks[0]).toMatchObject({
      outcome: "unverified",
      stale: true,
    });
  });
});

describe("evaluateStream: status", () => {
  it("fails a verified closed stream", () => {
    const { result, findings } = evaluateStream(
      stream({ status: verified("closed") }),
      ctx({ visa: "491" }),
    );
    expect(result.outcome).toBe("fail");
    expect(findings[1]).toBe("Closed for 491 in 2026–27");
  });

  it("never fails on a secondary closure", () => {
    const { result, findings } = evaluateStream(
      stream({ status: secondary("closed") }),
      ctx(),
    );
    expect(result.checks[1].outcome).toBe("unverified");
    expect(result.outcome).toBe("unverified");
    expect(findings[1]).toBe("Rules not yet verified on the official page");
  });

  it("treats an unknown status as unverified", () => {
    const { result } = evaluateStream(
      stream({ status: verified("unknown") }),
      ctx(),
    );
    expect(result.checks[1].outcome).toBe("unverified");
  });

  it("passes a verified restricted status (its rules are requirements)", () => {
    const { result } = evaluateStream(
      stream({ status: verified("restricted") }),
      ctx(),
    );
    expect(result.checks[1].outcome).toBe("pass");
    expect(result.outcome).toBe("pass");
  });
});

describe("evaluateStream: cohort", () => {
  it("fails a user whose cohort a verified rule excludes", () => {
    const { result, findings } = evaluateStream(
      stream({ cohorts: verified(["living-in-state"]) }),
      ctx({ profile: livingInVic }),
    );
    expect(result.checks[2].outcome).toBe("fail");
    expect(findings[2]).toBe("Not open to those living elsewhere in Australia");
  });

  it("names the offshore cohort when an onshore-only stream excludes it", () => {
    const { findings } = evaluateStream(
      stream({ cohorts: verified(["living-in-state"]) }),
      ctx({ profile: offshore }),
    );
    expect(findings[2]).toBe("Not open to those living offshore");
  });

  it("treats a secondary cohort rule as unverified even when it matches", () => {
    const { result } = evaluateStream(
      stream({ cohorts: secondary(ALL) }),
      ctx(),
    );
    expect(result.checks[2].outcome).toBe("unverified");
  });

  it("asks for the current state when an onshore user has not given one", () => {
    const check = evaluateStream(
      stream({ cohorts: verified(["living-in-state"]) }),
      ctx({ profile: { ...livingInWa, state: "" } }),
    ).result.checks[2];
    expect(check.outcome).toBe("needs-answer");
    expect(check.field).toBe("state");
    expect(check.question).toMatch(/state or territory/);
  });

  it("passes an onshore user with no state when every onshore cohort is open", () => {
    const { result } = evaluateStream(
      stream(),
      ctx({ profile: { ...livingInWa, state: "" } }),
    );
    expect(result.checks[2].outcome).toBe("pass");
  });
});

describe("evaluateStream: occupation list", () => {
  it("fails a code absent from a verified imported list", () => {
    const { result, findings } = evaluateStream(
      stream(),
      ctx({ code: "254499", federal: allEligible("254499") }),
    );
    expect(result.checks[3].outcome).toBe("fail");
    expect(findings[3]).toBe(
      "Not on the Western Australia 2026–27 list for 190",
    );
  });

  it("matches an interstate user against an in-state list entry (ruling P18)", () => {
    const { result } = evaluateStream(
      stream(),
      ctx({ code: "254418", profile: livingInVic }),
    );
    expect(result.checks[3].outcome).toBe("pass");
  });

  it("fails an offshore user on an onshore-only entry, naming the cohort", () => {
    const { result, findings } = evaluateStream(
      stream(),
      ctx({ code: "254418", profile: offshore }),
    );
    expect(result.checks[3].outcome).toBe("fail");
    expect(findings[3]).toBe(
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
    expect(evaluateStream(schedule2, ctx()).result.checks[3].outcome).toBe(
      "pass",
    );
    const for491 = evaluateStream(schedule2, ctx({ visa: "491" }));
    expect(for491.result.checks[3].outcome).toBe("fail");
    expect(for491.findings[3]).toBe(
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
    const { result } = evaluateStream(
      stream({ occupations }),
      ctx({ code: "254499", federal: allEligible("254499") }),
    );
    expect(result.checks[3].outcome).toBe("unverified");
  });

  it("passes a verified all-federally-eligible rule for a federally eligible code", () => {
    const { result } = evaluateStream(
      stream({ occupations: verified({ kind: "all-federally-eligible" }) }),
      ctx({ code: "254499", federal: allEligible("254499") }),
    );
    expect(result.checks[3].outcome).toBe("pass");
    expect(result.outcome).toBe("pass");
  });

  it("treats a stale imported list as unverified", () => {
    const old = { ...waList, checkedAt: "2026-09-01" };
    const { result } = evaluateStream(
      stream(),
      ctx({
        code: "254499",
        federal: allEligible("254499"),
        lists: { wa: old },
      }),
    );
    expect(result.checks[3]).toMatchObject({
      outcome: "unverified",
      stale: true,
    });
  });

  it("never fails a stream on a stale federal list through an all-federal rule", () => {
    const old = { ...federal, checkedAt: "2026-09-01" };
    const { result } = evaluateStream(
      stream({ occupations: verified({ kind: "all-federally-eligible" }) }),
      ctx({ code: "111111", federal: old }),
    );
    expect(result.checks[0]).toMatchObject({
      outcome: "unverified",
      stale: true,
    });
    expect(result.checks[3].outcome).not.toBe("fail");
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
      { kind: "min-years-experience", years: 1, withinYears: 3 },
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
        verified({ kind: "min-years-experience", years: 1, withinYears }),
      );
      expect(lastCheck(s, ctx()).field).toBe(field);
      const answered = (value: number) =>
        ctx({ profile: { ...livingInWa, [field]: value } });
      expect(lastCheck(s, answered(1)).outcome).toBe("pass");
      expect(lastCheck(s, answered(0.5)).outcome).toBe("fail");
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
    expect(evaluateStream(mixed, ctx()).result.outcome).toBe("unverified");
    const failing = { ...mixed, status: verified("closed" as const) };
    expect(evaluateStream(failing, ctx()).result.outcome).toBe("fail");
  });

  it("gives needs-answer when only answers are missing", () => {
    const { result } = evaluateStream(
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
