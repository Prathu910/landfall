import { describe, expect, it } from "vitest";
import { AI_READ_PARAGRAPH, LEGAL_PAGES, legalPageText } from "./copy";
import { legalMetadata, privacyPage } from "./meta";

describe("legalMetadata", () => {
  it("gives each page its own canonical path", () => {
    expect(legalMetadata("refunds")).toEqual({
      title: "Refund policy",
      description: LEGAL_PAGES.refunds.description,
      alternates: { canonical: "/refunds/" },
    });
  });
});

describe("privacyPage", () => {
  it("names Anthropic only while the AI-written summary is on", () => {
    expect(privacyPage(false)).toBe(LEGAL_PAGES.privacy);
    expect(legalPageText(privacyPage(false))).not.toContain(AI_READ_PARAGRAPH);
    expect(legalPageText(privacyPage(true))).toContain(AI_READ_PARAGRAPH);
  });
});
