import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import { FEES } from "../../data/guide/fees";
import { GUIDE_CHECKED_AT } from "../../data/guide/sources";
import { GUIDE_STEPS } from "../../data/guide/steps";
import { federalCounts, hubFaq, visaFaq } from "./faq";
import { GUIDE_PAGES, directAnswer, guideJsonLd } from "./meta";

const counts = federalCounts(stateRuleData.federal);
const types = (ld: object[]) =>
  ld.map((o) => (o as { "@type": string })["@type"]);

describe("guide pages", () => {
  it("gives every page a unique title, description and trailing-slash path", () => {
    const pages = Object.values(GUIDE_PAGES);
    expect(new Set(pages.map((p) => p.title)).size).toBe(4);
    expect(new Set(pages.map((p) => p.description)).size).toBe(4);
    for (const page of pages) {
      expect(page.path).toMatch(/^\/guide\/(\d{3}\/)?$/);
      expect(page.description.length).toBeLessThanOrEqual(160);
    }
  });

  it("opens with a dated, sourced answer of two or three sentences", () => {
    for (const id of ["hub", "189", "190", "491"] as const) {
      const answer = directAnswer(id, GUIDE_CHECKED_AT, counts);
      expect(answer).toContain("23 Nov 2026");
      expect(answer).toContain("Source: Home Affairs");
      const sentences = answer.split(/(?<=\.)\s+(?=[A-Z])/);
      expect(sentences.length, answer).toBeGreaterThanOrEqual(2);
      expect(sentences.length, answer).toBeLessThanOrEqual(3);
    }
  });

  it("counts each visa's occupations from the Home Affairs list", () => {
    expect(counts).toEqual({ "189": 212, "190": 427, "491": 504 });
    expect(directAnswer("189", GUIDE_CHECKED_AT, counts)).toContain(
      "212 occupations",
    );
    expect(directAnswer("189", GUIDE_CHECKED_AT, null)).not.toContain(
      "occupations are listed",
    );
  });
});

describe("guideJsonLd", () => {
  it("adds HowTo steps to the hub only", () => {
    const faq = hubFaq(FEES, GUIDE_STEPS, GUIDE_CHECKED_AT);
    const hub = guideJsonLd(
      GUIDE_PAGES.hub,
      faq,
      GUIDE_CHECKED_AT,
      [],
      GUIDE_STEPS,
    );
    expect(types(hub)).toEqual([
      "Article",
      "FAQPage",
      "BreadcrumbList",
      "HowTo",
    ]);
    const visa = guideJsonLd(
      GUIDE_PAGES["190"],
      visaFaq("190", FEES, counts),
      GUIDE_CHECKED_AT,
      [],
    );
    expect(types(visa)).toEqual(["Article", "FAQPage", "BreadcrumbList"]);
  });

  it("puts a visa page under the guide in its breadcrumbs", () => {
    const [, , crumbs] = guideJsonLd(
      GUIDE_PAGES["491"],
      [],
      GUIDE_CHECKED_AT,
      [],
    ) as { itemListElement: { name: string; item: string }[] }[];
    expect(crumbs.itemListElement.map((c) => c.item)).toEqual([
      "https://migratelens.com/",
      "https://migratelens.com/guide/",
      "https://migratelens.com/guide/491/",
    ]);
  });
});

describe("guide FAQ", () => {
  it("quotes visa charges from the sourced fee data", () => {
    const cost = visaFaq("189", FEES, counts).find((f) =>
      f.question.includes("cost"),
    );
    expect(cost?.answer).toContain("AUD 6,135 for the main applicant");
    expect(cost?.answer).toContain("1 Jul 2026");
    expect(cost?.answer).not.toContain("nomination fee");
    const cost491 = visaFaq("491", FEES, counts).find((f) =>
      f.question.includes("cost"),
    );
    expect(cost491?.answer).toContain("nomination fee");
  });

  it("numbers the ten steps in order", () => {
    const steps = hubFaq(FEES, GUIDE_STEPS, GUIDE_CHECKED_AT)[0].answer;
    expect(steps.startsWith("1. Choose your occupation")).toBe(true);
    expect(steps).toContain("10. Visa decision");
  });
});
