import { describe, expect, it } from "vitest";
import { defaultCurrency, formatPrice } from "./currency";

describe("defaultCurrency", () => {
  it("is INR in India and USD elsewhere", () => {
    expect(defaultCurrency("Asia/Kolkata", true)).toBe("INR");
    expect(defaultCurrency("Asia/Calcutta", true)).toBe("INR");
    expect(defaultCurrency("Europe/London", true)).toBe("USD");
  });

  it("is USD when the time zone is unknown", () => {
    expect(defaultCurrency(undefined, true)).toBe("USD");
  });

  it("is INR whenever USD is unavailable", () => {
    expect(defaultCurrency("Europe/London", false)).toBe("INR");
    expect(defaultCurrency(undefined, false)).toBe("INR");
  });
});

describe("formatPrice", () => {
  it("shows whole amounts without decimals", () => {
    expect(formatPrice(69900, "INR")).toBe("₹699");
    expect(formatPrice(1400, "USD")).toBe("$14");
  });

  it("keeps the minor units when there are some", () => {
    expect(formatPrice(1450, "USD")).toBe("$14.50");
    expect(formatPrice(123456, "INR")).toBe("₹1,234.56");
  });
});
