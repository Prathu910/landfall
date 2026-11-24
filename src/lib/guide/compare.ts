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
