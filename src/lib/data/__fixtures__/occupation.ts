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

export const activityCoreFixture: OccupationCore = {
  ...coreFixture,
  statusHistory: {
    "189": {
      "2026-07": { INVITED: "<20" },
      "2026-05": { INVITED: "82" },
      "2026-06": { INVITED: "905" },
      "2026-08": { SUBMITTED: "10" },
    },
  },
  invitedByScore: {
    "189": {
      "2026-06": { "90": "40", "95": "<20", "100": "865" },
      "2026-07": { "85": "<20" },
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
        "2026-08": { "80": "50", "90": "20" },
        "2026-09": { "85": "50", "95": "60" },
        "2026-10": { "75": "<20" },
      },
      ANY: { "2026-10": { "85": "5", "100": "9" } },
    },
  },
};

export const profileDetailFixture: OccupationDetail = {
  ...detailFixture,
  invitedProfile: {
    "189": {
      english: {
        superior: { "2026-08": "12", "2026-09": "<20", "2026-10": "30" },
      },
    },
  },
  invitedProfileState: {
    "190": { VIC: { english: { superior: "25" } } },
  },
};
