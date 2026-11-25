import { describe, expect, it } from "vitest";
import type { OccupationCore } from "../data/types";
import { MONTH, cores } from "./__fixtures__/data-2026-10";
import { coresAsAt, nationalFigures, scoreTotals } from "./facts-national";

/**
 * A minimal core for synthetic cases. Like every real import, it has every
 * visa's as-at month fetched (empty unless given).
 */
function core(
  code: string,
  statusHistory: OccupationCore["statusHistory"],
  extra: Partial<OccupationCore> = {},
): OccupationCore {
  const asAt = extra.asAt ?? "2026-10";
  const fetched = (visa: "189" | "190" | "491") => ({
    [asAt]: {},
    ...statusHistory[visa],
  });
  return {
    schemaVersion: 2,
    snapshotId: "skillselect-2026-10-31",
    asAt,
    code,
    name: `Occupation ${code}`,
    group: null,
    pool: {},
    statusHistory: {
      "189": fetched("189"),
      "190": fetched("190"),
      "491": fetched("491"),
    },
    invitedByScore: {},
    statePool: {},
    stateInvited: {},
    rounds189: [],
    ...extra,
  };
}

describe("nationalFigures, 2026-10", () => {
  const national = nationalFigures(cores, MONTH);
  // The maxima include the masked cells of occupations with hasData: false
  // (no SUBMITTED pool at the as-at month, but published "<20" INVITED or
  // earlier SUBMITTED counts, such as Neurosurgeon). The mockup's figures
  // (182,254, 16,643 and 9,867) left those occupations out.
  it("sums each visa's occupations within one month, as intervals", () => {
    expect(national["189"].submitted).toEqual({
      current: { min: 166555, max: 167904 },
      previous: { min: 181076, max: 182311 },
    });
    expect(national["189"].invited).toEqual({
      current: { min: 14876, max: 16700 },
      previous: { min: 0, max: 285 },
    });
    expect(national["190"].invited.current).toEqual({ min: 7017, max: 9905 });
  });
  it("keeps the masked counts of occupations with no current pool", () => {
    const withData = cores.filter((c) => c.code !== "253513");
    const without = nationalFigures(withData, MONTH);
    expect(national["189"].invited.current.max).toBe(
      without["189"].invited.current.max + 19,
    );
  });
});

describe("nationalFigures", () => {
  it("never sums INVITED across months: national figures read one month per visa", () => {
    const a = core("1", {
      "189": {
        "2026-09": { INVITED: "500" },
        "2026-10": { INVITED: "300" },
      },
      "190": { "2026-10": { INVITED: "40" } },
    });
    const b = core("2", {
      "189": { "2026-09": { INVITED: "<20" }, "2026-10": {} },
    });
    const n = nationalFigures([a, b], "2026-10");
    expect(n["189"].invited).toEqual({
      current: { min: 300, max: 300 },
      previous: { min: 500, max: 519 },
    });
    expect(n["190"].invited.current).toEqual({ min: 40, max: 40 });
  });

  it("returns null previous values when the previous month was not fetched", () => {
    const a = core("1", { "189": { "2026-10": { SUBMITTED: "70" } } });
    const n = nationalFigures([a], "2026-10");
    expect(n["189"].submitted).toEqual({
      current: { min: 70, max: 70 },
      previous: null,
    });
    expect(n["189"].invited.previous).toBeNull();
    expect(n["491"].submitted.previous).toBeNull();
  });

  it("ignores cores that dropped out of the data (R6)", () => {
    const current = core("1", {
      "189": { "2026-09": { SUBMITTED: "10" }, "2026-10": { SUBMITTED: "20" } },
    });
    const dropped = core(
      "2",
      { "189": { "2026-09": { SUBMITTED: "900" } } },
      { asAt: "2026-09" },
    );
    expect(coresAsAt([current, dropped], "2026-10")).toEqual([current]);
    expect(
      nationalFigures([current, dropped], "2026-10")["189"].submitted,
    ).toEqual({
      current: { min: 20, max: 20 },
      previous: { min: 10, max: 10 },
    });
  });
});

describe("nationalFigures with occupations dropped this month", () => {
  const current = core("1", {
    "189": { "2026-09": { SUBMITTED: "10" }, "2026-10": { SUBMITTED: "20" } },
  });
  const dropped = core(
    "2",
    { "189": { "2026-09": { SUBMITTED: "900" } } },
    { asAt: "2026-09" },
  );

  it("counts them in last month's figures only", () => {
    expect(
      nationalFigures([current, dropped], "2026-10", [dropped])["189"]
        .submitted,
    ).toEqual({
      current: { min: 20, max: 20 },
      previous: { min: 910, max: 910 },
    });
  });

  it("ignores a core that dropped out before last month", () => {
    const older = core(
      "3",
      { "189": { "2026-09": { SUBMITTED: "500" } } },
      { asAt: "2026-08" },
    );
    expect(
      nationalFigures([current], "2026-10", [older])["189"].submitted.previous,
    ).toEqual({ min: 10, max: 10 });
  });

  it("refuses a month no occupation has", () => {
    expect(() => nationalFigures([current], "2026-11")).toThrow(
      /No occupation has 189 figures for 2026-11/,
    );
  });
});

describe("scoreTotals", () => {
  it("sums the 189 pool by score, masked cells kept as 0–19, lowest score first", () => {
    const a = core(
      "1",
      {},
      {
        pool: {
          "189": { total: "119", byScore: { "65": "100", "90": "<20" } },
        },
      },
    );
    const b = core(
      "2",
      {},
      {
        pool: { "189": { total: "50", byScore: { "65": "50" } } },
      },
    );
    expect(scoreTotals([a, b], "2026-10", "189", "pool")).toEqual([
      { score: 65, count: { min: 150, max: 150 } },
      { score: 90, count: { min: 0, max: 19 } },
    ]);
  });

  it("reads invitations for the month only", () => {
    const a = core(
      "1",
      {},
      {
        invitedByScore: {
          "190": { "2026-09": { "80": "300" }, "2026-10": { "80": "40" } },
        },
      },
    );
    expect(scoreTotals([a], "2026-10", "190", "invited")).toEqual([
      { score: 80, count: { min: 40, max: 40 } },
    ]);
  });

  it("lists every published 189 score on 2026-10, lowest first", () => {
    const scores = scoreTotals(cores, MONTH, "189", "pool").map((s) => s.score);
    expect(scores).toEqual([...scores].sort((x, y) => x - y));
    expect(scores).toContain(65);
  });
});
