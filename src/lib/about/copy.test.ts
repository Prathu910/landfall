import { describe, expect, it } from "vitest";
import { BANNED_COPY } from "../report/copy";
import { ABOUT_SECTIONS, aboutText } from "./copy";

describe("the About page copy", () => {
  it("has the editorial, independence, corrections and not-advice anchors, once each", () => {
    const ids = ABOUT_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of [
      "who",
      "independence",
      "editorial",
      "updates",
      "corrections",
      "not-advice",
    ]) {
      expect(ids).toContain(id);
    }
  });
  it("follows the copy rules: no banned words, prices, percentages or names", () => {
    for (const text of aboutText()) {
      expect(text).not.toMatch(BANNED_COPY);
      expect(text).not.toMatch(/[₹$]\s?\d|\bINR\b|\bAUD\b|\bUSD\b|%/);
      expect(text).not.toMatch(/y-axis/i);
    }
  });
  it("gives the corrections address and says the site is not a migration agent", () => {
    const all = aboutText().join(" ");
    expect(all).toContain("hello@migratelens.com");
    expect(all).toContain("not a registered migration agent");
    expect(all).toContain("not individuals");
    expect(all).toContain("0 to 19");
  });
});
