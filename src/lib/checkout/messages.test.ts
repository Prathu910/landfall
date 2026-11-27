import { describe, expect, it } from "vitest";
import type { Quote } from "../orders/contract";
import { BANNED_COPY } from "../report/copy";
import { buyAnotherLabel, checkoutMessage, waitText } from "./messages";
import { initialCheckout, type CheckoutError } from "./reducer";

const QUOTE: Quote = {
  prices: { INR: 69900, USD: 1400 },
  founding: { enabled: true, remaining: 0, limit: 100 },
};

function say(error: CheckoutError, currency: "INR" | "USD" = "INR") {
  return checkoutMessage({ ...initialCheckout(QUOTE, currency), error });
}

describe("checkoutMessage", () => {
  it("words the brief's errors with the quoted price", () => {
    expect(say({ code: "founding-full" })).toBe(
      "The last founding place has just gone. Your report is ₹699.",
    );
    expect(say({ code: "founding-used" }, "USD")).toBe(
      "This email already has a founding report. Check your inbox, or buy another for $14.",
    );
    expect(say({ code: "busy" })).toBe(
      "Something went wrong on our side. Try again in a minute; you haven't been charged.",
    );
  });

  it("labels the founding-used action with the quoted price", () => {
    expect(buyAnotherLabel(initialCheckout(QUOTE, "INR"))).toBe(
      "Buy another for ₹699",
    );
    expect(buyAnotherLabel(initialCheckout(QUOTE, "USD"))).toBe(
      "Buy another for $14",
    );
  });

  it("counts the tries left", () => {
    expect(say({ code: "wrong-code", triesLeft: 1 })).toBe(
      "That code isn't right. 1 try left.",
    );
    expect(say({ code: "wrong-code", triesLeft: 3 })).toBe(
      "That code isn't right. 3 tries left.",
    );
  });

  it("words a founding wait honestly, rounded up to whole minutes", () => {
    expect(waitText(1)).toBe("1 second");
    expect(waitText(59)).toBe("59 seconds");
    expect(waitText(60)).toBe("1 minute");
    expect(waitText(61)).toBe("2 minutes");
    expect(waitText(600)).toBe("10 minutes");
    const text = say({ code: "wait", seconds: 120 });
    expect(text).toBe("You can ask for a new code in 2 minutes.");
    expect(text).not.toMatch(/our side|went wrong|charged/);
  });

  it("never says nothing was charged once a payment was made", () => {
    expect(say({ code: "confirm-busy" })).not.toMatch(/charged/);
    expect(say({ code: "signature" })).toContain("hello@migratelens.com");
  });

  it("passes a transport message through, and has nothing for no error", () => {
    expect(say({ code: "message", message: "Check your connection." })).toBe(
      "Check your connection.",
    );
    expect(checkoutMessage(initialCheckout(QUOTE, "INR"))).toBeNull();
  });

  it("keeps to the copy rules", () => {
    const codes: CheckoutError[] = [
      { code: "consent" },
      { code: "email" },
      { code: "human" },
      { code: "code-format" },
      { code: "founding-full" },
      { code: "founding-used" },
      { code: "price-changed" },
      { code: "usd-off" },
      { code: "busy" },
      { code: "invalid" },
      { code: "verification" },
      { code: "expired" },
      { code: "locked" },
      { code: "signature" },
      { code: "confirm-busy" },
      { code: "no-data" },
      { code: "wrong-code", triesLeft: 2 },
      { code: "wait", seconds: 45 },
    ];
    for (const error of codes) {
      const text = say(error);
      expect(text, error.code).toBeTruthy();
      expect(text, error.code).not.toMatch(BANNED_COPY);
    }
  });
});
