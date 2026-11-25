import { describe, expect, it } from "vitest";
import { scenarioInput } from "../outlook/__fixtures__/scenario-input";
import { buildFreeResult } from "../outlook/free-result";
import type { FreeResult } from "../outlook/free-result";
import { buildOutlookView } from "../outlook/view";
import { BANNED_COPY } from "../report/copy";
import { REPORT_SECTIONS } from "../report/sections";
import {
  canBuy,
  resultLine,
  teaserLines,
  TEASER_TITLE,
  whereLine,
} from "./teaser";

function freeResult(id: "strong" | "nodata"): FreeResult {
  const { core, detail, ...rest } = scenarioInput(id);
  return buildFreeResult({
    ...rest,
    occupation: core
      ? { status: "ready", core, detail }
      : { status: "unavailable" },
  });
}

function noStamps(result: FreeResult) {
  if (result.kind === "stamps") throw new Error(result.kind);
  return result;
}

function stampsOf(result: FreeResult) {
  if (result.kind !== "stamps") throw new Error(result.kind);
  return result;
}

describe("teaserLines", () => {
  it("counts the sections the full report renders, for the reader's points", () => {
    const result = stampsOf(freeResult("strong"));
    // The full view for the same answers is a report, which ReportView
    // renders as every section in REPORT_SECTIONS.
    const { core, detail, ...rest } = scenarioInput("strong");
    const view = buildOutlookView({
      ...rest,
      occupation: { status: "ready", core: core!, detail },
    });
    expect(view.kind).toBe("report");
    expect(REPORT_SECTIONS).toHaveLength(7);
    expect(teaserLines(result)).toEqual({
      heading: `7 more sections, written for your ${result.points.base} points`,
      ticks: [
        "EOIs ahead of you, and your estimated wait",
        "All 8 states checked against you",
        "Your fastest ways to more points",
      ],
    });
  });

  it("never names a page count", () => {
    const { heading } = teaserLines(stampsOf(freeResult("strong")));
    expect(heading).not.toMatch(/page/i);
    expect(TEASER_TITLE).not.toMatch(/page/i);
  });
});

describe("canBuy", () => {
  it("no-data occupation gets no checkout", () => {
    expect(canBuy(freeResult("nodata"))).toBe(false);
    expect(canBuy(freeResult("strong"))).toBe(true);
  });

  it("offers no checkout while the data loads", () => {
    const { profile, asOf, rules } = scenarioInput("strong");
    const loading = buildFreeResult({
      profile,
      asOf,
      rules,
      occupation: { status: "loading" },
    });
    expect(loading.kind).toBe("loading");
    expect(canBuy(loading)).toBe(false);
  });
});

describe("resultLine", () => {
  const points = stampsOf(freeResult("strong")).points;

  it("says a report isn't available for an occupation without data", () => {
    expect(resultLine(noStamps(freeResult("nodata")))).toBe(
      "A full report isn't available for this occupation yet.",
    );
  });

  it("never reads a failed load or the loading state as no data", () => {
    expect(
      resultLine({
        kind: "points-only",
        points,
        reason: "load-failed",
        note: null,
      }),
    ).toBe("We couldn't load the published data. Reload to try again.");
    expect(resultLine({ kind: "loading", points })).toBe(
      "Loading published data…",
    );
  });

  it("asks for an occupation on a points-only check", () => {
    expect(
      resultLine({
        kind: "points-only",
        points,
        reason: "no-occupation",
        note: null,
      }),
    ).toBe("Choose an occupation to see your visa stamps and a full report.");
  });
});

describe("the free result's copy", () => {
  it("uses none of the banned report wording", () => {
    const result = stampsOf(freeResult("strong"));
    const { heading, ticks } = teaserLines(result);
    const points = result.points;
    const lines = [
      TEASER_TITLE,
      heading,
      ...ticks,
      resultLine(noStamps(freeResult("nodata"))),
      resultLine({ kind: "loading", points }),
      ...(["no-occupation", "load-failed", "dropped"] as const).map((reason) =>
        resultLine({ kind: "points-only", points, reason, note: null }),
      ),
    ];
    for (const line of lines) expect(line).not.toMatch(BANNED_COPY);
  });
});

describe("whereLine", () => {
  it("names the occupation, where the reader is and the data date", () => {
    expect(whereLine("Software Engineer", false, "2026-10-31")).toBe(
      "Software Engineer · offshore · data as at 31 Oct 2026",
    );
    expect(whereLine("Cook", true, "2026-10-31")).toBe(
      "Cook · in Australia · data as at 31 Oct 2026",
    );
  });
});
