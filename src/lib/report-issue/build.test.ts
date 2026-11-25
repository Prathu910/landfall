import { describe, expect, it } from "vitest";
import { buildOutlookView } from "../outlook/view";
import { scenarioInput, AS_OF } from "../outlook/__fixtures__/scenario-input";
import { buildStateOutlookView } from "../report/state-outlook-view";
import { ReportBuildError, buildReportPayload } from "./build";
import type { ReportSource } from "../data/report-source";

const source: ReportSource = {
  snapshotDate: "2026-10-31",
  checkedAt: "2026-11-01",
  dashboardUrl: "https://example.test/d",
  roundsUrl: "https://example.test/r",
  previousRoundsUrl: "https://example.test/p",
};

function input(id: "strong" | "nodata" = "strong") {
  const s = scenarioInput(id);
  return { ...s, source, meta: null };
}

describe("buildReportPayload", () => {
  it("builds the same view as buildOutlookView", () => {
    const i = input();
    const payload = buildReportPayload(i);
    const view = buildOutlookView({
      profile: i.profile,
      asOf: i.asOf,
      rules: i.rules,
      occupation: { status: "ready", core: i.core!, detail: i.detail },
    });
    expect(view.kind).toBe("report");
    expect(payload.view).toEqual(view);
    expect(payload.asOf).toBe(AS_OF);
    expect(payload.schema).toBe(1);
  });

  it("includes the state outlook the evidence section shows", () => {
    const i = input();
    const payload = buildReportPayload(i);
    expect(payload.stateOutlook).toEqual(
      buildStateOutlookView({
        core: i.core!,
        profile: i.profile,
        asOf: i.asOf,
        points: payload.view.points,
        data: i.rules,
      }),
    );
  });

  it("refuses an occupation without a core", () => {
    let error: unknown;
    try {
      buildReportPayload(input("nodata"));
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ReportBuildError);
    expect((error as ReportBuildError).reason).toBe("no-core");
  });

  it("survives JSON", () => {
    const meta = {
      reportNo: "ML-0001",
      version: 1,
      issuedAt: "2026-11-25T00:00:00.000Z",
      correctableUntil: "2026-12-25T00:00:00.000Z",
      revisionsLeft: 2,
    };
    const payload = buildReportPayload({ ...input(), meta });
    expect(JSON.parse(JSON.stringify(payload))).toEqual(payload);
  });
});
