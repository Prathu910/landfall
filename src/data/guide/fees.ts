import type { FeeCatalogue } from "../../lib/guide/types";
import { THIRD_PARTY_FEES } from "./third-party-fees";
import { FEES_AS_AT, VISA_CHARGES } from "./visa-charges";

// Hand-sourced from the official pages on 23 Nov 2026; the research notes are
// docs/research/pr-guide-2026-11.md. Visa charges are in visa-charges.ts and
// everyone else's fees in third-party-fees.ts.
export const FEES: FeeCatalogue = {
  feesAsAt: FEES_AS_AT,
  visaCharges: VISA_CHARGES,
  ...THIRD_PARTY_FEES,
};
