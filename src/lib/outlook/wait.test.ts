import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { loadOccupationCore, loadOccupationDetail } from "../data/load-server";
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
  const core = loadOccupationCore(profile.occupation);
  return {
    profile,
    asOf: AS_OF,
    core,
    detail: core ? loadOccupationDetail(profile.occupation) : null,
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

  it("sana, with no core, cannot be estimated", () => {
    expect(wait("nodata", { core: null, detail: null })).toEqual({
      text: "We can't estimate one without data.",
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
      /^States don't publish a queue\. Northern Territory invited/,
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
    const core = loadOccupationCore("254499")!;
    const detail = loadOccupationDetail("254499")!;
    expect(lodgedPace(core, detail, 70, "nope", AS_OF)).toBeNull();
  });
});
