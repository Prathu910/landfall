import { describe, expect, it } from "vitest";
import { toOccupationEvidence } from "./data/legacy";
import { frozenCore } from "./data/__fixtures__/frozen-2026-10";
import { loadManifest, loadOccupationCore } from "./data/load-server";
import type { OccupationCore } from "./data/types";
import type { OccupationEvidence } from "./report-evidence";
import { netPoolChange, validateOccupationEvidence } from "./report-evidence";

function evidenceOf(
  load: (code: string) => OccupationCore | null,
  code: string,
): OccupationEvidence {
  const core = load(code);
  if (!core) throw new Error(`No generated core for ${code}`);
  return toOccupationEvidence(core);
}

/** The live import: only for invariants that every month must keep. */
const liveEvidence = (code: string) => evidenceOf(loadOccupationCore, code);
/** The frozen 2026-10 snapshot: for the figures asserted below. */
const generatedEvidence = (code: string) => evidenceOf(frozenCore, code);

const LEGACY_CODES = [
  "261111",
  "261312",
  "261313",
  "221111",
  "233211",
  "233512",
  "233311",
  "254499",
  "351311",
  "241111",
  "241411",
];

describe("published report evidence", () => {
  it("passes the consistency checks for every generated occupation", () => {
    const codes = loadManifest().occupations.map((o) => o.code);
    expect(codes.length).toBeGreaterThan(400);
    for (const code of codes) {
      expect(validateOccupationEvidence(liveEvidence(code)), code).toEqual([]);
    }
  });

  it("gives the original occupations twelve dated snapshots, six actual rounds and three pathways", () => {
    for (const code of LEGACY_CODES) {
      const occupation = generatedEvidence(code);
      expect(occupation.trend).toHaveLength(12);
      expect(occupation.trend[0].date).toBe("2025-11-30");
      expect(occupation.trend.at(-1)?.date).toBe("2026-10-31");
      expect(occupation.rounds.map((r) => r.date)).toEqual([
        "2026-10-15",
        "2026-06-04",
        "2025-11-13",
        "2025-08-21",
        "2024-11-07",
        "2024-09-05",
      ]);
      expect(occupation.pathways.map((p) => p.visa)).toEqual([
        "189",
        "190",
        "491",
      ]);
      expect(occupation.trend.at(-1)?.total).toEqual(
        occupation.pathways[0].total,
      );
    }
  });

  it("uses the directly published aggregate instead of summing suppressed cells to an exact value", () => {
    const occupation = generatedEvidence("261111");
    expect(occupation.pathways[0].total).toEqual({ min: 7774, max: 7774 });
    expect(occupation.pathways[0].points.some((p) => p.count === "<20")).toBe(
      true,
    );
  });

  it("keeps unlisted cutoffs distinct from zero and uses occupation-specific published cutoffs", () => {
    expect(generatedEvidence("261111").rounds[0].cutoff).toBeNull();
    expect(generatedEvidence("261111").rounds[4].cutoff).toBe(95);
    expect(generatedEvidence("254499").rounds[0].cutoff).toBe(70);
    expect(generatedEvidence("241111").rounds[0].cutoff).toBe(90);
    expect(generatedEvidence("241411").rounds[0].cutoff).toBe(80);
    expect(frozenCore("not-imported")).toBeNull();
  });

  it("bounds a net change across masked snapshots without treating it as gross inflow", () => {
    expect(netPoolChange({ min: 0, max: 19 }, { min: 30, max: 30 })).toEqual({
      min: 11,
      max: 30,
    });
    expect(netPoolChange({ min: 30, max: 30 }, { min: 0, max: 19 })).toEqual({
      min: -30,
      max: -11,
    });
  });

  it("rejects duplicate dates and inconsistent aggregate/distribution relationships", () => {
    const occupation = structuredClone(generatedEvidence("261111"));
    occupation.trend[1].date = occupation.trend[0].date;
    occupation.pathways[0].total = { min: 1, max: 1 };
    expect(validateOccupationEvidence(occupation)).toEqual([
      "Monthly dates must be unique and increasing",
      "189 aggregate is inconsistent with its score intervals",
    ]);
  });
});
