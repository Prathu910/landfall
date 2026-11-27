import { describe, expect, it } from "vitest";
import {
  emailHint,
  validateConfirm,
  validateOrderRequest,
  validateRevise,
  validateVerify,
  validToken,
} from "./contract";

const order = {
  profile: { occupation: "261313", name: "Aarav" },
  email: " Aarav@GMAIL.com ",
  currency: "INR",
  consent: true,
  asOf: "2026-11-25",
  turnstile_token: "turnstile-ok",
};
const token = "A".repeat(42) + "_";

describe("validateOrderRequest", () => {
  it("keeps the known fields and normalises the email", () => {
    expect(validateOrderRequest(order)).toEqual({
      ...order,
      email: "Aarav@gmail.com",
    });
  });
  it("drops unknown keys, so an amount never passes through", () => {
    const valid = validateOrderRequest({ ...order, amount: 100, price: 1 });
    expect(valid).not.toBeNull();
    expect(valid).not.toHaveProperty("amount");
    expect(valid).not.toHaveProperty("price");
  });
  it("keeps an optional paid flag only when it is exactly true", () => {
    expect(validateOrderRequest({ ...order, paid: true })).toEqual({
      ...order,
      email: "Aarav@gmail.com",
      paid: true,
    });
    expect(validateOrderRequest(order)).not.toHaveProperty("paid");
    expect(validateOrderRequest({ ...order, paid: false })).toBeNull();
    expect(validateOrderRequest({ ...order, paid: "true" })).toBeNull();
  });
  it("needs consent to be exactly true", () => {
    const withoutConsent: Record<string, unknown> = { ...order };
    delete withoutConsent.consent;
    expect(validateOrderRequest(withoutConsent)).toBeNull();
    expect(validateOrderRequest({ ...order, consent: "true" })).toBeNull();
  });
  it("refuses a bad currency", () => {
    expect(validateOrderRequest({ ...order, currency: "AUD" })).toBeNull();
    expect(validateOrderRequest({ ...order, currency: "inr" })).toBeNull();
  });
  it("refuses an email that fails validEmail", () => {
    expect(validateOrderRequest({ ...order, email: "aarav@" })).toBeNull();
    expect(validateOrderRequest({ ...order, email: 7 })).toBeNull();
  });
  it("needs a calendar date, a spam-check token and a profile object", () => {
    expect(validateOrderRequest({ ...order, asOf: "2026-02-30" })).toBeNull();
    expect(validateOrderRequest({ ...order, asOf: "25/11/2026" })).toBeNull();
    expect(validateOrderRequest({ ...order, turnstile_token: "" })).toBeNull();
    expect(
      validateOrderRequest({ ...order, turnstile_token: "x".repeat(2049) }),
    ).toBeNull();
    expect(validateOrderRequest({ ...order, profile: null })).toBeNull();
    expect(validateOrderRequest({ ...order, profile: [] })).toBeNull();
    expect(validateOrderRequest(null)).toBeNull();
  });
});

describe("validateVerify", () => {
  const claimId = "c5fa65d5-f388-4a7b-940c-1b5b78c751bd";
  it("accepts a claim id and a 6-digit code", () => {
    expect(validateVerify({ claimId, code: "012345", extra: 1 })).toEqual({
      claimId,
      code: "012345",
    });
  });
  it("lowercases the claim id", () => {
    expect(
      validateVerify({ claimId: claimId.toUpperCase(), code: "123456" }),
    ).toEqual({ claimId, code: "123456" });
  });
  it("refuses a 7-digit, 5-digit or non-digit code", () => {
    expect(validateVerify({ claimId, code: "1234567" })).toBeNull();
    expect(validateVerify({ claimId, code: "12345" })).toBeNull();
    expect(validateVerify({ claimId, code: "12345a" })).toBeNull();
    expect(validateVerify({ claimId, code: 123456 })).toBeNull();
  });
  it("refuses a claim id that isn't a UUID", () => {
    expect(validateVerify({ claimId: "claim-1", code: "123456" })).toBeNull();
  });
});

describe("validateConfirm", () => {
  const confirm = {
    orderId: "order_TEST1",
    paymentId: "pay_TEST1",
    signature: "a".repeat(64),
  };
  it("accepts Razorpay ids and a hex signature", () => {
    expect(validateConfirm({ ...confirm, amount: 1 })).toEqual(confirm);
  });
  it("refuses wrong prefixes and signatures", () => {
    expect(validateConfirm({ ...confirm, orderId: "pay_TEST1" })).toBeNull();
    expect(validateConfirm({ ...confirm, paymentId: "order_X" })).toBeNull();
    expect(
      validateConfirm({ ...confirm, signature: "a".repeat(63) }),
    ).toBeNull();
    expect(
      validateConfirm({ ...confirm, signature: "g".repeat(64) }),
    ).toBeNull();
  });
});

describe("validateRevise and validToken", () => {
  it("accepts a 43-character base64url token and a profile", () => {
    const profile = { occupation: "261313" };
    expect(validateRevise({ token, profile, x: 1 })).toEqual({
      token,
      profile,
    });
    expect(validToken(token)).toBe(true);
  });
  it("refuses a token that isn't 43 base64url characters", () => {
    const profile = {};
    expect(validateRevise({ token: token.slice(1), profile })).toBeNull();
    expect(validateRevise({ token: token + "A", profile })).toBeNull();
    expect(validateRevise({ token: "+".repeat(43), profile })).toBeNull();
    expect(validateRevise({ token: "=".repeat(43), profile })).toBeNull();
    expect(validateRevise({ token, profile: "x" })).toBeNull();
    expect(validToken(42)).toBe(false);
  });
});

describe("emailHint", () => {
  it("shows the first character and the domain", () => {
    expect(emailHint("aarav@gmail.com")).toBe("a•••@gmail.com");
    expect(emailHint("Z@Example.COM")).toBe("Z•••@example.com");
  });
  it("hides an address without an @ entirely", () => {
    expect(emailHint("aarav")).toBe("•••");
  });
});
