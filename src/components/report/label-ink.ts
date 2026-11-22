import type { OutlookLabel } from "@/lib/outlook/labels";

/** The Task 11 token for a label's ink colour; steps with no label use plain ink. */
export function labelInk(label: OutlookLabel | null): string {
  return label ? `var(--label-${label}-ink)` : "var(--ink)";
}
