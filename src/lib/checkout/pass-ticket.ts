import type { Currency, Quote } from "../orders/contract";
import { formatPrice } from "./currency";

export type PassMeta =
  | { kind: "pending" }
  | { kind: "founding"; was: string; remaining: number; limit: number }
  | { kind: "paid"; price: string };

/** The free result's boarding pass: its stub and meta row, from the quote alone. */
export type PassTicket = { stub: string; meta: PassMeta; metaText: string };

const PAID_TERMS = "one-off · 7-day no-questions refund";

/**
 * Prices come only from the quote (no price literal in the frontend), and
 * the founding count is the quote's real count: never invented scarcity.
 */
export function passTicket(
  quote: Quote | null,
  currency: Currency,
): PassTicket {
  if (!quote)
    return { stub: "PR REPORT", meta: { kind: "pending" }, metaText: "" };
  const usd = quote.prices.USD;
  const price =
    currency === "USD" && usd !== null
      ? formatPrice(usd, "USD")
      : formatPrice(quote.prices.INR, "INR");
  const { enabled, remaining, limit } = quote.founding;
  if (enabled && remaining > 0) {
    return {
      stub: `FOUNDING ${limit}`,
      meta: { kind: "founding", was: price, remaining, limit },
      metaText: `Free, was ${price}, ${remaining} of ${limit} left`,
    };
  }
  return {
    stub: "PR REPORT",
    meta: { kind: "paid", price },
    metaText: `${price} ${PAID_TERMS}`,
  };
}
