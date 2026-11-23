import type { StateCode, Visa } from "../data/types";
import type {
  Currency,
  Fee,
  FeeAmount,
  FeeCatalogue,
  Situation,
} from "./types";

/** The reader's answers to the cost estimator. */
export type CostInput = {
  visa: Visa;
  situation: Situation;
  partner: boolean;
  childrenUnder18: number;
  children18Plus: number;
  /** An assessing body's fee id, or null when not chosen. */
  assessingBody: string | null;
  /** An English test's fee id, or null for "already have a valid result". */
  englishTest: string | null;
  naati: boolean;
  /** The nominating state for 190 or 491, or null when not chosen. */
  state: StateCode | null;
  /**
   * Applicants aged 16 or over with a total of 12 months or more in Australia
   * in the last 10 years since turning 16: each needs an AFP check.
   */
  australianPoliceChecks: number;
};

export type CostLine = {
  id: string;
  label: string;
  quantity: number;
  /** One unit's amount on `asOf`. */
  unit: FeeAmount;
  /** `unit` times `quantity`; unpriced amounts pass through. */
  total: FeeAmount;
  fee: Fee;
  /** A published change still ahead, so the reader sees it coming. */
  upcoming?: { from: string; amount: FeeAmount; note?: string };
};

export type CurrencyTotal = { currency: Currency; min: number; max: number };

export type CostEstimate = {
  /** Lines with a published figure; they make up `totals`. */
  lines: CostLine[];
  /** One total per currency, in the order AUD, INR. Never converted. */
  totals: CurrencyTotal[];
  /** Lines with no figure ("Varies" or "Check current fee"). */
  unpriced: CostLine[];
  /** Charged later only for an adult without functional English; not totalled. */
  secondInstalment: Fee;
};

const CURRENCY_ORDER: Currency[] = ["AUD", "INR"];

function isSituational(
  amount: Fee["amount"],
): amount is Record<Situation, FeeAmount> {
  return "offshore" in amount && "onshore" in amount;
}

/** The amount that applies on `asOf`: the latest change that has started, else the base. */
export function resolveFee(
  fee: Fee,
  situation: Situation,
  asOf: string,
): { amount: FeeAmount; upcoming?: CostLine["upcoming"] } {
  const base = isSituational(fee.amount) ? fee.amount[situation] : fee.amount;
  const changes = [...(fee.changes ?? [])].sort((a, b) =>
    a.from.localeCompare(b.from),
  );
  const started = changes.filter((c) => c.from <= asOf);
  const upcoming = changes.find((c) => c.from > asOf);
  return {
    amount: started.at(-1)?.amount ?? base,
    ...(upcoming ? { upcoming } : {}),
  };
}

/** Whole cents, so 1,260.60 + 630.30 is 1,890.90, not 1,890.8999. */
function cents(value: number): number {
  return Math.round(value * 100);
}

function times(amount: FeeAmount, quantity: number): FeeAmount {
  if (amount.kind === "fixed") {
    return { ...amount, amount: (cents(amount.amount) * quantity) / 100 };
  }
  if (amount.kind === "range") {
    return {
      ...amount,
      min: (cents(amount.min) * quantity) / 100,
      max: (cents(amount.max) * quantity) / 100,
    };
  }
  return amount;
}

function count(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function line(
  fee: Fee,
  quantity: number,
  input: CostInput,
  asOf: string,
): CostLine {
  const { amount, upcoming } = resolveFee(fee, input.situation, asOf);
  return {
    id: fee.id,
    label: fee.label,
    quantity,
    unit: amount,
    total: times(amount, quantity),
    fee,
    ...(upcoming ? { upcoming } : {}),
  };
}

function chosenLines(
  input: CostInput,
  catalogue: FeeCatalogue,
  asOf: string,
): CostLine[] {
  const charges = catalogue.visaCharges[input.visa];
  const adults = (input.partner ? 1 : 0) + count(input.children18Plus);
  const children = count(input.childrenUnder18);
  const lines = [line(charges.main, 1, input, asOf)];
  if (adults > 0) lines.push(line(charges.adult, adults, input, asOf));
  if (children > 0) lines.push(line(charges.child, children, input, asOf));
  const body = catalogue.assessingBodies.find(
    (f) => f.id === input.assessingBody,
  );
  if (body) lines.push(line(body, 1, input, asOf));
  const test = catalogue.englishTests.find((f) => f.id === input.englishTest);
  if (test) lines.push(line(test, 1, input, asOf));
  if (input.naati) lines.push(line(catalogue.naati, 1, input, asOf));
  if (input.visa !== "189" && input.state) {
    lines.push(line(catalogue.stateNomination[input.state], 1, input, asOf));
  }
  // Any applicant can be 16 or over (under-18s include 16 and 17 year olds).
  const checks = Math.min(
    count(input.australianPoliceChecks),
    1 + adults + children,
  );
  if (checks > 0) lines.push(line(catalogue.afpCheck, checks, input, asOf));
  return lines;
}

function totalsOf(lines: CostLine[]): CurrencyTotal[] {
  const sums = new Map<Currency, { min: number; max: number }>();
  for (const { total } of lines) {
    if (total.kind !== "fixed" && total.kind !== "range") continue;
    const sum = sums.get(total.currency) ?? { min: 0, max: 0 };
    const low = total.kind === "fixed" ? total.amount : total.min;
    const high = total.kind === "fixed" ? total.amount : total.max;
    sums.set(total.currency, {
      min: sum.min + cents(low),
      max: sum.max + cents(high),
    });
  }
  return CURRENCY_ORDER.flatMap((currency) => {
    const sum = sums.get(currency);
    return sum ? [{ currency, min: sum.min / 100, max: sum.max / 100 }] : [];
  });
}

const isPriced = (l: CostLine) =>
  l.total.kind === "fixed" || l.total.kind === "range";

/** What the chosen steps cost, from the hand-sourced fees on `asOf`. */
export function estimateCosts(
  input: CostInput,
  catalogue: FeeCatalogue,
  asOf: string,
): CostEstimate {
  const chosen = chosenLines(input, catalogue, asOf);
  // Always listed, so a total is never read as the whole cost.
  const always = [
    catalogue.health,
    catalogue.overseasPolice,
    catalogue.translations,
  ].map((fee) => line(fee, 1, input, asOf));
  const lines = chosen.filter(isPriced);
  return {
    lines,
    totals: totalsOf(lines),
    unpriced: [...chosen.filter((l) => !isPriced(l)), ...always],
    secondInstalment: catalogue.visaCharges[input.visa].secondInstalment,
  };
}

function money(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatFeeAmount(amount: FeeAmount): string {
  switch (amount.kind) {
    case "fixed":
      return `${amount.currency} ${money(amount.amount)}`;
    case "range":
      return `${amount.currency} ${money(amount.min)}–${money(amount.max)}`;
    case "varies":
      return "Varies";
    case "check":
      return "Check current fee";
  }
}

export function formatTotal(total: CurrencyTotal): string {
  return total.min === total.max
    ? `${total.currency} ${money(total.min)}`
    : `${total.currency} ${money(total.min)}–${money(total.max)}`;
}
