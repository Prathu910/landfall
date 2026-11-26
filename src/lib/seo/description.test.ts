import { describe, expect, it } from "vitest";
import { splitSentences, wholeSentences } from "./description";

describe("wholeSentences", () => {
  it("keeps whole sentences that fit and skips one that doesn't", () => {
    const long = `Long ${"word ".repeat(40).trim()}.`;
    expect(
      wholeSentences(["One.", long, "Two."], [], { min: 0, max: 40 }),
    ).toBe("One. Two.");
  });
  it("shortens a sentence at a clause boundary rather than mid-clause", () => {
    expect(
      wholeSentences(
        ["The pool holds 4,280 EOIs; the most common score is 70."],
        [],
        {
          min: 0,
          max: 40,
        },
      ),
    ).toBe("The pool holds 4,280 EOIs.");
    expect(
      wholeSentences(
        [
          "Invited 20,000 EOIs on 15 Oct, across 159 occupations, at 65 to 100.",
        ],
        [],
        {
          min: 0,
          max: 60,
        },
      ),
    ).toBe("Invited 20,000 EOIs on 15 Oct, across 159 occupations.");
  });
  it("tops up with extras only while under the minimum", () => {
    expect(
      wholeSentences(
        ["Short."],
        ["Far too long an extra to fit here.", "Fits.", "More."],
        {
          min: 10,
          max: 20,
        },
      ),
    ).toBe("Short. Fits.");
  });
  it("cuts at a word with an ellipsis only when no clause fits", () => {
    const text = wholeSentences(["word ".repeat(60).trim()]);
    expect(text.length).toBeLessThanOrEqual(160);
    expect(text.endsWith("word…")).toBe(true);
  });
});

describe("splitSentences", () => {
  it("splits before a capital or a digit, not inside a number", () => {
    expect(
      splitSentences("As at 31 Oct. 189 listed it. It held 1.5 EOIs."),
    ).toEqual(["As at 31 Oct.", "189 listed it.", "It held 1.5 EOIs."]);
  });
});
