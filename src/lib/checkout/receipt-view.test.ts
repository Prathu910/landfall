import { describe, expect, it } from "vitest";
import type { Quote } from "../orders/contract";
import { BANNED_COPY } from "../report/copy";
import { initialCheckout } from "./reducer";
import { receiptView } from "./receipt-view";

const FOUNDING: Quote = {
  prices: { INR: 69900, USD: 1400 },
  founding: { enabled: true, remaining: 63, limit: 100 },
};
const PAID: Quote = {
  prices: { INR: 69900, USD: null },
  founding: { enabled: false, remaining: 63, limit: 100 },
};
const READER = {
  occupationName: "Software Engineer",
  points: 75,
  onshore: false,
};

describe("receiptView", () => {
  it("shows skeleton rows until the quote arrives", () => {
    const view = receiptView(initialCheckout(null, "INR"), READER);
    expect(view.kind).toBe("pending");
  });

  it("founding: the claim ticket, the discount and the seats", () => {
    const view = receiptView(initialCheckout(FOUNDING, "INR"), READER);
    if (view.kind !== "quoted") throw new Error("expected a quote");
    expect(view.item).toEqual({
      title: "Personal PR report",
      detail: "Software Engineer · 75 points · offshore",
      price: "₹699",
    });
    expect(view.discount).toEqual({
      title: "Founding 100",
      detail: "You're one of the first 100",
      amount: "−₹699",
    });
    expect(view.total).toBe("₹0");
    expect(view.seats).toEqual({
      text: "63 of 100 left",
      remaining: 63,
      limit: 100,
      taken: 0.37,
    });
    expect(view.ticket).toEqual({
      stub: "FOUNDING",
      title: "Claim my free report →",
      sub: "63 of 100 founding places left · issued in seconds",
    });
    expect(view.trust).toEqual([
      "7-day no-questions refund",
      "Ready on screen in seconds, PDF by email",
      "Questions? hello@migratelens.com",
    ]);
    expect(view.usdSwitch).toBe(true);
  });

  it("paid: the pay ticket, the price as total and the Razorpay line", () => {
    const view = receiptView(initialCheckout(PAID, "USD"), {
      ...READER,
      onshore: true,
    });
    if (view.kind !== "quoted") throw new Error("expected a quote");
    expect(view.item.detail).toBe("Software Engineer · 75 points · onshore");
    expect(view.discount).toBeNull();
    expect(view.seats).toBeNull();
    // USD is off in this quote, so the switch hides and INR is charged.
    expect(view.usdSwitch).toBe(false);
    expect(view.total).toBe("₹699");
    expect(view.ticket).toEqual({
      stub: "ADMIT ONE",
      title: "Pay ₹699 securely →",
      sub: "UPI, cards, netbanking · issued in seconds",
    });
    expect(view.trust[0]).toBe("Secure payment by Razorpay");
  });

  it("keeps to the copy rules", () => {
    for (const quote of [FOUNDING, PAID]) {
      const view = receiptView(initialCheckout(quote, "INR"), READER);
      if (view.kind !== "quoted") throw new Error("expected a quote");
      const text = [
        view.item.title,
        view.item.detail,
        view.discount?.detail ?? "",
        view.ticket.title,
        view.ticket.sub,
        ...view.trust,
      ].join(" ");
      expect(text).not.toMatch(BANNED_COPY);
    }
  });
});
