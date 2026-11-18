import type { OccupationCore } from "../../data/types";
import { coreFixture } from "../../data/__fixtures__/occupation";

const LAST_YEAR = [
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
  "2026-09",
  "2026-10",
];

/** A key per month, so each month counts as fetched (empty = zero). */
function monthly(
  entries: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  return Object.fromEntries(LAST_YEAR.map((m) => [m, entries[m] ?? {}]));
}

const roundsNone: OccupationCore["rounds189"] = [
  { date: "2026-10-15", cutoff: null },
  { date: "2026-09-17", cutoff: null },
  { date: "2026-08-20", cutoff: null },
  { date: "2026-07-16", cutoff: null },
  { date: "2024-11-21", cutoff: 95 },
];

/** Software Engineer-like: 189 not listed recently; 190 and 491 pools exist. */
export const noneRoundsCore: OccupationCore = {
  ...coreFixture,
  pool: {
    "189": {
      total: "9464",
      byScore: {
        "95": "608",
        "100": "229",
        "105": "35",
        "110": "<20",
        "90": "1132",
      },
    },
    "190": { total: "400", byScore: { "90": "50", "95": "40" } },
    "491": { total: "300", byScore: { "90": "30", "105": "20" } },
  },
  statusHistory: {
    "190": monthly({
      "2026-09": { INVITED: "42" },
      "2026-10": { INVITED: "35" },
    }),
    "491": monthly({}),
  },
  rounds189: roundsNone,
};

/** Every monthly INVITED count in the window is masked. */
export const allMaskedCore: OccupationCore = {
  ...noneRoundsCore,
  statusHistory: {
    "190": monthly({
      "2026-08": { INVITED: "<20" },
      "2026-10": { INVITED: "<20" },
    }),
    "491": monthly({}),
  },
};

export const occasionalCore: OccupationCore = {
  ...noneRoundsCore,
  rounds189: [
    { date: "2026-10-15", cutoff: null },
    { date: "2026-09-17", cutoff: 90 },
    { date: "2026-08-20", cutoff: null },
    { date: "2026-07-16", cutoff: 95 },
  ],
};

export const regularCore: OccupationCore = {
  ...noneRoundsCore,
  rounds189: [
    { date: "2026-10-15", cutoff: 100 },
    { date: "2026-09-17", cutoff: 90 },
    { date: "2026-08-20", cutoff: 95 },
    { date: "2026-07-16", cutoff: 95 },
  ],
};

/** Never listed in any round we can read. */
export const neverListedCore: OccupationCore = {
  ...noneRoundsCore,
  rounds189: [
    { date: "2026-10-15", cutoff: null },
    { date: "2026-09-17", cutoff: null },
  ],
};

export const no189PoolCore: OccupationCore = {
  ...noneRoundsCore,
  pool: {
    "190": noneRoundsCore.pool["190"],
    "491": noneRoundsCore.pool["491"],
  },
};

export const noPoolsCore: OccupationCore = {
  ...noneRoundsCore,
  pool: {},
  rounds189: [],
};
