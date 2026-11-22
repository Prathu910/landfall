import { describe, expect, it } from "vitest";
import { REPORT_BANNED_COPY } from "../report/copy";
import { SCENARIOS } from "./__fixtures__/scenarios";
import type { ScenarioId } from "./__fixtures__/scenarios";
import { scenarioInput } from "./__fixtures__/scenario-input";
import type { OutlookInput } from "./evaluate-profile";
import { evaluateProfile } from "./evaluate-profile";
import { buildHeadline } from "./headline";
import type { Headline } from "./headline";
import { buildImprove } from "./improve";

function headlineOf(input: OutlookInput): Headline {
  const outlook = evaluateProfile(input);
  return buildHeadline(input, outlook, buildImprove(input, outlook));
}

const run = (id: ScenarioId) => headlineOf(scenarioInput(id));

const H1: Record<ScenarioId, string> = {
  strong: "You're at the front of the queue.",
  middle: "You're on the edge for 189.",
  long: "Your best chance is Tasmania, not 189.",
  notinv: "Your way in is state nomination, not 189.",
  below: "190 in Tasmania is open to you now. 189 isn't, yet.",
  nodata: "There isn't enough published data to judge your occupation.",
  none: "None of the three visas is inviting Internal Auditor right now.",
  lodged: "You're in the queue, right at the cut-off.",
};

const IDS = Object.keys(SCENARIOS) as ScenarioId[];

describe("buildHeadline", () => {
  it.each(IDS)("%s: h1", (id) => {
    expect(run(id).h1).toBe(H1[id]);
  });

  it.each(IDS)("%s: uses no banned copy", (id) => {
    const { who, h1, fact, best, why } = run(id);
    for (const text of [who, h1, fact, best, why]) {
      expect(text).not.toMatch(REPORT_BANNED_COPY);
    }
  });

  it("who line names the reader", () => {
    expect(run("middle").who).toBe("Priya's report.");
  });

  it("who line for an empty name is 'Your report.'", () => {
    const input = scenarioInput("middle");
    const profile = { ...input.profile, name: "" };
    expect(headlineOf({ ...input, profile }).who).toBe("Your report.");
  });

  it("Aarav: fact and best route", () => {
    const h = run("strong");
    expect(h.fact).toBe(
      "No Registered Nurses nec EOIs score higher than your 90, and your occupation's last 3 listed rounds all had cut-offs of 75 or less.",
    );
    expect(h.best).toBe("189 Independent, with NSW 190 as a strong backup.");
    expect(h.why).toBe(
      "Very strong: 90 is above your occupation's last 3 listed cut-offs (70, 75, 75), and fewer than 20 EOIs score higher.",
    );
  });

  it("Priya: fact counts rounds and tied EOIs", () => {
    const h = run("middle");
    expect(h.fact).toBe(
      "70 points was enough in 2 of the last 6 rounds, but 1,841 Registered Nurses nec EOIs are tied with you at 70.",
    );
    expect(h.best).toBe("189, with VIC 190 alongside.");
    expect(h.why).toContain(
      "Confirm your English and skills assessment dates.",
    );
  });

  it("Meera: the fact states the 189 position too", () => {
    const h = run("long");
    expect(h.fact).toContain("every recent 189 cut-off (85 to 90)");
    expect(h.fact).toContain("2,444–2,463 EOIs ahead");
    expect(h.fact).toContain("Tasmania");
    expect(h.best).toBe(
      "190 or 491 in Tasmania (we're still checking Tasmania's rules).",
    );
    expect(h.why).toMatch(
      /^Stamp shows your best visa\. 190 Tasmania is Competitive/,
    );
    expect(h.why).toContain("189 is Long wait");
  });

  it("Rahul: the fact says 189 isn't listing the occupation", () => {
    const h = run("notinv");
    expect(h.fact).toContain(
      "189 hasn't listed Software Engineer in any of the last 4 rounds, since November 2024.",
    );
    expect(h.fact).toContain("Northern Territory");
    expect(h.why).toContain("189 is Not currently invited");
  });

  it("Arjun: the fact gives the 65 minimum and nomination points", () => {
    const h = run("below");
    expect(h.fact).toBe(
      "189 needs at least 65 points and you have 60. State nomination adds 5 (190) or 15 (491), which takes you to 65 and 75.",
    );
    expect(h.best).toBe("190 in Tasmania now; 189 after your English retake.");
  });

  it("Sana: no data falls back on list membership", () => {
    const h = run("nodata");
    expect(h.fact).toBe(
      "SkillSelect hasn't published any EOI counts, 189 rounds or state invitations for Greenkeeper, so there's nothing to compare you with.",
    );
    expect(h.best).toBe(
      "190 or 491 in Western Australia (your occupation is on its list).",
    );
  });

  it("Dev: nothing suits watches the listing states", () => {
    const h = run("none");
    expect(h.fact).toBe(
      "189 hasn't listed Internal Auditor since November 2024, and no state has invited it for 190 or 491 in the last 6 months.",
    );
    expect(h.best).toBe(
      "None right now. Stay in the pool and watch SA and WA, which still list your occupation.",
    );
  });

  it("very strong with no published pool claims no count of EOIs", () => {
    const input = scenarioInput("strong");
    const core = input.core ? { ...input.core, pool: {} } : null;
    const h = headlineOf({ ...input, core });
    expect(h.fact).toBe(
      "Your 90 is above every cut-off in your occupation's last 3 listed rounds (75 or less), and no 189 pool is published for Registered Nurses nec.",
    );
    expect(h.why).not.toContain("fewer than 20");
  });

  it("Kavya: the fact counts EOIs ahead of a lodged EOI", () => {
    const h = run("lodged");
    expect(h.fact).toBe(
      "The October 2026 round invited Registered Nurses nec down to 70 points, earliest dates first. Roughly 870 to 970 EOIs are ahead of you: 107–126 with higher scores, and about 760 to 840 at 70 submitted before March 2026.",
    );
    expect(h.best).toBe(
      "Stay in the 189 queue; Superior English moves you to the front.",
    );
  });
});
