// Test support: a small raw store (2 occupations, as-at 2026-09 and 2026-10)
// written through the real raw-store encoder.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MonthKey } from "../../src/lib/data/types";
import { VISA_NAMES } from "./qlik-constants";
import { encodeRaw, writeRawView } from "./raw-store";
import type { ParsedRound, SkippedRound } from "./rounds";
import type { ViewId } from "./views";

export const SOFTWARE_ENGINEER = "261313 Software Engineer";
export const NURSE = "254499 Registered Nurses nec";
const V189 = VISA_NAMES["189"];
const V190 = VISA_NAMES["190"];

export type FixturePart = {
  partition?: Record<string, string>;
  header: string[];
  rows: string[][];
};

const AS_AT = "As At Month";
const VISA = "Visa Type";
const OCC = "Occupation";
const STATUS = "EOI Status";
const COUNT = "Count EOIs";

export const HEADERS = {
  byOccupation: [AS_AT, VISA, OCC, STATUS, COUNT],
  byScore: [AS_AT, VISA, OCC, STATUS, "Points", COUNT],
  bySubmitted: [AS_AT, "Month Submitted", VISA, OCC, STATUS, COUNT],
  byEnglish: [AS_AT, VISA, OCC, STATUS, "English Test Score", COUNT],
};

export function writeFixtureView(
  root: string,
  viewId: ViewId,
  asAt: MonthKey,
  parts: FixturePart[],
): void {
  writeRawView(root, {
    viewId,
    asAt,
    fetchedAt: "2026-11-17T00:00:00Z",
    source: "https://example.test",
    selections: {},
    parts: parts.map((part) => ({
      partition: part.partition ?? {},
      table: encodeRaw(part.header, part.rows),
    })),
  });
}

function writeOctober(root: string): void {
  const m = "10/2026";
  writeFixtureView(root, "status-history", "2026-10", [
    {
      header: HEADERS.byOccupation,
      rows: [
        [m, V189, SOFTWARE_ENGINEER, "SUBMITTED", "150"],
        [m, V189, SOFTWARE_ENGINEER, "INVITED", "<20"],
        [m, V189, SOFTWARE_ENGINEER, "LODGED", "119"],
        [m, V189, NURSE, "SUBMITTED", "40"],
        [m, V189, NURSE, "INVITED", "2730"],
        [m, V190, NURSE, "SUBMITTED", "<20"],
      ],
    },
  ]);
  writeFixtureView(root, "pool-by-score", "2026-10", [
    {
      header: HEADERS.byScore,
      rows: [
        [m, V189, SOFTWARE_ENGINEER, "SUBMITTED", "85", "100"],
        [m, V189, SOFTWARE_ENGINEER, "SUBMITTED", "90", "<20"],
        [m, V189, SOFTWARE_ENGINEER, "SUBMITTED", "95", "50"],
        [m, V189, NURSE, "SUBMITTED", "90", "40"],
        [m, V190, NURSE, "SUBMITTED", "95", "<20"],
      ],
    },
  ]);
  writeFixtureView(root, "invited-by-score", "2026-10", [
    {
      header: HEADERS.byScore,
      rows: [
        [m, V189, SOFTWARE_ENGINEER, "INVITED", "100", "<20"],
        [m, V189, NURSE, "INVITED", "95", "2700"],
        [m, V189, NURSE, "INVITED", "100", "30"],
      ],
    },
  ]);
  writeFixtureView(root, "cohorts", "2026-10", [
    {
      header: HEADERS.bySubmitted,
      rows: [
        [m, "02/2025", V189, NURSE, "SUBMITTED", "142"],
        [m, "02/2025", V189, NURSE, "INVITED", "175"],
        [m, "05/2023", V189, NURSE, "CLOSED", "510"],
        [m, "11/2023", V189, SOFTWARE_ENGINEER, "LODGED", "<20"],
        [m, "10/2023", V189, SOFTWARE_ENGINEER, "CLOSED", "30"],
      ],
    },
  ]);
  writeFixtureView(root, "cohorts-by-score", "2026-10", [
    {
      partition: { score: "90" },
      header: HEADERS.bySubmitted,
      rows: [[m, "01/02/2025", V189, NURSE, "SUBMITTED", "40"]],
    },
    {
      partition: { score: "95" },
      header: HEADERS.bySubmitted,
      rows: [[m, "01/02/2025", V190, NURSE, "SUBMITTED", "<20"]],
    },
  ]);
  writeFixtureView(root, "state-pool", "2026-10", [
    {
      partition: { state: "VIC" },
      header: HEADERS.byScore,
      rows: [[m, V190, NURSE, "SUBMITTED", "95", "<20"]],
    },
    {
      partition: { state: "ANY" },
      header: HEADERS.byScore,
      rows: [[m, V190, NURSE, "SUBMITTED", "90", "7"]],
    },
  ]);
  writeFixtureView(root, "state-invited", "2026-10", [
    {
      partition: { state: "VIC" },
      header: HEADERS.byScore,
      rows: [[m, V190, NURSE, "INVITED", "95", "<20"]],
    },
  ]);
  writeFixtureView(root, "invited-profile", "2026-10", [
    {
      partition: { attribute: "english" },
      header: HEADERS.byEnglish,
      rows: [
        [m, V189, NURSE, "INVITED", "20", "1500"],
        [m, V189, NURSE, "INVITED", "10", "<20"],
      ],
    },
  ]);
  writeFixtureView(root, "invited-profile-state", "2026-10", [
    {
      partition: { state: "VIC", attribute: "english" },
      header: HEADERS.byEnglish,
      rows: [[m, V190, NURSE, "INVITED", "20", "<20"]],
    },
  ]);
}

function writeSeptember(root: string): void {
  const m = "09/2026";
  writeFixtureView(root, "status-history", "2026-09", [
    {
      header: HEADERS.byOccupation,
      rows: [
        [m, V189, SOFTWARE_ENGINEER, "SUBMITTED", "140"],
        [m, V189, NURSE, "SUBMITTED", "60"],
      ],
    },
  ]);
  writeFixtureView(root, "invited-by-score", "2026-09", [
    { header: HEADERS.byScore, rows: [] },
  ]);
  writeFixtureView(root, "state-invited", "2026-09", [
    {
      partition: { state: "VIC" },
      header: HEADERS.byScore,
      rows: [[m, V190, NURSE, "INVITED", "90", "25"]],
    },
  ]);
  writeFixtureView(root, "invited-profile", "2026-09", [
    {
      partition: { attribute: "english" },
      header: HEADERS.byEnglish,
      rows: [[m, V189, NURSE, "INVITED", "20", "12"]],
    },
  ]);
}

/** A fresh temp raw root holding both fixture months. */
export function buildRawFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "generate-raw-"));
  writeSeptember(root);
  writeOctober(root);
  return root;
}

export const fixtureRounds: ParsedRound[] = [
  {
    date: "2026-10-15",
    totals: [
      {
        subclass: "189",
        label: "Skilled Independent visa (subclass 189)",
        invited: 20000,
      },
    ],
    tieBreak: null,
    rows: [
      {
        occupationName: "Software Engineer",
        cutoff: 95,
        tieBreak: "2026-09-03",
      },
      { occupationName: "Chef", cutoff: 90, tieBreak: "2026-09-10" },
    ],
    nominations: null,
  },
  {
    date: "2026-06-04",
    totals: null,
    tieBreak: "2026-04-24",
    rows: [
      { occupationName: "Registered Nurses (nec)", cutoff: 65, tieBreak: null },
    ],
    nominations: null,
  },
];

export const fixtureSkippedRounds: SkippedRound[] = [
  { date: "2021-01-21", reason: "unit-group layout" },
];

export const fixtureInput = {
  asAt: "2026-10",
  checkedAt: "2026-11-17",
  rounds: { rounds: fixtureRounds, skipped: fixtureSkippedRounds },
  importVersion: "test-1",
};
