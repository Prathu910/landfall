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

