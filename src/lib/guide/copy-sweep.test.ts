import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import { FEES } from "../../data/guide/fees";
import { POINTS_CHANGES } from "../../data/guide/points-changes";
import { GUIDE_CHECKED_AT } from "../../data/guide/sources";
import { GUIDE_STEPS } from "../../data/guide/steps";
import { VISA_GUIDES } from "../../data/guide/visas";
import { feeItems } from "./staleness";
import { federalCounts, hubFaq, visaFaq } from "./faq";
import { GUIDE_PAGES, GUIDE_VISAS, directAnswer } from "./meta";

/**
 * The guide is general information: no chances or percentages, no advice
 * ("you should", "we recommend"), no promises and no named agencies or
 * consultancies (Migration Act advertising rules, Australian Consumer Law).
 */
const BANNED =
  /%|\bchances?\b|\bguarantee|\bshould\b|\brecommend|\bbest (state|visa|option)\b|migration agenc(y|ies)\b|consultan|y-axis|\bprobab/i;

function guideStrings(): string[] {
  const counts = federalCounts(stateRuleData.federal);
  const faqs = [
    ...hubFaq(FEES, GUIDE_STEPS, GUIDE_CHECKED_AT),
    ...GUIDE_VISAS.flatMap((v) => visaFaq(v, FEES, counts)),
  ];
  const visas = Object.values(VISA_GUIDES).flatMap((g) => [
    g.name,
    g.what,
    g.suits.onshore,
    g.suits.offshore,
    ...[...g.requirements, ...g.nomination, ...g.after].flatMap((r) => [
      r.label,
      r.text,
    ]),
  ]);
  const steps = GUIDE_STEPS.flatMap((s) => [
    s.title,
    s.what,
    s.rule.text,
    s.who,
    s.onshore,
    s.offshore,
    s.duration.text,
  ]);
  const fees = feeItems(FEES).map((f) => f.id);
  return [
    ...faqs.flatMap((f) => [f.question, f.answer]),
    ...visas,
    ...steps,
    ...POINTS_CHANGES.flatMap((c) => [c.title, c.text]),
    ...Object.values(GUIDE_PAGES).flatMap((p) => [
      p.title,
      p.description,
      p.heading,
      directAnswer(p.id, GUIDE_CHECKED_AT, counts),
    ]),
    ...fees,
  ];
}

describe("guide copy", () => {
  it("never states chances, advice, promises or agency names", () => {
    for (const text of guideStrings()) {
      expect(text).not.toMatch(BANNED);
    }
  });

  it("says 'pass mark, not a promise' where 65 points comes up", () => {
    const faq = hubFaq(FEES, GUIDE_STEPS, GUIDE_CHECKED_AT).find((f) =>
      f.question.includes("65 points"),
    );
    expect(faq?.answer).toContain("pass mark");
    expect(faq?.answer).toContain("not a promise");
  });

  it("gives a published duration only with its source", () => {
    for (const step of GUIDE_STEPS) {
      if (step.duration.kind === "published") {
        expect(step.duration.source).toMatch(/^https:\/\//);
      } else {
        expect(step.duration.text).not.toMatch(/\b\d+\s*(day|week|month)s?\b/);
      }
    }
  });
});

describe("the 191 pathway", () => {
  // The three requirements on the Home Affairs 191 page (SOURCES.visa191).
  const complete = (text: string) => {
    expect(text, text).toMatch(/at least 3 years/);
    expect(text, text).toMatch(/ATO notices of assessment for 3 income years/);
    expect(text, text).toMatch(/condition/);
    expect(text, text).toMatch(/designated regional area/);
  };
  const counts = federalCounts(stateRuleData.federal);

  it("states all three requirements wherever the guide says how to reach it", () => {
    const after = VISA_GUIDES["491"].after
      .filter((r) => r.label.startsWith("191"))
      .map((r) => r.text)
      .join(" ");
    complete(after);
    const faqs = [
      ...hubFaq(FEES, GUIDE_STEPS, GUIDE_CHECKED_AT),
      ...visaFaq("491", FEES, counts),
    ].filter((f) => /apply for the permanent 191/.test(f.answer));
    expect(faqs.length).toBeGreaterThanOrEqual(2);
    for (const faq of faqs) complete(faq.answer);
    complete(directAnswer("491", GUIDE_CHECKED_AT, counts));
  });

  it("cites the 191 page and says there is no minimum income", () => {
    const rules = VISA_GUIDES["491"].after.filter((r) =>
      r.label.startsWith("191"),
    );
    expect(rules.length).toBe(3);
    for (const rule of rules) expect(rule.source).toContain("191");
    expect(rules.map((r) => r.text).join(" ")).toContain("no minimum income");
  });
});

describe("the invitation step", () => {
  it("says a 190 or 491 invitation follows a state's nomination", () => {
    const step = GUIDE_STEPS.find((s) => s.id === "invitation");
    expect(step?.what).toMatch(/190 and 491.*nominat/);
    expect(step?.what).toMatch(/eligible relative/);
  });
});
