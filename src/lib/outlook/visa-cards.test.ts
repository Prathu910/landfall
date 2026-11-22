import { describe, expect, it } from "vitest";
import { scenarioInput } from "./__fixtures__/scenario-input";
import type { ScenarioId } from "./__fixtures__/scenarios";
import { evaluateProfile } from "./evaluate-profile";
import { visaCards } from "./visa-cards";
import { estimatedWait } from "./wait";

function cardsOf(id: ScenarioId) {
  const input = scenarioInput(id);
  const o = evaluateProfile(input);
  return visaCards(input, o, estimatedWait(o, input));
}

describe("visaCards", () => {
  it("builds one card per visa in order, with its shape and title", () => {
    expect(
      cardsOf("middle").map((c) => [c.visa, c.shape, c.title, c.points]),
    ).toEqual([
      ["189", "rect", "189 Independent", 70],
      ["190", "hex", "190 Nominated", 75],
      ["491", "oval", "491 Regional", 85],
    ]);
  });

  it("names the Northern Territory with its article", () => {
    expect(cardsOf("notinv")[1].caption).toBe(
      "The Northern Territory invited under 20 EOIs at or below your points in October 2026.",
    );
  });

  it("drops the waiting days for an EOI date after today", () => {
    const input = scenarioInput("lodged");
    const future = {
      ...input,
      profile: { ...input.profile, eoiDate: "2027-01-01" },
    };
    const o = evaluateProfile(future);
    const card = visaCards(future, o, estimatedWait(o, future))[0];
    expect(card.caption).not.toMatch(/Waiting/);
  });

  it("links a needs-answers note to the Sharpen questions", () => {
    const input = scenarioInput("middle");
    const o = evaluateProfile(input);
    const best = o.v190?.best;
    if (!o.v190 || !best) throw new Error("middle has a 190 state");
    const asked = {
      ...o,
      v190: { ...o.v190, best: { ...best, flag: "needs-answers" as const } },
    };
    const card = visaCards(input, asked, estimatedWait(asked, input))[1];
    expect(card.flagText).toBe("Answer the state questions to confirm it.");
    expect(card.flagHref).toBe("#sharpen");
  });

  it("gives a rules-being-checked note no link", () => {
    const card = cardsOf("middle")[1];
    expect(card.flagText).toMatch(/still checking/);
    expect(card.flagHref).toBeNull();
  });
});
