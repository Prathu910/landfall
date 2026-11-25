import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { frozenCore, frozenDetail } from "../data/__fixtures__/frozen-2026-10";
import {
  realFederal,
  realLists,
} from "../state-outlook/__fixtures__/real-data";
import { SCENARIOS } from "./__fixtures__/scenarios";
import type { ScenarioId } from "./__fixtures__/scenarios";
import { evaluateProfile } from "./evaluate-profile";
import type { OutlookInput } from "./evaluate-profile";
import { estimatedWait, lodgedPace } from "./wait";

const AS_OF = "2026-11-21";
const RULES = {
  rules: stateRules,
  lists: realLists(),
  federal: realFederal(),
};

function input(id: ScenarioId, over: Partial<OutlookInput> = {}): OutlookInput {
  const profile = SCENARIOS[id];
  const core = frozenCore(profile.occupation);
  return {
    profile,
    asOf: AS_OF,
    core,
    detail: core ? frozenDetail(profile.occupation) : null,
    rules: RULES,
    ...over,
  };
}

function wait(id: ScenarioId, over: Partial<OutlookInput> = {}) {
  const i = input(id, over);
  return estimatedWait(evaluateProfile(i), i);
}

describe("estimatedWait", () => {
  it.each([
    ["strong", "The next 189 round."],
    [
      "middle",
      "Uncertain. Possible in a round that goes down to 70, like Oct 2026.",
    ],
    ["none", "No 189 invitations to measure."],
  ] as const)("%s", (id, text) => {
    expect(wait(id)).toEqual({ text, pace: null });
  });

  it.each([
    ["long", "Tasmania"],
    ["below", "Tasmania"],
  ] as const)("%s uses the state sentence", (id, name) => {
    expect(wait(id).text).toMatch(
      new RegExp(
        `^States don't publish a queue\\. ${name} invited at or below your points in \\d of the last 6 months\\.$`,
      ),
    );
  });

  it("sana, off the 189 list with no core, has no 189 wait", () => {
    expect(wait("nodata", { core: null, detail: null })).toEqual({
      text: "189: not available for your occupation, so there's no 189 wait. 190 and 491: no data to estimate from.",
      pace: null,
    });
  });

  // The brief guessed 3; the snapshot has Tasmania inviting in all 6 months.
  it("meera is 6 of the last 6 months", () => {
    expect(wait("long").text).toBe(
      "States don't publish a queue. Tasmania invited at or below your points in 6 of the last 6 months.",
    );
  });

  it("rahul names the Northern Territory", () => {
    expect(wait("notinv").text).toMatch(
      /^States don't publish a queue\. The Northern Territory invited/,
    );
  });

  it("a nurse with a strong label reads the next 1 to 2 rounds", () => {
    const profile = {
      ...SCENARIOS.middle,
      english: "superior" as const,
      overseasYears: 2,
    };
    const i = input("middle", { profile });
    const o = evaluateProfile(i);
    expect(o.stamp).toMatchObject({ visa: "189", label: "strong" });
    expect(estimatedWait(o, i).text).toBe("The next 1 to 2 rounds.");
  });
});

describe("lodged pace", () => {
  it("measures Kavya's queue", () => {
    const result = wait("lodged");
    expect(result.pace).toEqual({
      ahead: { min: 871, max: 966 },
      pace: { min: 262, max: 262 },
      roundsPerYear: 2,
      roundsNeeded: { min: 3, max: 4 },
    });
    expect(result.text).toBe(
      "Roughly 870 to 970 EOIs ahead. At the latest pace, about 3 to 4 rounds, so plan for 1 to 2 years at 70 (estimate).",
    );
  });

  it("falls back to the planner text without detail", () => {
    const result = wait("lodged", { detail: null });
    expect(result.pace).toBeNull();
    expect(result.text).toMatch(/^Uncertain\./);
  });

  it("falls back when the EOI month is after the snapshot", () => {
    const profile = { ...SCENARIOS.lodged, eoiDate: "2026-12-01" };
    const result = wait("lodged", { profile });
    expect(result.pace).toBeNull();
    expect(result.text).toMatch(/^Uncertain\./);
  });

  it("lodgedPace is null for an invalid date", () => {
    const core = frozenCore("254499")!;
    const detail = frozenDetail("254499")!;
    expect(lodgedPace(core, detail, 70, "nope", AS_OF)).toEqual({
      kind: "unknown",
    });
  });
});

describe("lodged pace edge cases", () => {
  const core = frozenCore("254499")!;
  const detail = frozenDetail("254499")!;
  const scoreKey = "70";

  function withInvited(counts: Record<string, string> | undefined) {
    const invited = { ...core.invitedByScore["189"] };
    if (counts) invited[core.asAt] = counts;
    else delete invited[core.asAt];
    return {
      ...core,
      invitedByScore: { ...core.invitedByScore, "189": invited },
    };
  }

  it("a masked pace says there is nothing to measure", () => {
    const i = input("lodged", { core: withInvited({ [scoreKey]: "<20" }) });
    expect(estimatedWait(evaluateProfile(i), i)).toEqual({
      text: "No recent invitations at your score to measure a pace.",
      pace: null,
    });
  });

  it("a zero pace says there is nothing to measure", () => {
    const i = input("lodged", { core: withInvited({}) });
    expect(estimatedWait(evaluateProfile(i), i).text).toBe(
      "No recent invitations at your score to measure a pace.",
    );
  });

  it("a month that was not fetched falls back to the planner text", () => {
    const i = input("lodged", { core: withInvited(undefined) });
    const result = estimatedWait(evaluateProfile(i), i);
    expect(result.pace).toBeNull();
    expect(result.text).toMatch(/^Uncertain\./);
    expect(
      lodgedPace(withInvited(undefined), detail, 70, "2026-03-12", AS_OF),
    ).toEqual({ kind: "unknown" });
  });

  it("never shows fewer than 1 round", () => {
    const emptyPool = {
      ...core,
      pool: { ...core.pool, "189": { total: "0", byScore: {} } },
    };
    const emptyDetail = { ...detail, cohortsByScore: {} };
    const i = input("lodged", { core: emptyPool, detail: emptyDetail });
    const result = estimatedWait(evaluateProfile(i), i);
    expect(result.pace?.roundsNeeded).toEqual({ min: 0, max: 0 });
    expect(result.text).toContain("about 1 round, so plan for 1 year");
  });

  it("names the latest round at the reader's points, not a later lower one", () => {
    const rounds189 = [
      { date: "2026-10-14", cutoff: 65 },
      { date: "2026-09-10", cutoff: 70 },
      { date: "2026-08-10", cutoff: 75 },
    ];
    const i = input("middle", { core: { ...core, rounds189 } });
    const o = evaluateProfile(i);
    expect(o.stamp).toMatchObject({ label: "competitive" });
    expect(estimatedWait(o, i).text).toBe(
      "Uncertain. Possible in a round that goes down to 70, like Sep 2026.",
    );
  });
});
