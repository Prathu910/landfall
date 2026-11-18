import { describe, expect, it } from "vitest";
import {
  coreFixture,
  detailFixture,
} from "../../lib/data/__fixtures__/occupation";
import { toOccupationEvidence } from "../../lib/data/legacy";
import {
  toReportOccupation,
  toScorecardData,
  unavailableReason,
} from "./report-occupation";

describe("toReportOccupation", () => {
  it("keeps loading distinct from unavailable", () => {
    expect(
      toReportOccupation({ status: "loading" }, { status: "idle" }),
    ).toEqual({
      status: "loading",
    });
    expect(
      toReportOccupation({ status: "unavailable" }, { status: "idle" }),
    ).toEqual({
      status: "unavailable",
    });
  });

  it("treats an occupation that was never requested as unavailable", () => {
    expect(toReportOccupation({ status: "idle" }, { status: "idle" })).toEqual({
      status: "unavailable",
    });
  });

  it("adapts a loaded core to the report's evidence", () => {
    const detail = { status: "loading" } as const;
    const ready = toReportOccupation(
      { status: "ready", core: coreFixture },
      detail,
    );
    expect(ready).toEqual({
      status: "ready",
      evidence: toOccupationEvidence(coreFixture),
      core: coreFixture,
      detail,
    });
  });

  it("keeps a loaded occupation with no 189 pool ready", () => {
    const core = { ...coreFixture, pool: {} };
    expect(
      toReportOccupation({ status: "ready", core }, { status: "unavailable" }),
    ).toEqual({
      status: "ready",
      evidence: toOccupationEvidence(core),
      core,
      detail: { status: "unavailable" },
    });
  });
});

describe("unavailableReason", () => {
  const index = [
    { code: "261313", name: "Software Engineer", hasData: true },
    { code: "121316", name: "Horse Breeder", hasData: false },
  ];

  it("treats the points-only choice and unknown codes as not in the snapshot", () => {
    for (const code of ["other", "", "999999"]) {
      expect(unavailableReason(code, index)).toBe("notIndexed");
    }
  });

  it("says an indexed occupation without data has no published EOIs, not that it is missing", () => {
    expect(unavailableReason("121316", index)).toBe("noData");
  });

  it("reports a failed load of a published occupation without a claim about the dataset", () => {
    expect(unavailableReason("261313", index)).toBe("loadFailed");
  });
});

describe("toScorecardData", () => {
  const index = [
    { code: "261313", name: "Software Engineer", hasData: true },
    { code: "121316", name: "Horse Breeder", hasData: false },
  ];
  const ready = (detail: Parameters<typeof toReportOccupation>[1]) =>
    toReportOccupation({ status: "ready", core: coreFixture }, detail);

  it("passes the core, and the detail only once it has loaded", () => {
    expect(
      toScorecardData(
        ready({ status: "ready", detail: detailFixture }),
        "261313",
        index,
      ),
    ).toEqual({ kind: "ready", core: coreFixture, detail: detailFixture });
    expect(
      toScorecardData(ready({ status: "loading" }), "261313", index),
    ).toEqual({ kind: "ready", core: coreFixture, detail: null });
  });

  it("keeps loading distinct from each unavailable reason", () => {
    expect(toScorecardData({ status: "loading" }, "261313", index)).toEqual({
      kind: "none",
      reason: "loading",
    });
    const unavailable = { status: "unavailable" } as const;
    expect(toScorecardData(unavailable, "other", index)).toEqual({
      kind: "none",
      reason: "notIndexed",
    });
    expect(toScorecardData(unavailable, "121316", index)).toEqual({
      kind: "none",
      reason: "noData",
    });
    expect(toScorecardData(unavailable, "261313", index)).toEqual({
      kind: "none",
      reason: "loadFailed",
    });
  });
});
