import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { detailFixture } from "../data/__fixtures__/occupation";
import { sampleProfile, type Profile } from "../migration";
import {
  realFederal,
  realLists,
} from "../state-outlook/__fixtures__/real-data";
import { noneRoundsCore, no189PoolCore } from "./__fixtures__/scorecard";
import { buildReportView, type ReportViewInput } from "./report-view";

const AS_OF = "2026-11-17";
const profile: Profile = { ...sampleProfile, eoiDate: "2025-03-10" };

function input(overrides: Partial<ReportViewInput> = {}): ReportViewInput {
  return {
    occupationName: "Software Engineer",
    data: { kind: "ready", core: noneRoundsCore, detail: detailFixture },
    detailUnavailable: false,
    profile,
    asOf: AS_OF,
    skippedRounds: [],
    stateRuleData: {
      rules: stateRules,
      lists: realLists(),
      federal: realFederal(),
    },
    ...overrides,
  };
}

describe("buildReportView", () => {
  it("builds the scorecard and all three panels from the profile's points", () => {
    const view = buildReportView(input());
    expect(view.scorecard.cards.map((c) => c.points)).toEqual([90, 95, 105]);
    expect(view.panels).not.toBeNull();
    const panels = view.panels!;
    expect(panels.nominated.map((p) => p.visa)).toEqual(["190", "491"]);
    expect("segments" in panels.whereYouStand).toBe(true);
    expect(panels.rounds.tiles[0].date).toBe("2026-10-15");
  });

  it("uses the profile's EOI month for the same-score split and EOIs like yours", () => {
    const panels = buildReportView(input()).panels!;
    expect(panels.eois.kind).toBe("ready");
    if (panels.eois.kind === "ready") expect(panels.eois.month).toBe("2025-03");
    expect(panels.sameScore.kind).not.toBe("prompt");
  });

  it("prices each scenario on its own against the current 189 points", () => {
    const panels = buildReportView(input()).panels!;
    // Aarav has no community language credential: alone it adds 5 points.
    expect(panels.changes).toContainEqual({
      label: "Community language",
      effect: "+5",
      delta: 5,
      date: null,
      href: "#scenarios",
    });
  });

  it("builds what the data says from the same panels", () => {
    const view = buildReportView(input());
    const says = view.dataSays!;
    expect(says.recap).toBe(
      `${view.scorecard.headline} ${view.scorecard.detail}`,
    );
    expect(says.chart?.rounds.at(-1)?.label).toBe("Oct 2026");
    const eois = view.panels!.eois;
    expect(says.like).toBe(eois.kind === "ready" ? eois.sentence : null);
    expect(
      says.levers.add.some((l) => l.text.startsWith("Community language")),
    ).toBe(true);
  });

  it("has nothing to say without occupation data", () => {
    const view = buildReportView(
      input({ data: { kind: "none", reason: "notIndexed" } }),
    );
    expect(view.dataSays).toBeNull();
    expect(view.scorecard.detail).toBeNull();
  });

  it("still builds the 190 and 491 panels when the 189 pool is absent", () => {
    const view = buildReportView(
      input({ data: { kind: "ready", core: no189PoolCore, detail: null } }),
    );
    const panels = view.panels!;
    expect(panels.whereYouStand).toEqual({
      unavailable:
        "No 189 EOIs are published for this occupation in this snapshot.",
    });
    for (const panel of panels.nominated) {
      expect("segments" in panel.whereYouStand).toBe(true);
    }
  });

  it("shows sub-section loading while the detail file loads", () => {
    const panels = buildReportView(
      input({ data: { kind: "ready", core: noneRoundsCore, detail: null } }),
    ).panels!;
    expect(panels.sameScore).toEqual({ kind: "loading" });
    expect(panels.eois).toEqual({ kind: "loading" });
  });

  it("says detail-based sections could not load when the detail file failed", () => {
    const panels = buildReportView(
      input({
        data: { kind: "ready", core: noneRoundsCore, detail: null },
        detailUnavailable: true,
      }),
    ).panels!;
    expect(panels.sameScore).toEqual({
      kind: "unavailable",
      text: "Published counts by submission month could not be loaded. Try again later.",
    });
    expect(panels.eois).toEqual({
      kind: "unavailable",
      text: "Published outcomes by submission month could not be loaded. Try again later.",
    });
  });

  it("has no panels without occupation data", () => {
    for (const reason of ["loading", "notIndexed", "noData"] as const) {
      const view = buildReportView(input({ data: { kind: "none", reason } }));
      expect(view.panels).toBeNull();
    }
  });

  it("builds the state outlook and puts its summaries on the 190 and 491 cards", () => {
    const view = buildReportView(input());
    const outlook = view.stateOutlook;
    expect(outlook).not.toBeNull();
    const [, c190, c491] = view.scorecard.cards;
    expect(c190.sentence).toBe(outlook!.summaryByVisa["190"]);
    expect(c491.sentence).toBe(outlook!.summaryByVisa["491"]);
    // Evidence is read at each visa's points with nomination.
    expect(outlook!.panelsByVisa["190"][0].pointsThere[0]).toBe(
      "95 federal points with nomination",
    );
    expect(outlook!.panelsByVisa["491"][0].pointsThere[0]).toBe(
      "105 federal points with nomination",
    );
  });

  it("has no state outlook without occupation data", () => {
    for (const reason of [
      "loading",
      "notIndexed",
      "noData",
      "loadFailed",
    ] as const) {
      const view = buildReportView(input({ data: { kind: "none", reason } }));
      expect(view.stateOutlook).toBeNull();
    }
  });
});
