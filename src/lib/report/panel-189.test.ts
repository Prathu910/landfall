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

  it("prompts when no cohort data exists for the score", () => {
    expect(
      buildSameScore(core, detailFixture, 120, "2025-03", "2026-11-18").kind,
    ).toBe("prompt");
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
