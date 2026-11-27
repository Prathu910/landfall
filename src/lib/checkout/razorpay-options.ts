import type { Currency } from "../orders/contract";

export type RazorpayOpen = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: Currency;
  email: string;
  onSuccess: (paymentId: string, signature: string) => void;
  onDismiss: () => void;
};

/** What Checkout's handler passes back on a successful payment. */
export type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: Currency;
  name: string;
  description: string;
  prefill: { email: string };
  theme?: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal: { ondismiss: () => void };
};

const RGB = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/;

/** A computed `rgb(…)` colour as "#rrggbb" (Razorpay takes hex); null otherwise. */
export function cssColourToHex(value: string): string | null {
  const match = RGB.exec(value.trim());
  if (!match) return null;
  const hex = match
    .slice(1, 4)
    .map((part) => Math.min(255, Number(part)).toString(16).padStart(2, "0"));
  return `#${hex.join("")}`;
}

/** Razorpay Checkout's options for one order: the amount is the order's own. */
export function razorpayOptions(
  open: RazorpayOpen,
  brandColour: string | null,
): RazorpayOptions {
  return {
    key: open.keyId,
    order_id: open.orderId,
    amount: open.amount,
    currency: open.currency,
    name: "MigrateLens",
    description: "Personal PR report",
    prefill: { email: open.email },
    ...(brandColour ? { theme: { color: brandColour } } : {}),
    handler: (response) =>
      open.onSuccess(response.razorpay_payment_id, response.razorpay_signature),
    modal: { ondismiss: open.onDismiss },
  };
}
