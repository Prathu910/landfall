import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { frozenCore } from "./__fixtures__/frozen-2026-10";
import { coreFixture } from "./__fixtures__/occupation";
import { toOccupationEvidence, toPoolOccupation } from "./legacy";
import type { OccupationEvidence } from "../report-evidence";
import type { OccupationCore } from "./types";

const root = process.cwd();
const readJson = (rel: string): unknown =>
  JSON.parse(readFileSync(path.resolve(root, rel), "utf8"));

type LegacyPool = {
  occupations: {
    code: string;
    name: string;
    points: { score: number; count: string }[];
  }[];
};
const legacyPool = readJson(
  "src/lib/data/__fixtures__/legacy-2026-10/pool.json",
) as LegacyPool;
const legacyEvidence = readJson(
  "src/lib/data/__fixtures__/legacy-2026-10/report-evidence.json",
) as {
  occupations: OccupationEvidence[];
};

describe("legacy adapters reproduce the 2026-10 site data", () => {
  it("covers the 11 original occupations", () => {
    expect(legacyPool.occupations).toHaveLength(11);
  });

  for (const legacy of legacyPool.occupations) {
    describe(legacy.code, () => {
      const core = frozenCore(legacy.code);

      it("pool points match", () => {
        const pool = core && toPoolOccupation(core);
        expect(pool?.name).toBe(legacy.name);
        expect(pool?.points).toEqual(legacy.points);
      });

      it("evidence deep-equals", () => {
        const expected = legacyEvidence.occupations.find(
          (o) => o.code === legacy.code,
        );
        expect(core && toOccupationEvidence(core)).toEqual(expected);
      });
    });
  }
});

describe("toOccupationEvidence trend", () => {
  // 2025-11 to 2026-10 fetched except 2026-02; 2025-03 is older history.
  const covered = [
    "2025-11",
    "2025-12",
    "2026-01",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09",
  ];
  const core: OccupationCore = {
    ...coreFixture,
    statusHistory: {
      "189": {
        "2025-03": { SUBMITTED: "40" },
        ...Object.fromEntries(covered.map((month) => [month, {}])),
        "2026-10": { SUBMITTED: "<20", CLOSED: "3" },
      },
    },
  };
  const trend = toOccupationEvidence(core).trend;

  it("covers the last 12 calendar months only", () => {
    expect(trend.map((point) => point.date)).not.toContain("2025-03-31");
    expect(trend[0].date).toBe("2025-11-30");
    expect(trend.at(-1)).toEqual({
      date: "2026-10-31",
      total: { min: 0, max: 19 },
    });
  });

  it("reads a covered month with no SUBMITTED row as zero", () => {
    expect(trend.find((point) => point.date === "2026-09-30")).toEqual({
      date: "2026-09-30",
      total: { min: 0, max: 0 },
    });
    expect(trend).toHaveLength(11);
  });

  it("leaves out a month that was not fetched", () => {
    expect(trend.map((point) => point.date)).not.toContain("2026-02-28");
  });
});
