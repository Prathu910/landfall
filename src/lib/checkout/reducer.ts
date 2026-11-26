import type {
  ConfirmResponse,
  Currency,
  OrderResponse,
  Quote,
  VerifyResponse,
} from "../orders/contract";
import { validEmail } from "../submissions/contract";
import type {
  CheckoutError,
  CheckoutEvent,
  CheckoutState,
  PaidOrder,
} from "./state";

export type {
  CheckoutError,
  CheckoutEvent,
  CheckoutState,
  CheckoutStatus,
  PaidOrder,
  Payment,
} from "./state";

const CODE = /^\d{6}$/;

export function initialCheckout(
  quote: Quote | null,
  currency: Currency,
): CheckoutState {
  return {
    status: "ready",
    quote,
    currency,
    email: "",
    consent: false,
    turnstile: "",
    code: "",
  };
}

/** INR whenever the quote has no USD price (the switch is hidden then). */
export function activeCurrency(s: CheckoutState): Currency {
  return s.quote?.prices.USD == null ? "INR" : s.currency;
}

/** The founding offer is shown only while the quote has places left. */
export function foundingOpen(s: CheckoutState): boolean {
  const founding = s.quote?.founding;
  return !!founding && founding.enabled && founding.remaining > 0;
}

/** The price of the active currency, in the smallest unit. */
export function quotedAmount(s: CheckoutState): number | null {
  if (!s.quote) return null;
  return activeCurrency(s) === "USD" ? s.quote.prices.USD : s.quote.prices.INR;
}

function withoutFounding(quote: Quote | null): Quote | null {
  return quote && { ...quote, founding: { ...quote.founding, remaining: 0 } };
}

function back(s: CheckoutState, error?: CheckoutError): CheckoutState {
  return {
    ...s,
    status: "ready",
    claimId: undefined,
    emailHint: undefined,
    code: "",
    error,
  };
}

function submit(s: CheckoutState): CheckoutState {
  if (s.status === "code") {
    return CODE.test(s.code)
      ? { ...s, status: "verifying", error: undefined }
      : { ...s, error: { code: "code-format" } };
  }
  if (s.status !== "ready" || !s.quote) return s;
  if (!validEmail(s.email)) return { ...s, error: { code: "email" } };
  if (!s.consent) return { ...s, error: { code: "consent" } };
  if (s.order && s.order.currency === activeCurrency(s))
    return { ...s, status: "paying", error: undefined };
  if (!s.turnstile) return { ...s, error: { code: "human" } };
  return { ...s, status: "submitting", error: undefined };
}

function paidOrder(
  s: CheckoutState,
  response: Extract<OrderResponse, { kind: "razorpay" }>,
): CheckoutState {
  const order: PaidOrder = {
    orderId: response.orderId,
    keyId: response.keyId,
    amount: response.amount,
    currency: response.currency,
  };
  const next = { ...s, order, currency: order.currency, error: undefined };
  // The quote changed since the page showed it: show the new receipt first,
  // and open Checkout only when the reader presses Pay.
  if (foundingOpen(s))
    return {
      ...next,
      status: "ready",
      quote: withoutFounding(s.quote),
      error: { code: "founding-full" },
    };
  if (quotedAmount(next) !== order.amount && next.quote) {
    const prices = { ...next.quote.prices, [order.currency]: order.amount };
    return {
      ...next,
      status: "ready",
      quote: { ...next.quote, prices },
      error: { code: "price-changed" },
    };
  }
  return { ...next, status: "paying" };
}

function onOrder(s: CheckoutState, response: OrderResponse): CheckoutState {
  if (s.status !== "submitting") return s;
  const spent = { ...s, turnstile: "" };
  switch (response.kind) {
    case "code-sent":
      return {
        ...spent,
        status: "code",
        claimId: response.claimId,
        emailHint: response.emailHint,
        code: "",
        error: undefined,
      };
    case "razorpay":
      return paidOrder(spent, response);
    case "issued":
      return { ...spent, status: "issued", token: response.token };
  }
  switch (response.code) {
    case "no-data":
      return { ...spent, status: "error", error: { code: "no-data" } };
    case "founding-full":
      return back(
        { ...spent, quote: withoutFounding(s.quote) },
        { code: "founding-full" },
      );
    case "usd-off": {
      const quote = s.quote && {
        ...s.quote,
        prices: { ...s.quote.prices, USD: null },
      };
      return back({ ...spent, quote, order: undefined }, { code: "usd-off" });
    }
    default:
      return back(spent, { code: response.code });
  }
}

function onVerify(s: CheckoutState, response: VerifyResponse): CheckoutState {
  if (s.status !== "verifying") return s;
  if (response.kind === "issued")
    return { ...s, status: "issued", token: response.token };
  switch (response.code) {
    case "wrong-code":
      return response.triesLeft > 0
        ? { ...s, status: "code", code: "", error: response }
        : back(s, { code: "locked" });
    case "founding-full":
      return back(
        { ...s, quote: withoutFounding(s.quote) },
        { code: "founding-full" },
      );
    case "expired":
    case "locked":
      return back(s, { code: response.code });
    case "invalid":
      return { ...s, status: "code", error: { code: "code-format" } };
    case "busy":
      return { ...s, status: "code", error: { code: "busy" } };
  }
}

function onConfirm(s: CheckoutState, response: ConfirmResponse): CheckoutState {
  if (s.status !== "confirming") return s;
  if (response.kind === "issued")
    return { ...s, status: "issued", token: response.token };
  if (response.code === "pending")
    return { ...s, status: "issued-by-email", error: undefined };
  // A busy confirm is retried with the same payment; it issues at most once.
  const error = response.code === "busy" ? "confirm-busy" : "signature";
  return { ...s, status: "error", error: { code: error } };
}

function onFailed(s: CheckoutState, message: string): CheckoutState {
  const error = { code: "message", message } as const;
  switch (s.status) {
    case "submitting":
      // A failed resend keeps the code already sent.
      return s.claimId
        ? { ...s, status: "code", error }
        : { ...s, status: "ready", error };
    case "verifying":
      return { ...s, status: "code", error };
    case "paying":
      return { ...s, status: "ready", error };
    case "confirming":
      // The payment may have gone through: never say nothing was charged.
      return { ...s, status: "error", error: { code: "confirm-busy" } };
    case "ready":
      return s.quote ? { ...s, error } : { ...s, error: { code: "busy" } };
    default:
      return s;
  }
}

export function checkoutReducer(
  s: CheckoutState,
  e: CheckoutEvent,
): CheckoutState {
  switch (e.type) {
    case "quote":
      return { ...s, quote: e.quote, error: s.quote ? s.error : undefined };
    case "currency":
      if (s.status !== "ready") return s;
      return {
        ...s,
        currency: e.currency,
        order: s.order?.currency === e.currency ? s.order : undefined,
        error: undefined,
      };
    case "email":
      // An order belongs to the email it was made for.
      return { ...s, email: e.email, order: undefined, error: undefined };
    case "consent":
      return { ...s, consent: e.consent, error: undefined };
    case "turnstile":
      return { ...s, turnstile: e.token };
    case "code":
      return { ...s, code: e.code.replace(/\D/g, "").slice(0, 6) };
    case "submit":
      return submit(s);
    case "resend":
      if (s.status !== "code") return s;
      if (!s.turnstile) return { ...s, error: { code: "human" } };
      return { ...s, status: "submitting", error: undefined };
    case "change-email":
      return s.status === "code" ? back(s) : s;
    case "order":
      return onOrder(s, e.response);
    case "verify":
      return onVerify(s, e.response);
    case "razorpay-success":
      if (s.status !== "paying") return s;
      return {
        ...s,
        status: "confirming",
        payment: { paymentId: e.paymentId, signature: e.signature },
      };
    case "razorpay-dismissed":
      return s.status === "paying" ? { ...s, status: "ready" } : s;
    case "confirm":
      return onConfirm(s, e.response);
    case "retry":
      return s.status === "error" && s.payment && s.order
        ? { ...s, status: "confirming", error: undefined }
        : s;
    case "failed":
      return onFailed(s, e.message);
  }
}
