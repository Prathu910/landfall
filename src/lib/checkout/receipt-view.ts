import { SELLER } from "../orders/seller";
import { formatPrice } from "./currency";
import {
  activeCurrency,
  foundingOpen,
  quotedAmount,
  type CheckoutState,
} from "./reducer";

export type ReceiptTicket = { stub: string; title: string; sub: string };

/** The receipt, worded from the quote alone: no price literal anywhere. */
export type ReceiptView =
  | { kind: "pending" }
  | {
      kind: "quoted";
      usdSwitch: boolean;
      item: { title: string; detail: string; price: string };
      discount: { title: string; detail: string; amount: string } | null;
      total: string;
      seats: {
        text: string;
        remaining: number;
        limit: number;
        /** The share of places already taken, 0 to 1, for the meter. */
        taken: number;
      } | null;
      ticket: ReceiptTicket;
      trust: string[];
    };

export type Reader = {
  occupationName: string;
  points: number;
  onshore: boolean;
};

const TRUST = [
  "7-day no-questions refund",
  "Ready on screen in seconds, PDF by email",
  `Questions? ${SELLER.email}`,
];

export function receiptView(s: CheckoutState, reader: Reader): ReceiptView {
  const amount = quotedAmount(s);
  if (!s.quote || amount === null) return { kind: "pending" };
  const currency = activeCurrency(s);
  const price = formatPrice(amount, currency);
  const { remaining, limit } = s.quote.founding;
  const founding = foundingOpen(s);
  const item = {
    title: "Personal PR report",
    detail: `${reader.occupationName} · ${reader.points} points · ${reader.onshore ? "onshore" : "offshore"}`,
    price,
  };
  const shared = {
    kind: "quoted" as const,
    usdSwitch: s.quote.prices.USD !== null,
    item,
  };
  if (founding)
    return {
      ...shared,
      discount: {
        title: `Founding ${limit}`,
        detail: `You're one of the first ${limit}`,
        amount: `−${price}`,
      },
      total: formatPrice(0, currency),
      seats: {
        text: `${remaining} of ${limit} left`,
        remaining,
        limit,
        taken: Math.min(1, Math.max(0, (limit - remaining) / limit)),
      },
      ticket: {
        stub: "FOUNDING",
        title: "Claim my free report →",
        sub: `${remaining} of ${limit} founding places left · issued in seconds`,
      },
      trust: TRUST,
    };
  return {
    ...shared,
    discount: null,
    total: price,
    seats: null,
    ticket: {
      stub: "ADMIT ONE",
      title: `Pay ${price} securely →`,
      sub: "UPI, cards, netbanking · issued in seconds",
    },
    trust: ["Secure payment by Razorpay", ...TRUST],
  };
}
