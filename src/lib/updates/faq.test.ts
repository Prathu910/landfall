import { describe, expect, it } from "vitest";
import { dataOnly, roundOnly, twoRounds } from "./__fixtures__/recap-facts";
import { recapFaq } from "./faq";
import { loadRecap } from "./load-server";

const oct = loadRecap("2026-10");

describe("recapFaq", () => {
  it("asks 3 to 5 questions from the facts", () => {
    for (const facts of [oct, roundOnly, dataOnly, twoRounds]) {
      const faq = recapFaq(facts);
      expect(faq.length, facts.month).toBeGreaterThanOrEqual(3);
      expect(faq.length, facts.month).toBeLessThanOrEqual(5);
      expect(faq.at(-1)?.question).toBe("Is this migration advice?");
    }
  });

  it("answers October 2026 from the round and the data", () => {
    const faq = recapFaq(oct);
    expect(faq.map((f) => f.question)).toEqual([
      "When was the latest 189 round in October 2026?",
      "What was the lowest score invited for 189 in October 2026?",
      "Was Chef invited in the 15 October 2026 189 round?",
      "How many EOIs were in the 189 pool on 31 October 2026?",
      "Is this migration advice?",
    ]);
    expect(faq[0].answer).toBe(
      "15 October 2026. Home Affairs invited 20,000 EOIs for the 189 visa across 159 occupations. The round before it was on 4 June 2026.",
    );
    expect(faq[1].answer).toContain(
      "It depends on the occupation: from 65 to 100 points. 44 occupations had 65 as their lowest score invited.",
    );
    expect(faq[1].answer).toContain(
      "For Registered Nurses nec it was 70 (75 in the 4 Jun 2026 round), with a tie-break date of 19 Nov 2025.",
    );
    expect(faq[2].answer).toBe(
      "No. Chef wasn't listed in the 15 Oct 2026 round, or in the 3 rounds before it. It was last listed on 7 Nov 2024, at 85 points. On 31 Oct 2026 its 189 pool held 10,773 EOIs.",
    );
    expect(faq[3].answer).toContain("About 167,000 (166,555–167,904)");
  });

  it("takes its example from the spotlight, else the largest card move", () => {
    expect(recapFaq(roundOnly)[1].answer).toContain(
      "For Registered Nurses nec it was 65 (70 in the 15 Oct 2026 round), with a tie-break date of 5 Jan 2026.",
    );
  });

  it("leaves out which state gave the most unless one clearly did", () => {
    const question =
      "Which state gave the most 190 invitations in October 2026?";
    expect(recapFaq(oct).map((f) => f.question)).not.toContain(question);
    const december = recapFaq(dataOnly).find((f) =>
      f.question.startsWith("Which state"),
    );
    expect(december?.answer).toBe(
      "Victoria: at least 820 EOIs held a 190 invitation from it on 31 Dec 2026. These are minimums: the data hides counts under 20 for each occupation.",
    );
  });

  it("asks about the month's round only when it had one", () => {
    const questions = recapFaq(dataOnly).map((f) => f.question);
    expect(questions[0]).toBe("Was there a 189 round in December 2026?");
    expect(recapFaq(dataOnly)[0].answer).toBe(
      "No 189 round in December 2026; the last was on 15 Oct 2026.",
    );
    expect(recapFaq(roundOnly).map((f) => f.question)).toEqual([
      "When was the latest 189 round in November 2026?",
      "What was the lowest score invited for 189 in November 2026?",
      "Is this migration advice?",
    ]);
  });

  it("uses the newest round when the month had two", () => {
    const [latest] = recapFaq(twoRounds);
    expect(latest.answer).toBe(
      "25 March 2027. Home Affairs invited 6,000 EOIs for the 189 visa across 2 occupations. An earlier round on 4 March 2027 invited 8,000 EOIs.",
    );
  });
});
