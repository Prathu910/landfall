import type { Visa } from "../../lib/data/types";
import type { Fee, VisaCharges } from "../../lib/guide/types";
import { CHECKED, aud } from "./fee-amounts";
import { SOURCES } from "./sources";

// The Home Affairs visa application charges, from the current visa pricing
// table. They change every 1 July (the build warns once that date passes):
// re-read the table and update FEES_AS_AT with the amounts.
const PRICING = SOURCES.pricing;

/** The date the charges below took effect ("Fees as at"). */
export const FEES_AS_AT = "2026-07-01";

function charges(
  visa: Visa,
  main: number,
  adult: number,
  child: number,
  secondInstalment: number,
): VisaCharges {
  const fee = (id: string, label: string, amount: number): Fee => ({
    id: `vac-${visa}-${id}`,
    label,
    amount: aud(amount),
    source: PRICING,
    checkedAt: CHECKED,
  });
  return {
    visa,
    main: fee("main", "Visa application charge, main applicant", main),
    adult: fee("adult", "Each extra applicant aged 18 or over", adult),
    child: fee("child", "Each extra applicant under 18", child),
    secondInstalment: fee(
      "second",
      "Second instalment, each adult assessed without functional English",
      secondInstalment,
    ),
  };
}

export const VISA_CHARGES: Record<Visa, VisaCharges> = {
  "189": charges("189", 6135, 3070, 1540, 4885),
  "190": charges("190", 6140, 3070, 1535, 4885),
  "491": charges("491", 6140, 3070, 1535, 4890),
};
