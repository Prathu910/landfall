import { describe, expect, it } from "vitest";
import { coreFixture, detailFixture } from "../data/__fixtures__/occupation";
import type { OccupationCore } from "../data/types";
import { BANNED_COPY } from "./copy";
import { noneRoundsCore } from "./__fixtures__/scorecard";
import { buildRounds, buildSameScore, buildWhereYouStand } from "./panel-189";

describe("buildWhereYouStand", () => {
  it("splits the queue into intervals", () => {
    const result = buildWhereYouStand(noneRoundsCore, 90);
    if ("unavailable" in result) throw new Error("expected segments");
    expect(result.segments).toEqual({
      ahead: { min: 872, max: 891 },
      same: { min: 1132, max: 1132 },
      lower: { min: 7441, max: 7460 },
      total: { min: 9464, max: 9464 },
    });
    expect(result.sentence).toContain("872–891 EOIs have a higher score");
    expect(result.sentence).toContain("1,132 share your 90 points");
    expect(result.sentence).toContain("9,464 EOIs as at");
    expect(result.sentence).not.toMatch(BANNED_COPY);
  });

  it("reports an unavailable pool", () => {
    const core: OccupationCore = {
      ...noneRoundsCore,
      pool: { ...noneRoundsCore.pool, "189": undefined },
    };
    expect(buildWhereYouStand(core, 90)).toEqual({
      unavailable:
        "No 189 EOIs are published for this occupation in this snapshot.",
    });
  });
});

function withPool(total: string, byScore: Record<string, string>) {
  return { ...noneRoundsCore, pool: { "189": { total, byScore } } };
}

describe("buildWhereYouStand masked counts", () => {
  it("reads naturally when ahead is masked", () => {
    const result = buildWhereYouStand(
      withPool("9464", { "95": "<20", "90": "1132" }),
      90,
    );
    if ("unavailable" in result) throw new Error("expected segments");
    expect(result.sentence).toBe(
      "Under 20 EOIs have a higher score, so this may be zero. 1,132 share your 90 points. The pool holds 9,464 EOIs as at Oct 2026.",
    );
    expect(result.sentence).not.toMatch(BANNED_COPY);
  });

  it("reads naturally when same is masked", () => {
    const result = buildWhereYouStand(
      withPool("9464", { "95": "608", "90": "<20" }),
      90,
    );
    if ("unavailable" in result) throw new Error("expected segments");
    expect(result.sentence).toContain(
      "Under 20 share your 90 points, so this may be zero.",
    );
  });

  it("reads naturally when total is masked", () => {
    const result = buildWhereYouStand(
      withPool("<20", { "95": "<20", "90": "<20" }),
      90,
    );
    if ("unavailable" in result) throw new Error("expected segments");
    expect(result.sentence).toContain(
      "The pool holds under 20 EOIs as at Oct 2026, so this may be zero.",
    );
    expect(result.segments.lower).toEqual({ min: 0, max: 19 });
  });

  it("clamps lower when the subtraction would go negative", () => {
    const result = buildWhereYouStand(
      withPool("500", { "95": "300", "90": "400" }),
      90,
    );
    if ("unavailable" in result) throw new Error("expected segments");
    expect(result.segments.lower.min).toBe(0);
    expect(result.segments.lower.max).toBeGreaterThanOrEqual(
      result.segments.lower.min,
    );
  });
});

describe("buildSameScore", () => {
  const core = { ...coreFixture, pool: noneRoundsCore.pool };

  it("splits by submission month", () => {
    const result = buildSameScore(
      core,
      detailFixture,
      90,
      "2025-03",
      "2026-11-18",
    );
    expect(result).toMatchObject({
      kind: "split",
      sentence:
        "About 30–49 were submitted before Mar 2025, 25 in the same month and 40 after.",
      note: "Approximate: ties are broken by date of effect, which isn't published and can differ from the submission month.",
    });
  });

  it("says a masked same-month count may be zero, mid-sentence", () => {
    const result = buildSameScore(
      core,
      detailFixture,
      90,
      "2025-02",
      "2026-11-18",
    );
    expect(result).toMatchObject({
      kind: "split",
      sentence:
        "About 30 were submitted before Feb 2025, under 20 (so may be zero) in the same month and 65 after.",
    });
  });

  it("says a masked earlier count may be zero, mid-sentence", () => {
    const detail = {
      ...detailFixture,
      cohortsByScore: {
        "189": { "90": { "2025-02": "<20", "2025-03": "25" } },
      },
    };
    const result = buildSameScore(core, detail, 90, "2025-03", "2026-11-18");
    expect(result).toMatchObject({
      kind: "split",
      sentence:
        "About under 20 (so may be zero) were submitted before Mar 2025, 25 in the same month and 0 after.",
    });
    if (result.kind === "split")
      expect(result.sentence).not.toMatch(BANNED_COPY);
  });

  it("prompts without an EOI month", () => {
    const result = buildSameScore(core, detailFixture, 90, null, "2026-11-18");
    expect(result).toEqual({
      kind: "prompt",
      text: "Add your EOI date to see how many same-score EOIs were submitted before yours.",
    });
  });

  it("prompts when the EOI month is after the as-of month", () => {
    expect(
      buildSameScore(core, detailFixture, 90, "2027-01", "2026-11-18").kind,
    ).toBe("prompt");
  });

  it("is loading while detail is missing", () => {
    expect(buildSameScore(core, null, 90, "2025-03", "2026-11-18")).toEqual({
      kind: "loading",
    });
  });

  it("says counts are unavailable when the score has no cohort split", () => {
    expect(
      buildSameScore(core, detailFixture, 120, "2025-03", "2026-11-18"),
    ).toEqual({
      kind: "unavailable",
      text: "Published counts by submission month aren't available at your score.",
    });
  });
});

describe("buildRounds", () => {
  const many: OccupationCore = {
    ...noneRoundsCore,
    rounds189: Array.from({ length: 8 }, (_, i) => ({
      date: `2026-0${8 - i}-15`,
      cutoff: i === 0 ? null : 90,
    })),
  };

  it("caps tiles at six and keeps every round in all", () => {
    const block = buildRounds(many, []);
    expect(block.tiles).toHaveLength(6);
    expect(block.all).toHaveLength(8);
  });

  it("labels a null cut-off Not listed", () => {
    const block = buildRounds(many, []);
    expect(block.tiles[0]).toMatchObject({
      label: "15 Aug 2026",
      value: "Not listed",
      listed: false,
    });
    expect(block.tiles[1]).toMatchObject({ value: "90 pts", listed: true });
    expect(block.note).toBe(
      "“Not listed” means the official results didn't include this occupation. It is not a cut-off of zero.",
    );
  });

  it("words the skipped note by count", () => {
    expect(buildRounds(many, []).skippedNote).toBeNull();
    expect(buildRounds(many, [{ date: "2020-01-01" }]).skippedNote).toBe(
      "1 older round uses a different table layout and is not shown.",
    );
    const eight = Array.from({ length: 8 }, () => ({ date: "2020-01-01" }));
    expect(buildRounds(many, eight).skippedNote).toMatch(/^8 older rounds/);
  });
});
