import { describe, expect, it } from "vitest";
import { isFederalList, isImportedList, isStateRules } from "./rules-guards";

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
              s({ kind: "min-years-experience", years: 3, withinYears: 5 }),
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
    const c = validRules();
    b.rules[0].state = "XX" as never;
    expect(isStateRules(b)).toBe(false);
    (c.rules[0].streams[0] as Record<string, unknown>).extra = 1;
    expect(isStateRules(c)).toBe(false);
    expect(isStateRules({ programYear: "2025-26", rules: [] })).toBe(false);
    expect(isStateRules(null)).toBe(false);
  });
});

describe("isImportedList", () => {
  const list = {
    listId: "wa-190",
    source: "https://example.gov.au/list",
    checkedAt: "2026-11-01",
    entries: {
      "261313": { "190": ["offshore"], "491": ["living-in-state"] },
      "233211": { "190": ["offshore"], streams: ["a"], viaUnitGroup: "2332" },
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
