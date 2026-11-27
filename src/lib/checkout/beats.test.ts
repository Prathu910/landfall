import { describe, expect, it } from "vitest";
import fixture from "../report-issue/__fixtures__/engine-input-261313.json";
import type { OccupationCore } from "../data/types";
import { BANNED_COPY } from "../report/copy";
import { checkoutBeats } from "./beats";

const SE = (fixture.data as unknown as { core: OccupationCore }).core;
const READER = {
  occupationName: "Software Engineer",
  points: 75,
  occupationsWithData: 479,
  stateCount: 8,
};

describe("checkoutBeats", () => {
  it("names what the report covers, from the reader's own data", () => {
    const beats = checkoutBeats({ ...READER, core: SE });
    expect(beats.items.map((item) => item.title)).toEqual([
      "Your place in the 189 queue",
      "Your estimated wait",
      "190 and 491 in all 8 states",
      "Your fastest ways to more points",
      "PDF in your inbox, and a private link",
    ]);
    expect(beats.items[0].text).toBe(
      `Among ${Number(SE.pool["189"]?.total).toLocaleString("en-AU")} Software Engineer EOIs, how many score above your 75, and how many sit at it.`,
    );
    expect(beats.items[1].text).toBe(
      `From the last ${SE.rounds189.length} invitation rounds, labelled as an estimate.`,
    );
  });

  it("counts the data that goes into it, never a literal", () => {
    const beats = checkoutBeats({ ...READER, core: SE });
    const months = Math.max(
      ...Object.values(SE.statusHistory).map((h) => Object.keys(h).length),
    );
    expect(beats.facts).toEqual([
      { value: months, label: "months of SkillSelect data" },
      { value: 479, label: "occupations" },
      { value: SE.rounds189.length, label: "189 rounds read" },
      { value: 8, label: "state programs" },
    ]);
  });

  it("never prints a masked count as a number", () => {
    const masked: OccupationCore = {
      ...SE,
      pool: { "189": { total: "<20", byScore: {} } },
      rounds189: [],
    };
    const beats = checkoutBeats({ ...READER, core: masked });
    expect(beats.items[0].text).toBe(
      "Among fewer than 20 Software Engineer EOIs, how many score above your 75, and how many sit at it.",
    );
    expect(beats.items[1].text).toBe(
      "From recent invitation rounds, labelled as an estimate.",
    );
    const none = checkoutBeats({ ...READER, core: { ...SE, pool: {} } });
    expect(none.items[0].text).toBe(
      "Among Software Engineer EOIs, how many score above your 75, and how many sit at it.",
    );
  });

  it("keeps to the copy rules", () => {
    const beats = checkoutBeats({ ...READER, core: SE });
    const text = beats.items.flatMap((item) => [item.title, item.text]);
    for (const line of [...text, ...beats.facts.map((f) => f.label)])
      expect(line).not.toMatch(BANNED_COPY);
  });
});
