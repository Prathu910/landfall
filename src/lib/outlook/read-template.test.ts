import { describe, expect, it } from "vitest";
import { REPORT_BANNED_COPY } from "../report/copy";
import { SCENARIOS } from "./__fixtures__/scenarios";
import type { ScenarioId } from "./__fixtures__/scenarios";
import { scenarioInput } from "./__fixtures__/scenario-input";
import { evaluateProfile } from "./evaluate-profile";
import { buildFacts } from "./facts";
import { buildImprove } from "./improve";
import { checkRead } from "./read-contract";
import type { ReportFacts } from "./read-contract";
import { readTemplate } from "./read-template";
import { buildRoute } from "./route";
import { estimatedWait } from "./wait";

const IDS = Object.keys(SCENARIOS) as ScenarioId[];

function factsFor(id: ScenarioId): ReportFacts {
  const input = scenarioInput(id);
  const outlook = evaluateProfile(input);
  const improve = buildImprove(input, outlook);
  const route = buildRoute(input, outlook, improve);
  const wait = estimatedWait(outlook, input).text;
  return buildFacts(input, outlook, wait, improve, route);
}

describe("readTemplate", () => {
  it.each(IDS)("%s: passes checkRead", (id) => {
    const facts = factsFor(id);
    expect(checkRead(readTemplate(facts), facts)).toEqual({ ok: true });
  });

  it.each(IDS)("%s: uses no banned copy", (id) => {
    const facts = factsFor(id);
    expect(readTemplate(facts)).not.toMatch(REPORT_BANNED_COPY);
    expect(JSON.stringify(facts)).not.toMatch(REPORT_BANNED_COPY);
  });

  it("Priya: leads with the biggest jump and its label", () => {
    const read = readTemplate(factsFor("middle"));
    expect(read).toContain("Superior English");
    expect(read).toContain("80");
    expect(read).toContain("Very strong");
  });

  it("Rahul: says points aren't the problem and names the state", () => {
    const read = readTemplate(factsFor("notinv"));
    expect(read).toContain("More points won't fix this");
    expect(read).toContain("Northern Territory");
  });

  it("Dev: names no state as a route", () => {
    const read = readTemplate(factsFor("none"));
    expect(read).toContain("Your points aren't the problem");
    expect(read).not.toMatch(/Australian Capital Territory|ACT/);
  });
});

describe("buildFacts", () => {
  it("Priya: holds labels, points, counts and changes", () => {
    const facts = factsFor("middle");
    expect(facts.occupation).toBe("Registered Nurses nec");
    expect(facts.dataMonth).toBe("October 2026");
    expect(facts.stamp).toEqual({
      visa: "189",
      state: null,
      label: "Competitive",
    });
    expect(facts.visas.map((v) => [v.visa, v.label, v.points])).toEqual([
      ["189", "Competitive", 70],
      ["190", "Competitive", 75],
      ["491", "Competitive", 85],
    ]);
    expect(facts.counts).toContainEqual({
      name: "189 EOIs tied at your points",
      text: "1,841",
      numbers: [1841],
    });
    expect(facts.changes[0]).toEqual({
      title: "Superior English",
      fromPoints: 70,
      toPoints: 80,
      toLabel: "Very strong",
      month: null,
    });
  });

  it("holds no exact dates: only months and years", () => {
    for (const id of IDS) {
      const json = JSON.stringify(factsFor(id));
      expect(json).not.toMatch(
        /\b\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}/,
      );
      expect(json).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    }
  });

  it("holds no name", () => {
    for (const id of IDS) {
      const name = SCENARIOS[id].name;
      expect(JSON.stringify(factsFor(id))).not.toContain(name);
    }
  });

  it("Aarav: dated losses carry month and year", () => {
    const facts = factsFor("strong");
    expect(facts.changes).toContainEqual({
      title: "Turning 33 costs 5 points",
      fromPoints: 90,
      toPoints: 85,
      toLabel: "Very strong",
      month: "August 2027",
    });
  });

  it("Dev: names no state for a visa that isn't inviting (R7)", () => {
    const facts = factsFor("none");
    expect(facts.stamp.state).toBeNull();
    expect(facts.visas.map((v) => v.state)).toEqual([null, null, null]);
  });

  it("Sana: no core still gives the occupation name and data month", () => {
    const facts = factsFor("nodata");
    expect(facts.occupation).toBe("Greenkeeper");
    expect(facts.dataMonth).toBe("October 2026");
    expect(facts.stamp.label).toBe("Not enough data");
  });
});
