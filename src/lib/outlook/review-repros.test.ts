import { describe, expect, it } from "vitest";
import type { Profile } from "../migration";
import { PLANNER, profileInput } from "./__fixtures__/review-profiles";
import { buildOutlookView } from "./view";
import type { ReportOutlookView } from "./view";

function reportFor(profile: Profile): ReportOutlookView {
  const { core, detail, ...rest } = profileInput(profile);
  const view = buildOutlookView({
    ...rest,
    occupation: core
      ? { status: "ready", core, detail }
      : { status: "unavailable" },
  });
  if (view.kind !== "report") throw new Error(`got ${view.kind}`);
  return view;
}

const steps = (view: ReportOutlookView) =>
  view.route.steps.map((s) => `${s.title} [${s.sub}]`);

describe("a combined long-wait stamp names each visa (Management Accountant at 65)", () => {
  const view = reportFor({ ...PLANNER, occupation: "221112" });

  it("says which visas are the long wait and what 189 is", () => {
    expect(view.stamp).toMatchObject({ kind: "combined", label: "long-wait" });
    expect(view.headline.h1).toBe(
      "190 and 491 are a long wait at your points, while 189 isn't inviting your occupation.",
    );
    expect(view.wait).toBe(
      "190 and 491: unlikely without more points. 189: no invitations to measure.",
    );
  });

  it("never says no visa is inviting", () => {
    const texts = [view.headline.h1, view.wait, view.improve.banner ?? ""];
    for (const text of texts) expect(text).not.toMatch(/No visa is inviting/);
  });
});

describe("under 65 with no 189 data (Pressure Welder at 55)", () => {
  const view = reportFor({
    ...PLANNER,
    occupation: "322312",
    overseasYears: 0,
  });

  it("names the points 189 needs and each closed visa", () => {
    expect(view.headline.h1).toBe(
      "189 needs 10 more points, while 190 isn't open to you and 491 isn't inviting your occupation.",
    );
    expect(view.wait).toBe(
      "189: not possible until you reach 65. 190: not open to you. 491: no recent invitations.",
    );
  });

  it("leads the best line and route with the change that crosses 65", () => {
    expect(view.headline.best).toBe(
      "None yet. Superior English would take you to 75 points, so you can submit an EOI, though there isn't enough published 189 data to read your position.",
    );
    expect(steps(view)).toEqual([
      "Today [21 Nov 2026]",
      "Superior English [A new English test result at Superior level.]",
      "Submit EOI [189 + 190 + 491, at 75 points]",
      "Watch NSW, QLD, SA and WA [they still list you]",
    ]);
  });

  it("lists the changes plainly, and the read prints no no-data label", () => {
    expect(view.improve.mode).toBe("plain");
    expect(view.improveLabels).toBe(false);
    expect(view.templateRead).not.toMatch(/Not enough data/);
  });
});

describe("off the Home Affairs 189 list (Aquaculture Farmer at 55, founder 23 Nov 2026)", () => {
  const view = reportFor({
    ...PLANNER,
    occupation: "121111",
    overseasYears: 0,
  });

  it("says 189 isn't available, not that it needs points or data", () => {
    expect(view.headline.h1).toBe(
      "491 is a long wait at your points, while 189 isn't available for your occupation and 190 isn't open to you.",
    );
    expect(view.headline.fact).toBe(
      "The Home Affairs list doesn't include Aquaculture Farmer for 189, and neither 190 nor 491 is Competitive or better for you.",
    );
    expect(view.wait).toBe(
      "491: unlikely without more points. 189: not available for your occupation, so there's no 189 wait. 190: not open to you.",
    );
  });

  it("stamps 189 Not available in neutral ink, as the occupation page does", () => {
    expect(view.visas[0]).toMatchObject({
      stampWord: "Not available",
      label: "not-open",
      ink: "no-data",
      caption: "Not on the Home Affairs list for 189.",
    });
    expect(view.facts.visas[0].label).toBe("Not available");
  });

  it("points to 491 with nomination, never to a 189 EOI", () => {
    expect(view.headline.best).toBe(
      "None right now. More points could help 491, with state nomination. Watch QLD and WA, which still list your occupation.",
    );
    expect(view.improve.mode).toBe("off-list");
    expect(view.improve.banner).toBe(
      "More points won't open 189: the Home Affairs list doesn't include this occupation for it. They still count for 491, with state nomination.",
    );
    expect(steps(view)).toEqual([
      "Today [21 Nov 2026]",
      "Keep your EOI in [491]",
      "Check other occupations [you could be assessed in]",
      "Watch QLD and WA [they still list you]",
    ]);
    const all = JSON.stringify(view);
    expect(all).not.toMatch(
      /submit an EOI|opens 189|enough published 189 data/i,
    );
  });

  it("shows no 189 charts and marks 189 on the points page", () => {
    expect(view.cutoffs).toBeNull();
    expect(view.queue).toBeNull();
    expect(view.cutoffsEmpty).toBe(
      "189 isn't available for Aquaculture Farmer, so there are no 189 cut-offs to show.",
    );
    expect(view.pointsPage.totals[0].label).toBe(
      "189 Independent (not available for this occupation)",
    );
  });
});

describe("a reader under 18", () => {
  const view = reportFor({ ...PLANNER, dob: "2010-01-01" });

  it("names the 18-or-over rule in the route and the banner", () => {
    expect(steps(view)[1]).toBe(
      "Points-tested visas closed [they need you to be 18 or over]",
    );
    expect(view.improve.banner).toBe(
      "Points can't change this: 189, 190 and 491 all need you to be 18 or over when you're invited.",
    );
  });
});

describe("an expired English test", () => {
  const view = reportFor({ ...PLANNER, englishDate: "2023-01-01" });

  it("says so plainly in the headline and the wait", () => {
    expect(view.stamp).toMatchObject({
      kind: "combined",
      label: "not-eligible",
    });
    expect(view.headline.h1).toBe(
      "Your English test has expired, and 189, 190 and 491 all need a valid one.",
    );
    expect(view.wait).toBe(
      "Not possible until you retake your English test: a valid one is a basic requirement, not a points question.",
    );
  });

  it("leads the route with the English retake", () => {
    const best = view.improve.moves.find((m) => m.best);
    expect(best?.to.label).not.toBe("not-eligible");
    expect(view.route.steps[1].title).toBe("English retake");
    expect(view.headline.best).toMatch(/^None yet\. .+ which opens 189\.$/);
  });
});

describe("under 65 in an occupation 189 isn't inviting (Management Accountant, ruling R34)", () => {
  const at60 = reportFor({
    ...PLANNER,
    occupation: "221112",
    overseasYears: 3,
  });
  const at55 = reportFor({
    ...PLANNER,
    occupation: "221112",
    overseasYears: 0,
  });

  it("never says a change opens 189", () => {
    expect(at60.headline.best).toBe(
      "None yet. Superior English would take you to 80 points, so you can submit an EOI, though 189 isn't inviting your occupation.",
    );
    expect(JSON.stringify(at60)).not.toMatch(/opens 189/);
  });

  it("calls no change the biggest jump when none lifts the label", () => {
    expect(at60.templateRead).not.toMatch(/biggest jump/);
    expect(at60.templateRead).toMatch(
      /Superior English would take you to 80 points, so you could submit an EOI, though 189 isn't inviting Management Accountant\./,
    );
  });

  it("lists changes that reach 65 before ones that leave you short of it", () => {
    // "Both together" always closes the list.
    const reaches = at55.improve.moves
      .filter((m) => m.id !== "combined")
      .map((m) => m.to.label !== "not-eligible");
    expect(reaches[0]).toBe(true);
    expect(reaches).toEqual([...reaches].sort((a, b) => Number(b) - Number(a)));
  });

  it("keeps the capitals of move names in the next steps", () => {
    expect(at60.templateRead).toMatch(/Next steps: Superior English \(/);
    expect(at60.templateRead).not.toMatch(/superior English/);
  });
});

describe("a reader aged 45 or over", () => {
  const view = reportFor({ ...PLANNER, dob: "1980-01-01" });

  it("says above the changes that points can't fix age", () => {
    expect(view.improve.banner).toBe(
      "Points can't change this: 189, 190 and 491 all need you to be under 45 when you're invited.",
    );
  });

  it("says points can't change it, with no biggest jump", () => {
    expect(view.headline.h1).toBe(
      "189, 190 and 491 all need you to be under 45 when you're invited.",
    );
    expect(view.wait).toBe(
      "Not possible at 45 or over, and points can't change that.",
    );
    expect(view.headline.best).toBe(
      "None: 189, 190 and 491 all need you to be under 45 when you're invited.",
    );
    expect(view.improve.moves.filter((m) => m.best)).toEqual([]);
    expect(steps(view)).toEqual([
      "Today [21 Nov 2026]",
      "Points-tested visas closed [they need you to be under 45]",
      "Talk to a registered migration agent [about visas without this age limit]",
    ]);
  });
});

const MASKED_AS_NUMBER = /\b0–|\b0 to \d|about 0\b/;

describe("a lodged reader in a small pool (Economist at 75)", () => {
  const view = reportFor({
    ...PLANNER,
    occupation: "224311",
    english: "proficient",
    eoiDate: "2026-02-10",
  });

  it("never reads a summed masked count as a number", () => {
    const texts = [
      view.headline.fact,
      view.wait,
      view.visas[0].caption,
      view.templateRead,
    ];
    for (const text of texts) expect(text).not.toMatch(MASKED_AS_NUMBER);
    expect(view.headline.fact).toMatch(/Under \d+ EOIs are ahead of you/);
  });
});

describe("a lodged reader whose month published zero (Aarav, lodged)", () => {
  const view = reportFor({
    ...PLANNER,
    occupation: "254499",
    english: "superior",
    overseasYears: 8,
    eoiDate: "2026-03-14",
  });

  it("says no EOIs were published for the reader's month", () => {
    const month = view.queue?.groups.find((g) => g.key === "month");
    expect(month?.label).toBe("Your month: none published");
    expect(view.queue?.aria).toMatch(/none published in your month/);
  });
});

describe("an EOI submitted more than two years ago", () => {
  const view = reportFor({
    ...PLANNER,
    occupation: "254499",
    eoiDate: "2024-01-12",
  });

  it("says it has expired and plans as for a new EOI", () => {
    expect(view.whoDetail).toMatch(
      /EOI submitted 12 Jan 2024, expired 12 Jan 2026: a new EOI gets a new date of effect\./,
    );
    expect(view.route.steps[0].title).toBe("Today");
    expect(view.facts.lodged).toBe(false);
    expect(view.pointsPage.fields.map((f) => f.value).join(" ")).toMatch(
      /2024/,
    );
  });
});

describe("an EOI date after today", () => {
  const view = reportFor({
    ...PLANNER,
    occupation: "254499",
    eoiDate: "2026-12-30",
  });

  it("never shows negative days waiting", () => {
    const subs = view.route.steps.map((s) => s.sub).join(" ");
    expect(subs).not.toMatch(/-\d+ days/);
  });
});

describe("the template read", () => {
  it("calls no change a biggest jump when it leaves the label as it is", () => {
    const view = reportFor({ ...PLANNER, dob: "1980-01-01" });
    expect(view.templateRead).not.toMatch(/biggest jump/);
  });

  it("prints no no-data label on the no-core path", () => {
    // Proficient English: turning 33 leaves 70 points, a no-data label.
    const profile = { ...PLANNER, english: "proficient" as const };
    const { asOf, rules } = profileInput(profile);
    const view = buildOutlookView({
      profile,
      asOf,
      rules,
      occupation: { status: "unavailable" },
    });
    if (view.kind !== "report") throw new Error(view.kind);
    expect(view.templateRead).not.toMatch(/Not enough data|Too few to count/);
  });

  it("gives the combined fact one clause per visa group for a blocker", () => {
    const aged = reportFor({ ...PLANNER, dob: "1980-01-01" });
    expect(aged.headline.fact).toBe(
      "At 45 or over you can't be invited for 189, 190 or 491, whatever your points.",
    );
    const expired = reportFor({ ...PLANNER, englishDate: "2023-01-01" });
    expect(expired.headline.fact).toBe(
      "Without a valid English test you can't be invited for 189, 190 or 491, whatever your points.",
    );
  });
});
