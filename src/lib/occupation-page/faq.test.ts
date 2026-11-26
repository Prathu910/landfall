import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import { frozenCore } from "../data/__fixtures__/frozen-2026-10";
import { BANNED_COPY } from "../report/copy";
import { no189PoolCore } from "../report/__fixtures__/scorecard";
import { occupationFaq } from "./faq";
import { stateRows } from "./states";

const faqFor = (code: string) => {
  const core = frozenCore(code)!;
  return occupationFaq(core, stateRows(code, core, stateRuleData));
};
const faq261313 = faqFor("261313");
const faq254499 = faqFor("254499");

describe("occupationFaq", () => {
  it("asks its questions in order for 261313", () => {
    expect(faq261313.map((f) => f.question)).toEqual([
      "What is the latest 189 cut-off for Software Engineer?",
      "Which states nominate Software Engineer?",
      "Is 75 points enough for Software Engineer 189?",
      "How many points do I need for Software Engineer?",
      "How many Software Engineer EOIs are in the 190 pool?",
      "How many Software Engineer EOIs are in the 491 pool?",
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
  it("uses recent cut-offs", () => {
    expect(faq254499[2].question).toBe(
      "Is 70 points enough for Registered Nurses nec 189?",
    );
    expect(faq254499[2].answer).toContain("70 to 80 points");
    expect(faq254499[1].answer).toContain("rules are still being checked");
  });
  it("names no state when the leading ranges overlap (VIC 337–375, NSW 327–346)", () => {
    expect(faq254499[1].answer).not.toMatch(/had the most/);
  });
  it("names a state only when its range is above every other state's", () => {
    const core = frozenCore("254499")!;
    const at = (counts: Record<string, string>) => ({ [core.asAt]: counts });
    const clearLead = {
      ...core,
      stateInvited: {
        "190": {
          VIC: at({ "80": "215", "85": "<20" }),
          NSW: at({ "80": "168", "85": "26" }),
          QLD: at({ "80": "<20" }),
        },
      },
    };
    const [, states] = occupationFaq(
      clearLead,
      stateRows("254499", clearLead, stateRuleData),
    );
    expect(states.answer).toContain(
      "Victoria had the most EOIs in invited status for 190, as at Oct 2026 (215–234).",
    );
    const masked = {
      ...core,
      stateInvited: { "190": { VIC: at({ "80": "<20" }) } },
    };
    const [, alone] = occupationFaq(
      masked,
      stateRows("254499", masked, stateRuleData),
    );
    expect(alone.answer).not.toMatch(/had the most/);
  });
  it("names each state once, with both visas when it lists both", () => {
    expect(faq254499[1].answer).toMatch(
      /^For 2026–27, QLD, WA and SA list it for 190 and 491; NSW lists it for 190\./,
    );
    const core = frozenCore("254499")!;
    const rows = stateRows("254499", core, stateRuleData).map((r) => ({
      ...r,
      onList: r.state === "WA" ? r.onList : "Not on its 2026–27 list",
    }));
    const [, states] = occupationFaq(core, rows);
    expect(states.answer).toMatch(
      /^For 2026–27, WA lists it for 190 and 491\./,
    );
  });
  it("gives a single cut-off once, not as a range", () => {
    const core = frozenCore("254499")!;
    const rounds189 = core.rounds189.map((r) => ({ ...r, cutoff: 65 }));
    const [, , points] = occupationFaq(
      { ...core, rounds189 },
      stateRows("254499", core, stateRuleData),
    );
    expect(points.answer).toContain(
      "listed Registered Nurses nec at 65 points.",
    );
    expect(points.answer).not.toMatch(/65 to 65/);
  });
  it("has its own sentence when 189 has never listed it", () => {
    const core = frozenCore("254499")!;
    const rounds189 = core.rounds189.map((r) => ({ ...r, cutoff: null }));
    const [, , points] = occupationFaq(
      { ...core, rounds189 },
      stateRows("254499", core, stateRuleData),
    );
    expect(points.answer).toMatch(
      /^189 hasn't listed Registered Nurses nec in any round we can read\./,
    );
    expect(points.answer).not.toMatch(/not listed points/);
  });
  it("leaves out the points question without a 189 pool", () => {
    const faq = occupationFaq(
      no189PoolCore,
      stateRows(no189PoolCore.code, no189PoolCore, stateRuleData),
    );
    expect(faq.map((f) => f.question).join(" ")).not.toMatch(/enough/);
  });
  it("says none list it when no imported list includes the code", () => {
    const core = frozenCore("254499")!;
    const [, states] = occupationFaq(
      core,
      stateRows("000000", core, stateRuleData),
    );
    expect(states.answer).toContain(
      "None of NSW, QLD, WA and SA lists it for 2026–27.",
    );
  });
  it("adds the round's tie-break date to the latest cut-off when it was published", () => {
    const core = frozenCore("254499")!;
    const [latest] = occupationFaq(
      core,
      stateRows("254499", core, stateRuleData),
      { tieBreak: "2026-09-04" },
    );
    expect(latest.answer).toMatch(
      /^The latest 189 round to list Registered Nurses nec was on 15 Oct 2026, with a cut-off of \d+ points\. That round's published tie-break date for Registered Nurses nec was 4 Sep 2026/,
    );
    expect(faq254499[0].answer).not.toContain("tie-break");
  });
  it("gives the pass mark and the last three listed cut-offs, with dates", () => {
    const needed = faq261313.find((f) =>
      f.question.startsWith("How many points"),
    );
    expect(needed?.answer).toMatch(
      /^At least 65 points to be invited, the pass mark for the 189, 190 and 491\. The latest 189 cut-offs for Software Engineer were 95 points \(7 Nov 2024\), \d+ points \(\d+ \w+ \d{4}\) and \d+ points \(\d+ \w+ \d{4}\)\./,
    );
  });
  it("answers the 190 and 491 pools with EOIs, never individuals, and keeps a masked total a range", () => {
    const pool190 = faq261313.find((f) => f.question.includes("190 pool"));
    expect(pool190?.answer).toMatch(
      /^The 190 pool holds [\d,]+ EOIs as at Oct 2026/,
    );
    expect(pool190?.answer).toContain("not individuals");
    const core = frozenCore("254499")!;
    const masked = {
      ...core,
      pool: {
        "491": { total: "<20" as const, byScore: { "80": "<20" as const } },
      },
    };
    const faq = occupationFaq(
      masked,
      stateRows("254499", masked, stateRuleData),
    );
    const pool491 = faq.find((f) => f.question.includes("491 pool"));
    expect(pool491?.answer).toContain("under 20 EOIs (so it may be zero)");
    expect(faq.some((f) => f.question.includes("190 pool"))).toBe(false);
  });
  it("answers 'Can I get PR' from the Home Affairs list only, with no outlook", () => {
    const core = frozenCore("254499")!;
    const rows = stateRows("254499", core, stateRuleData);
    const pr = occupationFaq(core, rows, {
      federal: stateRuleData.federal,
    }).find((f) => f.question === "Can I get PR as a Registered Nurses nec?");
    expect(pr?.answer).toMatch(
      /^Registered Nurses nec is on the Home Affairs skilled occupation list for the 189, 190 and 491 \(checked \d+ \w+ \d{4}\)\. Being listed is one requirement/,
    );
    const off = occupationFaq(core, rows, {
      federal: { ...stateRuleData.federal!, entries: {} },
    }).find((f) => f.question.startsWith("Can I get PR"));
    expect(off?.answer).toContain(
      "isn't on the Home Affairs skilled occupation list",
    );
    expect(
      occupationFaq(core, rows).some((f) => f.question.startsWith("Can I")),
    ).toBe(false);
    const accountant = frozenCore("221111")!;
    expect(
      occupationFaq(
        accountant,
        stateRows("221111", accountant, stateRuleData),
        { federal: stateRuleData.federal },
      ).some((f) => f.question === "Can I get PR as an Accountant (General)?"),
    ).toBe(true);
  });
  it("passes the copy rules", () => {
    for (const f of [...faq261313, ...faq254499]) {
      expect(`${f.question} ${f.answer}`).not.toMatch(BANNED_COPY);
    }
  });
});
