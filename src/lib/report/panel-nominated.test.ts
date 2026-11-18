import { describe, expect, it } from "vitest";
import type { OccupationCore } from "../data/types";
import { BANNED_COPY } from "./copy";
import { allMaskedCore, noneRoundsCore } from "./__fixtures__/scorecard";
import { buildWhereYouStand } from "./panel-189";
import { buildNominatedPanel } from "./panel-nominated";

describe("buildNominatedPanel", () => {
  it("lists 12 months newest first with the exact copy", () => {
    const panel = buildNominatedPanel(noneRoundsCore, "190", 90);
    expect(panel.heading).toBe("Where you stand in the national 190 pool");
    expect(panel.invitationsHeading).toBe("Invitations recorded, all states");
    expect(panel.nationalNote).toBe(
      "This is the national pool. States select by their own rules.",
    );
    expect(panel.statesLink).toEqual({
      href: "#state-outlook-190",
      text: "See your state outlook",
    });
    expect(panel.invitations).toHaveLength(12);
    expect(panel.invitations[0]).toEqual({
      month: "2026-10",
      label: "Oct 2026",
      text: "at least 35 invited (as at Oct 2026)",
    });
    expect(panel.invitations[1].text).toBe(
      "at least 42 invited (as at Sep 2026)",
    );
    expect(panel.invitations[11].month).toBe("2025-11");
  });

  it("says none recorded for a covered month with no rows", () => {
    const panel = buildNominatedPanel(noneRoundsCore, "190", 90);
    expect(panel.invitations[2].text).toBe("none recorded (as at Aug 2026)");
  });

  it("says not published for an uncovered month", () => {
    const core: OccupationCore = {
      ...noneRoundsCore,
      statusHistory: {
        "190": { "2026-10": { INVITED: "35" } },
      },
    };
    const panel = buildNominatedPanel(core, "190", 90);
    expect(panel.invitations[1].text).toBe("not published (as at Sep 2026)");
  });

  it("says under 20 invited, so may be zero, for a masked month and never 'at least'", () => {
    const panel = buildNominatedPanel(allMaskedCore, "190", 90);
    expect(panel.invitations[0].text).toBe(
      "under 20 invited, so may be zero (as at Oct 2026)",
    );
    for (const row of panel.invitations) {
      expect(row.text).not.toMatch(/at least/);
      expect(row.text).not.toMatch(BANNED_COPY);
    }
  });

  it("works for 491 using the 491 pool", () => {
    const panel = buildNominatedPanel(noneRoundsCore, "491", 90);
    expect(panel.heading).toBe("Where you stand in the national 491 pool");
    expect(panel.nationalNote).toBe(
      "This is the national pool for state/territory nominated 491, excluding family sponsorship. States select by their own rules.",
    );
    expect(panel.whereYouStand).toEqual(
      buildWhereYouStand(noneRoundsCore, 90, "491"),
    );
    expect(panel.statesLink.href).toBe("#state-outlook-491");
  });

  it("puts the queue note under each national queue bar", () => {
    for (const visa of ["190", "491"] as const) {
      const stand = buildNominatedPanel(noneRoundsCore, visa, 90).whereYouStand;
      if ("unavailable" in stand) throw new Error("expected segments");
      expect(stand.queueNote.link).toEqual({
        href: "/methodology/#pool",
        text: "How to read the pool",
      });
    }
  });

  it("names the visa when no pool is published", () => {
    const core: OccupationCore = {
      ...noneRoundsCore,
      pool: { "189": noneRoundsCore.pool["189"] },
    };
    expect(buildNominatedPanel(core, "190", 90).whereYouStand).toEqual({
      unavailable:
        "No 190 EOIs are published for this occupation in this snapshot.",
    });
  });

  it("uses no banned copy", () => {
    const panel = buildNominatedPanel(noneRoundsCore, "190", 90);
    expect(JSON.stringify(panel)).not.toMatch(BANNED_COPY);
  });
});
