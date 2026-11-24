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

/** A rule with a short name, e.g. "Age": "Under 45 when invited". */
export type GuideRule = SourcedText & { label: string };

/** How long a step takes: only an officially published period, else "varies". */
export type StepDuration =
  ({ kind: "published" } & SourcedText) | { kind: "varies"; text: string };

export type GuideStep = {
  id: string;
  title: string;
  /** Two or three words for the overview strip. */
  short: string;
  /** Visas the step applies to; state nomination is 190 and 491 only. */
  appliesTo: Visa[];
  what: string;
  rule: SourcedText;
  who: string;
  link: { href: string; text: string };
  onshore: string;
  offshore: string;
  duration: StepDuration;
};

/** Announced, said or published: never modelled until published. */
export type PointsChange = SourcedText & {
  status: "announced" | "said" | "published" | "not-published";
  date: string;
  title: string;
};

export type VisaGuide = {
  visa: Visa;
  name: string;
  kind: "permanent" | "provisional";
  /** One sentence: what the visa is. */
  what: string;
  suits: { onshore: string; offshore: string };
  requirements: GuideRule[];
  nomination: GuideRule[];
  /** What comes after the grant (travel, the 191 pathway). */
  after: GuideRule[];
  /** The occupation page section that shows this visa's evidence. */
  evidenceAnchor: string;
};
