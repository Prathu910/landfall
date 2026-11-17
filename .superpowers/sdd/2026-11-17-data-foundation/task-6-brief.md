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

