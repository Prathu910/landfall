# Data Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import every occupation's SkillSelect EOI data (statuses, Month Submitted cohorts, states, profile slices and 189 rounds) into validated per-occupation files, with typed accessors, and feed the existing UI from it.

**Architecture:**

- A TypeScript importer (`scripts/import/`) talks to the public Qlik dashboard over Node 24's built-in `WebSocket`.
- It runs a declared set of guardrail-checked views, and stores compact raw tables per as-at month under `data/raw/`.
- A generator turns raw data into `src/data/manifest.json`, `src/data/occupation-index.json`, and `src/data/occupations/<code>.json` plus `<code>.detail.json`.
- Pure accessors in `src/lib/data/` answer the product questions.
- Legacy adapters keep today's UI unchanged while it switches source.

**Tech Stack:** TypeScript (strict), Node ≥24 for the importer, `tsx` (exact pin) to run scripts, Vitest, Next.js 16 static export.

**Spec:** `docs/superpowers/specs/2026-11-17-data-foundation-design.md`. Read it in full before starting any task.

## Global Constraints

- Follow `docs/ENGINEERING.md`. `npm run check` and `npm run build` must pass at the end of every task.
- Read only the dashboard's displayed `qText`. Never request unmasked counts or custom expressions. Never set any variable except `vShow*` toggles.
- **Guardrail:** each query uses ≤2 shown detail columns and ≤2 filtered detail fields. Detail fields are Occupation Group, Occupation, Score/points, Month Submitted, the profile fields, and Nominated State. `Visa Type`, `EOI Status` and `As At Month` are free. Exactly one `As At Month` is selected per query.
- Never narrow a `<20` cell by differencing. `<20` = interval `{min: 0, max: 19}`.
- Never sum INVITED counts across as-at snapshots. INVITED is a short-lived stock, so per-month figures are "at least N invited" lower bounds.
- Never sum across visas, or across states including `ANY`. Report `ANY` separately. Exclude `N/A` and `AUSTRADE` from state views.
- `CLOSED` is described only as "closed (expired, withdrawn or finalised)".
- **Budget:** a page read (`GetHyperCubeData`) is the unit. At most 600 per backfill and 150 per monthly import. Pause ≥250 ms between websocket calls. Page height = `floor(10000 / width)`.
- **Pre-approved reductions, in order:**
  1. Cohorts limited to the last 36 submitted months plus an `"older"` bucket.
  2. Drop months with no INVITED rows from multi-month invited views.
  3. `invited-profile` limited to the latest 6 months.
- **Size limits:** core file ≤50 KB, detail file ≤250 KB, raw ≤10 MB per as-at month.
- The first dataset is pinned to as-at `2026-10` (snapshot id `skillselect-2026-10-31`).
- Visas are `"189"` = `189PTS Points-Tested Stream`, `"190"` = `190SAS Skilled Australian Sponsored`, `"491"` = `491SNR State or Territory Nominated - Regional`. Family-sponsored 491 is excluded.
- **Dashboard identifiers:**
  - page `https://api.dynamic.reports.employment.gov.au/anonap/extensions/hSKLS02_SkillSelect_EOI_Data/hSKLS02_SkillSelect_EOI_Data.html`
  - websocket `wss://api.dynamic.reports.employment.gov.au/anonap/app/aaac76b5-ad30-477e-9ca0-472f8ab57fc8`
  - origin `https://api.dynamic.reports.employment.gov.au`
  - bookmark `44604edb-b94c-414b-b978-30bb79019ffd`
  - table object `eymDb`
- `docs/original-references/` stays unchanged. No network calls in tests.

## Review Focus

1. **Monthly INVITED snapshots summed into one total.** An EOI invited late in month M is often still INVITED at M+1. The expected behaviour is a per-month list and a peak, never a sum. Tested in Task 4.
2. **A user's score outside the published range or off the 5-point grid** (e.g. 47, 135). The expected behaviour: normalise to the 5-point band, `same` is `{0,0}` when absent, and `higher` sums only published rows above. Tested in Task 3.
3. **An occupation with no rows at all for a visa** (e.g. no 491 EOIs). The expected behaviour is "unavailable", not a confident zero. Tested in Task 3.
4. **The import fails halfway** (guardrail error 7005, a changed table shape, a network drop). The expected behaviour: nothing in `src/data/` or `data/raw/` is partially written. Tested in Task 8.
5. **A client asks for an occupation code that isn't in the index, or the fetch fails.** The expected behaviour: the UI shows "unavailable", and no arbitrary URL is fetched. Tested in Task 11.

---

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

### Task 2: Record guards

**Files:**

- Create: `src/lib/data/guards.ts`
- Test: `src/lib/data/guards.test.ts`

**Interfaces:**

- Consumes: the types from Task 1.
- Produces: `isOccupationCore(v: unknown): v is OccupationCore`, `isOccupationDetail(v: unknown): v is OccupationDetail`, `isManifest(v: unknown): v is Manifest`, `isCountText(v: unknown): v is CountText` (matches `/^(\d+|<20)$/`).

- [ ] **Step 1: Failing tests.**
  - A minimal valid core fixture (one visa, one month) passes.
  - Each of these fails:
    - `schemaVersion: 2`;
    - a count `"12a"`;
    - a month key `"2026-13"`;
    - a `rounds189` cutoff `"95"` (a string);
    - a missing `code`.
  - `isManifest` rejects duplicate occupation codes.
- [ ] **Step 2: Run** `npx vitest run src/lib/data/guards.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement** hand-written guards. Add no runtime dependency. Month keys match `/^\d{4}-(0[1-9]|1[0-2])$/`, and cohort keys also allow `"older"`.
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(data): add runtime guards for generated records`

### Task 3: Pool position and cohort accessors

**Files:**

- Create: `src/lib/data/pool-position.ts`, `src/lib/data/cohorts.ts`
- Test: `src/lib/data/pool-position.test.ts`, `src/lib/data/cohorts.test.ts`
- Create fixture: `src/lib/data/__fixtures__/occupation.ts`, which exports `coreFixture: OccupationCore` and `detailFixture: OccupationDetail`. Keep them small and hand-written; Tasks 4 and 10 reuse them.

**Interfaces:**

- Consumes: Tasks 1–2.
- Produces:

```ts
export type PoolPosition =
  | { available: false; reason: "no-eois-for-visa" }
  | {
      available: true;
      asAt: MonthKey;
      score: number; // normalised to the 5-point band
      higher: Interval;
      same: Interval;
      total: Interval;
      sameSubmitted?: {
        before: Interval;
        sameMonth: Interval;
        after: Interval;
        approximate: true;
      };
    };
export function poolPosition(
  core: OccupationCore,
  detail: OccupationDetail | null,
  visa: Visa,
  score: number,
  submittedMonth: MonthKey | null,
): PoolPosition;

export type CohortOutcome = {
  submittedMonth: MonthKey | "older";
  counts: Record<EoiStatus, Interval>;
};
export function cohortOutcomes(
  detail: OccupationDetail,
  visa: Visa,
  submittedMonth: MonthKey,
): CohortOutcome | undefined;
```

`sameSubmitted` is present only when `detail` and `submittedMonth` are given. The `"older"` bucket counts as `before`. The user's own month goes in `sameMonth`, never in `before` or `after`.

- [ ] **Step 1: Failing tests.**
  - `poolPosition` at score 90 against byScore `{"85":"100","90":"<20","95":"50"}` gives `higher` `{50,50}`, `same` `{0,19}` and `total` `{150,169}`.
  - Score 47 normalises to 45.
  - Score 135, with no rows above, gives `higher` `{0,0}`.
  - A visa missing from `core.pool` returns `{available:false, reason:"no-eois-for-visa"}`.
  - The same-score split for submitted month `2025-03` (cohortsByScore `"90"`: `{"older":"30","2025-02":"<20","2025-03":"25","2025-04":"40"}`) gives `before` `{30,49}`, `sameMonth` `{25,25}` and `after` `{40,40}`.
  - `cohortOutcomes` returns all five statuses, with absent statuses as `{0,0}`, and returns `undefined` for an unknown month.
- [ ] **Step 2: Run** `npx vitest run src/lib/data/pool-position.test.ts src/lib/data/cohorts.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement** using `normalizePoolScore` from `src/lib/pool.ts` and the Task 1 helpers.
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(data): add pool position and cohort outcome accessors`

### Task 4: Invitation, state and similar-profile accessors

**Files:**

- Create: `src/lib/data/invitations.ts`, `src/lib/data/state-evidence.ts`, `src/lib/data/similar-profile.ts`
- Test: one `*.test.ts` per file, using the Task 3 fixtures (extend them as needed).

**Interfaces:**

```ts
export type MonthlyInvited = { asAt: MonthKey; invitedAtLeast: Interval }; // lower bound: INVITED stock at that snapshot
export type InvitationActivity = {
  months: MonthlyInvited[]; // ascending
  lastConfirmedMonth: MonthKey | null; // latest month with invitedAtLeast.min > 0
  lastPossibleMonth: MonthKey | null; // latest month with invitedAtLeast.max > 0
  scoreRange: { min: number; max: number } | null; // scores with a positive (min > 0) INVITED count, latest 12 months
};
export function invitationActivity(
  core: OccupationCore,
  visa: Visa,
): InvitationActivity;

export type StateSide = {
  competitorsAtOrAbove: Interval; // statePool, latest
  invitedAtOrBelow: MonthlyInvited[]; // per month, latest `months` months, ascending
  peak: MonthlyInvited | null; // the month with the highest invitedAtLeast.min; never a sum
  scoreRange: { min: number; max: number } | null;
};
export function stateEvidence(
  core: OccupationCore,
  visa: StateVisa,
  state: StateCode,
  score: number,
  months?: number /* default 12 */,
): { state: StateSide; anyState: StateSide };

export function similarProfileInvited(
  detail: OccupationDetail,
  visa: Visa,
  attribute: ProfileAttribute,
  value: string,
  scope:
    | { kind: "national"; months?: number }
    | { kind: "state"; visa: StateVisa; state: StateKey },
): { perMonth?: MonthlyInvited[]; latest?: Interval } | undefined;
```

- [ ] **Step 1: Failing tests.**
  - `invitationActivity` with monthly INVITED `{"2026-05":"82","2026-06":"905","2026-07":"<20"}` gives months in order, `lastConfirmedMonth` `"2026-06"` and `lastPossibleMonth` `"2026-07"`.
  - **Review Focus 1:** `stateEvidence` for VIC, where two months each have `"50"` at or below the score, returns `peak.invitedAtLeast` `{50,50}`, and no field equals 100.
  - `anyState` is computed from `ANY` rows only. `state.competitorsAtOrAbove` excludes `ANY`.
  - `similarProfileInvited` returns `undefined` when the attribute wasn't imported.
- [ ] **Step 2: Run** these tests. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(data): add invitation, state and similar-profile accessors`

### Task 5: Qlik client

**Files:**

- Create: `scripts/import/qlik-client.ts`, `scripts/import/qlik-constants.ts` (the dashboard identifiers and visa names from Global Constraints)
- Test: `scripts/import/qlik-client.test.ts`, using a fake transport
- Modify: `package.json`. Add the exact-pinned dev dependency `tsx@4.23.15`.

**Interfaces:**

```ts
export type Transport = {
  send(message: string): void;
  onMessage(handler: (message: string) => void): void;
  close(): void;
};
export type QlikSessionOptions = {
  throttleMs: number;
  transport?: Transport;
  maxPageReads: number;
};
export class GuardrailError extends Error {}
export class BudgetExceededError extends Error {}
export type QlikSession = {
  applyBookmark(id: string): Promise<void>;
  setToggle(name: `vShow${string}`, on: boolean): Promise<void>; // rejects any name not starting with "vShow"
  select(
    field: string,
    values: { text?: string; number?: number }[],
  ): Promise<void>;
  clear(field: string): Promise<void>;
  readTable(objectId: string): Promise<{ header: string[]; rows: string[][] }>;
  pageReads(): number;
  close(): void;
};
export async function openQlikSession(
  options: QlikSessionOptions,
): Promise<QlikSession>;
export function asAtSerial(month: MonthKey): number; // Excel serial of the month-end date, as used by the current importer
```

Without an injected transport, `openQlikSession` GETs the dashboard page and collects the `Set-Cookie` values. It then opens `new WebSocket(wsUrl, { headers: { cookie, origin } })` (Node ≥24), calls `OpenDoc` and applies the bookmark. `readTable` pages with `qHeight = floor(10000 / qcx)` until `qcy`. It throws `GuardrailError` when the layout has `qError.qErrorCode === 7005`, and `BudgetExceededError` when page reads exceed `maxPageReads`. Every call waits `throttleMs` after the previous one.

- [ ] **Step 1: Failing tests** using a scripted fake transport that answers JSON-RPC by method name:
  - Paging a 3-column, 7,000-row table makes 3 page reads (height 3,333) and returns 7,000 rows.
  - Layout error 7005 rejects with `GuardrailError`.
  - `setToggle("vSelectionsLimit" as never, true)` rejects.
  - Exceeding `maxPageReads: 2` rejects with `BudgetExceededError`.
  - `asAtSerial("2026-10")` equals the serial of 2026-10-31.
- [ ] **Step 2: Run** `npx vitest run scripts/import/qlik-client.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(import): add throttled, guardrail-aware Qlik client`

### Task 6: Views, guardrail check and raw store

**Files:**

- Create: `scripts/import/views.ts`, `scripts/import/raw-store.ts`, `scripts/import/run-view.ts`
- Test: `scripts/import/views.test.ts`, `scripts/import/raw-store.test.ts`, `scripts/import/run-view.test.ts`
- Modify: `.gitignore`. Add `public/data/`, used in Task 11.

**Interfaces:**

```ts
export type DetailField =
  "occupation" | "points" | "submittedMonth" | "state" | ProfileAttribute;
export type ViewId =
  | "pool-by-score"
  | "status-history"
  | "invited-by-score"
  | "cohorts"
  | "cohorts-by-score"
  | "state-pool"
  | "state-invited"
  | "invited-profile"
  | "invited-profile-state";
export type ViewDefinition = {
  id: ViewId;
  shown: DetailField[];
  partitionBy: ("state" | "score" | ProfileAttribute)[]; // run once per value; each counts as a filter
  statuses: EoiStatus[];
  visas: Visa[];
  months: "latest" | { latest: number }; // { latest: 24 } = all
  detail: boolean; // true -> goes to the .detail.json file
};
export const VIEWS: ViewDefinition[]; // exactly the nine rows of the spec's views table
export function assertWithinGuardrail(view: ViewDefinition): void; // throws if shown.length > 2 or partitionBy.length > 2
export const FIELD_NAMES: Record<
  DetailField,
  { field: string; toggle: `vShow${string}` }
>;
// occupation: Occupation / vShowOccupations; points: Score / vShowPoints; submittedMonth: Month Submitted / vShowSubmittedOn;
// state: Nominated State / vShowEOINomState; english: English Test Score / vShowEnglishLanguageScore;
// australianStudy: Australian Study Flag / vShowAustralianStudy; professionalYear: Professional Year / vShowEmpProfessionalYear;
// partnerSkills: PartnerSkills Score / vShowPartnerSkillsScore

export type RawTable = {
  header: string[];
  dictionaries: string[][];
  rows: (number | string)[][];
}; // dimension cells are dictionary indexes; the last column keeps the count text
export type RawViewFile = {
  viewId: ViewId;
  asAt: MonthKey;
  fetchedAt: string;
  source: string;
  selections: Record<string, string[]>;
  parts: { partition: Record<string, string>; table: RawTable }[];
};
export function encodeRaw(header: string[], rows: string[][]): RawTable;
export function decodeRaw(table: RawTable): {
  header: string[];
  rows: string[][];
};
export function writeRawView(
  root: string,
  file: RawViewFile,
): { path: string; revised: boolean }; // never overwrites; a differing re-fetch -> `<view>.rev-<YYYY-MM-DD>.json`
export function readRawView(
  root: string,
  asAt: MonthKey,
  viewId: ViewId,
): RawViewFile | undefined; // newest revision wins
export async function runView(
  session: QlikSession,
  view: ViewDefinition,
  asAt: MonthKey,
  partitionValues: Record<string, string[]>,
): Promise<RawViewFile>;
```

- [ ] **Step 1: Failing tests.**
  - Every entry in `VIEWS` passes `assertWithinGuardrail`.
  - A view with `shown: ["occupation","points","state"]` throws.
  - `decodeRaw(encodeRaw(h, r))` round-trips.
  - Writing the same content twice doesn't create a revision. Differing content creates `status-history.rev-2026-11-17.json`, and `readRawView` returns it.
  - `runView` against a fake session clears all detail filters, then selects visas, statuses, the as-at month and the partition value, and sets only the toggles for `shown`. The test records and asserts the call sequence.
- [ ] **Step 2: Run** these tests. Expect FAIL.
- [ ] **Step 3: Implement.** Raw files go in `data/raw/<asAt>/<viewId>.json`, as compact JSON (no indentation).
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(import): declare guardrail-checked views and compact raw store`

### Task 7: Invitation round parser (all occupations, all rounds)

**Files:**

- Create: `scripts/import/rounds.ts`
- Create fixtures: `scripts/import/__fixtures__/invitation-rounds.html`, `scripts/import/__fixtures__/previous-rounds.html`
- Test: `scripts/import/rounds.test.ts`

**Interfaces:**

```ts
export type ParsedRound = {
  date: string;
  rows: { occupationName: string; cutoff: number }[];
};
export function parseRoundPages(
  currentHtml: string,
  previousHtml: string,
): ParsedRound[]; // newest first, every round on both pages
export function normalizeOccupationName(name: string): string; // lowercase alphanumerics only, as in the Python importer
export async function fetchRoundPages(): Promise<{
  currentHtml: string;
  previousHtml: string;
}>;
```

Port the logic of `read_rounds` from `scripts/import-report-evidence.py`. That covers the `PageSchemaHiddenField` JSON, the "Current round" block with "Invitations issued on <date>", and `previous["criteria"]` blocks. Keep **all** criteria blocks and **all** table rows. Throw if a cut-off cell isn't an integer, or if the table header no longer mentions an occupation column.

- [ ] **Step 1: Capture fixtures.** Use `fetchRoundPages` written inline in a scratch script, or `curl`, to save the two live pages into `__fixtures__/`. Record the capture date in a comment at the top of `rounds.test.ts`.
- [ ] **Step 2: Failing tests.**
  - The parsed dates include `2026-10-15`, `2026-06-04`, `2025-11-13`, `2025-08-21`, `2024-11-07` and `2024-09-05`, and are newest first.
  - The `2024-11-07` round contains an occupation whose normalised name is `ictbusinessanalyst`, with cut-off 95.
  - Altered HTML with the cut-off `"95+"` throws.
- [ ] **Step 3: Run** `npx vitest run scripts/import/rounds.test.ts`. Expect FAIL.
- [ ] **Step 4: Implement.** No new dependency: use a small hand-written table extractor, as in the Python version.
- [ ] **Step 5: Run** `npm run check`, then **commit** `feat(import): parse every 189 round and occupation row`

### Task 8: Generator with validation and atomic writes

**Files:**

- Create: `scripts/import/generate.ts`, `scripts/import/validate-generated.ts`
- Test: `scripts/import/generate.test.ts`, `scripts/import/validate-generated.test.ts`

**Interfaces:**

```ts
export type GeneratedData = {
  manifest: Manifest;
  index: OccupationIndexEntry[];
  cores: OccupationCore[];
  details: OccupationDetail[];
};
export function generate(input: {
  rawRoot: string;
  asAt: MonthKey;
  checkedAt: string;
  rounds: ParsedRound[];
  importVersion: string;
}): GeneratedData;
export function validateGenerated(
  data: GeneratedData,
  previousManifest: Manifest | null,
): string[]; // empty = valid
export function writeGenerated(outRoot: string, data: GeneratedData): void; // writes to a temp dir, then renames over src/data/{manifest.json,occupation-index.json,occupations/}
```

**Generation rules:**

- Occupation codes and names come from the dashboard's `"<code> <name>"` text.
- Visa and status names map back to the `Visa` / `EoiStatus` keys.
- `"Month Submitted"` `dd/mm/yyyy` and `"As At Month"` `mm/yyyy` become `YYYY-MM`.
- `rounds189` maps round rows to codes with `normalizeOccupationName`. Names with no match go in `manifest.roundsUnmatched`. Matched occupations missing from a round get `cutoff: null`.
- `hasData` is true when the occupation's latest 189, 190 or 491 SUBMITTED total is a non-zero interval.
- `snapshotId` is `skillselect-<YYYY-MM-last-day>`.
- Multi-month fields (`statusHistory`, `invitedByScore`, `stateInvited`, `invitedProfile`) are assembled from **every** `data/raw/<month>/` folder ≤ `asAt`, using each folder's newest revision. That keeps history older than the dashboard's 24-month window.
- Latest-only fields come from the `asAt` folder only.

**Validation rules:**

- Every core and detail object passes the Task 2 guards.
- For each visa and month, the `statusHistory` SUBMITTED total lies within `sumIntervals` of `pool.byScore` (latest month only).
- INVITED in `statusHistory` lies within the sum of `invitedByScore` for that month.
- Occupation codes are unique.
- The occupation count is no more than 10% below `previousManifest`.
- `asAt` is not older than `previousManifest.asAt`, and not older than the newest `data/raw/` folder.
- Core files are ≤50 KB and detail files ≤250 KB (serialised size).

- [ ] **Step 1: Failing tests,** using a temp-dir raw fixture built with `encodeRaw` (2 occupations, 2 months):
  - Generation produces two cores with the expected `pool`, `statusHistory` and `rounds189` (one `null`).
  - A pool total outside the score sums produces one validation issue naming the code and visa.
  - **Review Focus 4:** `writeGenerated` with a deliberately throwing serialiser leaves the existing `src/data` contents in the temp target unchanged.
- [ ] **Step 2: Run** these tests. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(import): generate validated per-occupation data atomically`

### Task 9: CLI and the first real import (as-at 2026-10)

**Files:**

- Create: `scripts/import/cli.ts`
- Modify: `package.json`. Add the scripts `"data:import": "tsx scripts/import/cli.ts"` and `"data:generate": "tsx scripts/import/cli.ts --generate-only"`.
- Generated and committed: `data/raw/2024-11/` … `data/raw/2026-10/`, `src/data/manifest.json`, `src/data/occupation-index.json`, `src/data/occupations/*.json`

**Interfaces:**

- CLI flags: `--as-at YYYY-MM` (required), `--backfill`, `--generate-only`, `--checked-at YYYY-MM-DD` (default: today).
- **Monthly mode:**
  - every view for `--as-at`;
  - plus a re-fetch of the previous month for `status-history`, `invited-by-score` and `state-invited`;
  - budget 150.
- **Backfill:** multi-month views for every month in their window that is ≤ `--as-at` and not yet in `data/raw/`. Budget 600.
- **Partition values:**
  - states: `ACT NSW NT QLD SA TAS VIC WA ANY`;
  - scores: every score present in `pool-by-score` for that as-at;
  - profile attributes: the four in `ProfileAttribute`.
- The CLI prints page reads used, revisions found, unmatched round names and validation issues. It exits non-zero on any issue, and writes `src/data` only when valid.

- [ ] **Step 1: Write the CLI** with argument parsing in an exported pure function `parseArgs(argv: string[])`. Test it in `scripts/import/cli.test.ts`:
  - a missing `--as-at` throws;
  - `--as-at 2026-13` throws.
- [ ] **Step 2: Run** `npx vitest run scripts/import/cli.test.ts`. Expect PASS after implementation.
- [ ] **Step 3: Run the real import.** `npm run data:import -- --as-at 2026-10 --backfill --checked-at <today>`.
  - Expected: exit 0, and page reads ≤600 printed.
  - If over budget or size, apply the pre-approved reductions in order and re-run. Note which ones were applied in `docs/DATA.md` (Task 12).
- [ ] **Step 4: Check sizes.** `du -sh data/raw/*`, `ls -l src/data/occupations | sort -k5 -n | tail`. Expect raw ≤10 MB per month, core ≤50 KB and detail ≤250 KB.
- [ ] **Step 5: Spot-check against the recon values** in the spec, as at 2026-10. Each cell is that occupation's `statusHistory["189"]["2026-10"]` value:
  - Software Engineer: INVITED `<20`, LODGED `119`, HOLD `343`, CLOSED `12354`.
  - Registered Nurses nec: INVITED `2730`.
- [ ] **Step 6: Run** `npm run check`, then **commit** the code and data separately:
  - `feat(import): add data import CLI`
  - `data: import SkillSelect snapshot as at 2026-10 (all occupations)`

### Task 10: Legacy adapters and the reproducibility test

**Files:**

- Create: `src/lib/data/legacy.ts`
- Test: `src/lib/data/legacy.test.ts`
- Move: `src/data/pool.json` → `src/lib/data/__fixtures__/legacy-2026-10/pool.json`, and `src/data/report-evidence.json` → `src/lib/data/__fixtures__/legacy-2026-10/report-evidence.json`. Make this move in Task 12, after the UI stops importing them. Until then the test reads them from `src/data/`.

**Interfaces:**

```ts
export type PoolOccupation = {
  code: string;
  name: string;
  points: { score: number; count: CountText }[];
}; // 189 SUBMITTED, ascending score
export function toPoolOccupation(core: OccupationCore): PoolOccupation | null; // null when no 189 pool
export function toOccupationEvidence(core: OccupationCore): OccupationEvidence; // existing type from src/lib/report-evidence.ts: latest 6 rounds, 12 monthly 189 SUBMITTED totals (month-end dates), 3 pathways
```

- [ ] **Step 1: Failing test.** For each of the 11 codes in the legacy `pool.json`, load the generated core from `src/data/occupations/<code>.json`, then:
  - `toPoolOccupation(core).points` equals `pool.json`'s points;
  - `toOccupationEvidence(core)` deep-equals the matching `report-evidence.json` occupation.
- [ ] **Step 2: Run** `npx vitest run src/lib/data/legacy.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the tests again. Expect PASS.
  - If values differ, investigate. An **unexplained** mismatch blocks the task.
  - An explained one (an old importer bug, or a government revision) is recorded in an `explainedDifferences` table in the test, with the reason, and in `docs/DATA.md`.
- [ ] **Step 5: Run** `npm run check`, then **commit** `test(data): prove the new pipeline reproduces the 2026-10 legacy data`

### Task 11: Loaders, static assets and the client hook

**Files:**

- Create:
  - `src/lib/data/load-server.ts`: Node `fs` reads, only imported from Server Components and `generateStaticParams`.
  - `src/lib/data/occupation-url.ts`
  - `src/components/data/use-occupation-core.ts`
  - `scripts/copy-public-data.ts`
- Test: `src/lib/data/occupation-url.test.ts`
- Modify: `package.json`. Add `"predev"` and `"prebuild"`, both `tsx scripts/copy-public-data.ts`, which copies `src/data/occupations/*.json` to `public/data/occupations/`.

**Interfaces:**

```ts
// load-server.ts
export function loadManifest(): Manifest;
export function loadOccupationCore(code: string): OccupationCore | null; // validates with isOccupationCore
export function loadOccupationDetail(code: string): OccupationDetail | null;
// occupation-url.ts
export function occupationDataUrl(
  code: string,
  index: OccupationIndexEntry[],
  kind: "core" | "detail",
): string | null; // null unless code is in index; "/data/occupations/<code>.json" or "<code>.detail.json"
// use-occupation-core.ts ("use client")
export type OccupationLoad =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; core: OccupationCore }
  | { status: "unavailable" };
export function useOccupationCore(
  code: string | null,
  index: OccupationIndexEntry[],
): OccupationLoad;
```

- [ ] **Step 1: Failing tests.**
  - **Review Focus 5:** `occupationDataUrl("../etc", index, "core")` is `null`, and so is `occupationDataUrl("999999", index, "core")`.
  - A known code returns `"/data/occupations/261313.json"`.
- [ ] **Step 2: Run** `npx vitest run src/lib/data/occupation-url.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement** all four files. The hook fetches only through `occupationDataUrl`, validates with `isOccupationCore`, and maps any failure to `"unavailable"`. Read `node_modules/next/dist/docs/` on static exports and the `public` folder first.
- [ ] **Step 4: Run** `npm run check && npm run build`. Expect PASS, and `out/data/occupations/261313.json` to exist.
- [ ] **Step 5: Commit** `feat(data): add server loaders, static data assets and client hook`

### Task 12: Move the UI to the new data, remove the old pipeline, and document

**Files:**

- Modify:
  - `src/components/pool-explorer.tsx`: occupation index for search; `initial: PoolOccupation` prop; hook for other codes.
  - `src/components/home-experience.tsx` and `src/app/page.tsx`: the page loads core `261111` server-side and passes it down.
  - `src/components/check-flow.tsx`: index for the picker and the `?occupation=` check; hook for the chosen code.
  - `src/components/report.tsx`.
  - `src/app/sample/page.tsx`: server-loads `261111` and `261313`.
  - `src/app/methodology/page.tsx`: replace "covers 11 occupations" with the manifest count.
  - `src/lib/pool.ts`: drop the `snapshot` JSON import; `Occupation` becomes `PoolOccupation`.
  - `src/lib/report-evidence.ts`: drop the JSON import and `evidence`; keep types and `netPoolChange`; move `validateOccupationEvidence` tests onto generated data via `toOccupationEvidence`.
- Delete: `scripts/import-report-evidence.py`.
- Move: the two legacy JSON files into the Task 10 fixtures folder, updating the test path.
- Create: `docs/DATA.md`.
- Modify: `scripts/README.md`, `CLAUDE.md` (the architecture data bullets and commands), `docs/REPORT-COVERAGE.md` (data sources section), `docs/HANDOFF.md`.

**Interfaces:**

- `Report` gets these new props, replacing the internal JSON lookups:
  - `occupation: { status: "loading" } | { status: "ready"; pool: PoolOccupation | null; evidence: OccupationEvidence } | { status: "unavailable" }`;
  - `comparisonIndex: OccupationIndexEntry[]`.
- The comparison occupation is loaded through `useOccupationCore`.
- Snapshot dates displayed come from `core.asAt` and `manifest.checkedAt`, passed as props.

**Steps:**

- [ ] **Step 1: Update the components and pages** as listed. While `status === "loading"`, the pool, rounds and comparison sections show "Loading published data…" (at least 12px text), never the "not in snapshot" message.
- [ ] **Step 2: Run** `rg "pool.json|report-evidence.json" src`. Expect matches only in `src/lib/data/__fixtures__` and the legacy test.
- [ ] **Step 3: Run** `npm run check && npm run build`. Expect PASS.
- [ ] **Step 4: Browser smoke test** against `python3 -m http.server 3017 --bind 127.0.0.1 --directory out`:
  - **Homepage:** the explorer shows ICT Business Analyst at 865–903, and searching "Registered Nurses" loads its chart.
  - **`/check/?occupation=233211`:** the occupation is preselected. Complete the four steps and confirm the report shows the pool chart and rounds.
  - **`/sample/`:** the content is identical to before, with 90/95/105 points.
  - At 390px width, nothing overflows horizontally. There are no console errors.
- [ ] **Step 5: Write `docs/DATA.md`.** Cover:
  - each view's shown columns, filters and months, plus any reductions applied in Task 9;
  - status meanings and the observed behaviour table from the spec;
  - known limits: multi-visa, the CLOSED mix, no onshore/offshore, masking, the INVITED lower bound, `ANY`, and the SUBMITTED coverage-window finding (compare `statusHistory` SUBMITTED for 189 against the legacy trend and record what it shows);
  - the guardrail rules;
  - snapshot, revision and versioning rules;
  - how to run monthly and backfill imports;
  - any explained differences from Task 10.

  Update the other docs listed.

- [ ] **Step 6: Run** `npm run check`, then **commit** in two parts:
  - `refactor: feed the UI from per-occupation data`
  - `docs: add data dictionary and update import docs`
