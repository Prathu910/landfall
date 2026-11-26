/** The checkout's state and events; `reducer.ts` moves between them. */
import type {
  ConfirmResponse,
  Currency,
  OrderResponse,
  Quote,
  VerifyResponse,
} from "../orders/contract";

/** A Razorpay order from report-order; kept so a retry never makes another. */
export type PaidOrder = {
  orderId: string;
  keyId: string;
  amount: number;
  currency: Currency;
};
export type Payment = { paymentId: string; signature: string };

export type CheckoutError =
  | {
      code:
        | "consent"
        | "email"
        | "human"
        | "code-format"
        | "founding-full"
        | "founding-used"
        | "price-changed"
        | "usd-off"
        | "busy"
        | "invalid"
        | "verification"
        | "expired"
        | "locked"
        | "signature"
        | "confirm-busy"
        | "no-data";
    }
  | { code: "wrong-code"; triesLeft: number }
  /** report-order's busy with Retry-After: a founding code must wait. */
  | { code: "wait"; seconds: number }
  | { code: "message"; message: string };

/**
 * What report-order's reply means to the checkout. The transport turns a
 * 503 busy with a `Retry-After` header (a resend inside a minute, or a
 * claim locked after 5 wrong codes) into `wait`, which is no server fault.
 */
export type OrderOutcome = OrderResponse | { kind: "wait"; seconds: number };

export type CheckoutStatus =
  | "ready"
  | "submitting"
  | "code"
  | "verifying"
  | "paying"
  | "confirming"
  | "issued"
  | "issued-by-email"
  | "error";

/**
 * The checkout, one status at a time. `code`/`verifying` carry `claimId` and
 * `emailHint` (kept in `ready` after "Use a different email" until the email
 * changes, so a return to the same address finds its code), `paying` an
 * `order`, `confirming` an order and `payment`, and `issued` the `token`.
 */
export type CheckoutState = {
  status: CheckoutStatus;
  /** Null until report-quote answers: prices come only from it. */
  quote: Quote | null;
  /** The reader's choice; `activeCurrency` is what is charged. */
  currency: Currency;
  email: string;
  consent: boolean;
  /** The Turnstile token: single use, so every order request spends it. */
  turnstile: string;
  code: string;
  claimId?: string;
  emailHint?: string;
  order?: PaidOrder;
  payment?: Payment;
  token?: string;
  /**
   * The reader chose to buy although the founding offer is open (their
   * email already has a founding report): the paid receipt shows, and the
   * order is sent with `paid: true`.
   */
  paid?: true;
  error?: CheckoutError;
};

export type CheckoutEvent =
  | { type: "quote"; quote: Quote }
  | { type: "currency"; currency: Currency }
  | { type: "email"; email: string }
  | { type: "consent"; consent: boolean }
  | { type: "turnstile"; token: string }
  | { type: "code"; code: string }
  | { type: "submit" }
  | { type: "resend" }
  | { type: "change-email" }
  | { type: "buy-another" }
  | { type: "order"; response: OrderOutcome }
  | { type: "verify"; response: VerifyResponse }
  | { type: "razorpay-success"; paymentId: string; signature: string }
  | { type: "razorpay-dismissed" }
  | { type: "confirm"; response: ConfirmResponse }
  | { type: "retry" }
  | { type: "failed"; message: string };
