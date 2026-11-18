### Task 1: State rules model, guards and staleness

**Files:**

- Create: `src/lib/state-outlook/rules-types.ts`, `src/lib/state-outlook/rules-guards.ts`, `src/lib/state-outlook/staleness.ts`
- Test: `src/lib/state-outlook/rules-guards.test.ts`, `src/lib/state-outlook/staleness.test.ts`

**Interfaces:**

```ts
export type Verification = "verified" | "secondary";
export type Sourced<T> = {
  value: T;
  source: string;
  checkedAt: string;
  verification: Verification;
  note?: string;
};
export type Cohort = "living-in-state" | "living-in-other-state" | "offshore";
export type ProgramStatus = "open" | "closed" | "restricted" | "unknown";
export type OccupationListRef =
  | { kind: "list"; listId: string } // an imported list in src/data/state-rules/lists/<listId>.json
  | { kind: "all-federally-eligible" }
  | { kind: "none-published" }; // the state names no list
export type Requirement =
  | { kind: "min-months-living-in-state"; months: number }
  | { kind: "min-months-working-in-state"; months: number } // working in the nominated occupation
  | { kind: "min-months-living-offshore"; months: number }
  | { kind: "job-offer-in-state" }
  | { kind: "visa-expiry-before"; date: string }
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
export type ImportedList = {
  listId: string;
  source: string;
  checkedAt: string;
  entries: Record<string, { "190"?: Cohort[]; "491"?: Cohort[] }>;
}; // code -> cohorts listed per visa
export type FederalList = {
  source: string;
  checkedAt: string;
  entries: Record<string, { "190": boolean; "491": boolean }>;
};

export function isStateRules(v: unknown): v is StateRules;
export function isImportedList(v: unknown): v is ImportedList;
export function isFederalList(v: unknown): v is FederalList;
export function isStale(checkedAt: string, asOf: string, maxDays = 60): boolean; // pure UTC calendar arithmetic
export function staleRules(
  rules: StateRules,
  buildDate: string,
  maxDays = 45,
): { path: string; checkedAt: string }[];
```

- [ ] **Step 1: Write failing tests.**
  - The guards accept a minimal valid structure.
  - The guards reject a rule with no `source`, with `checkedAt` "2026-13-01", or with `verification: "maybe"`.
  - `isStale("2026-09-01","2026-11-17")` is true (77 days > 60).
  - `isStale("2026-10-01","2026-11-17")` is false.
  - `staleRules` lists the paths of rules more than 45 days old.
- [ ] **Step 2: Run** `npx vitest run src/lib/state-outlook/`. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check && npm run build`. Expect PASS.
- [ ] **Step 5: Commit** `feat(state): model state rules with sources, verification and staleness`

