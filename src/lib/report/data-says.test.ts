import { describe, expect, it } from "vitest";
import type { StateCode } from "../data/types";
import type { Group } from "../state-outlook/outlook";
import { BANNED_COPY } from "./copy";
import {
  bottomLine189,
  buildCutoffChart,
  buildLevers,
  nominatedChip,
  stateLine,
  stateStanding,
} from "./data-says";
import type { ChangeItem } from "./what-could-change";

type Round = { date: string; cutoff: number | null };
const r = (date: string, cutoff: number | null): Round => ({ date, cutoff });

// Newest first, as the dataset stores them.
const NONE: Round[] = [
  r("2026-10-15", null),
  r("2026-06-04", null),
  r("2025-11-13", null),
  r("2025-08-21", null),
  r("2024-11-07", 95),
  r("2024-09-05", 100),
];
const REGULAR: Round[] = [
  r("2026-10-15", 80),
  r("2026-06-04", 75),
  r("2025-11-13", 75),
  r("2025-08-21", 85),
  r("2024-11-07", 70),
  r("2024-09-05", 75),
];
const OCCASIONAL: Round[] = [
  r("2026-10-15", 90),
  r("2026-06-04", null),
  r("2025-11-13", 85),
  r("2025-08-21", null),
];

const tiles = (pairs: [StateCode, Group][]) =>
  pairs.map(([state, group]) => ({ state, group }));

describe("bottomLine189", () => {
  it("says when 189 hasn't listed the occupation, with the last cut-off", () => {
    expect(bottomLine189("Software Engineer", NONE, 75)).toBe(
      "189 hasn't listed Software Engineer in its last four rounds; the last cut-off was 95 points, in Nov 2024.",
    );
  });

  it("says when no round we can read lists it", () => {
    expect(bottomLine189("Barrister", [r("2026-10-15", null)], 75)).toBe(
      "189 hasn't listed Barrister in any round we can read.",
    );
  });

  it("gives the range of recent cut-offs when the points reach the latest", () => {
    expect(bottomLine189("Registered Nurses nec", REGULAR, 90)).toBe(
      "189 listed Registered Nurses nec in each of its last four rounds, at 75–85 points, and you have 90.",
    );
  });

  it("names the latest cut-off when it is above the points", () => {
    expect(bottomLine189("Secondary School Teacher", REGULAR, 75)).toBe(
      "189 listed Secondary School Teacher in each of its last four rounds; the latest cut-off was 80 points, above your 75.",
    );
  });

  it("counts the listings for occasional invitations, and one cut-off is not a range", () => {
    expect(bottomLine189("Chef", OCCASIONAL, 95)).toBe(
      "189 listed Chef in 2 of its last four rounds, at 85–90 points, and you have 95.",
    );
    expect(
      bottomLine189("Chef", [r("2026-10-15", 90), r("2026-06-04", null)], 95),
    ).toBe(
      "189 listed Chef in 1 of its last 2 rounds, at 90 points, and you have 95.",
    );
  });
});

describe("bottomLine189 with fewer than four rounds", () => {
  it("counts the rounds there are", () => {
    expect(bottomLine189("Chef", [r("2026-10-15", 80)], 95)).toBe(
      "189 listed Chef in its last round, at 80 points, and you have 95.",
    );
    expect(
      bottomLine189("Chef", [r("2026-10-15", null), r("2026-06-04", null)], 95),
    ).toBe("189 hasn't listed Chef in any round we can read.");
    expect(
      bottomLine189(
        "Chef",
        [r("2026-10-15", null), r("2026-06-04", null), r("2025-01-01", 90)],
        95,
      ),
    ).toBe(
      "189 listed Chef in 1 of its last 3 rounds, at 90 points, and you have 95.",
    );
  });
});

describe("stateStanding and the state line", () => {
  it("picks the best group and the states in it", () => {
    expect(
      stateStanding(
        tiles([
          ["NSW", "strongest"],
          ["VIC", "unverified"],
          ["QLD", "not-open"],
        ]),
      ),
    ).toEqual({ group: "strongest", states: ["NSW"] });
    expect(stateStanding([])).toEqual({ group: null, states: [] });
  });

  it("names where the published evidence is strongest, for each visa", () => {
    const strong = {
      group: "strongest" as const,
      states: ["NSW"] as StateCode[],
    };
    const wa = { group: "strongest" as const, states: ["WA"] as StateCode[] };
    expect(stateLine(strong, wa)).toBe(
      "For a profile like yours, the published evidence for 190 is strongest in NSW, and for 491 in WA.",
    );
    expect(stateLine({ group: "unverified", states: ["VIC"] }, wa)).toBe(
      "For a profile like yours, the published evidence for 491 is strongest in WA.",
    );
    expect(
      stateLine(
        { group: "strongest", states: ["NSW", "VIC"] },
        { group: "not-open", states: ["NSW"] },
      ),
    ).toBe(
      "For a profile like yours, the published evidence for 190 is strongest in NSW and VIC.",
    );
  });

  it("says no state stands out, and names one worth watching", () => {
    expect(
      stateLine(
        { group: "unverified", states: ["VIC"] },
        { group: "watching", states: ["WA"] },
      ),
    ).toBe(
      "No state shows strong published evidence for your profile yet. Worth watching: WA for 491.",
    );
    expect(
      stateLine(
        { group: "needs-answers", states: ["NSW"] },
        { group: "not-open", states: ["SA"] },
      ),
    ).toBe("No state shows strong published evidence for your profile yet.");
  });

  it("chips name the best group for a nominated visa", () => {
    expect(nominatedChip({ group: "strongest", states: ["NSW"] })).toEqual({
      label: "Strongest evidence: NSW",
      tone: "green",
    });
    expect(nominatedChip({ group: "watching", states: ["WA", "VIC"] })).toEqual(
      {
        label: "Worth watching: WA, VIC",
        tone: "amber",
      },
    );
    expect(nominatedChip({ group: "needs-answers", states: ["NSW"] })).toEqual({
      label: "Needs your answers",
      tone: "neutral",
    });
    expect(nominatedChip({ group: "unverified", states: ["VIC"] })).toEqual({
      label: "Rules being checked",
      tone: "neutral",
    });
    expect(nominatedChip({ group: "not-open", states: ["SA"] })).toEqual({
      label: "Not open to you now",
      tone: "red",
    });
    expect(nominatedChip({ group: null, states: [] })).toEqual({
      label: "State decides",
      tone: "neutral",
    });
  });
});

describe("buildCutoffChart", () => {
  it("lists the last six rounds oldest first, with a note on the points", () => {
    const chart = buildCutoffChart("Secondary School Teacher", REGULAR, 75)!;
    expect(chart.rounds.map((x) => [x.label, x.cutoff])).toEqual([
      ["Sep 2024", 75],
      ["Nov 2024", 70],
      ["Aug 2025", 85],
      ["Nov 2025", 75],
      ["Jun 2026", 75],
      ["Oct 2026", 80],
    ]);
    expect(chart.points).toBe(75);
    expect(chart.scale).toEqual({
      lo: 60,
      hi: 105,
      ticks: [65, 70, 75, 80, 85, 90, 95, 100],
    });
    expect(
      buildCutoffChart("X", [r("2026-10-15", 110)], 120)!.scale,
    ).toMatchObject({
      lo: 60,
      hi: 125,
    });
    expect(chart.note).toBe(
      "Your 75 is at or above 4 of the 6 cut-offs listed in the last 6 rounds.",
    );
    expect(chart.description).toContain("Oct 2026: 80 points");
  });

  it("says when the points clear every listed cut-off, and counts unlisted rounds", () => {
    expect(buildCutoffChart("Chef", OCCASIONAL, 95)!.note).toBe(
      "Your 95 is at or above every cut-off listed in the last 4 rounds. Chef was not listed in 2 of them.",
    );
  });

  it("says when every listed cut-off was above the points", () => {
    expect(buildCutoffChart("Software Engineer", NONE, 75)!.note).toBe(
      "Every cut-off listed in the last 6 rounds was above your 75. Software Engineer was not listed in 4 of them.",
    );
    expect(
      buildCutoffChart("Software Engineer", NONE, 75)!.description,
    ).toContain("Oct 2026: not listed");
  });

  it("says when nothing was listed, and has no chart without rounds", () => {
    expect(
      buildCutoffChart(
        "Barrister",
        [r("2026-10-15", null), r("2026-06-04", null)],
        75,
      )!.note,
    ).toBe("Barrister was not listed in any of the last 2 rounds.");
    expect(buildCutoffChart("Barrister", [], 75)).toBeNull();
    expect(
      buildCutoffChart("Barrister", [r("2026-10-15", null)], 75)!.note,
    ).toBe("Barrister was not listed in the last round.");
    expect(buildCutoffChart("Chef", [r("2026-10-15", 80)], 75)!.note).toBe(
      "Every cut-off listed in the last round was above your 75.",
    );
  });
});

describe("buildLevers", () => {
  const changes: ChangeItem[] = [
    {
      label: "Your 33rd birthday",
      effect: "−5",
      delta: -5,
      date: "2027-08-09",
      href: "#timeline",
    },
    {
      label: "English test validity ends",
      effect: "−10",
      delta: -10,
      date: "2028-02-02",
      href: "#timeline",
    },
    {
      label: "Superior English",
      effect: "+10",
      delta: 10,
      date: null,
      href: "#scenarios",
    },
    {
      label: "Community language",
      effect: "+5",
      delta: 5,
      date: null,
      href: "#scenarios",
    },
  ];

  it("splits gains from dated changes, with dates", () => {
    const levers = buildLevers(changes, REGULAR, 75);
    expect(levers.dated).toEqual([
      { effect: "−5", tone: "minus", text: "Your 33rd birthday, 9 Aug 2027" },
      {
        effect: "−10",
        tone: "minus",
        text: "English test validity ends, 2 Feb 2028",
      },
    ]);
    expect(levers.add.map((l) => l.effect)).toEqual(["+10", "+5"]);
  });

  it("notes a gain that reaches every recent cut-off", () => {
    const levers = buildLevers(changes, REGULAR, 75);
    expect(levers.add[0].text).toBe(
      "Superior English: 85 points is at or above every cut-off listed in the last 6 rounds",
    );
    expect(levers.add[1].text).toBe("Community language");
  });

  it("adds no note when the points already clear every cut-off or none is listed", () => {
    expect(buildLevers(changes, REGULAR, 90).add[0].text).toBe(
      "Superior English",
    );
    expect(buildLevers(changes, [r("2026-10-15", null)], 75).add[0].text).toBe(
      "Superior English",
    );
  });

  it("adds no note while 189 hasn't listed the occupation recently", () => {
    const stale = [
      r("2026-10-15", null),
      r("2026-06-04", null),
      r("2025-11-13", null),
      r("2025-08-21", null),
      r("2024-11-07", 95),
      r("2024-09-05", 100),
    ];
    expect(buildLevers(changes, stale, 90).add[0].text).toBe(
      "Superior English",
    );
  });

  it("marks a dated gain as a plus", () => {
    const levers = buildLevers(
      [
        {
          label: "Next work band",
          effect: "+5",
          delta: 5,
          date: "2027-01-01",
          href: "#timeline",
        },
      ],
      REGULAR,
      75,
    );
    expect(levers.dated[0]).toEqual({
      effect: "+5",
      tone: "plus",
      text: "Next work band, 1 Jan 2027",
    });
  });
});

describe("copy", () => {
  it("uses only allowed words", () => {
    const strong = {
      group: "strongest" as const,
      states: ["NSW"] as StateCode[],
    };
    const strings = [
      bottomLine189("Software Engineer", NONE, 75),
      bottomLine189("Teacher", REGULAR, 75),
      bottomLine189("Teacher", REGULAR, 90),
      bottomLine189("Chef", OCCASIONAL, 95),
      stateLine(
        { group: "unverified", states: ["VIC"] },
        { group: "watching", states: ["WA"] },
      ),
      stateLine(strong, { group: "strongest", states: ["WA"] }),
      buildCutoffChart("Teacher", REGULAR, 75)!.note,
      buildCutoffChart("Teacher", REGULAR, 75)!.description,
      buildCutoffChart("Software Engineer", NONE, 75)!.note,
      ...(
        [
          "strongest",
          "watching",
          "needs-answers",
          "unverified",
          "not-open",
        ] as const
      ).map((group) => nominatedChip({ group, states: ["NSW"] }).label),
    ];
    const levers = buildLevers(
      [
        {
          label: "Superior English",
          effect: "+10",
          delta: 10,
          date: null,
          href: "#scenarios",
        },
      ],
      REGULAR,
      75,
    );
    strings.push(...levers.add.map((l) => l.text));
    for (const s of strings) expect(s).not.toMatch(BANNED_COPY);
  });
});
