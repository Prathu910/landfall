import type {
  ConfirmResponse,
  Currency,
  OrderResponse,
  Quote,
  VerifyResponse,
} from "../orders/contract";
import { validEmail } from "../submissions/contract";
import { activeCurrency, foundingOpen, quotedAmount } from "./selectors";
import type {
  CheckoutError,
  CheckoutEvent,
  CheckoutState,
  OrderOutcome,
  PaidOrder,
} from "./state";

export type {
  CheckoutError,
  CheckoutEvent,
  CheckoutState,
  CheckoutStatus,
  OrderOutcome,
  PaidOrder,
  Payment,
} from "./state";

export {
  activeCurrency,
  foundingOpen,
  orderRequest,
  quotedAmount,
} from "./selectors";

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

function onOrder(s: CheckoutState, response: OrderOutcome): CheckoutState {
  if (s.status !== "submitting") return s;
  const spent = { ...s, turnstile: "" };
  switch (response.kind) {
    case "wait": {
      const error = { code: "wait", seconds: response.seconds } as const;
      // A resend too soon: the code already sent still works, so keep its
      // step. Without a claim in hand there is no code field to go back to.
      return s.claimId
        ? { ...spent, status: "code", error }
        : back(spent, error);
    }
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
      // An order, a held claim and a choice to buy another belong to their email.
      return {
        ...s,
        email: e.email,
        order: undefined,
        paid: undefined,
        ...(e.email === s.email
          ? {}
          : { claimId: undefined, emailHint: undefined }),
        error: undefined,
      };
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
      // The claim stays held until the email changes: pressing again with
      // the same address inside a minute returns to its code step.
      return s.status === "code"
        ? { ...s, status: "ready", code: "", error: undefined }
        : s;
    case "buy-another":
      // A founding-used email buys at the full price: the paid receipt, then Pay.
      if (s.status !== "ready" || s.error?.code !== "founding-used") return s;
      return submit({ ...s, paid: true, error: undefined });
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
