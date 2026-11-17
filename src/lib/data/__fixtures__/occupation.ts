import type { OccupationCore, OccupationDetail } from "../types";

export const coreFixture: OccupationCore = {
  schemaVersion: 2,
  snapshotId: "2026-10",
  asAt: "2026-10",
  code: "261313",
  name: "Software Engineer",
  group: null,
  pool: {
    "189": {
      total: "150",
      byScore: { "85": "100", "90": "<20", "95": "50" },
    },
  },
  statusHistory: {},
  invitedByScore: {},
  statePool: {},
  stateInvited: {},
  rounds189: [{ date: "2026-10-15", cutoff: 95 }],
};

export const detailFixture: OccupationDetail = {
  schemaVersion: 2,
  snapshotId: "2026-10",
  asAt: "2026-10",
  code: "261313",
  cohorts: {
    "189": {
      older: { SUBMITTED: "30", INVITED: "<20" },
      "2025-03": { SUBMITTED: "25", LODGED: "4" },
    },
  },
  cohortsByScore: {
    "189": {
      "90": { older: "30", "2025-02": "<20", "2025-03": "25", "2025-04": "40" },
    },
  },
  invitedProfile: {},
  invitedProfileState: {},
};

/**
 * Covered months carry a key even with no rows ({}): a fetched month with no
 * row is zero. A month without a key was not fetched: not published.
 */
export const activityCoreFixture: OccupationCore = {
  ...coreFixture,
  statusHistory: {
    "189": {
      // 2026-04 was not fetched.
      "2026-05": { INVITED: "82" },
      "2026-06": { INVITED: "905" },
      "2026-07": { INVITED: "<20" },
      "2026-08": { SUBMITTED: "10" },
      "2026-09": {},
      "2026-10": { SUBMITTED: "12" },
    },
  },
  invitedByScore: {
    "189": {
      // Outside the 12-month window ending 2026-10.
      "2025-09": { "60": "30" },
      "2026-05": {},
      "2026-06": { "90": "40", "95": "<20", "100": "865" },
      "2026-07": { "85": "<20" },
      "2026-08": {},
      "2026-09": {},
      "2026-10": {},
    },
  },
  statePool: {
    "190": {
      VIC: { "80": "30", "85": "<20", "90": "10" },
      ANY: { "85": "7", "95": "3" },
    },
  },
  stateInvited: {
    "190": {
      VIC: {
        // Outside the 12-month window ending 2026-10.
        "2025-06": { "70": "40" },
        "2026-08": { "80": "50", "90": "20" },
        "2026-09": { "85": "50", "95": "60" },
        "2026-10": { "75": "<20" },
      },
      // 2026-08 was not fetched for ANY; 2026-09 was, with no rows.
      ANY: { "2026-09": {}, "2026-10": { "85": "5", "100": "9" } },
    },
  },
};

/** English Test Score values are the dashboard's points strings: "20", "10", "0". */
export const profileDetailFixture: OccupationDetail = {
  ...detailFixture,
  invitedProfile: {
    "189": {
      english: {
        // 2026-07 was not fetched.
        "2026-08": { "20": "12" },
        "2026-09": { "20": "<20", "10": "<20" },
        "2026-10": { "10": "30" },
      },
      professionalYear: {
        "2026-08": { N: "40", "-1": "<20" },
        "2026-09": { N: "35" },
      },
    },
  },
  invitedProfileState: {
    "190": { VIC: { english: { "20": "25" } } },
  },
};
