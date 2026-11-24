import { describe, expect, it } from "vitest";
import type { OccupationCore } from "../data/types";
import { MONTH, cores } from "./__fixtures__/data-2026-10";
import { poolMovers } from "./movers";

function core(
  code: string,
  sep: string | undefined,
  oct: string | undefined,
  asAt = "2026-10",
): OccupationCore {
  const months: Record<string, { SUBMITTED?: string }> = {};
  if (sep !== undefined) months["2026-09"] = { SUBMITTED: sep };
  if (oct !== undefined) months["2026-10"] = { SUBMITTED: oct };
  return {
    schemaVersion: 2,
    snapshotId: `skillselect-${asAt}`,
    asAt,
    code,
    name: `Occupation ${code}`,
    group: null,
    pool: {},
    statusHistory: { "189": months },
    invitedByScore: {},
    statePool: {},
    stateInvited: {},
    rounds189: [],
  };
}

describe("poolMovers, 2026-10", () => {
  const movers = poolMovers(cores, MONTH);
  it("lists the largest exact 189 pool falls and rises", () => {
    expect(movers.fell[0]).toEqual({
      code: "254499",
      name: "Registered Nurses nec",
      previous: 7500,
      current: 4280,
    });
    expect(movers.fell).toHaveLength(6);
    expect(movers.rose.length).toBeLessThanOrEqual(6);
    expect(movers.fell.every((m) => m.current < m.previous)).toBe(true);
    expect(movers.rose.every((m) => m.current > m.previous)).toBe(true);
  });
});

describe("poolMovers", () => {
  it("skips a mover masked in either month", () => {
    const m = poolMovers(
      [
        core("1", "<20", "500"),
        core("2", "500", "<20"),
        core("3", "400", "100"),
      ],
      "2026-10",
    );
    expect(m.fell.map((x) => x.code)).toEqual(["3"]);
    expect(m.rose).toEqual([]);
  });

  it("skips a month that was not fetched, and unchanged pools", () => {
    const m = poolMovers(
      [core("1", undefined, "500"), core("2", "300", "300")],
      "2026-10",
    );
    expect(m).toEqual({ fell: [], rose: [] });
  });

  it("orders by size of change, then code, and honours the limit", () => {
    const m = poolMovers(
      [
        core("4", "100", "160"),
        core("2", "100", "200"),
        core("1", "100", "200"),
        core("3", "100", "130"),
      ],
      "2026-10",
      2,
    );
    expect(m.rose.map((x) => x.code)).toEqual(["1", "2"]);
  });

  it("ignores cores that dropped out of the data (R6)", () => {
    expect(poolMovers([core("1", "900", "100", "2026-09")], "2026-10")).toEqual(
      { fell: [], rose: [] },
    );
  });
});
