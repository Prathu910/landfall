import type { StateCode, Visa } from "../data/types";
import { evaluateProfile } from "../outlook/evaluate-profile";
import type { OutlookInput } from "../outlook/evaluate-profile";
import { buildHeadline } from "../outlook/headline";
import { buildImprove } from "../outlook/improve";
import type { OutlookLabel } from "../outlook/labels";
import { estimatedWait } from "../outlook/wait";
import { applyScenarios } from "../scenarios";

export type HomeExample = {
  nationalLabel: OutlookLabel;
  bestRoute: string;
  wait: string;
  improvementText: string;
  fromPoints: number;
  toPoints: number;
  fromLabel: OutlookLabel;
  toLabel: OutlookLabel;
  outlook: {
    label: OutlookLabel;
    visa: Visa | null;
    state: StateCode | null;
    points: number;
  };
};

/** A compact example of the same route, wait and decisions the report uses. */
export function buildHomeExample(input: OutlookInput): HomeExample {
  const current = evaluateProfile(input);
  const improve = buildImprove(input, current);
  const headline = buildHeadline(input, current, improve);
  const improvedProfile = applyScenarios(
    input.profile,
    ["english"],
    input.asOf,
  );
  const improved = evaluateProfile({ ...input, profile: improvedProfile });
  const added = improved.points.base - current.points.base;
  const stamp = current.stamp;
  return {
    nationalLabel: current.v189.label,
    bestRoute: headline.best,
    wait: estimatedWait(current, input).text,
    improvementText:
      added > 0
        ? `Superior English adds ${added} points in this example.`
        : "Superior English does not add points in this example.",
    fromPoints: current.points.base,
    toPoints: improved.points.base,
    fromLabel: current.v189.label,
    toLabel: improved.v189.label,
    outlook: {
      label: stamp.label,
      visa: stamp.kind === "single" ? stamp.visa : null,
      state: stamp.kind === "single" ? stamp.state : null,
      points: stamp.kind === "single" ? stamp.points : current.points.base,
    },
  };
}
