import { describe, expect, it } from "vitest";
import { REPORT_BANNED_COPY } from "../report/copy";
import { scenarioInput } from "./__fixtures__/scenario-input";
import type { ScenarioId } from "./__fixtures__/scenarios";
import type { OutlookLabel } from "./labels";
import { buildOutlookView } from "./view";
import type { OccupationState, OutlookView } from "./view";

type ReportView = Extract<OutlookView, { kind: "report" }>;

/** Sana's occupation has no published data, so the report gets "unavailable". */
function viewOf(
  id: ScenarioId,
  occupation?: OccupationState,
  profile = scenarioInput(id).profile,
): OutlookView {
  const { core, detail, ...rest } = scenarioInput(id);
  const state: OccupationState = core
    ? { status: "ready", core, detail }
    : { status: "unavailable" };
  return buildOutlookView({
    ...rest,
    profile,
    occupation: occupation ?? state,
  });
}

function reportOf(id: ScenarioId, occupation?: OccupationState): ReportView {
  const view = viewOf(id, occupation);
  if (view.kind !== "report") throw new Error(`${id} is ${view.kind}`);
  return view;
}

/** Every string anywhere in the view, with the path it was found at. */
function stringsOf(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => stringsOf(item, `${path}[${i}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      stringsOf(item, `${path}.${key}`),
    );
  }
  return [];
}

type Row = {
  id: ScenarioId;
  stamp: { kind: string; visa?: string; state?: string | null };
  stampLabel: OutlookLabel;
  cards: [OutlookLabel, OutlookLabel, OutlookLabel];
  wait: string;
  bestMove: string | null;
};

// Data-derived (snapshot skillselect-2026-10-31, asOf 2026-11-21).
const ROWS: Row[] = [
  {
    id: "strong",
    stamp: { kind: "single", visa: "189", state: null },
    stampLabel: "very-strong",
    cards: ["very-strong", "strong", "strong"],
    wait: "The next 189 round.",
    bestMove: null,
  },
  {
    id: "middle",
    stamp: { kind: "single", visa: "189", state: null },
    stampLabel: "competitive",
    cards: ["competitive", "competitive", "competitive"],
    wait: "Uncertain. Possible in a round that goes down to 70, like Oct 2026.",
    bestMove: "english-superior",
  },
  {
    id: "long",
    stamp: { kind: "single", visa: "190", state: "TAS" },
    stampLabel: "competitive",
    cards: ["long-wait", "competitive", "competitive"],
    wait: "States don't publish a queue. Tasmania invited at or below your points in 6 of the last 6 months.",
    bestMove: "combined",
  },
  {
    id: "notinv",
    stamp: { kind: "single", visa: "190", state: "NT" },
    stampLabel: "competitive",
    cards: ["not-invited", "competitive", "competitive"],
    wait: "States don't publish a queue. The Northern Territory invited at or below your points in 6 of the last 6 months.",
    bestMove: null,
  },
  {
    id: "below",
    stamp: { kind: "single", visa: "190", state: "TAS" },
    stampLabel: "competitive",
    cards: ["not-eligible", "competitive", "long-wait"],
    wait: "States don't publish a queue. Tasmania invited at or below your points in 6 of the last 6 months.",
    bestMove: "english-superior",
  },
  {
    id: "nodata",
    stamp: { kind: "combined" },
    stampLabel: "no-data",
    cards: ["no-data", "no-data", "no-data"],
    wait: "We can't estimate one without data.",
    bestMove: null,
  },
  {
    id: "none",
    stamp: { kind: "combined" },
    stampLabel: "not-invited",
    cards: ["not-invited", "not-invited", "not-invited"],
    wait: "No 189 invitations to measure.",
    bestMove: null,
  },
  {
    id: "lodged",
    stamp: { kind: "single", visa: "189", state: null },
    stampLabel: "competitive",
    cards: ["competitive", "competitive", "competitive"],
    wait: "Roughly 870 to 970 EOIs ahead. At the latest pace, about 3 to 4 rounds, so plan for 1 to 2 years at 70 (estimate).",
    bestMove: "english-superior",
  },
];

describe("buildOutlookView scenarios", () => {
  it.each(ROWS)("$id", (row) => {
    const view = reportOf(row.id);
    expect(view.stamp).toMatchObject({ ...row.stamp, label: row.stampLabel });
    expect(view.visas.map((card) => card.label)).toEqual(row.cards);
    expect(view.wait).toBe(row.wait);
    const best = view.improve.moves.find((move) => move.best);
    expect(best?.id ?? null).toBe(row.bestMove);
  });

  it("rings and bottoms the stamp", () => {
    expect(reportOf("strong")).toMatchObject({
      stampRing: "SUBCLASS 189",
      stampBottom: "OCT 2026 • 90 POINTS",
    });
    expect(reportOf("long")).toMatchObject({
      stampRing: "SUBCLASS 190 TAS",
      stampBottom: "OCT 2026 • 85 POINTS",
    });
    expect(reportOf("none")).toMatchObject({
      stampRing: "189 • 190 • 491",
      stampBottom: "OCT 2026 • 75 POINTS",
    });
  });

  it("adds the who sub-line under the name", () => {
    const strong = reportOf("strong");
    expect(strong.headline.who).toBe("Aarav's report.");
    expect(strong.whoDetail).toBe(
      "Registered Nurses nec, 90 points, onshore in NSW. Data to October 2026.",
    );
    expect(reportOf("long").whoDetail).toBe(
      "Early Childhood (Pre-primary School) Teacher, 80 points, offshore. Data to October 2026.",
    );
    expect(reportOf("lodged").whoDetail).toBe(
      "Registered Nurses nec, 70 points, offshore. EOI submitted 12 Mar 2026. Data to October 2026.",
    );
  });

  it("builds Aarav's three visa cards", () => {
    expect(reportOf("strong").visas).toEqual([
      {
        visa: "189",
        shape: "rect",
        top: "189 ANY STATE",
        stampWord: "Very strong",
        points: 90,
        label: "very-strong",
        title: "189 Independent",
        caption: "No EOIs ahead of you.",
        flagText: null,
        flagHref: null,
      },
      {
        visa: "190",
        shape: "hex",
        top: "190 NSW",
        stampWord: "Strong",
        points: 95,
        label: "strong",
        title: "190 Nominated",
        caption:
          "New South Wales invited 327–346 EOIs at or below your points in October 2026.",
        flagText: null,
        flagHref: null,
      },
      {
        visa: "491",
        shape: "oval",
        top: "491 VIC",
        stampWord: "Strong",
        points: 105,
        label: "strong",
        title: "491 Regional",
        caption:
          "Victoria invited 98–136 EOIs at or below your points in October 2026.",
        flagText: "We're still checking Victoria's rules.",
        flagHref: null,
      },
    ]);
  });

  it("names no state for a visa that isn't inviting (ruling R7)", () => {
    const cards = reportOf("none").visas;
    expect(cards.map((card) => card.top)).toEqual([
      "189 ANY STATE",
      "190 ANY STATE",
      "491 ANY STATE",
    ]);
    expect(cards.map((card) => card.stampWord)).toEqual([
      "Not invited",
      "Not invited",
      "Not invited",
    ]);
    expect(cards[0].caption).toBe(
      "Not listed since November 2024. 154–192 EOIs score higher.",
    );
    expect(cards[1].caption).toBe(
      "No state open to you invited your occupation in the last 6 months.",
    );
    expect(cards.every((card) => card.flagText === null)).toBe(true);
  });

  it("names a long-wait state and its latest month", () => {
    const card = reportOf("below").visas[2];
    expect(card).toMatchObject({ top: "491 SA", stampWord: "Long wait" });
    expect(card.caption).toBe(
      "South Australia invited under 20 EOIs at or below your points in June 2026.",
    );
  });

  it("says when a state is named from its list (ruling R16)", () => {
    const cards = reportOf("nodata").visas;
    expect(cards.map((card) => [card.top, card.stampWord])).toEqual([
      ["189 ANY STATE", "No data"],
      ["190 WA", "On WA list"],
      ["491 WA", "On WA list"],
    ]);
    expect(cards.map((card) => card.caption)).toEqual([
      "No published pool or rounds.",
      "Listed by Western Australia.",
      "Check Western Australia's regional program.",
    ]);
  });

  it("captions 189 for points below the pass mark and for a lodged EOI", () => {
    expect(reportOf("below").visas[0].caption).toBe("You need 5 more points.");
    expect(reportOf("lodged").visas[0].caption).toBe(
      "Waiting 254 days. Roughly 870 to 970 EOIs ahead.",
    );
    expect(reportOf("middle").visas[0].caption).toBe(
      "107–126 EOIs ahead of you.",
    );
  });

  it("shows charts when there is data and plain lines when there isn't", () => {
    const strong = reportOf("strong");
    expect(strong.cutoffs).not.toBeNull();
    expect(strong.cutoffsEmpty).toBeNull();
    expect(strong.queue).not.toBeNull();
    expect(strong.queueEmpty).toBeNull();
    const nodata = reportOf("nodata");
    expect(nodata.cutoffs).toBeNull();
    expect(nodata.cutoffsEmpty).toBe(
      "No 189 round in the published results lists Greenkeeper, so there are no cut-offs to show.",
    );
    expect(nodata.queue).toBeNull();
    expect(nodata.queueEmpty).toBe(
      "SkillSelect hasn't published any 189 EOI counts for Greenkeeper, so there's no queue to show.",
    );
  });

  it("reads a summed under-20 count as under, in the card and the facts", () => {
    const view = reportOf("long");
    const card = view.visas[2];
    expect(card.caption).toBe(
      "Tasmania invited under 39 EOIs at or below your points in October 2026.",
    );
    const count = view.facts.counts.find((c) => c.name.startsWith("491 "));
    expect(count).toEqual({
      name: "491 Tasmania invitations at or below your points in October 2026",
      text: "under 39",
      numbers: [39],
    });
    expect(card.caption).toContain(count?.text);
    expect(JSON.stringify(view)).not.toContain("0–");
  });

  it("uses the not-moving queue when 189 isn't inviting", () => {
    expect(reportOf("none").queue?.aria).toContain("isn't being invited");
  });

  it("renders plain mode label-free", () => {
    expect(reportOf("nodata").improveLabels).toBe(false);
    expect(reportOf("middle").improveLabels).toBe(true);
  });

  it("carries the facts and their template read", () => {
    const view = reportOf("long");
    expect(view.facts.stamp).toEqual({
      visa: "190",
      state: "Tasmania",
      label: "Competitive",
    });
    expect(view.templateRead.length).toBeGreaterThan(0);
    expect(view.dataMonth).toBe("October 2026");
  });

  it("has the ten method lines and the footer", () => {
    const view = reportOf("strong");
    expect(view.methodLines).toHaveLength(10);
    expect(view.methodLines[0]).toBe(
      "Very strong: your points are above every 189 cut-off in your occupation's last 3 listed rounds, and fewer than 20 EOIs score higher.",
    );
    expect(view.methodLines[7]).toBe(
      "The stamp shows your best visa. If none is Competitive or better, it covers all three.",
    );
    expect(view.methodLines[9]).toBe(
      "Future points assume today's points test; the announced reforms could change them.",
    );
    expect(view.footer).toBe(
      "This is our best reading of the data, not a guarantee. It comes from published SkillSelect figures up to October 2026. Home Affairs and the states can change round sizes, cut-offs and rules at any time, so your real result may be different. MigrateLens isn't a registered migration agent; for advice on your own case, talk to one.",
    );
  });

  it.each(ROWS.map((row) => row.id))("%s has no banned copy", (id) => {
    const { footer, ...rest } = reportOf(id);
    const banned = stringsOf(rest).filter(([, text]) =>
      REPORT_BANNED_COPY.test(text),
    );
    expect(banned).toEqual([]);
    expect(footer.replace("not a guarantee", "")).not.toMatch(
      REPORT_BANNED_COPY,
    );
  });
});

describe("buildOutlookView states", () => {
  it("is loading while the occupation loads (review focus 1)", () => {
    expect(viewOf("strong", { status: "loading" })).toEqual({
      kind: "loading",
    });
  });

  it("takes the no-core path when the load failed (review focus 1)", () => {
    const view = reportOf("strong", { status: "unavailable" });
    expect(view.stamp).toEqual({
      kind: "combined",
      label: "no-data",
      tooFew: false,
    });
    expect(view.stampRing).toBe("189 • 190 • 491");
    expect(view.cutoffs).toBeNull();
    expect(view.queue).toBeNull();
    expect(view.dataMonth).toBe("October 2026");
    expect(view.stampBottom).toBe("OCT 2026 • 90 POINTS");
    expect(view.whoDetail).toBe(
      "Registered Nurses nec, 90 points, onshore in NSW. Data to October 2026.",
    );
  });

  it("is points-only without an occupation (review focus 2)", () => {
    const profile = { ...scenarioInput("strong").profile, occupation: "" };
    const view = viewOf("strong", { status: "unavailable" }, profile);
    expect(view).toMatchObject({
      kind: "points-only",
      line: "Choose an occupation to see how your points compare.",
    });
    if (view.kind !== "points-only") return;
    expect(view.points.base).toBe(90);
    expect(view.line).not.toMatch(REPORT_BANNED_COPY);
    expect(view.pointsPage.fields[1]).toEqual({
      label: "Occupation",
      value: "No occupation chosen",
    });
    expect(view.footer).toMatch(
      /^This is our best reading of the data, not a guarantee\. It comes from published SkillSelect figures up to October 2026\./,
    );
    // The printed page footers name the same month.
    expect(view.dataMonth).toBe("October 2026");
  });

  it("carries the evidence and the points page with a report", () => {
    const view = reportOf("middle");
    expect(view.evidence.rounds?.you).toBe(70);
    expect(view.pointsPage.totals[0]).toEqual({
      points: 70,
      label: "189 Independent",
    });
    expect(view.pointsPage.mrz[1]).toMatch(/<<OCT2026</);
  });

  it("is points-only without an occupation even while loading", () => {
    const profile = { ...scenarioInput("strong").profile, occupation: "" };
    const view = viewOf("strong", { status: "loading" }, profile);
    expect(view.kind).toBe("points-only");
  });

  it("shows points only, no stamp, when the published data failed to load", () => {
    const view = viewOf("middle", { status: "load-failed" });
    expect(view).toMatchObject({
      kind: "points-only",
      line: "We couldn't load the published data. Reload to try again.",
    });
    if (view.kind !== "points-only") return;
    expect(view.points.base).toBe(70);
    expect(view.line).not.toMatch(REPORT_BANNED_COPY);
    // A network failure is never reported as a SkillSelect fact.
    expect(JSON.stringify(view)).not.toMatch(/hasn't published|No data/);
    expect(view.pointsPage.fields[1]).toEqual({
      label: "Occupation",
      value: "Registered Nurses nec (254499)",
    });
  });
});
