import { describe, expect, it } from "vitest";
import { HOME_FAQ } from "../../components/home/home-faq";
import { calculatePoints, sampleProfile } from "../migration";
import { BANNED_COPY } from "../report/copy";
import { HOME_COPY, sampleCaption, trustLine } from "./home-copy";

const SPEC = {
  headline: "Know your points. See where they'd put you.",
  lede: "Count your points, check the points-test basics, then see the EOIs ahead of you and what happened to EOIs like yours. From official SkillSelect data, free.",
  storyTitle: "65 points is the pass mark, not a promise.",
  storyBody:
    "Reach 65 points and you'll often hear the same answer: yes, you can apply, now pay the fees, sometimes lakhs of rupees. What you rarely hear is how many EOIs are ahead of you, or how long EOIs like yours have waited. We built MigrateLens so you can see that first, from official data, before you commit to anything.",
};

/** Every string in a nested value, so no copy escapes the checks. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object")
    return Object.values(value).flatMap(strings);
  return [];
}

const ALL_COPY = [
  ...strings(HOME_COPY),
  ...strings(HOME_FAQ),
  ...trustLine("2026-10"),
  sampleCaption("ICT Business Analyst", "189", 90),
];

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z"“])/).filter(Boolean);
}

describe("homepage copy", () => {
  it("uses the founder-approved hero and story wording", () => {
    expect(HOME_COPY.headline).toBe(SPEC.headline);
    expect(HOME_COPY.lede).toBe(SPEC.lede);
    expect(HOME_COPY.story.title).toBe(SPEC.storyTitle);
    expect(HOME_COPY.story.body).toBe(SPEC.storyBody);
  });

  it("has the two doors from the spec, the planner's first", () => {
    expect(HOME_COPY.doors).toEqual([
      {
        id: "planning",
        tag: "Not lodged an EOI yet",
        title: "Am I ready, and is it worth it?",
        body: "Your points, what could add more, and where an EOI at your score would sit today.",
        action: "Check my points",
      },
      {
        id: "lodged",
        tag: "Already lodged",
        title: "Where does my EOI stand?",
        body: "The EOIs ahead of you, the ones at your score, and what happened to EOIs lodged when yours was.",
        action: "Check where I stand",
      },
    ]);
  });

  it("dates the trust line from the snapshot month", () => {
    expect(trustLine("2026-10")).toEqual([
      "SkillSelect data, as at Oct 2026",
      "No percentages",
      "Stays in your browser",
    ]);
  });

  it("labels the sample visuals as an example", () => {
    expect(sampleCaption("ICT Business Analyst", "190", 95)).toBe(
      "Example from the sample report: ICT Business Analyst, 190 at 95 points.",
    );
  });

  it("repeats the final call to action", () => {
    expect(HOME_COPY.finalCta.action).toBe("Check my points, free");
  });

  it("never promises eligibility, quotes a percentage, says always or names an agency", () => {
    for (const text of ALL_COPY) {
      expect(text).not.toMatch(/eligib/i);
      expect(text).not.toContain("%");
      expect(text).not.toMatch(/\balways\b/i);
      expect(text).not.toMatch(/Y-Axis|VisaEnvoy|Abhinav/i);
    }
  });

  it("passes the report copy rules", () => {
    for (const text of ALL_COPY) expect(text).not.toMatch(BANNED_COPY);
  });
});

describe("homepage FAQ", () => {
  it("has five to seven questions with unique ids", () => {
    expect(HOME_FAQ.length).toBeGreaterThanOrEqual(5);
    expect(HOME_FAQ.length).toBeLessThanOrEqual(7);
    expect(new Set(HOME_FAQ.map((item) => item.id)).size).toBe(HOME_FAQ.length);
  });

  it("answers each question directly in two or three sentences", () => {
    for (const item of HOME_FAQ) {
      expect(item.question).toMatch(/\?$/);
      const count = sentences(item.answer).length;
      expect(count, item.question).toBeGreaterThanOrEqual(2);
      expect(count, item.question).toBeLessThanOrEqual(3);
      expect(item.answer, item.question).not.toMatch(/^It depends/i);
    }
  });

  it("states the nomination points the points check uses", () => {
    const result = calculatePoints(sampleProfile, "2026-11-17");
    const answer = HOME_FAQ.find((item) => item.id === "nomination")?.answer;
    expect(answer).toContain(`adds ${result.subclass190 - result.base} points`);
    expect(answer).toContain(`adds ${result.subclass491 - result.base}`);
  });

  it("links only to pages that exist, with trailing slashes", () => {
    for (const item of HOME_FAQ) {
      if (!item.link) continue;
      expect(item.link.href).toMatch(
        /^\/(sample|states|methodology)\/(#[a-z0-9-]+)?$/,
      );
    }
  });
});
