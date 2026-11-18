import { describe, expect, it } from "vitest";
import {
  invalidRulePath,
  isFederalList,
  isImportedList,
  isStateRules,
} from "./rules-guards";

function s<T>(value: T, over: Record<string, unknown> = {}) {
  return {
    value,
    source: "https://example.gov.au/rules",
    checkedAt: "2026-11-01",
    verification: "verified",
    ...over,
  };
}

function validRules() {
  return {
    programYear: "2026-27",
    rules: [
      {
        state: "WA",
        visa: "190",
        selectionSystem: s("Points-based"),
        ownScoreSystem: s({ name: "WA score", url: "https://example.gov.au" }),
        resultsUrl: "https://example.gov.au/results",
        streams: [
          {
            id: "wa-general",
            name: "General stream",
            cohorts: s(["offshore", "living-in-state"]),
            status: s("open"),
            restriction: s("Visa must expire by 31 Jan 2027"),
            occupations: s({ kind: "list", listId: "wa-190" }),
            requirements: [
              s({ kind: "min-months-living-in-state", months: 6 }),
              s({ kind: "visa-expiry-before", date: "2027-01-31" }),
              s({
                kind: "min-years-experience",
                years: 3,
                withinYears: 5,
                related: "any-skilled",
              }),
              s({ kind: "job-offer-in-state" }),
            ],
          },
        ],
      },
    ],
  };
}

describe("isStateRules", () => {
  it("accepts a minimal valid structure", () => {
    expect(isStateRules(validRules())).toBe(true);
    expect(isStateRules({ programYear: "2026-27", rules: [] })).toBe(true);
  });

  it("rejects a rule with no source", () => {
    const v = validRules();
    delete (v.rules[0].selectionSystem as Record<string, unknown>).source;
    expect(isStateRules(v)).toBe(false);
  });

  it("rejects an impossible checkedAt date", () => {
    const v = validRules();
    v.rules[0].selectionSystem = s("x", { checkedAt: "2026-13-01" }) as never;
    expect(isStateRules(v)).toBe(false);
    v.rules[0].selectionSystem = s("x", { checkedAt: "2026-02-30" }) as never;
    expect(isStateRules(v)).toBe(false);
  });

  it("rejects an unknown verification", () => {
    const v = validRules();
    v.rules[0].streams[0].status = s("open", {
      verification: "maybe",
    }) as never;
    expect(isStateRules(v)).toBe(false);
  });

  it("rejects bad enum values, requirements and extra stream keys", () => {
    const a = validRules();
    a.rules[0].streams[0].status = s("maybe") as never;
    expect(isStateRules(a)).toBe(false);
    const b = validRules();
    b.rules[0].streams[0].requirements = [s({ kind: "nope" })] as never;
    expect(isStateRules(b)).toBe(false);
    const d = validRules();
    d.rules[0].state = "XX" as never;
    expect(isStateRules(d)).toBe(false);
    const c = validRules();
    (c.rules[0].streams[0] as Record<string, unknown>).extra = 1;
    expect(isStateRules(c)).toBe(false);
    expect(isStateRules({ programYear: "2025-26", rules: [] })).toBe(false);
    expect(isStateRules(null)).toBe(false);
  });

  it("accepts a list reference narrowed to stream tags, and a not-imported list", () => {
    const a = validRules();
    a.rules[0].streams[0].occupations = s({
      kind: "list",
      listId: "wa",
      streams: ["schedule-1", "schedule-2"],
    }) as never;
    expect(isStateRules(a)).toBe(true);
    const b = validRules();
    b.rules[0].streams[0].occupations = s({ kind: "not-imported" }) as never;
    expect(isStateRules(b)).toBe(true);
  });

  it("rejects empty or non-string stream tags and extra keys on a not-imported list", () => {
    const bad = [
      { kind: "list", listId: "wa", streams: [] },
      { kind: "list", listId: "wa", streams: [""] },
      { kind: "list", listId: "wa", streams: "schedule-1" },
      { kind: "not-imported", listId: "act" },
    ];
    for (const ref of bad) {
      const v = validRules();
      v.rules[0].streams[0].occupations = s(ref) as never;
      expect(isStateRules(v)).toBe(false);
    }
  });
});

describe("month and work requirements", () => {
  function withRequirement(req: Record<string, unknown>) {
    const v = validRules();
    v.rules[0].streams[0].requirements = [s(req)] as never;
    return v;
  }

  it("accepts a working requirement with its related-work definition and an optional month window", () => {
    for (const related of [
      "same-occupation",
      "anzsco-2-digit",
      "anzsco-3-digit",
      "anzsco-4-digit",
      "any-skilled",
    ]) {
      const req = { kind: "min-months-working-in-state", months: 9, related };
      expect(isStateRules(withRequirement(req))).toBe(true);
      expect(isStateRules(withRequirement({ ...req, ofLastMonths: 12 }))).toBe(
        true,
      );
    }
    for (const kind of [
      "min-months-living-in-state",
      "min-months-living-offshore",
    ]) {
      expect(isStateRules(withRequirement({ kind, months: 6 }))).toBe(true);
      expect(
        isStateRules(withRequirement({ kind, months: 6, ofLastMonths: 9 })),
      ).toBe(true);
    }
  });

  it("rejects a working requirement without a known related-work definition", () => {
    const base = { kind: "min-months-working-in-state", months: 9 };
    expect(isStateRules(withRequirement(base))).toBe(false);
    expect(
      isStateRules(withRequirement({ ...base, related: "anzsco-5-digit" })),
    ).toBe(false);
    expect(
      isStateRules(
        withRequirement({
          kind: "min-months-living-in-state",
          months: 6,
          related: "same-occupation",
        }),
      ),
    ).toBe(false);
  });

  it("requires a known related-work definition on an experience requirement (ruling P31)", () => {
    const base = { kind: "min-years-experience", years: 1, withinYears: 10 };
    expect(
      isStateRules(withRequirement({ ...base, related: "anzsco-4-digit" })),
    ).toBe(true);
    expect(isStateRules(withRequirement(base))).toBe(false);
    expect(isStateRules(withRequirement({ ...base, related: "nearby" }))).toBe(
      false,
    );
  });

  it("rejects a month window that is negative, not a number or shorter than the months", () => {
    const base = { kind: "min-months-living-in-state", months: 9 };
    for (const ofLastMonths of [-1, "12", 6]) {
      expect(isStateRules(withRequirement({ ...base, ofLastMonths }))).toBe(
        false,
      );
    }
  });
});

describe("stream tags", () => {
  it("rejects duplicate stream tags on a list reference", () => {
    const v = validRules();
    v.rules[0].streams[0].occupations = s({
      kind: "list",
      listId: "wa",
      streams: ["graduate", "graduate"],
    }) as never;
    expect(isStateRules(v)).toBe(false);
  });
});

describe("invalidRulePath", () => {
  it("returns null for valid rules", () => {
    expect(invalidRulePath(validRules() as never)).toBeNull();
  });

  it("names the state, visa and stream of the first invalid stream", () => {
    const v = validRules();
    v.rules[0].streams[0].status = s("maybe") as never;
    expect(invalidRulePath(v as never)).toBe("WA 190 stream wa-general");
  });

  it("names the state and visa when a rule-level field is invalid", () => {
    const v = validRules();
    v.rules[0].selectionSystem = s("x", { checkedAt: "2026-13-01" }) as never;
    expect(invalidRulePath(v as never)).toBe("WA 190 (rule fields)");
  });
});

describe("isImportedList", () => {
  const list = {
    listId: "wa-190",
    source: "https://example.gov.au/list",
    checkedAt: "2026-11-01",
    entries: {
      "261313": { "190": ["offshore"], "491": ["living-in-state"] },
      "233211": {
        "190": ["offshore"],
        streams: { "190": ["a"], "491": ["b"] },
        viaUnitGroup: "2332",
      },
    },
  };

  it("accepts a list, including the optional streams and viaUnitGroup", () => {
    expect(isImportedList(list)).toBe(true);
  });

  it("rejects unknown entry keys, bad codes and bad viaUnitGroup", () => {
    expect(
      isImportedList({ ...list, entries: { "261313": { other: [] } } }),
    ).toBe(false);
    expect(
      isImportedList({ ...list, entries: { "26": { "190": ["offshore"] } } }),
    ).toBe(false);
    expect(
      isImportedList({
        ...list,
        entries: { "261313": { viaUnitGroup: "23" } },
      }),
    ).toBe(false);
    expect(
      isImportedList({ ...list, entries: { "261313": { "190": ["mars"] } } }),
    ).toBe(false);
    expect(isImportedList({ ...list, checkedAt: "2026-13-01" })).toBe(false);
  });

  it("rejects malformed per-visa streams", () => {
    const bad = [
      ["a"],
      {},
      { "189": ["a"] },
      { "190": [] },
      { "190": [""] },
      { "190": "a" },
      { "190": ["a"], other: ["b"] },
    ];
    for (const streams of bad) {
      expect(
        isImportedList({
          ...list,
          entries: { "261313": { "190": ["offshore"], streams } },
        }),
        JSON.stringify(streams),
      ).toBe(false);
    }
  });
});

describe("isFederalList", () => {
  const list = {
    source: "https://example.gov.au/fed",
    checkedAt: "2026-11-01",
    entries: { "261313": { "190": true, "491": false } },
  };
  it("accepts and rejects", () => {
    expect(isFederalList(list)).toBe(true);
    expect(
      isFederalList({ ...list, entries: { "261313": { "190": true } } }),
    ).toBe(false);
    expect(isFederalList({ ...list, source: "" })).toBe(false);
  });
});
