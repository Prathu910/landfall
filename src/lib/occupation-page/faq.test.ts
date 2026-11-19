import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import { loadOccupationCore } from "../data/load-server";
import { BANNED_COPY } from "../report/copy";
import { no189PoolCore } from "../report/__fixtures__/scorecard";
import { occupationFaq } from "./faq";
import { stateRows } from "./states";

const faqFor = (code: string) => {
  const core = loadOccupationCore(code)!;
  return occupationFaq(core, stateRows(code, core, stateRuleData));
};
const faq261313 = faqFor("261313");
const faq254499 = faqFor("254499");

describe("occupationFaq", () => {
  it("asks three questions in order for 261313", () => {
    expect(faq261313.map((f) => f.question)).toEqual([
      "When did 189 last invite Software Engineer?",
      "Which states nominate Software Engineer?",
      "Is 75 points enough for Software Engineer 189?",
    ]);
  });
  it("answers the first from the last listed round", () => {
    expect(faq261313[0].answer).toContain("7 Nov 2024");
    expect(faq261313[0].answer).toContain("95 points");
  });
  it("answers the third from history only", () => {
    const { answer } = faq261313[2];
    expect(answer).toContain("no recent cut-off");
    expect(answer).toMatch(/[\d,]+ EOIs in the pool hold more than 75 points/);
    expect(answer.endsWith("Past cut-offs are history, not a promise.")).toBe(
      true,
    );
  });
  it("uses recent cut-offs and names the state with most 190 invitations", () => {
    expect(faq254499[2].question).toBe(
      "Is 70 points enough for Registered Nurses nec 189?",
    );
    expect(faq254499[2].answer).toContain("70 to 80 points");
    expect(faq254499[1].answer).toContain("Victoria");
    expect(faq254499[1].answer).toContain("rules are still being checked");
  });
  it("leaves out the points question without a 189 pool", () => {
    const faq = occupationFaq(
      no189PoolCore,
      stateRows(no189PoolCore.code, no189PoolCore, stateRuleData),
    );
    expect(faq).toHaveLength(2);
    expect(faq.map((f) => f.question).join(" ")).not.toMatch(/enough/);
  });
  it("says none list it when no imported list includes the code", () => {
    const core = loadOccupationCore("254499")!;
    const [, states] = occupationFaq(
      core,
      stateRows("000000", core, stateRuleData),
    );
    expect(states.answer).toContain(
      "None of NSW, QLD, WA and SA lists it for 2026–27.",
    );
  });
  it("passes the copy rules", () => {
    for (const f of [...faq261313, ...faq254499]) {
      expect(`${f.question} ${f.answer}`).not.toMatch(BANNED_COPY);
    }
  });
});
