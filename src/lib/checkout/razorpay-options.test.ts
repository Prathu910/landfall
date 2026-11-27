import { describe, expect, it, vi } from "vitest";
import { cssColourToHex, razorpayOptions } from "./razorpay-options";

describe("cssColourToHex", () => {
  it("turns a computed rgb() colour into hex", () => {
    expect(cssColourToHex("rgb(31, 92, 74)")).toBe("#1f5c4a");
    expect(cssColourToHex("rgba(0, 0, 0, 0.5)")).toBe("#000000");
    expect(cssColourToHex("rgb(31 92 74)")).toBe("#1f5c4a");
  });

  it("gives null for anything else", () => {
    expect(cssColourToHex("")).toBeNull();
    expect(cssColourToHex("light-dark(red, blue)")).toBeNull();
  });
});

describe("razorpayOptions", () => {
  it("passes the order, the email and the brand, and reports the outcome", () => {
    const onSuccess = vi.fn();
    const onDismiss = vi.fn();
    const options = razorpayOptions(
      {
        keyId: "rzp_test_key",
        orderId: "order_Abc123",
        amount: 69900,
        currency: "INR",
        email: "aarav@gmail.com",
        onSuccess,
        onDismiss,
      },
      "#1f5c4a",
    );
    expect(options).toMatchObject({
      key: "rzp_test_key",
      order_id: "order_Abc123",
      amount: 69900,
      currency: "INR",
      name: "MigrateLens",
      description: "Personal PR report",
      prefill: { email: "aarav@gmail.com" },
      theme: { color: "#1f5c4a" },
    });
    options.handler({
      razorpay_order_id: "order_Abc123",
      razorpay_payment_id: "pay_Xyz",
      razorpay_signature: "sig",
    });
    expect(onSuccess).toHaveBeenCalledWith("pay_Xyz", "sig");
    options.modal.ondismiss();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("leaves the theme out when the token can't be read", () => {
    const options = razorpayOptions(
      {
        keyId: "k",
        orderId: "order_A",
        amount: 1,
        currency: "INR",
        email: "a@b.co",
        onSuccess: () => {},
        onDismiss: () => {},
      },
      null,
    );
    expect(options.theme).toBeUndefined();
  });
});
