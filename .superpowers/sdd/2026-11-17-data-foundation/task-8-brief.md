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

