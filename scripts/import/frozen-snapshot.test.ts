import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generateFrozenSnapshot } from "./frozen-snapshot";
import { readRoundsFile } from "./generate-rounds";

describe("generateFrozenSnapshot", () => {
  it("regenerates the 2026-10 snapshot", () => {
    const data = generateFrozenSnapshot(
      "data/raw",
      readRoundsFile(JSON.parse(readFileSync("src/data/rounds.json", "utf8"))),
    );
    expect(data.manifest.snapshotId).toBe("skillselect-2026-10-31");
    expect(data.index).toHaveLength(493);
    expect(data.index.filter((e) => e.hasData)).toHaveLength(479);
    expect(data.rounds.rounds[0].date).toBe("2026-10-15");
  });
});
