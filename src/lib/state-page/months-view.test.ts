import { describe, expect, it } from "vitest";
import { FIXTURE_CORES } from "./__fixtures__/cores";
import { frozenView } from "./__fixtures__/frozen-views";
import { monthsCardView } from "./months-view";
import { stateSeries } from "./series";
import type { StateVisaFacts } from "./facts";

function facts(count: number): StateVisaFacts {
  const series = stateSeries(FIXTURE_CORES, "190", "NSW", "2026-10", count);
  return { visa: "190", series } as StateVisaFacts;
}

describe("monthsCardView", () => {
  it("labels floors, hidden-only, empty and unfetched months differently", () => {
    const card = monthsCardView(facts(4), "NSW");
    expect(card.columns.map((c) => [c.kind, c.value])).toEqual([
      ["not-published", "n/p"],
      ["floor", "25+"],
      ["hidden", "<20 each"],
      ["floor", "91+"],
    ]);
    expect(card.table.rows[0]).toEqual({
      month: "31 Jul 2026",
      held: "not published",
      hidden: "—",
    });
    expect(card.columns[2].full).toBe(
      "30 Sep 2026: under 20 for each occupation",
    );
  });

  it("marks the latest month, the first July and the years under Jan", () => {
    const card = monthsCardView(facts(4), "NSW");
    expect(card.columns.map((c) => c.latest)).toEqual([
      false,
      false,
      false,
      true,
    ]);
    expect(card.columns[0].year).toBe("2026");
    const year = frozenView("NSW").months.cards[0].columns;
    expect(year.find((c) => c.programYear)?.month).toBe("2026-07");
    expect(year.filter((c) => c.year).map((c) => c.month)).toEqual([
      "2025-11",
      "2026-01",
    ]);
  });

  it("explains a visa whose every month is hidden", () => {
    const tas491 = frozenView("TAS").months.cards[1];
    expect(tas491.columns.every((c) => c.kind === "hidden")).toBe(true);
    expect(tas491.note).toMatch(/^Every Tasmania 491 count/);
    expect(frozenView("NSW").months.cards[0].note).toBeNull();
  });
});
