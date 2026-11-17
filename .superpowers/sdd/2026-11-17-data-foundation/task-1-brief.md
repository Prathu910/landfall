### Task 1: Domain types and published counts

**Files:**

- Create: `src/lib/data/types.ts`, `src/lib/data/published-count.ts`
- Test: `src/lib/data/published-count.test.ts`
- Modify: `src/lib/pool.ts`. `countInterval` re-exports `parseCountText` so existing callers keep working.

**Interfaces:**

- Produces (`types.ts`):

```ts
export type Visa = "189" | "190" | "491";
export type StateVisa = "190" | "491";
export type EoiStatus = "SUBMITTED" | "INVITED" | "LODGED" | "HOLD" | "CLOSED";
export type StateCode =
  "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";
export type StateKey = StateCode | "ANY";
export type ProfileAttribute =
  "english" | "australianStudy" | "professionalYear" | "partnerSkills";
export type MonthKey = string; // "YYYY-MM"
export type CountText = string; // displayed qText: digits or "<20"
export type ScoreCounts = Record<string, CountText>; // key = score as string, e.g. "90"
export type Interval = { min: number; max: number };

export type OccupationCore = {
  schemaVersion: 1;
  snapshotId: string;
  asAt: MonthKey;
  code: string;
  name: string;
  group: string | null;
  pool: Partial<Record<Visa, { total: CountText; byScore: ScoreCounts }>>; // SUBMITTED, latest as-at
  statusHistory: Partial<
    Record<Visa, Record<MonthKey, Partial<Record<EoiStatus, CountText>>>>
  >;
  invitedByScore: Partial<Record<Visa, Record<MonthKey, ScoreCounts>>>;
  statePool: Partial<Record<StateVisa, Partial<Record<StateKey, ScoreCounts>>>>;
  stateInvited: Partial<
    Record<StateVisa, Partial<Record<StateKey, Record<MonthKey, ScoreCounts>>>>
  >;
  rounds189: { date: string; cutoff: number | null }[]; // newest first
};

export type OccupationDetail = {
  schemaVersion: 1;
  snapshotId: string;
  asAt: MonthKey;
  code: string;
  cohorts: Partial<
    Record<
      Visa,
      Record<MonthKey | "older", Partial<Record<EoiStatus, CountText>>>
    >
  >;
  cohortsByScore: Partial<
    Record<Visa, Record<string, Record<MonthKey | "older", CountText>>>
  >; // SUBMITTED only; score -> submitted month
  invitedProfile: Partial<
    Record<
      Visa,
      Partial<
        Record<ProfileAttribute, Record<string, Record<MonthKey, CountText>>>
      >
    >
  >;
  invitedProfileState: Partial<
    Record<
      StateVisa,
      Partial<
        Record<
          StateKey,
          Partial<Record<ProfileAttribute, Record<string, CountText>>>
        >
      >
    >
  >;
};

export type OccupationIndexEntry = {
  code: string;
  name: string;
  hasData: boolean;
};
export type Manifest = {
  schemaVersion: 1;
  snapshotId: string;
  asAt: MonthKey;
  checkedAt: string; // YYYY-MM-DD
  importVersion: string;
  sources: { dashboard: string; currentRounds: string; previousRounds: string };
  roundsUnmatched: string[]; // round-table occupation names with no dashboard match
  occupations: (OccupationIndexEntry & {
    group: string | null;
    totals: Partial<Record<Visa, CountText>>;
  })[];
};
```

- Produces (`published-count.ts`):
  - `parseCountText(text: CountText): Interval`
  - `addIntervals(a: Interval, b: Interval): Interval`
  - `sumIntervals(items: Interval[]): Interval`
  - `countIn(map: Record<string, CountText> | undefined, key: string): Interval | undefined` returns `undefined` when the map is absent (not fetched) and `{min: 0, max: 0}` when the map exists but the key doesn't (Qlik omits zero rows from a fully paged table).
  - `isPositive(i: Interval): boolean` returns `i.min > 0`.

- [ ] **Step 1: Write failing tests** in `published-count.test.ts`:
  - `parseCountText("<20")` → `{min:0,max:19}`
  - `parseCountText("1,093")` throws
  - `parseCountText("1093")` → `{min:1093,max:1093}`
  - `parseCountText("-1")` throws
  - `countIn(undefined,"90")` → `undefined`
  - `countIn({}, "90")` → `{min:0,max:0}`
  - `sumIntervals([{0,19},{5,5}])` → `{min:5,max:24}`
  - `isPositive({min:0,max:19})` → `false`
- [ ] **Step 2: Run** `npx vitest run src/lib/data/published-count.test.ts`. Expect FAIL (module not found).
- [ ] **Step 3: Implement** both files. Move the body of `countInterval` from `pool.ts` into `parseCountText`, and make `pool.ts` export `countInterval = parseCountText` and re-export `Interval` from `types.ts`.
- [ ] **Step 4: Run** `npm run check`. Expect all tests to pass, including the existing 47.
- [ ] **Step 5: Commit** `feat(data): add occupation record types and published count helpers`

