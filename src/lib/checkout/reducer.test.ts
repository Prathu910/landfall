import { describe, expect, it } from "vitest";
import type { Quote } from "../orders/contract";
import { receiptView } from "./receipt-view";
import {
  activeCurrency,
  checkoutReducer,
  foundingOpen,
  initialCheckout,
  orderRequest,
  type CheckoutEvent,
  type CheckoutState,
} from "./reducer";

const FOUNDING: Quote = {
  prices: { INR: 69900, USD: 1400 },
  founding: { enabled: true, remaining: 63, limit: 100 },
};
const PAID: Quote = {
  prices: { INR: 69900, USD: null },
  founding: { enabled: true, remaining: 0, limit: 100 },
};
const ORDER = {
  kind: "razorpay",
  orderId: "order_Abc123",
  keyId: "rzp_test_key",
  amount: 69900,
  currency: "INR",
} as const;
const TOKEN = "a".repeat(43);

function run(state: CheckoutState, ...events: CheckoutEvent[]) {
  return events.reduce(checkoutReducer, state);
}

/** A reader who has filled the receipt in and passed the spam check. */
function filled(quote: Quote, currency: "INR" | "USD" = "INR") {
  return run(
    initialCheckout(quote, currency),
    { type: "email", email: "aarav@gmail.com" },
    { type: "consent", consent: true },
    { type: "turnstile", token: "turnstile-ok" },
  );
}

describe("checkoutReducer", () => {
  it("founding: submit → code → verify → issued", () => {
    let s = run(filled(FOUNDING), { type: "submit" });
    expect(s.status).toBe("submitting");
    s = run(s, {
      type: "order",
      response: {
        kind: "code-sent",
        claimId: "1b4e28ba-2fa1-11d2-883f-0016d3cca427",
        emailHint: "a•••@gmail.com",
      },
    });
    expect(s).toMatchObject({
      status: "code",
      claimId: "1b4e28ba-2fa1-11d2-883f-0016d3cca427",
      emailHint: "a•••@gmail.com",
      // A spam-check token is single use.
      turnstile: "",
    });
    s = run(s, { type: "code", code: "123456" }, { type: "submit" });
    expect(s.status).toBe("verifying");
    s = run(s, { type: "verify", response: { kind: "issued", token: TOKEN } });
    expect(s).toMatchObject({ status: "issued", token: TOKEN });
  });

  it("paid: submit → paying → success → confirming → issued", () => {
    let s = run(filled(PAID), { type: "submit" });
    expect(s.status).toBe("submitting");
    s = run(s, { type: "order", response: ORDER });
    expect(s).toMatchObject({
      status: "paying",
      order: { orderId: "order_Abc123", amount: 69900 },
    });
    s = run(s, {
      type: "razorpay-success",
      paymentId: "pay_Xyz",
      signature: "f".repeat(64),
    });
    expect(s).toMatchObject({
      status: "confirming",
      payment: { paymentId: "pay_Xyz", signature: "f".repeat(64) },
    });
    s = run(s, { type: "confirm", response: { kind: "issued", token: TOKEN } });
    expect(s).toMatchObject({ status: "issued", token: TOKEN });
  });

  it("founding-used: buy another re-submits with paid, shows the paid receipt and goes to Pay", () => {
    const reader = {
      occupationName: "Software Engineer",
      points: 85,
      onshore: false,
    };
    let s = run(
      filled(FOUNDING),
      { type: "submit" },
      { type: "order", response: { kind: "error", code: "founding-used" } },
    );
    expect(s).toMatchObject({
      status: "ready",
      error: { code: "founding-used" },
    });
    expect(foundingOpen(s)).toBe(true);
    expect(orderRequest(filled(FOUNDING), {}, "2026-11-25")).not.toHaveProperty(
      "paid",
    );
    // The spam-check token was spent on the founding request.
    s = run(
      s,
      { type: "turnstile", token: "turnstile-2" },
      { type: "buy-another" },
    );
    expect(s).toMatchObject({ status: "submitting", paid: true });
    expect(s.error).toBeUndefined();
    expect(foundingOpen(s)).toBe(false);
    const view = receiptView(s, reader);
    expect(view).toMatchObject({
      kind: "quoted",
      discount: null,
      total: "₹699",
      seats: null,
      ticket: { stub: "ADMIT ONE", title: "Pay ₹699 securely →" },
    });
    expect(orderRequest(s, { occupation: "261313" }, "2026-11-25")).toEqual({
      profile: { occupation: "261313" },
      email: "aarav@gmail.com",
      currency: "INR",
      consent: true,
      asOf: "2026-11-25",
      turnstile_token: "turnstile-2",
      paid: true,
    });
    // The Razorpay order opens Checkout at once: no founding-full detour.
    s = run(s, { type: "order", response: ORDER });
    expect(s).toMatchObject({
      status: "paying",
      paid: true,
      order: { orderId: "order_Abc123", amount: 69900 },
    });
    expect(s.error).toBeUndefined();
  });

  it("buy another waits for a fresh spam check, and only follows founding-used", () => {
    const used = run(
      filled(FOUNDING),
      { type: "submit" },
      { type: "order", response: { kind: "error", code: "founding-used" } },
    );
    let s = run(used, { type: "buy-another" });
    expect(s).toMatchObject({
      status: "ready",
      paid: true,
      error: { code: "human" },
    });
    s = run(s, { type: "turnstile", token: "turnstile-2" }, { type: "submit" });
    expect(s).toMatchObject({ status: "submitting", paid: true });
    // Another email may still have its founding place.
    s = run(
      used,
      { type: "buy-another" },
      { type: "email", email: "other@gmail.com" },
    );
    expect(s.paid).toBeUndefined();
    expect(foundingOpen(s)).toBe(true);
    const ready = filled(FOUNDING);
    expect(run(ready, { type: "buy-another" })).toBe(ready);
  });

  it("dismissed returns to ready and keeps the order for a retry", () => {
    let s = run(
      filled(PAID),
      { type: "submit" },
      { type: "order", response: ORDER },
      { type: "razorpay-dismissed" },
    );
    expect(s.status).toBe("ready");
    expect(s.order?.orderId).toBe("order_Abc123");
    // Pressing Pay again reopens Checkout on the same order: no new order,
    // so no spam check is needed either.
    s = run(s, { type: "submit" });
    expect(s).toMatchObject({
      status: "paying",
      order: { orderId: "order_Abc123" },
    });
  });

  it("a new email or currency drops the held order", () => {
    const held = run(
      filled(FOUNDING, "INR"),
      { type: "quote", quote: { ...PAID, prices: { INR: 69900, USD: 1400 } } },
      { type: "submit" },
      { type: "order", response: ORDER },
      { type: "razorpay-dismissed" },
    );
    expect(held.order).toBeDefined();
    expect(
      run(held, { type: "email", email: "other@gmail.com" }).order,
    ).toBeUndefined();
    expect(run(held, { type: "currency", currency: "USD" }).order).toBe(
      undefined,
    );
  });

  it("founding-full mid-claim switches to the paid quote, keeping email and consent", () => {
    const claiming = run(
      filled(FOUNDING),
      { type: "submit" },
      {
        type: "order",
        response: {
          kind: "code-sent",
          claimId: "1b4e28ba-2fa1-11d2-883f-0016d3cca427",
          emailHint: "a•••@gmail.com",
        },
      },
      { type: "code", code: "123456" },
      { type: "submit" },
    );
    const s = run(claiming, {
      type: "verify",
      response: { kind: "error", code: "founding-full" },
    });
    expect(s).toMatchObject({
      status: "ready",
      email: "aarav@gmail.com",
      consent: true,
      error: { code: "founding-full" },
    });
    expect(foundingOpen(s)).toBe(false);
    expect(s.claimId).toBeUndefined();
  });

  it("founding-full from the order endpoint also shows the paid receipt", () => {
    const s = run(
      filled(FOUNDING),
      { type: "submit" },
      { type: "order", response: { kind: "error", code: "founding-full" } },
    );
    expect(s).toMatchObject({
      status: "ready",
      error: { code: "founding-full" },
    });
    expect(foundingOpen(s)).toBe(false);
  });

  it("a paid order on a founding receipt waits for the press, with a note", () => {
    const s = run(
      filled(FOUNDING),
      { type: "submit" },
      { type: "order", response: ORDER },
    );
    expect(s).toMatchObject({
      status: "ready",
      order: { orderId: "order_Abc123" },
      error: { code: "founding-full" },
    });
    expect(foundingOpen(s)).toBe(false);
    expect(run(s, { type: "submit" }).status).toBe("paying");
  });

  it("a paid order at another price updates the receipt before paying", () => {
    const s = run(
      filled(PAID),
      { type: "submit" },
      { type: "order", response: { ...ORDER, amount: 79900 } },
    );
    expect(s).toMatchObject({
      status: "ready",
      error: { code: "price-changed" },
    });
    expect(s.quote?.prices.INR).toBe(79900);
  });

  it("confirm pending → issued-by-email", () => {
    const s = run(
      filled(PAID),
      { type: "submit" },
      { type: "order", response: ORDER },
      {
        type: "razorpay-success",
        paymentId: "pay_Xyz",
        signature: "f".repeat(64),
      },
      { type: "confirm", response: { kind: "error", code: "pending" } },
    );
    expect(s.status).toBe("issued-by-email");
  });

  it("a busy confirm can be retried with the same payment", () => {
    const failed = run(
      filled(PAID),
      { type: "submit" },
      { type: "order", response: ORDER },
      {
        type: "razorpay-success",
        paymentId: "pay_Xyz",
        signature: "f".repeat(64),
      },
      { type: "confirm", response: { kind: "error", code: "busy" } },
    );
    expect(failed).toMatchObject({
      status: "error",
      error: { code: "confirm-busy" },
    });
    expect(run(failed, { type: "retry" })).toMatchObject({
      status: "confirming",
      payment: { paymentId: "pay_Xyz" },
    });
  });

  it("submit without consent is refused locally", () => {
    const s = run(
      initialCheckout(FOUNDING, "INR"),
      { type: "email", email: "aarav@gmail.com" },
      { type: "turnstile", token: "turnstile-ok" },
      { type: "submit" },
    );
    expect(s).toMatchObject({ status: "ready", error: { code: "consent" } });
  });

  it("submit needs a valid email and the spam check", () => {
    const noEmail = run(
      initialCheckout(FOUNDING, "INR"),
      { type: "consent", consent: true },
      { type: "submit" },
    );
    expect(noEmail.error).toEqual({ code: "email" });
    const noCheck = run(
      initialCheckout(FOUNDING, "INR"),
      { type: "email", email: "aarav@gmail.com" },
      { type: "consent", consent: true },
      { type: "submit" },
    );
    expect(noCheck).toMatchObject({
      status: "ready",
      error: { code: "human" },
    });
  });

  it("wrong code keeps the code step with tries left", () => {
    const s = run(
      filled(FOUNDING),
      { type: "submit" },
      {
        type: "order",
        response: {
          kind: "code-sent",
          claimId: "1b4e28ba-2fa1-11d2-883f-0016d3cca427",
          emailHint: "a•••@gmail.com",
        },
      },
      { type: "code", code: "000000" },
      { type: "submit" },
      {
        type: "verify",
        response: { kind: "error", code: "wrong-code", triesLeft: 3 },
      },
    );
    expect(s).toMatchObject({
      status: "code",
      claimId: "1b4e28ba-2fa1-11d2-883f-0016d3cca427",
      error: { code: "wrong-code", triesLeft: 3 },
      code: "",
    });
  });

  it("a code that isn't 6 digits is refused locally", () => {
    const s = run(
      filled(FOUNDING),
      { type: "submit" },
      {
        type: "order",
        response: {
          kind: "code-sent",
          claimId: "1b4e28ba-2fa1-11d2-883f-0016d3cca427",
          emailHint: "a•••@gmail.com",
        },
      },
      { type: "code", code: "12a4" },
      { type: "submit" },
    );
    expect(s).toMatchObject({ status: "code", error: { code: "code-format" } });
  });

  it("a network failure goes back a step with its message", () => {
    const s = run(
      filled(PAID),
      { type: "submit" },
      {
        type: "failed",
        message: "Check your connection and try again.",
      },
    );
    expect(s).toMatchObject({
      status: "ready",
      error: {
        code: "message",
        message: "Check your connection and try again.",
      },
    });
  });

  it("no-data ends the checkout", () => {
    const s = run(
      filled(PAID),
      { type: "submit" },
      { type: "order", response: { kind: "error", code: "no-data" } },
    );
    expect(s).toMatchObject({ status: "error", error: { code: "no-data" } });
  });

  it("stale responses are ignored", () => {
    const ready = filled(PAID);
    expect(run(ready, { type: "order", response: ORDER })).toBe(ready);
    expect(
      run(ready, {
        type: "confirm",
        response: { kind: "issued", token: TOKEN },
      }),
    ).toBe(ready);
  });

  it("uses INR whenever the quote has no USD price", () => {
    const usd = initialCheckout(PAID, "USD");
    expect(activeCurrency(usd)).toBe("INR");
    const off = run(
      filled({ ...PAID, prices: { INR: 69900, USD: 1400 } }, "USD"),
      { type: "submit" },
      { type: "order", response: { kind: "error", code: "usd-off" } },
    );
    expect(off.error).toEqual({ code: "usd-off" });
    expect(activeCurrency(off)).toBe("INR");
  });

  it("a missing quote can't be submitted", () => {
    const s = run(
      initialCheckout(null, "INR"),
      { type: "email", email: "aarav@gmail.com" },
      { type: "consent", consent: true },
      { type: "turnstile", token: "turnstile-ok" },
      { type: "submit" },
    );
    expect(s.status).toBe("ready");
  });
});
