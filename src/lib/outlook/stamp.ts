import type { StateCode, Visa } from "../data/types";
import type { Label189 } from "./label-189";
import type { VisaLabel } from "./label-state";
import { isAtLeast } from "./labels";
import type { OutlookLabel } from "./labels";

export type Stamp =
  | {
      kind: "single";
      visa: Visa;
      state: StateCode | null;
      label: OutlookLabel;
      points: number;
      tooFew: boolean;
    }
  | { kind: "combined"; label: OutlookLabel; tooFew: boolean };

type Candidate = {
  visa: Visa;
  label: OutlookLabel;
  state: StateCode | null;
  points: number;
  tooFew: boolean;
};

// Spec 6.4: a stamp names one visa only when it is at least competitive.
// Otherwise one visa's name would imply a position that the data doesn't show.
export function chooseStamp(
  v189: Label189,
  v190: VisaLabel | null,
  v491: VisaLabel | null,
  points: { base: number; s190: number; s491: number },
): Stamp {
  // Listed in tie-break order: 189, then 190, then 491.
  const candidates: Candidate[] = [
    {
      visa: "189",
      label: v189.label,
      state: null,
      points: points.base,
      tooFew: v189.tooFew,
    },
    {
      visa: "190",
      label: v190?.label ?? "no-data",
      state: v190?.best?.state ?? null,
      points: points.s190,
      tooFew: false,
    },
    {
      visa: "491",
      label: v491?.label ?? "no-data",
      state: v491?.best?.state ?? null,
      points: points.s491,
      tooFew: false,
    },
  ];

  let best = candidates[0];
  for (const candidate of candidates) {
    if (
      isAtLeast(candidate.label, best.label) &&
      candidate.label !== best.label
    ) {
      best = candidate;
    }
  }

  if (!isAtLeast(best.label, "competitive")) {
    return { kind: "combined", label: best.label, tooFew: best.tooFew };
  }
  return {
    kind: "single",
    visa: best.visa,
    state: best.state,
    label: best.label,
    points: best.points,
    tooFew: best.tooFew,
  };
}
