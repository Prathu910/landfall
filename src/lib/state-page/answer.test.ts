import { describe, expect, it } from "vitest";
import { frozenView } from "./__fixtures__/frozen-views";
import { stateAnswer } from "./answer";
import type { StateFacts } from "./facts";

describe("the state page's direct answer (frozen 2026-10)", () => {
  it("leads with both visas' floors, dated, then points and nominations", () => {
    expect(frozenView("NSW").hero.answer).toEqual([
      "On 31 October 2026, SkillSelect data showed at least 790 EOIs holding an NSW 190 invitation and at least 141 holding an NSW 491 invitation.",
      "The lowest score with a published 190 count was 70 points, and Registered Nurses nec had the highest published count (at least 327).",
      "Home Affairs counted 11 NSW 190 and 0 491 nominations from 1 Jul to 30 Sep 2026, a different measure.",
    ]);
  });

  it("names an all-hidden visa as under 20 for each occupation, never zero", () => {
    const [first] = frozenView("TAS").hero.answer;
    expect(first).toBe(
      "On 31 October 2026, SkillSelect data showed at least 28 EOIs holding a Tasmania 190 invitation; Tasmania 491 counts were under 20 for each occupation.",
    );
  });

  it('reads "<5" nominations as fewer than 5', () => {
    expect(frozenView("QLD").hero.answer[2]).toContain(
      "7 Queensland 190 and fewer than 5 491 nominations",
    );
  });

  it("says no points level can be read when every count is hidden, and drops a missing nominations table", () => {
    const facts = frozenView("TAS").facts;
    const hidden = (v: StateFacts["visas"]["190"]) => ({
      ...v,
      latest: { total: { min: 0, max: 57 }, maskedCells: 3 },
      lowestScore: null,
    });
    const allHidden: StateFacts = {
      ...facts,
      nominations: null,
      visas: {
        "190": hidden(facts.visas["190"]),
        "491": hidden(facts.visas["491"]),
      },
    };
    expect(stateAnswer(allHidden)).toEqual([
      "On 31 October 2026, every SkillSelect count of EOIs holding a Tasmania 190 or 491 invitation was under 20 for each occupation.",
      "Every Tasmania 190 and 491 count was under 20 for each occupation and score, so no points level can be read from them.",
    ]);
  });
});
