import { describe, expect, it } from "vitest";
import { SAMPLE_AS_OF, sampleReportProfile } from "../../lib/sample";
import { calculatePoints, sampleProfile } from "../../lib/migration";
import { buildDemoContent } from "../../lib/home/demo-content";
import { formatInterval } from "../../lib/pool";
import { buildSampleView } from "./sample-view";

describe("sample profile", () => {
  it("is the /sample/ profile", () => {
    expect(sampleReportProfile.occupation).toBe(sampleProfile.occupation);
    expect(sampleReportProfile.eoiDate).toBe("2026-03-14");
    expect(sampleReportProfile.state).toBe("NSW");
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

describe("the homepage's outcome key", () => {
  it("sums to the total in the sample's sentence", () => {
    const eois = buildSampleView().view.panels!.eois;
    if (eois.kind !== "ready") throw new Error(`got ${eois.kind}`);
    const sum = eois.outcomes.reduce(
      (a, o) => ({ min: a.min + o.interval.min, max: a.max + o.interval.max }),
      { min: 0, max: 0 },
    );
    expect(eois.sentence).toMatch(/^Of the \S+ /);
    expect(eois.sentence).toContain(`Of the ${formatInterval(sum)} `);
    expect(eois.outcomes.map((o) => o.key)).toContain("hold");
  });
});

describe("the sample occupation", () => {
  it("shows EOIs from the sample's month that were invited and lodged", () => {
    // The homepage leads with this example; a data refresh that empties it
    // should prompt a new sample occupation.
    const eois = buildSampleView().view.panels!.eois;
    if (eois.kind !== "ready") throw new Error(`got ${eois.kind}`);
    expect(eois.basis).toBe("your-month");
    expect(eois.bar.invited.min).toBeGreaterThan(0);
    expect(eois.bar.lodged.min).toBeGreaterThan(0);
  });
});

describe("the sample's state outlook", () => {
  it("earns Strongest evidence in New South Wales for 190 from verified rules", () => {
    const outlook = buildSampleView().view.stateOutlook!;
    const nsw = outlook.tilesByVisa["190"].find((t) => t.state === "NSW");
    expect(nsw?.group).toBe("strongest");
    expect(outlook.summaryByVisa["190"]).toContain("Strongest evidence in NSW");
  });
});
