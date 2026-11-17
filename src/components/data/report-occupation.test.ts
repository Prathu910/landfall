import { describe, expect, it } from "vitest";
import { coreFixture } from "../../lib/data/__fixtures__/occupation";
import { toOccupationEvidence } from "../../lib/data/legacy";
import { toReportOccupation } from "./report-occupation";

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
