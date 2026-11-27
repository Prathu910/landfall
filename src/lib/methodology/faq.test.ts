import { describe, expect, it } from "vitest";
import { methodologyFaq } from "./faq";

describe("methodologyFaq", () => {
  const faq = methodologyFaq("2026-10-31", 493);
  it("dates the pool and counts the occupations from the data", () => {
    const text = faq.map((f) => f.answer).join(" ");
    expect(text).toContain("31 Oct 2026");
    expect(text).toContain("493 occupations");
  });
  it("no longer calls automatic imports a later release or counts founding places", () => {
    const text = faq.map((f) => f.answer).join(" ");
    expect(text).not.toMatch(/later release/);
    expect(text).not.toMatch(/first 100/);
  });
});
