import { describe, expect, it } from "vitest";
import { dataOnly, roundOnly, twoRounds } from "./__fixtures__/recap-facts";
import { loadRecap } from "./load-server";
import { buildRecapView } from "./recap-view";

const oct = loadRecap("2026-10");
const ctx = { recapMonths: ["2026-10"] };

describe("buildRecapView, October 2026", () => {
  const view = buildRecapView(oct, ctx);

  it("is a full recap headed by the round", () => {
    expect(view.kind).toBe("full");
    expect(view.path).toBe("/updates/2026-10/");
    expect(view.breadcrumb.map((c) => c.name)).toEqual([
      "Home",
      "Updates",
      "October 2026",
    ]);
    expect(view.hero.eyebrow).toBe("SkillSelect update · October 2026");
    expect(view.hero.h1).toBe(
      "SkillSelect October 2026: 20,000 EOIs invited in the 189 round",
    );
    expect(view.hero.pendingDataNote).toBeNull();
    expect(view.noRound).toBeNull();
  });

  it("opens with a dated answer and the highest published minimum", () => {
    expect(view.hero.answer).toMatch(/^As at 31 October 2026:/);
    expect(view.hero.answer).toContain(
      "Home Affairs invited 20,000 EOIs for the 189 visa on 15 October 2026, across 159 occupations",
    );
    expect(view.hero.answer).toContain(
      "At least 1,018 EOIs held a 190 invitation from Victoria, the highest published minimum of any state.",
    );
    expect(view.hero.answer).not.toMatch(/the most of any state/);
  });

  it("dates the page by its last update, round, data and sources", () => {
    expect(view.hero.dateline).toEqual([
      { label: "Updated", value: "24 Nov 2026" },
      { label: "189 round", value: "15 Oct 2026" },
      { label: "Data as at", value: "31 Oct 2026" },
      { label: "Sources checked", value: "17 Nov 2026" },
    ]);
    expect(view.hero.actions).toEqual([
      { label: "Check my points free", href: "/check/" },
      { label: "Questions", href: "#faq" },
    ]);
  });

  it("fills the passport from the round and the data", () => {
    expect(view.passport.stamp.text).toBe(
      "SUBCLASS 189 ROUND · 20,000 INVITED · 15 OCT 2026",
    );
    expect(view.passport.figures).toContainEqual(
      expect.objectContaining({ value: "about 167,000" }),
    );
    expect(view.passport.figures.map((f) => f.value)).toEqual([
      "159",
      "65–100",
      "about 167,000",
      "at least 14,876",
    ]);
    expect(view.passport.figures[2].label).toContain("166,555–167,904");
    expect(view.passport.mrz).toHaveLength(44);
  });

  it("shows the state figures as floors", () => {
    expect(
      view.states!["491"].tiles.find((t) => t.state === "TAS")!.figure,
    ).toBe("under 20 for each occupation");
  });

  it("draws the pool by points without a 0– range", () => {
    const bars = view.pool!.bars;
    expect(bars[0].score).toBe("35");
    expect(bars[0].label).toBe("under 552");
    expect(bars.find((b) => b.score === "65")).toMatchObject({
      label: "28,957–30,401",
      passMark: true,
    });
    expect(bars.at(-1)?.score).toBe("110");
  });

  it("lists the notable and not-listed occupations", () => {
    expect(view.notable!.rows).toHaveLength(10);
    expect(view.notable!.columns.previous).toBe("4 Jun 2026 round");
    expect(view.notable!.rows[0]).toMatchObject({
      occupation: { name: "Early Childhood (Pre-primary School) Teacher" },
      cutoff: "90",
      previous: { value: "Not listed", change: null },
      pool: "13,693",
      invited: "at least 198",
    });
    expect(view.notable!.rows[2].invited).toBe("under 20");
    expect(view.notListed!.items[0]).toMatchObject({
      occupation: { name: "Chef", href: "/occupations/chef-351311/" },
      pool: "10,773",
      note: "Not listed in the last 4 rounds; last listed 7 Nov 2024 at 85 points",
    });
  });

  it("compares the month with the one before, stating both numbers", () => {
    expect(view.compare!.columns).toEqual({
      label: "All occupations",
      previous: "30 Sep 2026",
      current: "31 Oct 2026",
    });
    expect(view.compare!.rows[1]).toEqual({
      label: "Holding a 189 invitation",
      previous: "under 286",
      current: "at least 14,876",
    });
    expect(view.compare!.cautions).toHaveLength(4);
    expect(view.movers!.pool!.fell.items[0].text).toBe("7,500 → 4,280");
    expect(view.movers!.cutoffs?.fell.items[0].text).toBe("85 → 65");
  });

  it("names the data, round and occupation-list sources", () => {
    expect(view.method.sources.map((s) => s.label)).toEqual([
      "SkillSelect EOI data",
      "Home Affairs SkillSelect invitation rounds",
      "Home Affairs skilled occupation list",
    ]);
    expect(view.method.link).toEqual({
      href: "/methodology/",
      text: "How we read the data",
    });
  });
});

describe("buildRecapView, round only", () => {
  const view = buildRecapView(roundOnly, ctx);

  it("shows round facts only and says the data comes later, once", () => {
    expect(view).toMatchObject({
      kind: "round-only",
      pool: null,
      notable: null,
      notListed: null,
      states: null,
      movers: null,
      compare: null,
      hero: {
        h1: "SkillSelect November 2026: 15,000 EOIs invited in the 189 round",
        pendingDataNote:
          "SkillSelect's November figures for pools and state invitations will be added here when they are published.",
      },
    });
    expect(view.hero.answer).toMatch(
      /^On 19 November 2026, Home Affairs invited 15,000 EOIs for the 189 visa, across 4 occupations/,
    );
    expect(view.passport.figures.map((f) => f.value)).toEqual(["4", "65–95"]);
    expect(view.hero.dateline.map((d) => d.label)).toEqual([
      "Updated",
      "189 round",
      "Sources checked",
    ]);
  });

  it("cites the Home Affairs round page alone", () => {
    expect(view.method.sources.map((s) => s.label)).toEqual([
      "Home Affairs SkillSelect invitation rounds",
    ]);
  });
});

describe("buildRecapView, data only", () => {
  it("says there was no round and links the last one only if its recap exists", () => {
    const view = buildRecapView(dataOnly, { recapMonths: ["2026-12"] });
    expect(view.kind).toBe("data-only");
    expect(view.noRound).toEqual({
      text: "No 189 round in December 2026; the last was on 15 Oct 2026",
      href: null,
    });
    const linked = buildRecapView(dataOnly, {
      recapMonths: ["2026-12", "2026-10"],
    });
    expect(linked.noRound?.href).toBe("/updates/2026-10/");
  });

  it("heads the page with the states and a data stamp", () => {
    const view = buildRecapView(dataOnly, ctx);
    expect(view.hero.h1).toBe(
      "SkillSelect December 2026: 190 and 491 invitations by state",
    );
    expect(view.hero.answer).toMatch(/^As at 31 December 2026:/);
    expect(view.hero.answer).toContain("Victoria, the most of any state");
    expect(view.passport.stamp.text).toBe(
      "SKILLSELECT · DEC 2026 · AS AT 31 DEC 2026",
    );
    expect(view.rounds).toEqual([]);
    expect(view.hero.pendingDataNote).toBeNull();
  });

  it("never invents last month's figures", () => {
    const view = buildRecapView(dataOnly, ctx);
    expect(view.movers).toBeNull();
    expect(
      view.compare!.rows.every((r) => r.previous === "Not available"),
    ).toBe(true);
    expect(view.notable!.columns.previous).toBe("Previous round");
    expect(view.notable!.rows[0].previous).toEqual({
      value: "—",
      change: null,
    });
    expect(view.notListed!.items[0].note).toBe(
      "Not listed in any of the 13 rounds in our data",
    );
  });
});

describe("buildRecapView, two rounds", () => {
  const view = buildRecapView(twoRounds, ctx);

  it("shows both rounds newest first and heads the page with the newest", () => {
    expect(view.rounds.map((r) => r.date)).toEqual([
      "2027-03-25",
      "2027-03-04",
    ]);
    expect(view.hero.h1).toBe(
      "SkillSelect March 2027: 6,000 EOIs invited in the 189 round",
    );
    expect(view.passport.stamp.text).toBe(
      "SUBCLASS 189 ROUND · 6,000 INVITED · 25 MAR 2027",
    );
    expect(view.hero.dateline[1]).toEqual({
      label: "189 rounds",
      value: "25 Mar 2027 and 4 Mar 2027",
    });
    expect(view.hero.answer).toContain(
      "An earlier round on 4 March 2027 invited 8,000 EOIs.",
    );
  });
});
