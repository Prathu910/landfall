export type OutlookLabel =
  | "very-strong"
  | "strong"
  | "competitive"
  | "long-wait"
  | "not-eligible"
  | "not-open"
  | "not-invited"
  | "no-data";

// Best first. The order is the single source of truth for comparing labels.
export const LABEL_RANK: readonly OutlookLabel[] = [
  "very-strong",
  "strong",
  "competitive",
  "long-wait",
  "not-eligible",
  "not-open",
  "not-invited",
  "no-data",
];

const LABEL_NAMES: Record<OutlookLabel, string> = {
  "very-strong": "Very strong",
  strong: "Strong",
  competitive: "Competitive",
  "long-wait": "Long wait",
  "not-eligible": "Not eligible yet",
  "not-open": "Not open to you",
  "not-invited": "Not currently invited",
  "no-data": "Not enough data",
};

// Stamps are small, so four labels get shorter names.
const STAMP_NAMES: Record<OutlookLabel, string> = {
  ...LABEL_NAMES,
  "not-eligible": "Not eligible",
  "not-open": "Not open",
  "not-invited": "Not invited",
  "no-data": "No data",
};

const TOO_FEW = "Too few to count";

// tooFew marks a masked "<20" count, which differs from a missing one.
export function labelName(label: OutlookLabel, tooFew = false): string {
  if (tooFew && label === "no-data") {
    return TOO_FEW;
  }
  return LABEL_NAMES[label];
}

export function stampName(label: OutlookLabel, tooFew = false): string {
  if (tooFew && label === "no-data") {
    return TOO_FEW;
  }
  return STAMP_NAMES[label];
}

export function bestLabel(labels: OutlookLabel[]): OutlookLabel {
  let best: OutlookLabel = "no-data";
  for (const label of labels) {
    if (LABEL_RANK.indexOf(label) < LABEL_RANK.indexOf(best)) {
      best = label;
    }
  }
  return best;
}

export function isAtLeast(label: OutlookLabel, floor: OutlookLabel): boolean {
  return LABEL_RANK.indexOf(label) <= LABEL_RANK.indexOf(floor);
}
