import { describe, expect, it } from "vitest";
import type { OccupationCore, StateKey } from "../data/types";
import { MONTH, cores } from "./__fixtures__/data-2026-10";
import { stateFigures } from "./facts-states";

const STATES: StateKey[] = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
  "ANY",
];

/**
 * A minimal core. Like every real import, it has each state's as-at month
 * fetched for both visas (empty unless given).
 */
function core(
  code: string,
  given: OccupationCore["stateInvited"],
  asAt = "2026-10",
): OccupationCore {
  const visa = (v: "190" | "491") =>
    Object.fromEntries(
      STATES.map((state) => [state, { [asAt]: {}, ...given[v]?.[state] }]),
    );
  const stateInvited = {
    "190": visa("190"),
    "491": visa("491"),
  } as OccupationCore["stateInvited"];
  return {
    schemaVersion: 2,
    snapshotId: `skillselect-${asAt}`,
    asAt,
    code,
    name: `Occupation ${code}`,
    group: null,
    pool: {},
    statusHistory: {},
    invitedByScore: {},
    statePool: {},
    stateInvited,
    rounds189: [],
  };
}

describe("stateFigures, 2026-10", () => {
  const states = stateFigures(cores, MONTH);
  it("sums each state's occupation-by-score cells within one visa and month", () => {
    expect(states["190"].VIC.floor).toBe(1018);
    // Includes Neurosurgeon's "<20" (hasData: false); the mockup had
    // 6,927 and 323 without it.
    expect(states["190"].NSW.total).toEqual({ min: 790, max: 6946 });
    expect(states["190"].NSW.maskedCells).toBe(324);
    expect(states["190"].NSW.floor).toBe(790);
  });
  it("keeps State not recorded as its own key", () => {
    expect(states["190"].ANY.floor).toBe(243);
  });
  it("counts an all-masked state's hidden cells, with a zero floor", () => {
    expect(states["491"].TAS).toMatchObject({ floor: 0, maskedCells: 138 });
    expect(states["491"].TAS.top).toEqual([]);
  });
  it("gives the previous month's floor", () => {
    expect(states["190"].VIC.previousFloor).toBe(0);
  });
  it("lists up to three occupations by floor, each above zero", () => {
    const top = states["190"].VIC.top;
    expect(top.length).toBeLessThanOrEqual(3);
    expect(top[0]).toMatchObject({ code: "254499" });
    for (let i = 1; i < top.length; i += 1) {
      expect(top[i - 1].total.min).toBeGreaterThanOrEqual(top[i].total.min);
    }
    expect(top.every((t) => t.total.min > 0)).toBe(true);
  });
});

describe("stateFigures", () => {
  it("returns a null previous floor when the previous month was not fetched", () => {
    const a = core("1", { "190": { VIC: { "2026-10": { "80": "25" } } } });
    const f = stateFigures([a], "2026-10");
    expect(f["190"].VIC).toEqual({
      total: { min: 25, max: 25 },
      floor: 25,
      maskedCells: 0,
      previousFloor: null,
      top: [{ code: "1", name: "Occupation 1", total: { min: 25, max: 25 } }],
    });
    expect(f["491"].VIC.previousFloor).toBeNull();
  });

  it("never adds states to each other or to ANY", () => {
    const a = core("1", {
      "190": {
        VIC: { "2026-10": { "80": "25" } },
        NSW: { "2026-10": { "80": "30" } },
        ANY: { "2026-10": { "80": "<20" } },
      },
    });
    const f = stateFigures([a], "2026-10");
    expect(f["190"].VIC.total).toEqual({ min: 25, max: 25 });
    expect(f["190"].NSW.total).toEqual({ min: 30, max: 30 });
    expect(f["190"].ANY).toMatchObject({ floor: 0, maskedCells: 1 });
  });

  it("ignores cores that dropped out of the data (R6)", () => {
    const dropped = core(
      "2",
      { "190": { VIC: { "2026-09": { "80": "900" } } } },
      "2026-09",
    );
    const a = core("1", { "190": { VIC: { "2026-10": { "80": "25" } } } });
    expect(
      stateFigures([a, dropped], "2026-10")["190"].VIC.previousFloor,
    ).toBeNull();
  });

  it("counts occupations dropped this month in last month's floor only", () => {
    const dropped = core(
      "2",
      { "190": { VIC: { "2026-09": { "80": "900" } } } },
      "2026-09",
    );
    const a = core("1", { "190": { VIC: { "2026-10": { "80": "25" } } } });
    const vic = stateFigures([a, dropped], "2026-10", [dropped])["190"].VIC;
    expect(vic.total).toEqual({ min: 25, max: 25 });
    expect(vic.previousFloor).toBe(900);
    expect(vic.top.map((t) => t.code)).toEqual(["1"]);
  });

  it("refuses a month no occupation has", () => {
    const a = core("1", {});
    expect(() => stateFigures([a], "2026-11")).toThrow(
      /No occupation has 190 ACT figures for 2026-11/,
    );
  });
});
