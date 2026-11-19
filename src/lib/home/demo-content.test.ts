import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { detailFixture } from "../data/__fixtures__/occupation";
import { BANNED_COPY } from "../report/copy";
import { noneRoundsCore } from "../report/__fixtures__/scorecard";
import { buildReportView } from "../report/report-view";
import { calculatePoints, sampleProfile } from "../migration";
import {
  realFederal,
  realLists,
} from "../state-outlook/__fixtures__/real-data";
import { buildDemoContent } from "./demo-content";
import { AT_SCORE_LABEL, POINTS_UNIT } from "../report/scorecard";
import {
  OPEN_OVERVIEW,
  START_OVER,
  TRY_SAMPLE_ANSWERS,
} from "../check-actions";

const categories = calculatePoints(sampleProfile, "2026-11-17").categories;
const view = buildReportView({
  occupationName: "Software Engineer",
  data: { kind: "ready", core: noneRoundsCore, detail: detailFixture },
  detailUnavailable: false,
  profile: sampleProfile,
  asOf: "2026-11-17",
  skippedRounds: [],
  stateRuleData: {
    rules: stateRules,
    lists: realLists(),
    federal: realFederal(),
  },
});

describe("buildDemoContent", () => {
  const demo = buildDemoContent(view, "Software Engineer", 90, categories);

  it("carries the occupation and points as strings", () => {
    expect(demo.occupation).toBe("Software Engineer");
    expect(demo.points).toBe("90");
    expect(demo.profileLines).toEqual([
      ...categories
        .filter((c) => c.points > 0)
        .map((c) => `${c.label} · ${c.points} pts`),
      "90 points",
    ]);
    expect(demo.profileLines.length).toBeGreaterThan(1);
  });

  it("maps cards and 190 tiles from the view, in order", () => {
    expect(demo.cards).toEqual(
      view.scorecard.cards.map((c) => ({
        visa: c.visa,
        title: c.title,
        points: String(c.points),
        aheadLabel: c.aheadLabel,
        ahead: c.ahead,
        atScore: c.atScore,
      })),
    );
    const tiles = view.stateOutlook!.tilesByVisa["190"];
    expect(demo.tiles.map((t) => t.state)).toEqual(tiles.map((t) => t.state));
    expect(demo.tiles.map((t) => t.label)).toEqual(tiles.map((t) => t.label));
    expect(demo.tiles.map((t) => t.tone)).toEqual(tiles.map((t) => t.group));
  });

  it("keeps each visa's own points and count label, as the report does", () => {
    const [v189, v190, v491] = demo.cards;
    expect(v189.points).toBe("90");
    expect(Number(v190.points)).toBeGreaterThan(90);
    expect(Number(v491.points)).toBeGreaterThan(Number(v190.points));
    expect(v189.aheadLabel).toBe("Ahead of you");
    expect(v190.aheadLabel).toBe("Higher score (national pool)");
  });

  it("takes the stage's few labels from the product's own constants", () => {
    expect(demo.labels).toEqual({
      atScore: AT_SCORE_LABEL,
      pointsUnit: POINTS_UNIT,
      startOver: START_OVER,
      trySample: TRY_SAMPLE_ANSWERS,
      openOverview: OPEN_OVERVIEW,
    });
  });

  it("describes the payoff in one plain sentence from the same strings", () => {
    expect(demo.posterAlt).toContain("Software Engineer");
    expect(demo.posterAlt).toContain("90 points");
    expect(demo.posterAlt).toContain(demo.cards[0].ahead);
    expect(demo.posterAlt.endsWith(".")).toBe(true);
    expect(demo.posterAlt.indexOf(".")).toBe(demo.posterAlt.length - 1);
    expect(demo.posterAlt).not.toMatch(/\. [A-Z]/);
  });

  it("uses only allowed copy", () => {
    const text = JSON.stringify(demo);
    expect(text).not.toMatch(BANNED_COPY);
    expect(text).not.toContain("%");
  });

  it("refuses a view without data rather than inventing counts", () => {
    expect(() =>
      buildDemoContent({ ...view, stateOutlook: null }, "X", 90, categories),
    ).toThrow();
  });
});
