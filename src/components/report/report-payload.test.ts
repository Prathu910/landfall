import { describe, expect, it } from "vitest";
import type { ReportSource } from "../../lib/data/report-source";
import type { OccupationIndexEntry } from "../../lib/data/types";
import { scenarioInput } from "../../lib/outlook/__fixtures__/scenario-input";
import { buildOutlookView } from "../../lib/outlook/view";
import { buildReportPayload } from "../../lib/report-issue/build";
import { buildCheckReport, occupationState } from "./report-payload";

const source: ReportSource = {
  snapshotDate: "2026-10-31",
  checkedAt: "2026-11-01",
  dashboardUrl: "https://example.test/d",
  roundsUrl: "https://example.test/r",
  previousRoundsUrl: "https://example.test/p",
};

const index: OccupationIndexEntry[] = [
  { code: "111111", name: "Loaded", hasData: true },
  { code: "222222", name: "Never published", hasData: false },
];

describe("occupationState", () => {
  it("passes a ready detail through and drops a loading one", () => {
    const { core, detail, profile } = scenarioInput("strong");
    const ready = occupationState(
      profile.occupation,
      "ready",
      core,
      { status: "ready", detail: detail! },
      index,
    );
    expect(ready).toEqual({ status: "ready", core, detail });
    const loading = occupationState(
      profile.occupation,
      "ready",
      core,
      { status: "loading" },
      index,
    );
    expect(loading).toEqual({ status: "ready", core, detail: null });
  });

  it("tells a failed load from an occupation with no data", () => {
    expect(occupationState("111111", "unavailable", null, null, index)).toEqual(
      { status: "load-failed" },
    );
    expect(occupationState("222222", "unavailable", null, null, index)).toEqual(
      { status: "unavailable" },
    );
    expect(occupationState("111111", "loading", null, null, index)).toEqual({
      status: "loading",
    });
  });
});

describe("buildCheckReport", () => {
  it("builds the payload the server will issue for an occupation with data", () => {
    const s = scenarioInput("strong");
    const built = buildCheckReport({
      profile: s.profile,
      asOf: s.asOf,
      rules: s.rules,
      source,
      occupation: { status: "ready", core: s.core!, detail: s.detail },
    });
    expect(built).toEqual({
      kind: "payload",
      payload: buildReportPayload({ ...s, source, meta: null }),
    });
  });

  it("shows the no-core report, without a state outlook, when nothing is published", () => {
    const s = scenarioInput("nodata");
    const built = buildCheckReport({
      profile: s.profile,
      asOf: s.asOf,
      rules: s.rules,
      source,
      occupation: { status: "unavailable" },
    });
    const view = buildOutlookView({
      profile: s.profile,
      asOf: s.asOf,
      rules: s.rules,
      occupation: { status: "unavailable" },
    });
    expect(view.kind).toBe("report");
    expect(built).toEqual({
      kind: "payload",
      payload: {
        schema: 1,
        view,
        stateOutlook: null,
        profile: s.profile,
        asOf: s.asOf,
        source,
        meta: null,
      },
    });
  });

  it("keeps loading and points-only views out of the payload", () => {
    const s = scenarioInput("strong");
    const base = { asOf: s.asOf, rules: s.rules, source };
    expect(
      buildCheckReport({
        ...base,
        profile: s.profile,
        occupation: { status: "loading" },
      }),
    ).toEqual({ kind: "pre-report", view: { kind: "loading" } });
    const failed = buildCheckReport({
      ...base,
      profile: s.profile,
      occupation: { status: "load-failed" },
    });
    expect(failed.kind === "pre-report" && failed.view.kind).toBe(
      "points-only",
    );
    const none = buildCheckReport({
      ...base,
      profile: { ...s.profile, occupation: "" },
      occupation: { status: "ready", core: s.core!, detail: s.detail },
    });
    expect(none.kind === "pre-report" && none.view.kind).toBe("points-only");
  });
});
