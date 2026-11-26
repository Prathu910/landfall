import { describe, expect, it } from "vitest";
import { dataOnly, twoRounds } from "./__fixtures__/recap-facts";
import { loadRecap } from "./load-server";
import { occupationLinker } from "./round-view";
import { buildStateSection, shadeBand, stateLeader } from "./state-view";

const oct = loadRecap("2026-10");
const link = occupationLinker();

describe("shadeBand", () => {
  it("uses the mockup's four bands", () => {
    expect([0, 19, 20, 199, 200, 699, 700, 5000].map(shadeBand)).toEqual([
      1, 1, 2, 2, 3, 3, 4, 4,
    ]);
  });
});

describe("buildStateSection", () => {
  const s190 = buildStateSection("190", oct.data!, oct.month, link);
  const s491 = buildStateSection("491", oct.data!, oct.month, link);

  it("shows each state as a floor with its hidden counts", () => {
    expect(s190.tiles.map((t) => t.state)).toEqual([
      "NSW",
      "VIC",
      "QLD",
      "WA",
      "SA",
      "TAS",
      "ACT",
      "NT",
    ]);
    const nsw = s190.tiles[0];
    expect(nsw).toMatchObject({
      name: "New South Wales",
      figure: "at least 790",
      hidden: "+ 324 hidden small counts",
      shade: 4,
      top: {
        label: "Highest published minimum",
        occupation: { name: "Registered Nurses nec" },
        figure: "at least 327",
      },
    });
    expect(s190.map.NSW).toEqual({ big: "790", small: "at least", shade: 4 });
  });

  it("never shows an all-masked state as 0", () => {
    const tas = s491.tiles.find((t) => t.state === "TAS")!;
    expect(tas.figure).toBe("under 20 for each occupation");
    expect(tas.top).toBeNull();
    expect(s491.map.TAS).toEqual({
      big: "<20",
      small: "each occupation",
      shade: 1,
    });
  });

  it("keeps State not recorded apart from the states", () => {
    expect(s190.notRecorded).toMatchObject({
      label: "State not recorded",
      figure: "at least 243",
    });
    expect(s190.tiles.some((t) => (t.state as string) === "ANY")).toBe(false);
  });

  it("says every state was under 20 last month when every floor was 0", () => {
    expect(s190.heading).toBe("190 invitations by state, October 2026");
    expect(s190.lead).toContain(
      "On 30 September 2026, every state was under 20 for each occupation.",
    );
  });

  it("copies the nominations table as published, as a different measure", () => {
    expect(s190.nominations?.heading).toBe(
      "Home Affairs nominations, 2026–27 program year to 30 Sep 2026",
    );
    expect(s190.nominations?.cells.find((c) => c.state === "ACT")?.value).toBe(
      "<5",
    );
    expect(s190.nominations?.caption).toMatch(/^A different measure:/);
    expect(s190.nominations?.caption).toContain('"<5" is published that way.');
  });

  it("says nothing about last month when it wasn't fetched", () => {
    const view = buildStateSection("491", dataOnly.data!, dataOnly.month, link);
    expect(view.lead).not.toContain("every state was under 20");
    expect(view.tiles.every((t) => t.previous === null)).toBe(true);
    expect(view.tiles.find((t) => t.state === "NT")?.figure).toBe(
      "none published",
    );
    expect(view.nominations).toBeNull();
  });

  it("gives last month's floor per state when it was fetched", () => {
    const view = buildStateSection("190", twoRounds.data!, "2027-03", link);
    expect(view.tiles[0].previous).toBe(
      "28 Feb 2027: under 20 for each occupation",
    );
  });
});

describe("buildStateSection on a state page", () => {
  it("links each tile to its state page and marks the current state", () => {
    const view = buildStateSection("190", oct.data!, oct.month, link, {
      stateHref: (state) => `/states/${state.toLowerCase()}/`,
      current: "TAS",
      heading: "EOIs holding a 190 invitation, by state, 31 Oct 2026",
    });
    expect(view.heading).toBe(
      "EOIs holding a 190 invitation, by state, 31 Oct 2026",
    );
    expect(view.tiles.map((t) => t.href)).toContain("/states/tas/");
    expect(view.tiles.filter((t) => t.current).map((t) => t.state)).toEqual([
      "TAS",
    ]);
  });

  it("links nothing for a caller that gives no state pages", () => {
    const view = buildStateSection("190", oct.data!, oct.month, link);
    expect(view.tiles.every((t) => t.href === null && !t.current)).toBe(true);
  });
});

describe("stateLeader", () => {
  it("claims the most only above every other state's range", () => {
    expect(stateLeader(oct.data!.states["190"])).toEqual({
      state: "VIC",
      floor: 1018,
      strictlyMost: false,
    });
    expect(stateLeader(dataOnly.data!.states["190"])).toMatchObject({
      state: "VIC",
      strictlyMost: true,
    });
  });
});
