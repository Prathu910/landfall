import { describe, expect, it } from "vitest";
import { loadOccupationCore } from "../data/load-server";
import type { OccupationCore } from "../data/types";
import { calculatePoints } from "../migration";
import {
  ENDOCRINOLOGIST,
  SCENARIOS,
  type ScenarioId,
} from "./__fixtures__/scenarios";
import { higherScoreCount, label189 } from "./label-189";

const AS_OF = "2026-11-21";
const core = (code: string) => {
  const c = loadOccupationCore(code);
  if (!c) throw new Error(`missing core ${code}`);
  return c;
};
const nurse = core("254499");

describe("scenario fixtures", () => {
  const expected: Record<ScenarioId, number> = {
    strong: 90,
    middle: 70,
    long: 80,
    notinv: 85,
    below: 60,
    nodata: 75,
    none: 75,
    lodged: 70,
  };
  for (const [id, points] of Object.entries(expected)) {
    it(`${id} is ${points} points`, () => {
      expect(calculatePoints(SCENARIOS[id as ScenarioId], AS_OF).base).toBe(
        points,
      );
    });
  }
  it("endocrinologist is 80 points", () => {
    expect(calculatePoints(ENDOCRINOLOGIST, AS_OF).base).toBe(80);
  });
});

function synthetic(
  over: Partial<OccupationCore>,
  scores: Record<string, string>,
): OccupationCore {
  return {
    ...nurse,
    pool: { "189": { total: "<20", byScore: scores } },
    rounds189: [],
    ...over,
  };
}

describe("label189", () => {
  it("nurse at 90 is very strong", () => {
    const r = label189({ points: 90, eligible: true, core: nurse });
    expect(r.label).toBe("very-strong");
    expect(r.lastThree).toEqual([70, 75, 75]);
    expect(r.ahead).toEqual({ min: 0, max: 0 });
  });
  it("nurse at 75 is strong", () => {
    expect(label189({ points: 75, eligible: true, core: nurse }).label).toBe(
      "strong",
    );
  });
  it("nurse at 70 is competitive with the why text", () => {
    const r = label189({ points: 70, eligible: true, core: nurse });
    expect(r.label).toBe("competitive");
    expect(r.why).toBe(
      "70 meets the lowest of your occupation's last 3 listed cut-offs (70) but not the other two (75, 75).",
    );
  });
  it("teacher at 80 is long wait", () => {
    const r = label189({ points: 80, eligible: true, core: core("241111") });
    expect(r.label).toBe("long-wait");
    expect(r.lastThree).toEqual([90, 85, 85]);
    expect(r.ahead).toEqual({ min: 2444, max: 2463 });
  });
  it("software engineer and internal auditor are not invited", () => {
    expect(
      label189({ points: 85, eligible: true, core: core("261313") }).label,
    ).toBe("not-invited");
    expect(
      label189({ points: 75, eligible: true, core: core("221214") }).label,
    ).toBe("not-invited");
  });
  it("below 65 or ineligible is not eligible", () => {
    expect(label189({ points: 60, eligible: true, core: nurse }).label).toBe(
      "not-eligible",
    );
    expect(label189({ points: 90, eligible: false, core: nurse }).label).toBe(
      "not-eligible",
    );
  });
  it("no core is no data", () => {
    const r = label189({ points: 90, eligible: true, core: null });
    expect(r.label).toBe("no-data");
    expect(r.tooFew).toBe(false);
  });
  it("endocrinologist is labelled from rounds with no pool", () => {
    const r = label189({ points: 80, eligible: true, core: core("253315") });
    expect(r.label).toBe("competitive");
    expect(r.ahead).toBeNull();
  });
  it("all-masked pool with no listing is too few", () => {
    const c = synthetic({}, { "80": "<20" });
    const r = label189({ points: 90, eligible: true, core: c });
    expect(r.label).toBe("no-data");
    expect(r.tooFew).toBe(true);
  });
  it("masked ahead count still allows very strong", () => {
    const c = synthetic(
      {
        rounds189: [
          { date: "2026-10-01", cutoff: 80 },
          { date: "2026-09-01", cutoff: 85 },
          { date: "2026-08-01", cutoff: 80 },
        ],
      },
      { "95": "<20" },
    );
    const r = label189({ points: 90, eligible: true, core: c });
    expect(r.ahead).toEqual({ min: 0, max: 19 });
    expect(r.label).toBe("very-strong");
  });
  it("unknown eligibility keeps the label and asks to confirm dates", () => {
    const r = label189({ points: 90, eligible: null, core: nurse });
    expect(r.label).toBe("very-strong");
    expect(
      r.why.endsWith("Confirm your English and skills assessment dates."),
    ).toBe(true);
  });
});

describe("higherScoreCount", () => {
  it("is null without a pool", () => {
    expect(higherScoreCount(core("253315"), "189", 80)).toBeNull();
  });
});

describe("label189 edge cases", () => {
  const withRounds = (cutoffs: number[], pool = true) =>
    synthetic(
      {
        rounds189: cutoffs.map((cutoff, i) => ({
          date: `2026-0${9 - i}-01`,
          cutoff,
        })),
      },
      pool ? { "95": "<20" } : {},
    );
  it("no pool but listed rounds counts zero EOIs ahead", () => {
    const c = withRounds([70, 75, 75]);
    delete c.pool["189"];
    const r = label189({ points: 80, eligible: true, core: c });
    expect(r.label).toBe("very-strong");
    expect(r.ahead).toBeNull();
    // No pool means no count of higher scores, so the why line can't claim one.
    expect(r.why).toBe(
      "80 is above your occupation's last 3 listed cut-offs (70, 75, 75). No 189 pool is published for it.",
    );
  });
  it("names met and unmet cut-offs truthfully", () => {
    const r = label189({
      points: 75,
      eligible: true,
      core: withRounds([80, 75, 70]),
    });
    expect(r.label).toBe("competitive");
    expect(r.why).toBe(
      "75 meets two of your occupation's last 3 listed cut-offs (75, 70) but not the other (80).",
    );
  });
  it("handles duplicate lowest cut-offs", () => {
    const r = label189({
      points: 70,
      eligible: true,
      core: withRounds([75, 70, 70]),
    });
    expect(r.why).toBe(
      "70 meets two of your occupation's last 3 listed cut-offs (70, 70) but not the other (75).",
    );
  });
  it("reads correctly with fewer than 3 listed rounds", () => {
    const one = label189({
      points: 80,
      eligible: true,
      core: withRounds([75]),
    });
    expect(one.why).toContain("last listed cut-off (75)");
    const two = label189({
      points: 72,
      eligible: true,
      core: withRounds([75, 70]),
    });
    expect(two.why).toBe(
      "72 meets the lower of your occupation's last 2 listed cut-offs (70) but not the other (75).",
    );
  });
});
