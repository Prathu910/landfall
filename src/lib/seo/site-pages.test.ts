import { describe, expect, it } from "vitest";
import { GUIDE_PAGES } from "../guide/meta";
import { LEGAL_PAGES, LEGAL_SLUGS } from "../legal/copy";
import { BANNED_COPY } from "../report/copy";
import {
  CHECK_PAGE,
  FEEDBACK_PAGE,
  HOME_PAGE,
  METHODOLOGY_PAGE,
  NOT_FOUND_PAGE,
  occupationsPage,
  samplePage,
  statesPage,
} from "./site-pages";

const BRAND = " · MigrateLens";
const pages = [
  HOME_PAGE,
  CHECK_PAGE,
  FEEDBACK_PAGE,
  METHODOLOGY_PAGE,
  samplePage("Oct 2026"),
  statesPage("2026–27"),
  occupationsPage(479, "31 Oct 2026"),
];
const descriptions = [
  ...pages.map((p) => p.description),
  NOT_FOUND_PAGE.description,
  ...LEGAL_SLUGS.map((slug) => LEGAL_PAGES[slug].description),
  ...Object.values(GUIDE_PAGES).map((p) => p.description),
];

describe("the site's page metadata", () => {
  it("gives every page a 120–160 character description", () => {
    const bad = descriptions.filter((d) => d.length < 120 || d.length > 160);
    expect(bad).toEqual([]);
  });
  it("never repeats a description", () => {
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
  it("keeps every title within 60 characters with the brand", () => {
    for (const page of pages) {
      const full = page.absolute ? page.title : page.title + BRAND;
      expect(full.length).toBeLessThanOrEqual(60);
      expect(full).toContain("MigrateLens");
    }
  });
  it("keeps the guide titles within 60 characters with the brand", () => {
    for (const page of Object.values(GUIDE_PAGES)) {
      expect((page.title + BRAND).length).toBeLessThanOrEqual(60);
    }
  });
  it("never calls the report free and states no price", () => {
    for (const text of descriptions) {
      expect(text).not.toMatch(/free,? (personal |full )?report/i);
      expect(text).not.toMatch(/[₹$]\s?\d|\bINR\b|\bAUD\b|\bUSD\b/);
      expect(text).not.toMatch(BANNED_COPY);
    }
  });
});
