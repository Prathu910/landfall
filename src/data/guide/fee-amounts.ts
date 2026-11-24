import type { FeeAmount } from "../../lib/guide/types";
import { GUIDE_CHECKED_AT } from "./sources";

// Shared by the fee files: every fee was read on GUIDE_CHECKED_AT.
export const CHECKED = GUIDE_CHECKED_AT;

export const BLOCKED =
  "The official page refused our automated read on 23 Nov 2026.";

export const aud = (amount: number): FeeAmount => ({
  kind: "fixed",
  currency: "AUD",
  amount,
});
export const audRange = (min: number, max: number): FeeAmount => ({
  kind: "range",
  currency: "AUD",
  min,
  max,
});
export const check = (reason: string): FeeAmount => ({
  kind: "check",
  reason,
});
