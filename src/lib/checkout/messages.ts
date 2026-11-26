import { SELLER } from "../orders/seller";
import { formatPrice } from "./currency";
import { activeCurrency, quotedAmount, type CheckoutState } from "./reducer";

export const BUSY =
  "Something went wrong on our side. Try again in a minute; you haven't been charged.";
export const SCRIPT_FAILED =
  "Payment couldn't start. Check your connection and try again.";

function price(s: CheckoutState): string {
  const amount = quotedAmount(s);
  return amount === null ? "" : formatPrice(amount, activeCurrency(s));
}

/** "45 seconds", "1 minute", "9 minutes": a wait rounded up, never down. */
export function waitText(seconds: number): string {
  if (seconds < 60) return seconds === 1 ? "1 second" : `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

/** The founding-used action: the same email buys a report at the quoted price. */
export function buyAnotherLabel(s: CheckoutState): string {
  return `Buy another for ${price(s)}`;
}

/** The line shown under the ticket for the state's error; null for none. */
export function checkoutMessage(s: CheckoutState): string | null {
  const error = s.error;
  if (!error) return null;
  switch (error.code) {
    case "message":
      return error.message || null;
    case "consent":
      return "Tick the box to agree to the Terms and Privacy policy.";
    case "email":
      return "Enter a valid email address for your report.";
    case "human":
      return "Complete the spam verification, then press the button again.";
    case "code-format":
      return "Enter the 6-digit code from the email.";
    case "founding-full":
      return `The last founding place has just gone. Your report is ${price(s)}.`;
    case "founding-used":
      return `This email already has a founding report. Check your inbox, or buy another for ${price(s)}.`;
    case "price-changed":
      return `The price has changed since this page loaded. Your report is ${price(s)}.`;
    case "usd-off":
      return `Payment in USD isn't available right now. Your report is ${price(s)}.`;
    case "busy":
      return BUSY;
    case "wait":
      // In the code step the claim's code is still valid; in `ready` the
      // reason (a recent code, or too many wrong ones) isn't known.
      return s.status === "code"
        ? `The code we sent still works. You can ask for a new one in ${waitText(error.seconds)}.`
        : `You can ask for a new code in ${waitText(error.seconds)}.`;
    case "invalid":
      return "We couldn't read your answers. Go back to your free result and try again.";
    case "verification":
      return "Spam verification was not accepted. Please retry verification.";
    case "expired":
      return "That code has expired. Press the button for a new one.";
    case "locked":
      return "Too many wrong codes. Wait a while, then press the button for a new one.";
    case "wrong-code":
      return `That code isn't right. ${error.triesLeft} ${error.triesLeft === 1 ? "try" : "tries"} left.`;
    case "signature":
      return `We couldn't confirm this payment, so no report was issued. If you were charged, write to ${SELLER.email} and we'll sort it out.`;
    case "confirm-busy":
      return `We're still confirming your payment. Try again in a minute; if your report doesn't open, its link will reach your email. Questions? ${SELLER.email}`;
    case "no-data":
      return "A full report isn't available for this occupation yet.";
  }
}
