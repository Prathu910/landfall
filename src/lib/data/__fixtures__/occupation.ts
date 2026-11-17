import type { OccupationCore, OccupationDetail } from "../types";

export const coreFixture: OccupationCore = {
  schemaVersion: 1,
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
  schemaVersion: 1,
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
