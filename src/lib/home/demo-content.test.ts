import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { detailFixture } from "../data/__fixtures__/occupation";
import { BANNED_COPY } from "../report/copy";
import { noneRoundsCore } from "../report/__fixtures__/scorecard";
import { buildReportView } from "../report/report-view";
import { sampleProfile } from "../migration";
import {
  realFederal,
  realLists,
} from "../state-outlook/__fixtures__/real-data";
import { buildDemoContent } from "./demo-content";

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
  const demo = buildDemoContent(view, "Software Engineer", 90);

  it("carries the occupation and points as strings", () => {
    expect(demo.occupation).toBe("Software Engineer");
    expect(demo.points).toBe("90");
    expect(demo.profileLines.length).toBeGreaterThan(0);
  });

  it("maps cards and 190 tiles from the view, in order", () => {
    expect(demo.cards).toEqual(
      view.scorecard.cards.map((c) => ({
        visa: c.title,
        ahead: c.ahead,
        atScore: c.atScore,
      })),
    );
    const tiles = view.stateOutlook!.tilesByVisa["190"];
    expect(demo.tiles.map((t) => t.state)).toEqual(tiles.map((t) => t.state));
    expect(demo.tiles.map((t) => t.label)).toEqual(tiles.map((t) => t.label));
  });

  it("describes the payoff in one plain sentence from the same strings", () => {
    expect(demo.posterAlt).toContain("Software Engineer");
    expect(demo.posterAlt).toContain("90 points");
    expect(demo.posterAlt).toContain(demo.cards[0].ahead);
    expect(demo.posterAlt.match(/\. /g)).toBeNull();
  });

  it("uses only allowed copy", () => {
    const text = JSON.stringify(demo);
    expect(text).not.toMatch(BANNED_COPY);
    expect(text).not.toContain("%");
  });

  it("refuses a view without data rather than inventing counts", () => {
    expect(() =>
      buildDemoContent({ ...view, stateOutlook: null }, "X", 90),
    ).toThrow();
  });
});
