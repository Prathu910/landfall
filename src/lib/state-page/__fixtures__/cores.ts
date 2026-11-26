import type { OccupationCore, ScoreCounts, StateKey } from "../../data/types";

type Months = Record<string, ScoreCounts>;

/** A minimal core holding only the given state data. */
export function core(
  code: string,
  stateInvited: OccupationCore["stateInvited"],
  options: {
    asAt?: string;
    statePool?: OccupationCore["statePool"];
  } = {},
): OccupationCore {
  const asAt = options.asAt ?? "2026-10";
  return {
    schemaVersion: 2,
    snapshotId: `skillselect-${asAt}`,
    asAt,
    code,
    name: `Occupation ${code}`,
    group: null,
    pool: {},
    statusHistory: {},
    invitedByScore: {},
    statePool: options.statePool ?? {},
    stateInvited,
    rounds189: [],
  };
}

const nsw = (months: Months): Partial<Record<StateKey, Months>> => ({
  NSW: months,
});

/**
 * Three months to 2026-10. A: published and "<20" cells. B: "{}" in Sep
 * (fetched, no rows) and an ANY row that must never reach NSW. C: no
 * 2026-08 key at all (not fetched).
 */
export const A = core(
  "111111",
  {
    "190": nsw({
      "2026-08": { "70": "25", "75": "<20" },
      "2026-09": { "75": "<20" },
      "2026-10": { "70": "<20", "80": "40", "85": "21" },
    }),
  },
  { statePool: { "190": { NSW: { "65": "100", "70": "<20" } } } },
);

export const B = core("222222", {
  "190": {
    NSW: {
      "2026-08": { "80": "<20" },
      "2026-09": {},
      "2026-10": { "80": "30" },
    },
    ANY: { "2026-10": { "80": "500" } },
  },
});

export const C = core("333333", {
  "190": { NSW: { "2026-09": { "90": "<20" }, "2026-10": { "90": "<20" } } },
});

/** Another month's core: never part of the 2026-10 pages. */
export const OLD = core(
  "444444",
  { "190": nsw({ "2026-09": { "70": "99" } }) },
  { asAt: "2026-09" },
);

export const FIXTURE_CORES = [A, B, C];
