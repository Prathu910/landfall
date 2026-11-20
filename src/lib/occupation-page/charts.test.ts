import { describe, expect, it } from "vitest";
import { loadOccupationCore, loadOccupationDetail } from "../data/load-server";
import { BANNED_COPY } from "../report/copy";
import {
  type CohortKey,
  cohortNote,
  cohortRows,
  poolBars,
  poolTotalLabel,
  roundCards,
  roundsNote,
} from "./charts";

const core261313 = loadOccupationCore("261313")!;
const core254499 = loadOccupationCore("254499")!;
const detail254499 = loadOccupationDetail("254499");
const detail261313 = loadOccupationDetail("261313");

describe("roundCards and roundsNote", () => {
  it("lists rounds oldest first with null for not listed", () => {
    const cards = roundCards(core261313.rounds189);
    expect(cards.map((c) => c.cutoff)).toEqual([
      null,
      100,
      100,
      95,
      null,
      null,
      null,
      null,
    ]);
    expect(cards[0].label).toBe("18 Dec 2023");
  });
  it("describes a lapsed listing", () => {
    expect(roundsNote(core261313.rounds189)).toBe(
      "Not listed in the last 4 rounds. The last 8 rounds listed it 3 times, at 95 to 100 points.",
    );
  });
  it("describes a regular listing", () => {
    expect(roundsNote(core254499.rounds189)).toBe(
      "Listed in every one of the last 8 rounds, at 65 to 85 points. The latest cut-off was 70.",
    );
  });
  it("handles never listed, partial and single-score listings", () => {
    const none = Array.from({ length: 8 }, (_, i) => ({
      date: `2026-0${i + 1}-01`,
      cutoff: null,
    }));
    expect(roundsNote(none)).toBe("Not listed in any of the last 8 rounds.");
    const partial = [
      { date: "2026-08-01", cutoff: 70 },
      { date: "2026-07-01", cutoff: null },
      { date: "2026-06-01", cutoff: 70 },
    ];
    expect(roundsNote(partial, 3)).toBe(
      "Listed in 2 of the last 3 rounds, at 70 points. The latest cut-off was 70.",
    );
  });
});

describe("poolBars", () => {
  const bars = poolBars(core261313.pool["189"]);
  it("scales to the largest bar and labels counts", () => {
    const top = bars.find((b) => b.score === 75)!;
    expect(top.share).toBe(1);
    expect(top.label).toBe("1,552");
    expect(bars.map((b) => b.score)).toEqual(
      [...bars.map((b) => b.score)].sort((a, b) => a - b),
    );
  });
  it("marks masked bars", () => {
    const masked = bars.find((b) => b.score === 110)!;
    expect(masked.masked).toBe(true);
    expect(masked.label).toBe("under 20");
  });
  it("is empty without a pool", () => {
    expect(poolBars(undefined)).toEqual([]);
  });
  it("labels the pool total", () => {
    expect(poolTotalLabel("189", core261313.pool["189"])).toBe(
      "9,464 EOIs in the 189 pool",
    );
    expect(poolTotalLabel("190", { total: "<20" })).toBe(
      "under 20 EOIs in the 190 pool",
    );
    expect(poolTotalLabel("491", undefined)).toBeNull();
  });
});

describe("cohortRows and cohortNote", () => {
  it("builds twelve months ending at the snapshot", () => {
    const rows = cohortRows(detail254499, "2026-10")!;
    expect(rows).toHaveLength(12);
    const last = rows[11];
    expect(last.month).toBe("Oct 2026");
    expect(last.segments.find((s) => s.key === "INVITED")!.count).toEqual({
      min: 40,
      max: 40,
    });
    expect(last.segments.find((s) => s.key === "LODGED")!.masked).toBe(true);
  });
  it("is null without detail", () => {
    expect(cohortRows(null, "2026-10")).toBeNull();
  });
  it("keeps a masked lodged count as under 20", () => {
    const segment = (key: CohortKey, min: number, max: number) => ({
      key,
      label: key,
      count: { min, max },
      masked: min === 0 && max === 19,
    });
    const row = {
      month: "Oct 2026",
      total: { min: 80, max: 99 },
      segments: [
        segment("INVITED", 30, 30),
        segment("LODGED", 0, 19),
        segment("SUBMITTED", 50, 50),
      ],
    };
    expect(cohortNote("X", [row])).toBe(
      "Across the last 1 submission months, 80–99 EOIs for X were submitted. Of those, 30 are invited, under 20 have lodged a visa application and 50 are still waiting.",
    );
  });
  it("writes notes that pass the copy rules", () => {
    const note = cohortNote(
      "Registered Nurses nec",
      cohortRows(detail254499, "2026-10")!,
    );
    expect(note).toMatch(/^Across the last 12 submission months, /);
    expect(note).toMatch(
      /Of those, [\d,–]+ are invited, [\d,–]+ have lodged a visa application and [\d,–]+ are still waiting\.$/,
    );
    expect(note).not.toMatch(BANNED_COPY);
    const other = cohortNote(
      "Software Engineer",
      cohortRows(detail261313, "2026-10")!,
    );
    expect(other).not.toMatch(/ 0 are invited/);
    expect(other).toContain("have lodged a visa application");
    expect(other).not.toMatch(BANNED_COPY);
  });
});
