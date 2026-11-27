import type { Currency } from "../orders/contract";

const INDIA = new Set(["Asia/Kolkata", "Asia/Calcutta"]);
const SYMBOL: Record<Currency, string> = { INR: "₹", USD: "$" };
const GROUPING: Record<Currency, string> = { INR: "en-IN", USD: "en-US" };

/**
 * INR in India, USD elsewhere (paid report spec, "Pricing and currency").
 * An unknown time zone is "elsewhere"; with USD off, everyone sees INR.
 */
export function defaultCurrency(
  timeZone: string | undefined,
  usdAvailable: boolean,
): Currency {
  if (!usdAvailable) return "INR";
  return timeZone && INDIA.has(timeZone) ? "INR" : "USD";
}

/** A price in the smallest unit (paise, cents) as "₹699" or "$14.50". */
export function formatPrice(amount: number, currency: Currency): string {
  const whole = amount % 100 === 0;
  const number = (amount / 100).toLocaleString(GROUPING[currency], {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
  return `${SYMBOL[currency]}${number}`;
}
