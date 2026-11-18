import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { loadOccupationCore } from "../data/load-server";
import type { StateCode, StateVisa } from "../data/types";
import { sampleProfile } from "../migration";
import { BANNED_COPY } from "../report/copy";
import { cases, realFederal, realLists } from "./__fixtures__/real-data";
import { stateOutlook } from "./outlook";
import type { Outlook, RuleCheck, StateOutcome } from "./outlook";
import { questionsNeeded } from "./questions";
import type { Question } from "./questions";
import type { RelatedWork } from "./rules-types";

const lists = realLists();
const federal = realFederal();

function run(visa: StateVisa): Outlook {
  const c = cases[0];
  const core = loadOccupationCore(c.profile.occupation);
  if (!core) throw new Error("no core");
  return stateOutlook({
    core,
    rules: stateRules,
    lists,
    federal,
    profile: c.profile,
    points: c.points[0][visa],
    visa,
    asOf: "2026-11-18",
  });
}

function check(overrides: Partial<RuleCheck>): RuleCheck {
  return {
    label: "A rule",
    outcome: "needs-answer",
    source: "https://example.test",
    checkedAt: "2026-11-01",
    stale: false,
    ...overrides,
  };
}

function outlook(
  visa: StateVisa,
  entries: [StateCode, RuleCheck[]][],
): Outlook {
  const states: StateOutcome[] = entries.map(([state, checks]) => ({
    state,
    visa,
    group: "needs-answers",
    deciding: { streamId: "s", name: "S", outcome: "needs-answer", checks },
    streams: [],
    evidence: {
      competitorsAtOrAbove: { min: 0, max: 0 },
      invitedAtOrBelow: [],
      notPublished: [],
      peak: null,
      scoreRange: null,
    },
    reasonText: "",
  }));
  return { visa, states, anyState: states[0].evidence, summary: "" };
}

const living = (): RuleCheck =>
  check({ field: "monthsLivingInState", question: "x" });
const working = (related: RelatedWork): RuleCheck =>
  check({ field: "monthsWorkingInState", question: "x", related });
function ask(outlooks: Outlook[], state = ""): Question[] {
  return questionsNeeded(outlooks, { ...sampleProfile, state });
}
const byField = (qs: Question[], field: string) =>
  qs.find((q) => q.field === field);

describe("questionsNeeded", () => {
  it("de-duplicates by field and lists the states each affects", () => {
    const qs = ask([
      outlook("190", [
        ["WA", [check({ field: "visaExpiry" })]],
        ["SA", [check({ field: "visaExpiry" })]],
      ]),
      outlook("491", [["SA", [check({ field: "visaExpiry" })]]]),
    ]);
    expect(qs).toHaveLength(1);
    expect(qs[0].affects).toEqual(["South Australia", "Western Australia"]);
    expect(qs[0].affectsText).toBe(
      "Affects: South Australia, Western Australia",
    );
  });

  it("asks only for needs-answer checks", () => {
    const qs = ask([
      outlook("190", [
        [
          "WA",
          [
            check({ field: "visaExpiry", outcome: "pass" }),
            check({ field: "livesRegional", outcome: "fail" }),
            check({ field: "studyState", outcome: "unverified" }),
            check({ outcome: "needs-answer" }), // no field: nothing to ask
          ],
        ],
      ]),
    ]);
    expect(qs).toEqual([]);
  });

  it("never asks incomeBand", () => {
    const qs = ask([
      outlook("190", [["WA", [check({ field: "incomeBand" })]]]),
    ]);
    expect(qs).toEqual([]);
  });

  it("words the months questions as months in a row up to now", () => {
    const qs = ask(
      [
        outlook("190", [
          [
            "SA",
            [
              living(),
              check({ field: "monthsLivingOffshore" }),
              working("same-occupation"),
            ],
          ],
        ]),
      ],
      "SA",
    );
    expect(byField(qs, "monthsLivingInState")?.text).toBe(
      "How many months in a row, up to now, have you lived in South Australia?",
    );
    expect(byField(qs, "monthsLivingOffshore")?.text).toBe(
      "How many months in a row, up to now, have you lived outside Australia?",
    );
    expect(byField(qs, "monthsWorkingInState")?.text).toBe(
      "How many months in a row, up to now, have you worked in South Australia in your nominated occupation?",
    );
  });

  it.each([
    ["anzsco-2-digit", "same first 2 ANZSCO digits"],
    ["anzsco-3-digit", "same first 3 ANZSCO digits"],
  ] as const)("names the %s relatedness", (related, definition) => {
    const qs = ask([outlook("190", [["WA", [working(related)]]])], "WA");
    expect(qs[0].text).toBe(
      `How many months in a row, up to now, have you worked in Western Australia in your nominated occupation or one Western Australia treats as related (${definition})?`,
    );
  });

  it("words a shared question for the state the user lives in", () => {
    const outlooks = [
      outlook("190", [
        ["WA", [working("anzsco-3-digit")]],
        ["SA", [working("anzsco-2-digit")]],
      ]),
    ];
    expect(ask(outlooks, "SA")[0].text).toBe(
      "How many months in a row, up to now, have you worked in South Australia in your nominated occupation or one South Australia treats as related (same first 2 ANZSCO digits)?",
    );
    expect(ask(outlooks, "WA")[0].text).toContain("same first 3 ANZSCO digits");
  });

  it("uses neutral wording when the user's state is not among those affected", () => {
    const outlooks = [
      outlook("190", [
        ["WA", [working("anzsco-3-digit"), living()]],
        ["SA", [working("anzsco-2-digit")]],
      ]),
    ];
    const qs = ask(outlooks, "VIC");
    expect(byField(qs, "monthsWorkingInState")?.text).toBe(
      "How many months in a row, up to now, have you worked in the state you live in, in your nominated occupation or a related one?",
    );
    expect(byField(qs, "monthsLivingInState")?.text).toBe(
      "How many months in a row, up to now, have you lived in the state you live in?",
    );
  });

  it("asks one experience question per window", () => {
    const qs = ask([
      outlook("491", [
        [
          "NSW",
          [
            check({ field: "yearsExperienceLast5" }),
            check({ field: "yearsExperienceLast3" }),
          ],
        ],
        ["QLD", [check({ field: "yearsExperienceLast5" })]],
      ]),
    ]);
    expect(qs.map((q) => q.text)).toEqual([
      "Years of skilled work in your nominated occupation in the last 3 years",
      "Years of skilled work in your nominated occupation in the last 5 years",
    ]);
    expect(byField(qs, "yearsExperienceLast5")?.affects).toEqual([
      "New South Wales",
      "Queensland",
    ]);
  });

  it("gives the short questions for the remaining fields", () => {
    const qs = ask([
      outlook("190", [
        [
          "WA",
          [
            check({ field: "state" }),
            check({ field: "jobOfferState" }),
            check({ field: "studyState" }),
            check({ field: "livesRegional" }),
            check({ field: "visaExpiry" }),
          ],
        ],
      ]),
    ]);
    expect(qs.map((q) => q.kind)).toEqual([
      "state",
      "visa-expiry",
      "job-offer",
      "study",
      "regional",
    ]);
  });

  it("asks the real ICT Business Analyst profile for both visas", () => {
    const qs = ask([run("190"), run("491")]);
    expect(qs.length).toBeGreaterThan(0);
    expect(new Set(qs.map((q) => q.field)).size).toBe(qs.length);
    for (const q of qs) {
      expect(q.affects.length).toBeGreaterThan(0);
      expect(q.field).not.toBe("incomeBand");
    }
  });

  it("uses no banned copy", () => {
    const qs = ask([run("190"), run("491")]);
    const all = [
      ...qs.flatMap((q) => [q.text, q.help, q.affectsText]),
      ...ask([
        outlook("190", [["WA", [working("anzsco-3-digit"), living()]]]),
      ]).flatMap((q) => [q.text, q.help, q.affectsText]),
    ];
    for (const text of all.filter((x) => x !== undefined))
      expect(text).not.toMatch(BANNED_COPY);
  });
});
