import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import { frozenCore, frozenDetail } from "../data/__fixtures__/frozen-2026-10";
import { calculatePoints } from "../migration";
import { evaluateProfile } from "../outlook/evaluate-profile";
import type { OutlookInput } from "../outlook/evaluate-profile";
import { EXAMPLE_PROFILES } from "../outlook/examples";
import { buildHeadline } from "../outlook/headline";
import { buildImprove } from "../outlook/improve";
import { estimatedWait } from "../outlook/wait";
import { SAMPLE_AS_OF } from "../sample";
import { applyScenarios } from "../scenarios";
import { buildHomeExample } from "./example";

function input(): OutlookInput {
  const profile = EXAMPLE_PROFILES.middle;
  return {
    profile,
    asOf: SAMPLE_AS_OF,
    core: frozenCore(profile.occupation),
    detail: frozenDetail(profile.occupation),
    rules: stateRuleData,
  };
}

describe("homepage report example", () => {
  it("derives the nurse route, wait and stamp from the report's actual decisions", () => {
    const entered = input();
    const outlook = evaluateProfile(entered);
    const improvement = buildImprove(entered, outlook);
    const view = buildHomeExample(entered);
    expect(view.bestRoute).toBe(
      buildHeadline(entered, outlook, improvement).best,
    );
    expect(view.wait).toBe(estimatedWait(outlook, entered).text);
    expect(view.nationalLabel).toBe(outlook.v189.label);
    expect(view.outlook).toEqual({
      label: "competitive",
      visa: "189",
      state: null,
      points: 70,
    });
    expect(view.wait).toContain("Oct 2026");
    expect(view.bestRoute).toContain("VIC 190");
  });

  it("recalculates Superior English from the real profile and preserves its national label change", () => {
    const entered = input();
    const afterProfile = applyScenarios(
      entered.profile,
      ["english"],
      entered.asOf,
    );
    const after = evaluateProfile({ ...entered, profile: afterProfile });
    const view = buildHomeExample(entered);
    expect(view.fromPoints).toBe(
      calculatePoints(entered.profile, entered.asOf).base,
    );
    expect(view.toPoints).toBe(
      calculatePoints(afterProfile, entered.asOf).base,
    );
    expect(view.toPoints - view.fromPoints).toBe(10);
    expect(view.fromLabel).toBe("competitive");
    expect(view.toLabel).toBe(after.v189.label);
    expect(view.improvementText).toBe(
      "Superior English adds 10 points in this example.",
    );
  });

  it("does not invent a ten-point improvement when English already earns twenty", () => {
    const entered = input();
    entered.profile = applyScenarios(
      entered.profile,
      ["english"],
      entered.asOf,
    );
    const view = buildHomeExample(entered);
    expect(view.toPoints).toBe(view.fromPoints);
    expect(view.toLabel).toBe(view.fromLabel);
    expect(view.improvementText).toBe(
      "Superior English does not add points in this example.",
    );
  });

  it("keeps no-data routes and waits honest instead of retaining the nurse example's claims", () => {
    const entered = { ...input(), core: null, detail: null };
    const outlook = evaluateProfile(entered);
    const view = buildHomeExample(entered);
    expect(view.nationalLabel).toBe("no-data");
    expect(view.wait).toBe(estimatedWait(outlook, entered).text);
    expect(view.wait).not.toContain("round that goes down");
    expect(view.bestRoute).not.toBe(buildHomeExample(input()).bestRoute);
    expect(view.toLabel).toBe("no-data");
  });
});
