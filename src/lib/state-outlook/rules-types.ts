import type { StateCode, StateVisa } from "../data/types";

export type Verification = "verified" | "secondary";

/** A rule value with where it came from, when it was checked and how sure we are. */
export type Sourced<T> = {
  value: T;
  source: string;
  checkedAt: string; // YYYY-MM-DD
  verification: Verification;
  note?: string;
};

export type Cohort = "living-in-state" | "living-in-other-state" | "offshore";
export type ProgramStatus = "open" | "closed" | "restricted" | "unknown";

export type OccupationListRef =
  // An imported list in src/data/state-rules/lists/<listId>.json. With
  // `streams`, only entries tagged with at least one of those stream tags count
  // (e.g. WA's Graduate stream accepts only Graduate-list occupations).
  | { kind: "list"; listId: string; streams?: string[] }
  | { kind: "all-federally-eligible" }
  | { kind: "none-published" } // the state names no list
  // The state publishes a list or occupation restriction that is not imported
  // (its URL is the Sourced `source`), so membership cannot be checked.
  | { kind: "not-imported" };

export type Requirement =
  | { kind: "min-months-living-in-state"; months: number }
  | { kind: "min-months-working-in-state"; months: number } // working in the nominated occupation
  | { kind: "min-months-living-offshore"; months: number }
  | { kind: "job-offer-in-state" }
  | { kind: "visa-expiry-before"; date: string } // expires on or before `date` ("by 31 Jan 2027")
  | { kind: "min-years-experience"; years: number; withinYears: number }
  | { kind: "lives-regional" }
  | { kind: "studied-in-state" };

export type Stream = {
  id: string; // "wa-general", "sa-skilled-employment", ...
  name: string; // "General stream"
  cohorts: Sourced<Cohort[]>;
  status: Sourced<ProgramStatus>;
  restriction?: Sourced<string>; // human text, e.g. "Visa must expire by 31 Jan 2027"
  occupations: Sourced<OccupationListRef>;
  requirements: Sourced<Requirement>[];
};

export type StateVisaRules = {
  state: StateCode;
  visa: StateVisa;
  selectionSystem: Sourced<string>;
  ownScoreSystem?: Sourced<{ name: string; url: string }>;
  streams: Stream[];
  resultsUrl?: string;
};

export type StateRules = { programYear: "2026-27"; rules: StateVisaRules[] };

/** One entry of an imported state list: cohorts listed per visa. */
export type ImportedListEntry = {
  "190"?: Cohort[];
  "491"?: Cohort[];
  streams?: string[];
  viaUnitGroup?: string; // 4-digit unit group the occupation is listed under
};

export type ImportedList = {
  listId: string;
  source: string;
  checkedAt: string;
  entries: Record<string, ImportedListEntry>; // code -> entry
};

export type FederalList = {
  source: string;
  checkedAt: string;
  entries: Record<string, { "190": boolean; "491": boolean }>;
};
