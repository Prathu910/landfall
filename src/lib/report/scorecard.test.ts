import { describe, expect, it } from "vitest";
import { isOccupationCore } from "../data/guards";
import { BANNED_COPY } from "./copy";
import {
  allMaskedCore,
  neverListedCore,
  no189PoolCore,
  noneRoundsCore,
  noPoolsCore,
  occasionalCore,
  regularCore,
} from "./__fixtures__/scorecard";
import { buildScorecard, type ScorecardData } from "./scorecard";

const POINTS = { base: 90, subclass190: 95, subclass491: 105 };

function build(data: ScorecardData, name = "Software Engineer") {
  return buildScorecard({
    occupationName: name,
    data,
    points: POINTS,
    submittedMonth: null,
  });
}
const ready = (core: typeof noneRoundsCore): ScorecardData => ({
  kind: "ready",
  core,
  detail: null,
});

describe("fixtures", () => {
  it("pass the core guard", () => {
    for (const core of [
      noneRoundsCore,
      allMaskedCore,
      occasionalCore,
      regularCore,
      neverListedCore,
      no189PoolCore,
      noPoolsCore,
    ]) {
      expect(isOccupationCore(core)).toBe(true);
    }
  });
});

describe("buildScorecard", () => {
  it("builds the none-status scorecard", () => {
    const card = build(ready(noneRoundsCore));
    expect(card.headline).toBe(
      "189 hasn't listed Software Engineer in its last four rounds. Your 190 and 491 prospects depend on state nomination.",
    );
    const c189 = card.cards[0];
    expect(c189.title).toBe("189 · Independent");
    expect(c189.ahead).toBe("872–891");
    expect(c189.atScore).toBe("1,132");
    expect(c189.chip).toEqual({ label: "No recent invitations", tone: "red" });
    expect(c189.sentence).toBe(
      "Not listed in the last 4 rounds. Last cut-off: 95 points, Nov 2024.",
    );
    expect(c189.points).toBe(90);
    expect(c189.href).toBe("#visa-189");
    expect(card.cards[1].points).toBe(95);
    expect(card.cards[1].pointsNote).toBe("with +5 if nominated");
    expect(card.cards[2].points).toBe(105);
    expect(card.cards[2].pointsNote).toBe("with +15 if nominated or sponsored");
    expect(card.overlapNote).toBe(
      "One EOI can select several visas, so pools overlap.",
    );
    expect(card.sourceLine).toBe(
      "Source: SkillSelect, Department of Home Affairs · snapshot 31 Oct 2026 · counts are EOIs (one person can hold several).",
    );
  });

  it("describes 190 and 491 invitations without summing months", () => {
    const [, c190, c491] = build(ready(noneRoundsCore)).cards;
    expect(c190.chip).toEqual({ label: "State decides", tone: "amber" });
    expect(c190.sentence).toBe(
      "At least 35 invited as at Oct 2026, across all states. Each state selects by its own rules.",
    );
    expect(c190.ahead).toBe("0");
    expect(c190.atScore).toBe("40");
    expect(c491.sentence).toBe(
      "No 491 invitations recorded for this occupation in the last 12 months.",
    );
  });

  it("says invitations are not published when no month in the window was fetched", () => {
    const core = {
      ...noneRoundsCore,
      statusHistory: { "190": noneRoundsCore.statusHistory["190"] },
    };
    const [, c190, c491] = build(ready(core)).cards;
    expect(c491.sentence).toBe(
      "Invitations for the last 12 months are not published for this occupation.",
    );
    expect(c190.sentence).toContain("At least 35 invited");
  });

  it("says masked invitations may be zero", () => {
    const [, c190] = build(ready(allMaskedCore)).cards;
    expect(c190.sentence).toBe(
      "Invitations recorded in the last 12 months are each under 20, so may be zero.",
    );
  });

  it("handles occasional, regular and never-listed rounds", () => {
    const occasional = build(ready(occasionalCore));
    expect(occasional.cards[0].chip.tone).toBe("amber");
    expect(occasional.cards[0].sentence).toBe(
      "Listed in 2 of the last 4 rounds. Latest cut-off: 90 points, Sep 2026.",
    );
    expect(occasional.headline).toContain("Software Engineer");
    const regular = build(ready(regularCore));
    expect(regular.cards[0].chip.tone).toBe("green");
    expect(regular.cards[0].sentence).toBe(
      "Listed in 4 of the last 4 rounds. Latest cut-off: 100 points, Oct 2026.",
    );
    expect(build(ready(neverListedCore)).cards[0].sentence).toBe(
      "Not listed in any round we can read.",
    );
  });

  it("keeps the round headline when only the 189 pool is missing", () => {
    const card = build(ready(no189PoolCore));
    expect(card.headline).toContain("189 hasn't listed");
    expect(card.cards[0].sentence).toBe(
      "No 189 EOIs are published for this occupation in this snapshot.",
    );
    expect(card.cards[0].ahead).toBeNull();
    expect(card.cards[0].atScore).toBeNull();
    expect(card.cards[1].ahead).not.toBeNull();
  });

  it("reports too-limited data when no pool exists", () => {
    expect(build(ready(noPoolsCore)).headline).toBe(
      "Published SkillSelect data for Software Engineer is too limited to compare. Your points breakdown is below.",
    );
  });

  it("handles occupations with no data", () => {
    const card = build({ kind: "none", reason: "notIndexed" });
    expect(card.headline).toContain("too limited to compare");
    for (const c of card.cards) {
      expect(c.ahead).toBeNull();
      expect(c.atScore).toBeNull();
      expect(c.sentence).toBe(
        "No published data to compare for this occupation.",
      );
    }
    expect(card.cards[0].chip).toEqual({ label: "No data", tone: "neutral" });
    expect(card.cards[1].chip).toEqual({
      label: "State decides",
      tone: "neutral",
    });
    expect(card.cards.map((c) => c.points)).toEqual([90, 95, 105]);
    // No visa panels render without data, so there is nothing to link to.
    expect(card.cards.map((c) => c.href)).toEqual([null, null, null]);
    expect(card.sourceLine).toBe(
      "Source: SkillSelect, Department of Home Affairs.",
    );
  });

  it("shows a loading headline", () => {
    expect(build({ kind: "none", reason: "loading" }).headline).toBe(
      "Loading published data…",
    );
  });

  it("never uses banned copy", () => {
    const datas: ScorecardData[] = [
      ready(noneRoundsCore),
      ready(allMaskedCore),
      ready(occasionalCore),
      ready(regularCore),
      ready(neverListedCore),
      ready(no189PoolCore),
      ready(noPoolsCore),
      { kind: "none", reason: "notIndexed" },
      { kind: "none", reason: "loading" },
    ];
    for (const data of datas) {
      const card = build(data);
      const texts = [
        card.headline,
        card.overlapNote,
        ...card.cards.map((c) => c.sentence),
      ];
      for (const text of texts) expect(text).not.toMatch(BANNED_COPY);
    }
  });
});
