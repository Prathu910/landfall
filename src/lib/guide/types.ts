import type { StateCode, Visa } from "../data/types";

/** A fee's currency: the one the provider charges in. No live exchange rates. */
export type Currency = "AUD" | "INR";

/** Where the reader is now; some providers charge GST or a different fee onshore. */
export type Situation = "offshore" | "onshore";

export type FeeAmount =
  | { kind: "fixed"; currency: Currency; amount: number }
  | { kind: "range"; currency: Currency; min: number; max: number }
  /** No single published price, e.g. panel clinics set their own. */
  | { kind: "varies"; reason: string }
  /** We could not read the official page, so we show no figure. */
  | { kind: "check"; reason: string };

/** A hand-sourced fee: the amount, where it came from and when we read it. */
export type Fee = {
  id: string;
  label: string;
  /** One amount, or one per situation when the provider charges differently. */
  amount: FeeAmount | Record<Situation, FeeAmount>;
  /** "Excludes GST", "Includes GST", "No GST". */
  tax?: string;
  note?: string;
  source: string;
  checkedAt: string; // YYYY-MM-DD
  /** A published change from a future date (applied once `asOf` reaches it). */
  changes?: { from: string; amount: FeeAmount; note?: string }[];
};

/** The three visa application charges for one visa. */
export type VisaCharges = {
  visa: Visa;
  main: Fee;
  adult: Fee;
  child: Fee;
  /** Charged later, only for an adult assessed without functional English. */
  secondInstalment: Fee;
};

export type FeeCatalogue = {
  /** The date the visa charges took effect ("Fees as at"). */
  feesAsAt: string;
  visaCharges: Record<Visa, VisaCharges>;
  assessingBodies: Fee[];
  englishTests: Fee[];
  naati: Fee;
  stateNomination: Record<StateCode, Fee>;
  afpCheck: Fee;
  overseasPolice: Fee;
  health: Fee;
  translations: Fee;
};

/** A dated, sourced statement in the guide (a rule, a step, a reform note). */
export type SourcedText = { text: string; source: string; checkedAt: string };
