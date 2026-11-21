import { describe, expect, it } from "vitest";
import { scenarioInput } from "./__fixtures__/scenario-input";
import type { ScenarioId } from "./__fixtures__/scenarios";
import { evaluateProfile } from "./evaluate-profile";
import { buildEvidence, poolBars } from "./evidence";

function evidenceOf(id: ScenarioId, detail = true) {
  const input = scenarioInput(id);
  const withDetail = detail ? input : { ...input, detail: null };
  return buildEvidence(withDetail, evaluateProfile(withDetail));
}

describe("buildEvidence rounds", () => {
  it("lists every 189 round since 2022 with Enough or Short by N", () => {
    const { rounds } = evidenceOf("middle");
    expect(rounds?.you).toBe(70);
    expect(rounds?.rows).toHaveLength(13);
    expect(rounds?.rows[0]).toEqual({
      date: "15 Oct 2026",
      cutoff: "70",
      verdict: "Enough",
    });
    expect(rounds?.rows[1]).toEqual({
      date: "4 Jun 2026",
      cutoff: "75",
      verdict: "Short by 5",
    });
  });

  it("shows a round that omits the occupation as Not listed, with no verdict", () => {
    const last = evidenceOf("middle").rounds?.rows.at(-1);
    expect(last).toEqual({
      date: "21 Jan 2022",
      cutoff: "Not listed",
      verdict: null,
    });
  });

  it("has no rounds table and a plain sentence without a core", () => {
    const evidence = evidenceOf("nodata");
    expect(evidence.rounds).toBeNull();
    expect(evidence.roundsEmpty).toBe(
      "No 189 round in the published results lists Greenkeeper.",
    );
  });
});

describe("buildEvidence pool", () => {
  it("keeps masked counts as under 20 and marks the reader's score", () => {
    const { pool } = evidenceOf("middle");
    expect(pool?.note).toBe(
      "4,280 Registered Nurses nec EOIs waiting, as at Oct 2026.",
    );
    const at = (score: number) => pool?.bars.find((b) => b.score === score);
    expect(at(85)).toMatchObject({ count: "under 20", side: "higher" });
    expect(at(70)).toMatchObject({ count: "1,841", side: "you", share: 1 });
    expect(at(65)).toMatchObject({ count: "1,532", side: "lower" });
    expect(pool?.bars.map((b) => b.score)).toEqual([
      30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85,
    ]);
  });

  it("summarises the pool for assistive technology", () => {
    expect(evidenceOf("middle").pool?.aria).toMatch(
      /^189 pool by points: 30: under 20, .* 85: under 20\. You are at 70\.$/,
    );
  });
});

describe("buildEvidence cohort", () => {
  it("uses the month 12 months before today when the reader hasn't lodged", () => {
    const { cohort } = evidenceOf("middle");
    expect(cohort?.title).toBe("What happened to EOIs from a year ago");
    expect(cohort?.sub).toBe(
      "Registered Nurses nec 189 EOIs submitted in November 2025 (all scores), as at October 2026.",
    );
    expect(cohort?.outcomes.kind).toBe("ready");
  });

  it("uses the reader's own month once they have lodged", () => {
    const { cohort } = evidenceOf("lodged");
    expect(cohort?.title).toBe("What happened to EOIs from your month");
    expect(cohort?.sub).toMatch(/submitted in March 2026/);
  });

  it("waits for the detail file rather than inventing outcomes", () => {
    expect(evidenceOf("middle", false).cohort?.outcomes.kind).toBe("loading");
  });
});

describe("buildEvidence states", () => {
  it("tables 190 and 491 by state at the nominated points", () => {
    const [s190, s491] = evidenceOf("middle").states;
    expect(s190.title).toBe("190 by state, at your 75 points");
    expect(s491.title).toBe("491 by state, at your 85 points");
    expect(s190.rows).toHaveLength(8);
    const nsw = s190.rows.find((row) => row.state === "NSW");
    expect(nsw?.latest).toMatch(/^Oct 2026: /);
    expect(nsw?.months).toMatch(/^\d of the last 6 months$/);
  });

  it("says None in the last 6 months for a state that invited nobody at or below", () => {
    const rows = evidenceOf("none").states.flatMap((table) => table.rows);
    expect(
      rows.every((row) => row.latest === "None in the last 6 months"),
    ).toBe(true);
    // A state whose rules don't fit the reader is "not open", whatever it invited.
    const labels = new Set(rows.map((row) => row.label));
    expect([...labels].sort()).toEqual(["not-invited", "not-open"]);
  });

  it("has no state tables and a plain sentence without a core", () => {
    const evidence = evidenceOf("nodata");
    expect(evidence.states).toEqual([]);
    expect(evidence.statesEmpty).toBe(
      "No state invitations are published for Greenkeeper.",
    );
  });
});

describe("buildEvidence state rules notes", () => {
  function rulesOf(id: ScenarioId, visa: "190" | "491", state: string) {
    const table = evidenceOf(id).states.find((t) => t.visa === visa);
    return table?.rows.find((row) => row.state === state)?.rules;
  }

  it("names the stream whose verified rules the reader meets", () => {
    expect(rulesOf("strong", "190", "NSW")).toBe(
      "Meets every verified rule for Living in NSW.",
    );
  });

  it("gives the rule that closes a state", () => {
    expect(rulesOf("strong", "190", "QLD")).toBe(
      "Not on the Queensland 2026–27 list for 190 under Building and construction workers.",
    );
    expect(rulesOf("none", "491", "NSW")).toBe("Closed for 491 in 2026–27.");
  });

  it("counts the rules that still need the reader's answers", () => {
    expect(rulesOf("middle", "190", "NSW")).toBe("2 rules need your answers.");
    expect(rulesOf("long", "491", "WA")).toBe("1 rule needs your answers.");
  });

  it("says when we are still checking a state's rules", () => {
    expect(rulesOf("middle", "190", "VIC")).toBe("Rules being checked.");
  });
});

describe("buildEvidence masked state counts", () => {
  it("says a summed masked count may be zero, as for Tasmania's 190", () => {
    const [s190] = evidenceOf("middle").states;
    const tas = s190.rows.find((row) => row.state === "TAS");
    expect(tas?.latest).toBe("Oct 2026: under 58 (may be zero)");
    const vic = s190.rows.find((row) => row.state === "VIC");
    expect(vic?.latest).toBe("Oct 2026: 36");
  });

  it("names the series each state table counts", () => {
    const [s190] = evidenceOf("middle").states;
    expect(s190.sub).toBe(
      "Registered Nurses nec invitations issued each month, at or below your 75 points, over the last 6 months: the latest month with any, and how many months had some.",
    );
  });
});

describe("poolBars", () => {
  it("labels the reader's own score as you", () => {
    const bars = poolBars({ "65": "30", "70": "40" }, 70);
    expect(bars.map((bar) => bar.label)).toEqual(["65", "70 (you)"]);
  });

  it("labels the band as yours when the reader's score sits inside it", () => {
    const bars = poolBars({ "70": "40", "75": "<20" }, 72);
    expect(bars.map((bar) => bar.label)).toEqual(["70 (your band)", "75"]);
  });
});
