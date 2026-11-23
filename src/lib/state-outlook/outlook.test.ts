import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { coreFixture } from "../data/__fixtures__/occupation";
import type { OccupationCore, StateCode } from "../data/types";
import { emptyProfile } from "../migration";
import type { Profile } from "../migration";
import { BANNED_COPY } from "../report/copy";
import { realFederal, realLists } from "./__fixtures__/real-data";
import { stateOutlook } from "./outlook";
import type { Outlook } from "./outlook";
import type {
  Cohort,
  FederalList,
  ImportedList,
  Requirement,
  Sourced,
  StateVisaRules,
  Stream,
} from "./rules-types";

const SOURCE = "https://migration.example.gov.au/rules";
const CHECKED = "2026-11-17";
const AS_OF = "2026-11-18";
const ALL: Cohort[] = ["living-in-state", "living-in-other-state", "offshore"];
const CODE = "261313";

function verified<T>(value: T): Sourced<T> {
  return {
    value,
    source: SOURCE,
    checkedAt: CHECKED,
    verification: "verified",
  };
}

function secondary<T>(value: T): Sourced<T> {
  return {
    value,
    source: SOURCE,
    checkedAt: CHECKED,
    verification: "secondary",
  };
}

function stream(id: string, overrides: Partial<Stream> = {}): Stream {
  return {
    id,
    name: `Stream ${id}`,
    cohorts: verified(ALL),
    status: verified("open"),
    occupations: verified({ kind: "all-federally-eligible" }),
    requirements: [],
    ...overrides,
  };
}

function visaRules(
  state: StateCode,
  streams: Stream[],
  visa: "190" | "491" = "190",
): StateVisaRules {
  return {
    state,
    visa,
    selectionSystem: verified("Ranked by points"),
    streams,
  };
}

const LAST_YEAR = [
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
  "2026-09",
  "2026-10",
];

function monthly(
  entries: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  return Object.fromEntries(LAST_YEAR.map((m) => [m, entries[m] ?? {}]));
}

// At 90 points: WA has 42 invited at 85, SA only masked counts, QLD only
// invitations above 90, ANY a large count that must never change a group.
const core: OccupationCore = {
  ...coreFixture,
  code: CODE,
  stateInvited: {
    "190": {
      WA: monthly({ "2026-09": { "85": "42" } }),
      SA: monthly({ "2026-08": { "85": "<20" } }),
      QLD: monthly({ "2026-09": { "100": "30" } }),
      NSW: monthly({ "2026-10": { "80": "60" } }),
      ANY: monthly({ "2026-09": { "80": "500" } }),
    },
  },
};

const federal: FederalList = {
  source: "https://immi.example.gov.au/list",
  checkedAt: CHECKED,
  entries: { [CODE]: { "189": true, "190": true, "491": true } },
};

const livingInSa: Profile = {
  ...emptyProfile,
  occupation: CODE,
  onshore: true,
  state: "SA",
};

const LIVING_12: Requirement = {
  kind: "min-months-living-in-state",
  months: 12,
};

function outlook(
  rules: StateVisaRules[],
  overrides: Partial<Parameters<typeof stateOutlook>[0]> = {},
): Outlook {
  return stateOutlook({
    core,
    rules: { programYear: "2026-27", rules },
    lists: {},
    federal,
    profile: livingInSa,
    points: 90,
    eligibility: {
      eligible: true,
      ineligibleReasons: [],
      missing: [],
      uncheckedDates: [],
    },
    visa: "190",
    asOf: AS_OF,
    ...overrides,
  });
}

function outcomeFor(result: Outlook, state: StateCode) {
  const found = result.states.find((s) => s.state === state);
  if (!found) throw new Error(`no outcome for ${state}`);
  return found;
}

describe("stateOutlook: groups", () => {
  it("puts a passing state with confirmed invitations at or below the score in strongest", () => {
    const wa = outcomeFor(outlook([visaRules("WA", [stream("wa-a")])]), "WA");
    expect(wa.group).toBe("strongest");
    expect(wa.deciding?.streamId).toBe("wa-a");
    expect(wa.evidence.peak?.invitedAtLeast.min).toBe(42);
    expect(wa.reasonText).toBe("Meets every verified rule for Stream wa-a");
  });

  it("puts a passing state with masked-only invitations in watching", () => {
    const sa = outcomeFor(outlook([visaRules("SA", [stream("sa-a")])]), "SA");
    expect(sa.group).toBe("watching");
  });

  it("puts a passing state with invitations only above the score in watching", () => {
    const qld = outcomeFor(outlook([visaRules("QLD", [stream("q")])]), "QLD");
    expect(qld.group).toBe("watching");
  });

  it("names the question when a verified requirement is unanswered", () => {
    const sa = outcomeFor(
      outlook([
        visaRules("SA", [
          stream("sa-a", { requirements: [verified(LIVING_12)] }),
        ]),
      ]),
      "SA",
    );
    expect(sa.group).toBe("needs-answers");
    expect(sa.reasonText).toBe(
      "Answer 1 question: months living in South Australia",
    );
    const asked = sa.deciding?.checks.filter((c) => c.question);
    expect(asked?.map((c) => c.field)).toEqual(["monthsLivingInState"]);
  });

  it("never passes or fails on unanswered facts (Review Focus 1)", () => {
    const run = (profile: Profile) =>
      outlook(
        stateRules.rules.filter((r) => r.visa === "190"),
        {
          lists: realLists(),
          federal: realFederal(),
          profile,
        },
      );
    const unanswered = run(livingInSa);
    for (const s of unanswered.states) {
      if (s.group === "strongest" || s.group === "watching") {
        expect(s.deciding?.checks.every((c) => c.outcome === "pass")).toBe(
          true,
        );
      }
      if (s.group === "needs-answers") {
        expect(s.reasonText).toMatch(/^Answer \d+ questions?: /);
        expect(s.deciding?.checks.some((c) => c.question)).toBe(true);
      }
    }
    const allNull = run({
      ...livingInSa,
      monthsLivingInState: null,
      monthsWorkingInState: null,
      monthsLivingOffshore: null,
      yearsExperienceLast3: null,
      yearsExperienceLast5: null,
      yearsExperienceLast10: null,
      jobOfferState: null,
      livesRegional: null,
      studyState: null,
    });
    expect(allNull).toEqual(unanswered);
    expect(unanswered.states.some((s) => s.group === "needs-answers")).toBe(
      true,
    );
  });

  it("gives needs-answers when one stream is secondary and another needs answers, in either order (ruling P3)", () => {
    const unanswered = stream("sa-answers", {
      requirements: [verified(LIVING_12)],
    });
    const unverified = stream("sa-secondary", { cohorts: secondary(ALL) });
    for (const streams of [
      [unanswered, unverified],
      [unverified, unanswered],
    ]) {
      const sa = outcomeFor(outlook([visaRules("SA", streams)]), "SA");
      expect(sa.group).toBe("needs-answers");
      expect(sa.deciding?.streamId).toBe("sa-answers");
    }
  });

  it("gives unverified for a state whose only stream is secondary (Review Focus 2)", () => {
    const sa = outcomeFor(
      outlook([
        visaRules("SA", [stream("sa-a", { status: secondary("open") })]),
      ]),
      "SA",
    );
    expect(sa.group).toBe("unverified");
    expect(sa.reasonText).toBe("Rules not yet verified on the official page");
  });

  it("gives unverified when a secondary rule sits beside verified rules that pass (Review Focus 2)", () => {
    const sa = outcomeFor(
      outlook(
        [
          visaRules("SA", [
            stream("sa-a", {
              requirements: [
                verified(LIVING_12),
                secondary<Requirement>({ kind: "lives-regional" }),
              ],
            }),
          ]),
        ],
        { profile: { ...livingInSa, monthsLivingInState: 24 } },
      ),
      "SA",
    );
    expect(sa.group).toBe("unverified");
    expect(sa.deciding?.checks.map((c) => c.outcome)).toEqual([
      "pass", // points check: eligibility
      "pass", // points check: pass mark
      "pass",
      "pass",
      "pass",
      "pass",
      "pass",
      "unverified",
    ]);
  });

  it("gives not-open for a code missing from a verified list (Review Focus 3)", () => {
    const list: ImportedList = {
      listId: "wa",
      source: SOURCE,
      checkedAt: CHECKED,
      entries: { "111111": { "491": ALL } },
    };
    const result = outlook(
      [
        visaRules(
          "WA",
          [
            stream("wa-a", {
              occupations: verified({ kind: "list", listId: "wa" }),
            }),
          ],
          "491",
        ),
      ],
      { visa: "491", lists: { wa: list } },
    );
    const wa = outcomeFor(result, "WA");
    expect(wa.group).toBe("not-open");
    expect(wa.reasonText).toBe(
      "Not on the Western Australia 2026–27 list for 491",
    );
  });

  it("gives unverified for rules checked 61 days before asOf (Review Focus 4)", () => {
    const sa = outcomeFor(
      outlook([visaRules("SA", [stream("sa-a")])], { asOf: "2027-01-17" }),
      "SA",
    );
    expect(sa.group).toBe("unverified");
    expect(sa.reasonText).toBe(
      "Rules last checked 17 Nov 2026; may have changed",
    );
    expect(sa.deciding?.checks.some((c) => c.stale)).toBe(true);
  });

  it("gives not-open for NSW 491, which is closed", () => {
    const nsw = outcomeFor(
      outlook(
        stateRules.rules.filter((r) => r.state === "NSW"),
        { visa: "491", lists: realLists(), federal: realFederal() },
      ),
      "NSW",
    );
    expect(nsw.group).toBe("not-open");
    expect(nsw.reasonText).toBe("Closed for 491 in 2026–27");
  });

  it("gives not-open everywhere for a federally ineligible occupation", () => {
    const ineligible: FederalList = {
      ...federal,
      entries: { [CODE]: { "189": false, "190": false, "491": true } },
    };
    const result = outlook(stateRules.rules, {
      federal: ineligible,
      lists: realLists(),
    });
    expect(result.states).toHaveLength(8);
    for (const s of result.states) {
      expect(s.group).toBe("not-open");
      expect(s.reasonText).toBe("Not on the federal list for 190");
    }
  });

  it("gives not-open everywhere for an ineligible points check, naming the reason (ruling P27)", () => {
    const result = outlook([visaRules("WA", [stream("wa-a")])], {
      eligibility: {
        eligible: false,
        ineligibleReasons: ["age 45 or over"],
        missing: [],
        uncheckedDates: [],
      },
    });
    for (const s of result.states.filter((x) => x.deciding !== null)) {
      expect(s.group).toBe("not-open");
      expect(s.reasonText).toBe("Your points check shows age 45 or over");
    }
  });

  it("gives not-open everywhere under the 65-point pass mark (ruling P27)", () => {
    const result = outlook([visaRules("WA", [stream("wa-a")])], {
      points: 60,
    });
    expect(outcomeFor(result, "WA").group).toBe("not-open");
    expect(outcomeFor(result, "WA").reasonText).toBe(
      "Under the 65-point pass mark for 190",
    );
  });

  it("never passes a state while the points check is incomplete (ruling P27)", () => {
    const result = outlook([visaRules("WA", [stream("wa-a")])], {
      eligibility: {
        eligible: null,
        ineligibleReasons: [],
        missing: [],
        uncheckedDates: ["englishDate"],
      },
    });
    expect(outcomeFor(result, "WA").group).toBe("needs-answers");
  });

  it("gives unverified everywhere when the federal list is unavailable", () => {
    const result = outlook(stateRules.rules, {
      federal: null,
      lists: realLists(),
      visa: "491",
    });
    for (const s of result.states) {
      expect(s.group).toBe("unverified");
      expect(s.reasonText).toBe("Federal occupation list not available");
    }
  });

  it("gives unverified for a state with no rules for the visa", () => {
    const act = outcomeFor(outlook([]), "ACT");
    expect(act).toMatchObject({ group: "unverified", deciding: null });
    expect(act.reasonText).toBe("Rules not recorded for 190");
  });

  it("names the furthest-reaching failing stream when every stream fails", () => {
    const sa = outcomeFor(
      outlook(
        [
          visaRules("SA", [
            stream("sa-offshore", { cohorts: verified(["offshore"]) }),
            stream("sa-onshore", {
              requirements: [verified(LIVING_12)],
            }),
          ]),
        ],
        { profile: { ...livingInSa, monthsLivingInState: 3 } },
      ),
      "SA",
    );
    expect(sa.group).toBe("not-open");
    expect(sa.deciding?.streamId).toBe("sa-onshore");
    expect(sa.reasonText).toBe("Under 12 months living in South Australia");
  });
});

describe("stateOutlook: order, any state and summary", () => {
  const passing = (state: StateCode) =>
    visaRules(state, [stream(`${state}-a`)]);

  it("orders by group, then peak descending, then state code", () => {
    const result = outlook([
      passing("WA"),
      passing("NSW"),
      passing("SA"),
      passing("QLD"),
      visaRules("VIC", [stream("v", { status: verified("closed") })]),
    ]);
    expect(result.states.map((s) => [s.state, s.group])).toEqual([
      ["NSW", "strongest"],
      ["WA", "strongest"],
      ["QLD", "watching"],
      ["SA", "watching"],
      ["ACT", "unverified"],
      ["NT", "unverified"],
      ["TAS", "unverified"],
      ["VIC", "not-open"],
    ]);
  });

  it("reports any-state evidence separately without changing a group", () => {
    const result = outlook([passing("TAS")]);
    expect(result.anyState.peak?.invitedAtLeast.min).toBe(500);
    expect(outcomeFor(result, "TAS").group).toBe("watching");
  });

  it("summarises strongest states and the not-open count", () => {
    const closed = (state: StateCode) =>
      visaRules(state, [stream(`${state}-c`, { status: verified("closed") })]);
    expect(
      outlook([passing("WA"), passing("NSW"), closed("VIC"), closed("ACT")])
        .summary,
    ).toBe(
      "Strongest evidence in NSW and WA. Not open to you now in 2 states.",
    );
    expect(outlook([passing("WA"), closed("VIC")]).summary).toBe(
      "Strongest evidence in WA. Not open to you now in 1 state.",
    );
    expect(outlook([passing("WA")]).summary).toBe("Strongest evidence in WA.");
    expect(outlook([passing("SA"), closed("VIC")]).summary).toBe(
      "No state shows strong published evidence for your profile yet.",
    );
  });
});

describe("stateOutlook: copy", () => {
  it("uses no banned wording in any reason, label, question or summary", () => {
    const profiles: Profile[] = [
      livingInSa,
      { ...livingInSa, state: "VIC", monthsLivingInState: 2 },
      { ...livingInSa, onshore: false, state: "" },
      { ...livingInSa, state: "" },
    ];
    for (const profile of profiles) {
      for (const visa of ["190", "491"] as const) {
        const result = outlook(stateRules.rules, {
          profile,
          visa,
          lists: realLists(),
          federal: realFederal(),
        });
        const texts = [
          result.summary,
          ...result.states.flatMap((s) => [
            s.reasonText,
            ...s.streams.flatMap((st) =>
              st.checks.flatMap((c) => [c.label, c.question ?? ""]),
            ),
          ]),
        ];
        for (const text of texts) expect(text).not.toMatch(BANNED_COPY);
      }
    }
  });
});
