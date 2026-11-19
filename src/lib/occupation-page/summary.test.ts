import { describe, expect, it } from "vitest";
import { loadOccupationCore, loadOccupationDetail } from "../data/load-server";
import federalJson from "../../data/state-rules/federal-occupations.json";
import { buildEoisLikeYours } from "../report/eois-like-yours";
import { BANNED_COPY } from "../report/copy";
import {
  allMaskedCore,
  neverListedCore,
  no189PoolCore,
  noPoolsCore,
  noneRoundsCore,
  occasionalCore,
  regularCore,
} from "../report/__fixtures__/scorecard";
import type { FederalList } from "../state-outlook/rules-types";
import {
  likeTheseSentence,
  mostCommonScore,
  occupationSummary,
  poolSentence,
  roundsSentence,
  sourceLine,
  statusChips,
} from "./summary";

const federal = federalJson as unknown as FederalList;
const core261313 = loadOccupationCore("261313")!;
const detail261313 = loadOccupationDetail("261313");
const core254499 = loadOccupationCore("254499")!;

describe("roundsSentence", () => {
  it("says when 189 has not listed the occupation recently", () => {
    expect(roundsSentence("Software Engineer", core261313.rounds189)).toBe(
      "189 hasn't listed Software Engineer in its last four rounds; the last cut-off was 95 points, in Nov 2024.",
    );
  });
  it("says when every recent round listed it", () => {
    expect(roundsSentence("Registered Nurses nec", core254499.rounds189)).toBe(
      "189 listed Registered Nurses nec in each of its last four rounds, at 70–80 points.",
    );
  });
  it("handles never listed and occasional", () => {
    expect(roundsSentence("X", neverListedCore.rounds189)).toBe(
      "189 hasn't listed X in any round we can read.",
    );
    expect(roundsSentence("X", occasionalCore.rounds189)).toMatch(
      /^189 listed X in 2 of its last four rounds, at /,
    );
  });
});

describe("poolSentence", () => {
  it("gives the total and most common score", () => {
    expect(poolSentence("Software Engineer", core261313)).toBe(
      "The 189 pool holds 9,464 EOIs; the most common score is 75 points (1,552 EOIs).",
    );
  });
  it("names the 190 and 491 totals when there is no 189 pool", () => {
    const text = poolSentence("X", no189PoolCore);
    expect(text).toMatch(/^No 189 EOIs are published for /);
    expect(text).toContain("190 pool holds");
    expect(text).toContain("491 pool holds");
  });
});

describe("mostCommonScore", () => {
  it("ignores masked cells and breaks ties by lower score", () => {
    expect(mostCommonScore({ "65": "<20", "70": "30", "75": "30" })).toEqual({
      score: 70,
      count: 30,
    });
    expect(mostCommonScore({ "65": "<20" })).toBeNull();
  });
});

describe("likeTheseSentence", () => {
  it("matches the report's sentence for the month six months back", () => {
    const expected = buildEoisLikeYours({
      occupationName: core261313.name,
      core: core261313,
      detail: detail261313,
      submittedMonth: "2026-04",
      asOf: "2026-10-31",
    });
    expect(expected.kind).toBe("ready");
    expect(likeTheseSentence(core261313.name, core261313, detail261313)).toBe(
      expected.kind === "ready" ? expected.sentence : null,
    );
  });
  it("is null without detail", () => {
    expect(likeTheseSentence("X", core261313, null)).toBeNull();
  });
});

describe("occupationSummary", () => {
  it("leaves out 189 and cohort sentences with no 189 pool", () => {
    const lines = occupationSummary(no189PoolCore, null);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.some((l) => l.startsWith("189 "))).toBe(false);
    expect(lines.some((l) => l.includes("EOIs submitted"))).toBe(false);
  });
  it("gives two or three sentences with detail", () => {
    const lines = occupationSummary(core261313, detail261313);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines.length).toBeLessThanOrEqual(3);
  });
});

describe("statusChips", () => {
  it("shows the 189 status and the federal list", () => {
    expect(statusChips(core261313, federal)).toEqual([
      { label: "189: No recent invitations", tone: "red" },
      { label: "190 eligible", tone: "neutral" },
      { label: "491 eligible", tone: "neutral" },
    ]);
  });
  it("flags a code that is not on the federal list", () => {
    const list: FederalList = {
      ...federal,
      entries: { "261313": { "190": false, "491": true } },
    };
    expect(statusChips(core261313, list)[1].label).toBe(
      "Not on the federal list for 190",
    );
  });
  it("leaves the state chips out without a federal list", () => {
    expect(statusChips(core261313, null)).toHaveLength(1);
  });
  it("leaves the 189 chip out with no 189 pool", () => {
    expect(statusChips(no189PoolCore, null)).toEqual([]);
  });
});

describe("sourceLine", () => {
  it("dates the snapshot to the month end", () => {
    expect(sourceLine(core261313)).toBe(
      "SkillSelect (Department of Home Affairs), snapshot 31 Oct 2026 · counts are EOIs (one person can hold several) · updated monthly",
    );
  });
});

describe("banned copy", () => {
  it("passes over every fixture and real record", () => {
    const cores = [
      noneRoundsCore,
      occasionalCore,
      regularCore,
      neverListedCore,
      no189PoolCore,
      allMaskedCore,
      noPoolsCore,
      core261313,
      core254499,
    ];
    for (const core of cores) {
      const detail = core === core261313 ? detail261313 : null;
      const strings = [
        ...occupationSummary(core, detail),
        roundsSentence(core.name, core.rounds189),
        poolSentence(core.name, core),
        sourceLine(core),
        ...statusChips(core, federal).map((c) => c.label),
      ];
      for (const s of strings) expect(s).not.toMatch(BANNED_COPY);
    }
  });
});
