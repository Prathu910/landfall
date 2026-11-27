import { describe, expect, it } from "vitest";
import type { Quote } from "../orders/contract";
import { passTicket } from "./pass-ticket";

const QUOTE: Quote = {
  prices: { INR: 69900, USD: 1400 },
  founding: { enabled: true, remaining: 63, limit: 100 },
};

describe("passTicket", () => {
  it("shows the founding offer with the real count and the price after it", () => {
    expect(passTicket(QUOTE, "INR")).toEqual({
      stub: "FOUNDING 100",
      meta: { kind: "founding", was: "₹699", remaining: 63, limit: 100 },
      metaText: "Free, was ₹699, 63 of 100 left",
    });
  });

  it("shows the price once the places are gone or the offer is off", () => {
    const paid = {
      stub: "PR REPORT",
      meta: { kind: "paid", price: "$14" },
      metaText: "$14 one-off · 7-day no-questions refund",
    };
    const gone = { ...QUOTE, founding: { ...QUOTE.founding, remaining: 0 } };
    const off = { ...QUOTE, founding: { ...QUOTE.founding, enabled: false } };
    expect(passTicket(gone, "USD")).toEqual(paid);
    expect(passTicket(off, "USD")).toEqual(paid);
  });

  it("falls back to INR when USD has no price", () => {
    const inrOnly = {
      prices: { INR: 69900, USD: null },
      founding: { enabled: false, remaining: 0, limit: 100 },
    };
    expect(passTicket(inrOnly, "USD").metaText).toBe(
      "₹699 one-off · 7-day no-questions refund",
    );
  });

  it("claims nothing before the quote arrives", () => {
    expect(passTicket(null, "INR")).toEqual({
      stub: "PR REPORT",
      meta: { kind: "pending" },
      metaText: "",
    });
  });
});
