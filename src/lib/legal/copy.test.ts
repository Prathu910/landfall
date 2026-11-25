import { describe, expect, it } from "vitest";
import { SELLER } from "../orders/seller";
import { BANNED_COPY } from "../report/copy";
import {
  LEGAL_PAGES,
  LEGAL_REVIEWED,
  LEGAL_SLUGS,
  legalNotices,
  legalPageText,
  NOT_ADVICE,
  REVIEW_LINE,
  SELLER_LINE,
} from "./copy";

describe("the legal pages' copy", () => {
  it("gives every page a title, an intro and sections with text", () => {
    for (const slug of LEGAL_SLUGS) {
      const page = LEGAL_PAGES[slug];
      expect(page.title.trim(), slug).not.toBe("");
      expect(page.intro.trim(), slug).not.toBe("");
      expect(page.sections.length, slug).toBeGreaterThan(0);
      for (const section of page.sections) {
        expect(section.heading.trim(), `${slug} heading`).not.toBe("");
        expect(section.paragraphs.length, section.heading).toBeGreaterThan(0);
        for (const text of legalPageText({ ...page, sections: [section] })) {
          expect(text.trim(), section.heading).not.toBe("");
        }
      }
    }
  });

  it("names the seller, the city and the email on every page", () => {
    expect(SELLER_LINE).toBe(
      "MigrateLens, Ahmedabad, India · hello@migratelens.com",
    );
    for (const slug of LEGAL_SLUGS) {
      const text = legalPageText(LEGAL_PAGES[slug]).join("\n");
      expect(text, slug).toContain(SELLER.name);
      expect(text, slug).toContain(SELLER.city);
      expect(text, slug).toContain(SELLER.email);
      expect(text, slug).toContain(NOT_ADVICE);
    }
  });

  it("promises a 7-day refund with no questions asked", () => {
    const refunds = legalPageText(LEGAL_PAGES.refunds).join("\n");
    expect(refunds).toContain("7 days");
    expect(refunds).toContain("no questions");
  });

  it("covers the terms the spec lists", () => {
    const terms = legalPageText(LEGAL_PAGES.terms).join("\n");
    for (const fact of [
      "not migration advice",
      "Founding 100",
      "one per email",
      "7 days",
      "3 revisions",
      "12 months",
      "laws of India",
      "Ahmedabad",
    ]) {
      expect(terms).toContain(fact);
    }
  });

  it("names every processor on the privacy page", () => {
    const privacy = legalPageText(LEGAL_PAGES.privacy).join("\n");
    for (const processor of ["Supabase", "Razorpay", "Cloudflare", "Resend"]) {
      expect(privacy).toContain(processor);
    }
    expect(privacy).toContain("12 months");
  });

  it("uses none of the banned report wording", () => {
    for (const slug of LEGAL_SLUGS) {
      for (const text of legalPageText(LEGAL_PAGES[slug])) {
        expect(text, slug).not.toMatch(BANNED_COPY);
      }
    }
  });
});

describe("legalNotices", () => {
  it("shows the review line until the founder's lawyer review", () => {
    expect(LEGAL_REVIEWED).toBe(false);
    expect(legalNotices(false)).toEqual([
      "Last updated 25 Nov 2026",
      REVIEW_LINE,
    ]);
    expect(REVIEW_LINE).toBe(
      "Drafted for review: check with your lawyer before relying on this.",
    );
  });

  it("drops the review line once the pages are reviewed", () => {
    expect(legalNotices(true)).toEqual(["Last updated 25 Nov 2026"]);
  });
});
