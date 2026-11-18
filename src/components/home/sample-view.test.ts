import { describe, expect, it } from "vitest";
import { SAMPLE_AS_OF, sampleReportProfile } from "../../lib/sample";
import { calculatePoints, sampleProfile } from "../../lib/migration";
import { buildDemoContent } from "../../lib/home/demo-content";
import { buildSampleView } from "./sample-view";

describe("sample profile", () => {
  it("is the /sample/ profile", () => {
    expect(sampleReportProfile.occupation).toBe(sampleProfile.occupation);
    expect(sampleReportProfile.eoiDate).toBe("2026-03-14");
    expect(sampleReportProfile.state).toBe("VIC");
    expect(SAMPLE_AS_OF).toBe("2026-11-17");
  });
});

describe("demo content matches the sample report view", () => {
  const { view, occupationName, points, categories } = buildSampleView();
  const demo = buildDemoContent(view, occupationName, points, categories);

  it("builds profile lines from the sample profile's points", () => {
    const result = calculatePoints(sampleReportProfile, SAMPLE_AS_OF);
    expect(categories).toEqual(result.categories);
    expect(demo.profileLines.at(-1)).toBe(`${result.base} points`);
  });

  it("uses the report's scorecard counts for each visa", () => {
    expect(demo.cards).toHaveLength(3);
    view.scorecard.cards.forEach((card, i) => {
      expect(demo.cards[i].ahead).toBe(card.ahead);
      expect(demo.cards[i].atScore).toBe(card.atScore);
    });
    expect(points).toBe(view.scorecard.cards[0].points);
  });

  it("maps the 190 tiles one to one, in order, with group labels", () => {
    const outlook = view.stateOutlook!;
    const tiles = outlook.tilesByVisa["190"];
    expect(demo.tiles).toHaveLength(tiles.length);
    tiles.forEach((tile, i) => {
      const panel = outlook.panelsByVisa["190"].find(
        (p) => p.id === tile.href.slice(1),
      );
      expect(demo.tiles[i]).toEqual({
        state: tile.state,
        tone: tile.group,
        group: panel!.groupLabel,
        label: tile.label,
      });
    });
  });
});
