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
import { EOI_CAVEAT, buildScorecard, type ScorecardData } from "./scorecard";

const POINTS = { base: 90, subclass190: 95, subclass491: 105 };
const SUMMARIES = {
  "190": "Strongest evidence in SA and WA. Not open to you now in 2 states.",
  "491": "No state shows strong published evidence for your profile yet.",
};
const TILES = {
  "190": [
    { state: "SA" as const, group: "strongest" as const },
    { state: "WA" as const, group: "strongest" as const },
    { state: "NSW" as const, group: "not-open" as const },
  ],
  "491": [
    { state: "WA" as const, group: "watching" as const },
    { state: "VIC" as const, group: "unverified" as const },
  ],
};
const QUEUE_NOTE = {
  text: "Counts of EOIs with a higher score, not your place in a queue: ties use an unpublished date of effect, and one person can hold several EOIs.",
  link: { href: "/methodology/#pool", text: "How to read the pool" },
};

function build(data: ScorecardData, name = "Software Engineer") {
  return buildScorecard({
    occupationName: name,
    data,
    points: POINTS,
    submittedMonth: null,
    stateSummaries: data.kind === "ready" ? SUMMARIES : null,
    stateTiles: data.kind === "ready" ? TILES : null,
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
      "189 hasn't listed Software Engineer in its last four rounds; the last cut-off was 95 points, in Nov 2024.",
    );
    expect(card.detail).toBe(
      "For a profile like yours, the published evidence for 190 is strongest in SA and WA.",
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

  it("labels 189 counts ahead and 190/491 counts as the national pool", () => {
    const card = build(ready(noneRoundsCore));
    expect(card.cards.map((c) => c.aheadLabel)).toEqual([
      "Ahead of you",
      "Higher score (national pool)",
      "Higher score (national pool)",
    ]);
  });

  it("explains once that the counts are not a queue place", () => {
    expect(build(ready(noneRoundsCore)).queueNote).toEqual(QUEUE_NOTE);
    expect(build(ready(no189PoolCore)).queueNote).toEqual(QUEUE_NOTE);
  });

  it("has no queue note when no card shows a count", () => {
    expect(build(ready(noPoolsCore)).queueNote).toBeNull();
    for (const reason of ["notIndexed", "noData", "loadFailed"] as const) {
      expect(build({ kind: "none", reason }).queueNote).toBeNull();
    }
  });

  it("uses each visa's state outlook summary as the 190 and 491 sentence", () => {
    const [, c190, c491] = build(ready(noneRoundsCore)).cards;
    expect(c190.chip).toEqual({
      label: "Strongest evidence: SA, WA",
      tone: "green",
    });
    expect(c491.chip).toEqual({ label: "Worth watching: WA", tone: "amber" });
    expect(c190.sentence).toBe(SUMMARIES["190"]);
    expect(c190.ahead).toBe("0");
    expect(c190.atScore).toBe("40");
    expect(c491.sentence).toBe(SUMMARIES["491"]);
  });

  it("no longer counts invitations across all states in the 190 and 491 cards", () => {
    for (const core of [noneRoundsCore, allMaskedCore, occasionalCore]) {
      const [, c190, c491] = build(ready(core)).cards;
      for (const card of [c190, c491]) {
        expect(card.sentence).not.toMatch(/invited|across all states/);
      }
    }
  });

  it("refuses to build 190 and 491 cards from data without state summaries", () => {
    expect(() =>
      buildScorecard({
        occupationName: "Software Engineer",
        data: ready(noneRoundsCore),
        points: POINTS,
        submittedMonth: null,
        stateSummaries: null,
        stateTiles: null,
      }),
    ).toThrow("state outlook");
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

  it("says so when only the 189 pool is missing", () => {
    const card = build(ready(no189PoolCore));
    expect(card.headline).toBe(
      "The snapshot publishes no 189 EOIs for Software Engineer, so its 190 and 491 prospects depend on state nomination.",
    );
    expect(card.cards[0].sentence).toBe(
      "No 189 EOIs are published for this occupation in this snapshot.",
    );
    expect(card.cards[0].ahead).toBeNull();
    expect(card.cards[0].atScore).toBeNull();
    expect(card.cards[1].ahead).not.toBeNull();
  });

  it("reports too-limited data when no pool exists, with no state line", () => {
    const card = build(ready(noPoolsCore));
    expect(card.headline).toBe(
      "Published SkillSelect data for Software Engineer is too limited to compare. Your points breakdown is below.",
    );
    expect(card.detail).toBeNull();
  });

  it("has no state line without occupation data", () => {
    for (const reason of [
      "notIndexed",
      "noData",
      "loadFailed",
      "loading",
    ] as const) {
      expect(build({ kind: "none", reason }).detail).toBeNull();
    }
  });

  it("says a points-only check has no occupation data to compare", () => {
    const card = build({ kind: "none", reason: "notIndexed" });
    expect(card.headline).toBe(
      "You chose a points check only, so there is no occupation data to compare. Your points breakdown is below.",
    );
    for (const c of card.cards) {
      expect(c.ahead).toBeNull();
      expect(c.atScore).toBeNull();
      expect(c.sentence).toBe("Points check only.");
      expect(c.chip).toEqual({ label: "Points only", tone: "neutral" });
    }
    expect(card.cards.map((c) => c.points)).toEqual([90, 95, 105]);
    // No visa panels render without data, so there is nothing to link to.
    expect(card.cards.map((c) => c.href)).toEqual([null, null, null]);
    expect(card.sourceLine).toBe(
      "Source: SkillSelect, Department of Home Affairs.",
    );
  });

  it("says an occupation without published EOIs is too limited to compare", () => {
    const card = build({ kind: "none", reason: "noData" });
    expect(card.headline).toBe(
      "Published SkillSelect data for Software Engineer is too limited to compare. Your points breakdown is below.",
    );
    for (const c of card.cards) {
      expect(c.sentence).toBe(
        "No published data to compare for this occupation.",
      );
      expect(c.href).toBeNull();
    }
    expect(card.cards.map((c) => c.chip)).toEqual([
      { label: "No data", tone: "neutral" },
      { label: "State decides", tone: "neutral" },
      { label: "State decides", tone: "neutral" },
    ]);
  });

  it("says a failed load could not be loaded, never that data is too limited", () => {
    const card = build({ kind: "none", reason: "loadFailed" });
    expect(card.headline).toBe(
      "Published data for Software Engineer could not be loaded. Your points breakdown is below.",
    );
    for (const c of card.cards) {
      expect(c.sentence).toBe("Published data could not be loaded.");
      expect(c.chip.tone).toBe("neutral");
      expect(c.ahead).toBeNull();
      expect(c.atScore).toBeNull();
      expect(c.href).toBeNull();
    }
    expect(card.cards[0].chip.label).toBe("Not loaded");
    expect(card.cards.map((c) => c.points)).toEqual([90, 95, 105]);
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
      { kind: "none", reason: "noData" },
      { kind: "none", reason: "loadFailed" },
      { kind: "none", reason: "loading" },
    ];
    for (const data of datas) {
      const card = build(data);
      const texts = [
        card.headline,
        card.overlapNote,
        card.queueNote?.text ?? "",
        ...card.cards.map((c) => c.sentence),
      ];
      for (const text of texts) expect(text).not.toMatch(BANNED_COPY);
    }
  });
});

describe("EOI_CAVEAT", () => {
  it("is the report's one wording for the EOI caveat", () => {
    expect(EOI_CAVEAT).toBe("Counts are EOIs (one person can hold several).");
  });
});
