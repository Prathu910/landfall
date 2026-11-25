import { describe, expect, it } from "vitest";
import { roundOnly, twoRounds } from "./__fixtures__/recap-facts";
import { loadRecap } from "./load-server";
import { buildRoundView, occupationLinker, round189Total } from "./round-view";

const oct = loadRecap("2026-10");
const link = occupationLinker();

describe("buildRoundView", () => {
  const view = buildRoundView("2026-10-15", oct.rounds["2026-10-15"], link);

  it("states the round's own facts", () => {
    expect(view.heading).toBe("The 15 October 2026 round");
    expect(view.total).toBe("20,000");
    expect(view.listed).toBe("159");
    expect(view.cutoffRange).toBe("65–100");
    expect(view.lead).toContain(
      "Home Affairs invited 20,000 EOIs for the 189 visa on 15 October 2026.",
    );
    expect(view.lead).toContain("The previous 189 round was on 4 June 2026.");
    expect(view.lead).toContain(
      "For 44 of them the lowest score invited was 65, the pass mark; the highest was 100.",
    );
  });

  it("lists every occupation with the previous round beside it", () => {
    expect(view.table.rows).toHaveLength(159);
    expect(view.table.columns.previous).toBe("4 Jun 2026 round");
    const actuary = view.table.rows.find(
      (r) => r.occupation.name === "Actuary",
    )!;
    expect(actuary).toMatchObject({
      occupation: { href: "/occupations/actuary-224111/" },
      cutoff: "85",
      previous: { value: "90", change: { direction: "fell", text: "−5" } },
      tieBreak: "3 Sep 2026",
    });
    const early = view.table.rows.find((r) =>
      r.occupation.name.startsWith("Early Childhood"),
    )!;
    expect(early.previous).toEqual({ value: "Not listed", change: null });
  });

  it("compares with the previous round", () => {
    expect(view.newlyListed?.heading).toBe(
      "Listed this round, not on 4 Jun 2026 (22)",
    );
    expect(view.notListedAgain?.items.map((o) => o.name)).toEqual([
      "Fitter and Turner",
      "Organisational Psychologist",
      "Thoracic Medicine Specialist",
    ]);
    expect(view.moves?.fell.items[0]).toEqual({
      occupation: {
        name: "Welfare Centre Manager",
        href: "/occupations/welfare-centre-manager-134214/",
      },
      text: "85 → 65",
    });
    expect(view.moves?.fell.caption).toBe(
      "78 occupations fell, 50 were unchanged.",
    );
    expect(view.moves?.rose.caption).toBe("9 occupations rose.");
  });

  it("sizes the distribution bars against the tallest", () => {
    const first = view.distribution.bars[0];
    expect(first).toEqual({ score: "65", occupations: "44", share: 1 });
  });
});

describe("rounds without names or a previous round", () => {
  it("leaves an unmatched name unlinked", () => {
    const view = buildRoundView(
      "2026-11-19",
      roundOnly.rounds["2026-11-19"],
      link,
    );
    const patho = view.table.rows.find((r) => r.occupation.name === "Patho");
    expect(patho?.occupation.href).toBeNull();
  });

  it("drops the comparison when no earlier round is stored", () => {
    const view = buildRoundView(
      "2027-03-04",
      twoRounds.rounds["2027-03-04"],
      link,
    );
    expect(view.table.columns.previous).toBeNull();
    expect(view.table.rows.every((r) => r.previous === null)).toBe(true);
    expect(view.moves).toBeNull();
    expect(view.newlyListed).toBeNull();
    expect(view.cutoffRange).toBe("70");
    expect(view.lead).toContain(
      "For both of them the lowest score invited was 70.",
    );
    expect(view.lead).not.toContain("previous 189 round");
  });

  it("links only occupations that have a page when told which do", () => {
    const only = occupationLinker(new Set(["254499"]));
    expect(only({ code: "254499", name: "Registered Nurses nec" }).href).toBe(
      "/occupations/registered-nurses-nec-254499/",
    );
    expect(only({ code: "261313", name: "Software Engineer" }).href).toBeNull();
  });

  it("reads the 189 total from the totals table", () => {
    expect(round189Total(oct.rounds["2026-10-15"])).toBe(20000);
  });
});
