import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isOccupationCore } from "./guards";
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

/** Known, reasoned differences between the legacy files and the new pipeline. */
const explainedDifferences: { code: string; field: string; reason: string }[] =
  [];

function loadCore(code: string): OccupationCore {
  const value = readJson(`src/data/occupations/${code}.json`);
  if (!isOccupationCore(value)) throw new Error(`Invalid core ${code}`);
  return value;
}

describe("legacy adapters reproduce the 2026-10 site data", () => {
  it("covers the 11 original occupations", () => {
    expect(legacyPool.occupations).toHaveLength(11);
    expect(explainedDifferences).toEqual([]);
  });

  for (const legacy of legacyPool.occupations) {
    describe(legacy.code, () => {
      const core = loadCore(legacy.code);

      it("pool points match", () => {
        const pool = toPoolOccupation(core);
        expect(pool?.name).toBe(legacy.name);
        expect(pool?.points).toEqual(legacy.points);
      });

      it("evidence deep-equals", () => {
        const expected = legacyEvidence.occupations.find(
          (o) => o.code === legacy.code,
        );
        expect(toOccupationEvidence(core)).toEqual(expected);
      });
    });
  }
});
