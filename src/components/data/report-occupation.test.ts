import { describe, expect, it } from "vitest";
import { coreFixture } from "../../lib/data/__fixtures__/occupation";
import { toOccupationEvidence } from "../../lib/data/legacy";
import {
  poolUnavailableMessage,
  toReportOccupation,
  unavailableReason,
} from "./report-occupation";

describe("toReportOccupation", () => {
  it("keeps loading distinct from unavailable", () => {
    expect(toReportOccupation({ status: "loading" })).toEqual({
      status: "loading",
    });
    expect(toReportOccupation({ status: "unavailable" })).toEqual({
      status: "unavailable",
    });
  });

  it("treats an occupation that was never requested as unavailable", () => {
    expect(toReportOccupation({ status: "idle" })).toEqual({
      status: "unavailable",
    });
  });

  it("adapts a loaded core to the report's pool and evidence", () => {
    const ready = toReportOccupation({ status: "ready", core: coreFixture });
    expect(ready).toEqual({
      status: "ready",
      pool: {
        code: "261313",
        name: "Software Engineer",
        points: [
          { score: 85, count: "100" },
          { score: 90, count: "<20" },
          { score: 95, count: "50" },
        ],
      },
      evidence: toOccupationEvidence(coreFixture),
    });
  });

  it("keeps a loaded occupation with no 189 pool ready, with a null pool", () => {
    const core = { ...coreFixture, pool: {} };
    expect(toReportOccupation({ status: "ready", core })).toEqual({
      status: "ready",
      pool: null,
      evidence: toOccupationEvidence(core),
    });
  });
});

describe("unavailableReason and poolUnavailableMessage", () => {
  const index = [
    { code: "261313", name: "Software Engineer", hasData: true },
    { code: "121316", name: "Horse Breeder", hasData: false },
  ];

  it("treats the points-only choice and unknown codes as not in the snapshot, with the original text", () => {
    for (const code of ["other", "", "999999"]) {
      expect(unavailableReason(code, index)).toBe("notIndexed");
      expect(poolUnavailableMessage(code, index)).toBe(
        "This occupation is not in the imported snapshot. Your points are available; no pool comparison has been invented.",
      );
    }
  });

  it("says an indexed occupation without data has no published EOIs, not that it is missing", () => {
    expect(unavailableReason("121316", index)).toBe("noData");
    expect(poolUnavailableMessage("121316", index)).toBe(
      "No submitted EOIs are published for this occupation in this snapshot. Your points are available; no pool comparison has been invented.",
    );
  });

  it("reports a failed load of a published occupation without a claim about the dataset", () => {
    expect(unavailableReason("261313", index)).toBe("loadFailed");
    expect(poolUnavailableMessage("261313", index)).toBe(
      "Published data for this occupation could not be loaded. Your points are still calculated; try again later.",
    );
  });
});
