import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { frozenCore } from "../data/__fixtures__/frozen-2026-10";
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
    core: frozenCore(profile.occupation),
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

  // Greenkeeper is off the Home Affairs 189 list, so 189 is "not open" even
  // without published data, and that is the best label of the three.
  it("is combined not open, from 189's list, with no 190 or 491 label", () => {
    expect(outlook.v190).toBeNull();
    expect(outlook.v491).toBeNull();
    expect(outlook.v189).toMatchObject({ label: "not-open", offList: true });
    expect(outlook.stamp).toMatchObject({
      kind: "combined",
      label: "not-open",
    });
  });

  it("reads list membership from the rules by occupation code", () => {
    expect(outlook.listMembership).toEqual({
      federal189: false,
      federal190: true,
      federal491: true,
      states: ["WA"],
    });
  });
});

describe("evaluateProfile list membership", () => {
  it("falls back on the published data when the federal list is unreadable", () => {
    const outlook = evaluateProfile({
      profile: SCENARIOS.nodata,
      asOf: AS_OF,
      core: null,
      detail: null,
      rules: { ...RULES, federal: null },
    });
    expect(outlook.listMembership.federal189).toBeNull();
    expect(outlook.v189).toMatchObject({ label: "no-data", offList: false });
    expect(outlook.stamp).toMatchObject({ kind: "combined", label: "no-data" });
  });

  it("lists every state whose imported list holds the occupation", () => {
    expect(run("none").listMembership.states).toEqual(["SA", "WA"]);
  });
});
