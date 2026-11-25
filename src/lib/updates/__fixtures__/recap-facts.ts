import type { Interval, StateKey } from "../../data/types";
import type {
  DataSection,
  RecapFacts,
  RoundSection,
  StateFigure,
} from "../types";

/**
 * Small hand-made facts files for the recap view-model: a round-only month,
 * a data-only month (no round, previous month not fetched) and a month with
 * two rounds and its data. Figures are made up but follow the number rules.
 */

const SOURCES: RoundSection["sources"] = {
  currentRounds:
    "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds",
  previousRounds:
    "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/previous-rounds",
  checkedAt: "2026-11-20",
};

const TOTAL_LABEL = "Skilled Independent visa (subclass 189)";

function round(
  total: number,
  section: Omit<RoundSection, "generatedAt" | "sources" | "totals">,
): RoundSection {
  return {
    generatedAt: "2026-11-20",
    sources: SOURCES,
    totals: [{ subclass: "189", label: TOTAL_LABEL, invited: total }],
    ...section,
  };
}

const exact = (n: number): Interval => ({ min: n, max: n });

function fig(
  floor: number,
  maskedCells: number,
  previousFloor: number | null,
  top: StateFigure["top"] = [],
): StateFigure {
  return {
    total: { min: floor, max: floor + maskedCells * 19 },
    floor,
    maskedCells,
    previousFloor,
    top,
  };
}

const NURSE = { code: "254499", name: "Registered Nurses nec" };
const SOFTWARE = { code: "261313", name: "Software Engineer" };
const CIVIL = { code: "233211", name: "Civil Engineer" };

function states(previous: number | null): DataSection["states"] {
  const nurse = (min: number) => [{ ...NURSE, total: { min, max: min + 19 } }];
  const s190: Record<StateKey, StateFigure> = {
    ACT: fig(40, 10, previous),
    NSW: fig(300, 20, previous, nurse(120)),
    NT: fig(20, 5, previous),
    QLD: fig(210, 30, previous, nurse(90)),
    SA: fig(25, 12, previous),
    TAS: fig(0, 9, previous),
    VIC: fig(820, 12, previous, nurse(400)),
    WA: fig(150, 20, previous),
    ANY: fig(60, 8, previous),
  };
  const s491: Record<StateKey, StateFigure> = {
    ...s190,
    NT: fig(0, 0, previous),
    TAS: fig(0, 14, previous),
    VIC: fig(90, 30, previous, [{ ...CIVIL, total: exact(22) }]),
  };
  return { "190": s190, "491": s491 };
}

function data(
  overrides: Partial<DataSection> & Pick<DataSection, "sources">,
): DataSection {
  const pair = (current: Interval, previous: Interval | null) => ({
    current,
    previous,
  });
  return {
    generatedAt: "2026-11-20",
    national: {
      "189": {
        submitted: pair({ min: 150000, max: 151200 }, null),
        invited: pair({ min: 900, max: 1300 }, null),
      },
      "190": {
        submitted: pair({ min: 380000, max: 381500 }, null),
        invited: pair({ min: 0, max: 400 }, null),
      },
      "491": {
        submitted: pair({ min: 420000, max: 421000 }, null),
        invited: pair({ min: 100, max: 101 }, null),
      },
    },
    pool189ByScore: [
      { score: 55, count: { min: 0, max: 19 } },
      { score: 60, count: { min: 0, max: 95 } },
      { score: 65, count: { min: 3000, max: 3200 } },
      { score: 70, count: { min: 2000, max: 2100 } },
      { score: 75, count: { min: 0, max: 38 } },
      { score: 80, count: { min: 0, max: 19 } },
    ],
    invitedByScore: { "189": [], "190": [], "491": [] },
    states: states(null),
    nominations: null,
    movers: { fell: [], rose: [] },
    notable189: null,
    largePoolsNotListed: [],
    spotlight: {
      ...NURSE,
      pickedBy: "auto",
      qualifiedBy: null,
      card: {
        latest189: { kind: "not-listed", date: "2026-10-15" },
        rounds: [],
        tieBreak: null,
        invited189: { current: null, previous: null },
        pool189: { current: "4000", previous: null },
        top190: [],
      },
    },
    occupationsAdded: null,
    occupationsRemoved: null,
    ...overrides,
  };
}

/** A November round before November's dashboard data is published. */
export const roundOnly: RecapFacts = {
  schemaVersion: 1,
  month: "2026-11",
  firstGeneratedAt: "2026-11-20",
  updatedAt: "2026-11-20",
  rounds: {
    "2026-11-19": round(15000, {
      occupations: [
        { ...CIVIL, cutoff: 85, previousCutoff: 85, tieBreak: null },
        {
          code: null,
          name: "Patho",
          cutoff: 80,
          previousCutoff: null,
          tieBreak: null,
        },
        { ...NURSE, cutoff: 65, previousCutoff: 70, tieBreak: "2026-01-05" },
        {
          ...SOFTWARE,
          cutoff: 95,
          previousCutoff: null,
          tieBreak: "2026-10-01",
        },
      ],
      distribution: [
        { score: 65, occupations: 1 },
        { score: 80, occupations: 1 },
        { score: 85, occupations: 1 },
        { score: 95, occupations: 1 },
      ],
      previousRound: { date: "2026-10-15", listed: 159 },
      comparison: {
        fell: 1,
        rose: 0,
        same: 1,
        newlyListed: [{ code: null, name: "Patho" }, SOFTWARE],
        notListedAgain: [
          {
            code: "241111",
            name: "Early Childhood (Pre-primary School) Teacher",
          },
        ],
        falls: [{ ...NURSE, previous: 70, current: 65 }],
        rises: [],
      },
      cardPicks: [{ ...NURSE, previous: 70, current: 65 }],
    }),
  },
  data: null,
};

/** December's dashboard data with no December round; November wasn't fetched. */
export const dataOnly: RecapFacts = {
  schemaVersion: 1,
  month: "2026-12",
  firstGeneratedAt: "2027-01-18",
  updatedAt: "2027-01-18",
  rounds: {},
  data: data({
    sources: {
      snapshotId: "skillselect-2026-12-31",
      checkedAt: "2027-01-16",
      previous: null,
      federalListCheckedAt: "2027-01-10",
    },
    notable189: {
      round: "2026-10-15",
      rows: [
        {
          ...NURSE,
          cutoff: 70,
          previousCutoff: null,
          tieBreak: null,
          pool: "4000",
          invited: "<20",
        },
      ],
    },
    largePoolsNotListed: [
      { ...SOFTWARE, pool: 9000, roundsNotListed: 13, lastListed: null },
    ],
  }),
};

/** March 2027 with two rounds, the dashboard data and last month's figures. */
export const twoRounds: RecapFacts = {
  schemaVersion: 1,
  month: "2027-03",
  firstGeneratedAt: "2027-03-06",
  updatedAt: "2027-04-17",
  rounds: {
    "2027-03-04": round(8000, {
      occupations: [
        { ...NURSE, cutoff: 70, previousCutoff: null, tieBreak: "2026-12-01" },
        { ...CIVIL, cutoff: 70, previousCutoff: null, tieBreak: "2026-12-02" },
      ],
      distribution: [{ score: 70, occupations: 2 }],
      previousRound: null,
      comparison: null,
      cardPicks: [],
    }),
    "2027-03-25": round(6000, {
      occupations: [
        { ...CIVIL, cutoff: 80, previousCutoff: 70, tieBreak: "2027-01-09" },
        { ...NURSE, cutoff: 65, previousCutoff: 70, tieBreak: "2026-12-20" },
      ],
      distribution: [
        { score: 65, occupations: 1 },
        { score: 80, occupations: 1 },
      ],
      previousRound: { date: "2027-03-04", listed: 2 },
      comparison: {
        fell: 1,
        rose: 1,
        same: 0,
        newlyListed: [],
        notListedAgain: [],
        falls: [{ ...NURSE, previous: 70, current: 65 }],
        rises: [{ ...CIVIL, previous: 70, current: 80 }],
      },
      cardPicks: [
        { ...NURSE, previous: 70, current: 65 },
        { ...CIVIL, previous: 70, current: 80 },
      ],
    }),
  },
  data: data({
    generatedAt: "2027-04-17",
    sources: {
      snapshotId: "skillselect-2027-03-31",
      checkedAt: "2027-04-15",
      previous: {
        month: "2027-02",
        snapshotId: "skillselect-2027-02-28",
        checkedAt: "2027-03-16",
      },
      federalListCheckedAt: "2027-04-01",
    },
    national: {
      "189": {
        submitted: {
          current: { min: 150000, max: 151200 },
          previous: { min: 152000, max: 153100 },
        },
        invited: {
          current: { min: 9000, max: 9800 },
          previous: { min: 0, max: 300 },
        },
      },
      "190": {
        submitted: {
          current: { min: 380000, max: 381500 },
          previous: { min: 379000, max: 380400 },
        },
        invited: {
          current: { min: 2000, max: 4000 },
          previous: { min: 1500, max: 3600 },
        },
      },
      "491": {
        submitted: {
          current: { min: 420000, max: 421000 },
          previous: { min: 419000, max: 420100 },
        },
        invited: {
          current: { min: 600, max: 2000 },
          previous: { min: 500, max: 1900 },
        },
      },
    },
    states: states(0),
    movers: {
      fell: [{ ...NURSE, previous: 5000, current: 4000 }],
      rose: [{ ...CIVIL, previous: 8000, current: 8100 }],
    },
    notable189: {
      round: "2027-03-25",
      rows: [
        {
          ...CIVIL,
          cutoff: 80,
          previousCutoff: 70,
          tieBreak: "2027-01-09",
          pool: "8100",
          invited: "312",
        },
        {
          ...NURSE,
          cutoff: 65,
          previousCutoff: 70,
          tieBreak: "2026-12-20",
          pool: "4000",
          invited: "<20",
        },
      ],
    },
    largePoolsNotListed: [
      {
        ...SOFTWARE,
        pool: 9000,
        roundsNotListed: 2,
        lastListed: { date: "2026-10-15", cutoff: 95 },
      },
    ],
    nominations: {
      programYear: "2026-27",
      from: "2026-07-01",
      to: "2027-02-28",
      byVisa: {
        "190": {
          ACT: "<5",
          NSW: "40",
          NT: "12",
          QLD: "30",
          SA: "0",
          TAS: "18",
          VIC: "55",
          WA: "21",
        },
        "491": {
          ACT: "<5",
          NSW: "0",
          NT: "20",
          QLD: "<5",
          SA: "0",
          TAS: "9",
          VIC: "0",
          WA: "14",
        },
      },
    },
  }),
};
