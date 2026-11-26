import type { Visa } from "../data/types";
import { formatFeeAmount } from "./costs";
import type { FeeCatalogue } from "./types";

export type CompareRow = { label: string; values: Record<Visa, string> };

/** The three visas side by side, from the sourced rules, fees and list counts. */
export function compareRows(
  fees: FeeCatalogue,
  counts: Record<Visa, number> | null,
): CompareRow[] {
  const charge = (visa: Visa) => {
    const amount = fees.visaCharges[visa].main.amount;
    return "kind" in amount ? formatFeeAmount(amount) : "";
  };
  const rows: CompareRow[] = [
    {
      label: "Kind of visa",
      values: {
        "189": "Permanent",
        "190": "Permanent",
        "491": "Provisional, 5 years",
      },
    },
    {
      label: "Who nominates you",
      values: {
        "189": "No one",
        "190": "A state or territory",
        "491": "A state or territory, or an eligible relative",
      },
    },
    {
      label: "Points for nomination",
      values: { "189": "None", "190": "+5", "491": "+15" },
    },
    {
      label: "Where you live",
      values: {
        "189": "Anywhere in Australia",
        "190": "The nominating state sets its conditions",
        "491": "A designated regional area",
      },
    },
    {
      label: "Permanent residence",
      values: {
        "189": "On grant",
        "190": "On grant",
        "491": "Through the 191, after 3 years on the 491",
      },
    },
    {
      label: "Main applicant’s visa charge",
      values: {
        "189": charge("189"),
        "190": charge("190"),
        "491": charge("491"),
      },
    },
  ];
  if (!counts) return rows;
  return [
    ...rows,
    {
      label: "Occupations on the list",
      values: {
        "189": String(counts["189"]),
        "190": String(counts["190"]),
        "491": String(counts["491"]),
      },
    },
  ];
}

/**
 * The one-sentence answer above the comparison table, for "189 vs 190 vs
 * 491" queries (audit A-P2-8); the nomination points come from the table.
 */
export function differenceAnswer(points190: number, points491: number): string {
  return `The 189 and 190 are permanent; the 491 is a 5-year provisional regional visa with a path to the permanent 191. The 190 adds ${points190} points for state nomination and the 491 adds ${points491} for state nomination or family sponsorship; the 189 has no nomination.`;
}
