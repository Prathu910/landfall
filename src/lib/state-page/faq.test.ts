import { describe, expect, it } from "vitest";
import { frozenStateViews, frozenView } from "./__fixtures__/frozen-views";
import { stateFaq } from "./faq";

const DATE =
  /\b\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b/;
const SOURCE = /SkillSelect|Home Affairs|official|invitation rounds page/;

describe("state FAQ (frozen 2026-10)", () => {
  it("dates every answer and names its source", () => {
    for (const view of frozenStateViews().values()) {
      for (const entry of view.faq) {
        expect(entry.answer, entry.question).toMatch(DATE);
        expect(entry.answer, entry.question).toMatch(SOURCE);
      }
    }
  });

  it("asks the six questions in order, with the state's search name", () => {
    expect(frozenView("NSW").faq.map((f) => f.question)).toEqual([
      "How many points do I need for NSW 190?",
      "How many points do I need for NSW 491?",
      "Is NSW 190 or 491 open in 2026–27?",
      "How many 190 and 491 nominations has NSW made in 2026–27?",
      "Which occupations hold NSW 190 invitations?",
      "Which occupations hold NSW 491 invitations?",
      "How many EOIs are waiting for NSW 190 and 491?",
    ]);
  });

  it("adds the own-score question only for the states that have one", () => {
    expect(frozenView("ACT").faq.at(-1)?.question).toBe(
      "Does the ACT use the Canberra Matrix?",
    );
    expect(frozenView("VIC").faq.at(-1)?.question).toBe(
      "What is the Victorian Points Test?",
    );
    expect(frozenView("NSW").faq.at(-1)?.question).not.toMatch(/Matrix|VPT/);
  });

  it("drops a question whose data is missing, never guessing", () => {
    const tas = frozenView("TAS");
    const questions = tas.faq.map((f) => f.question);
    expect(questions).not.toContain(
      "Which occupations hold Tasmania 491 invitations?",
    );
    const noNominations = stateFaq({ ...tas.facts, nominations: null });
    expect(noNominations.map((f) => f.question).join(" ")).not.toMatch(
      /nominations has/,
    );
  });

  it("states the nomination points from the points table", () => {
    const [p190, p491] = frozenView("WA").faq;
    expect(p190.answer).toContain("a 190 nomination adds 5 points");
    expect(p491.answer).toContain("a 491 nomination adds 15 points");
  });
});
