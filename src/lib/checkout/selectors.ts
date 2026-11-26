/** Read-only views of the checkout state, shared by the reducer and the UI. */
import type { Currency, OrderRequest } from "../orders/contract";
import type { CheckoutState } from "./state";

/** INR whenever the quote has no USD price (the switch is hidden then). */
export function activeCurrency(s: CheckoutState): Currency {
  return s.quote?.prices.USD == null ? "INR" : s.currency;
}

/** Founding shows while the quote has places, unless the reader chose to pay. */
export function foundingOpen(s: CheckoutState): boolean {
  const founding = s.quote?.founding;
  return !s.paid && !!founding && founding.enabled && founding.remaining > 0;
}

/** The report-order body for a submitting state. */
export function orderRequest(
  s: CheckoutState,
  profile: unknown,
  asOf: string,
): OrderRequest {
  return {
    profile,
    email: s.email,
    currency: activeCurrency(s),
    consent: true,
    asOf,
    turnstile_token: s.turnstile,
    ...(s.paid ? { paid: true as const } : {}),
  };
}

/** The price of the active currency, in the smallest unit. */
export function quotedAmount(s: CheckoutState): number | null {
  if (!s.quote) return null;
  return activeCurrency(s) === "USD" ? s.quote.prices.USD : s.quote.prices.INR;
}
