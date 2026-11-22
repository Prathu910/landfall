import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { loadOccupationCore } from "../data/load-server";
import {
  realFederal,
  realLists,
} from "../state-outlook/__fixtures__/real-data";
import { SCENARIOS } from "./__fixtures__/scenarios";
import type { ScenarioId } from "./__fixtures__/scenarios";
import { evaluateProfile } from "./evaluate-profile";
import type { ProfileOutlook } from "./evaluate-profile";

const AS_OF = "2026-11-21";
const RULES = {
  rules: stateRules,
  lists: realLists(),
  federal: realFederal(),
};

function run(id: ScenarioId): ProfileOutlook {
  const profile = SCENARIOS[id];
  return evaluateProfile({
    profile,
    asOf: AS_OF,
    core: loadOccupationCore(profile.occupation),
    detail: null,
    rules: RULES,
  });
}

describe("evaluateProfile stamps on the real snapshot", () => {
  it.each([
    ["strong", "189", null, "very-strong"],
    ["middle", "189", null, "competitive"],
    ["long", "190", "TAS", "competitive"],
    ["notinv", "190", "NT", "competitive"],
    ["below", "190", "TAS", "competitive"],
    ["lodged", "189", null, "competitive"],
  ] as const)("%s is a single %s stamp", (id, visa, state, label) => {
    expect(run(id).stamp).toMatchObject({
      kind: "single",
      visa,
      state,
      label,
    });
  });

  it("none is combined not invited", () => {
    expect(run("none").stamp).toMatchObject({
      kind: "combined",
      label: "not-invited",
    });
  });

  it("stamp points match the visa's points", () => {
    const outlook = run("long");
    expect(outlook.stamp).toMatchObject({
      points: outlook.points.subclass190,
    });
  });
});

describe("evaluateProfile with no core", () => {
  const outlook = evaluateProfile({
    profile: SCENARIOS.nodata,
    asOf: AS_OF,
    core: null,
    detail: null,
    rules: RULES,
  });

  it("is combined no data with no 190 or 491 label", () => {
    expect(outlook.v190).toBeNull();
    expect(outlook.v491).toBeNull();
    expect(outlook.stamp).toMatchObject({ kind: "combined", label: "no-data" });
  });

  it("reads list membership from the rules by occupation code", () => {
    expect(outlook.listMembership).toEqual({
      federal190: true,
      federal491: true,
      states: ["WA"],
    });
  });
});

describe("evaluateProfile list membership", () => {
  it("lists every state whose imported list holds the occupation", () => {
    expect(run("none").listMembership.states).toEqual(["SA", "WA"]);
  });
});
