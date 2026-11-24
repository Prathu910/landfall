import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { generateFrozenSnapshot } from "../../scripts/import/frozen-snapshot";
import { readRoundsFile } from "../../scripts/import/generate-rounds";
import type { GeneratedData } from "../../scripts/import/generate";
import {
  loadSampleCore,
  loadSampleDetail,
  loadSampleMeta,
} from "./data/load-server";
import { SAMPLE_CODES } from "./outlook/examples";

let frozen: GeneratedData;
beforeAll(() => {
  frozen = generateFrozenSnapshot(
    "data/raw",
    readRoundsFile(JSON.parse(readFileSync("src/data/rounds.json", "utf8"))),
  );
});

describe("frozen sample data", () => {
  it("sample records equal the frozen 2026-10 regeneration", () => {
    for (const code of SAMPLE_CODES) {
      expect(loadSampleCore(code)).toEqual(
        frozen.cores.find((core) => core.code === code),
      );
      expect(loadSampleDetail(code)).toEqual(
        frozen.details.find((detail) => detail.code === code),
      );
    }
  });

  it("dates the sample to 31 Oct 2026, checked 17 Nov 2026", () => {
    expect(loadSampleMeta()).toMatchObject({
      snapshotId: "skillselect-2026-10-31",
      asAt: "2026-10",
      checkedAt: "2026-11-17",
    });
  });

  it("lists four unique codes", () => {
    expect(SAMPLE_CODES).toEqual(["254499", "261313", "221214", "254412"]);
  });
});
