### Task 5: Automation helpers (base branch, frozen sections, failure issues)

**Files:**

- Create: `src/lib/updates/frozen.ts`, `scripts/automation/base-branch.ts`, `scripts/automation/frozen-check.ts`, `scripts/automation/failure-issue.ts`
- Modify: `package.json` (`"updates:frozen-check": "tsx scripts/automation/frozen-check.ts"`)
- Test: `src/lib/updates/frozen.test.ts`, `scripts/automation/base-branch.test.ts`, `scripts/automation/failure-issue.test.ts`

**Interfaces:**

- Produces: `changedFrozenSections(base: RecapFacts | null, head: RecapFacts): string[]` (each `rounds[<date>]` and `data` present in `base` whose JSON differs in `head`, or is missing from it; header fields are ignored); `hasPublishedData(base: RecapFacts | null): boolean`; `hasPublishedRound(base: RecapFacts | null, date: string): boolean`. Both jobs skip generating (and rendering) a section that is already on `main`.
- Produces: `chooseBase(open: { number: number; headRefName: string }[], fresh: string): { kind: "join"; branch: string; number: number } | { kind: "new"; branch: string }` (throws on more than one). CLI prints `branch=…`, `pr=…` lines for `$GITHUB_OUTPUT`, reading `gh pr list --label data-update --state open --json number,headRefName`.
- CLI `updates:frozen-check -- --base origin/main` compares every `src/data/updates/*.json` with `git show <base>:<path>` (missing on base = new file, fine) and exits 1 listing sections; `--allow <month>:<section>` exempts one section (the founder-requested regeneration).
- Produces: `failureIssueAction(open: { number: number; title: string }[], title: string): { kind: "create" } | { kind: "comment"; number: number }`; titles `Monthly SkillSelect update failed ({Mon YYYY})` and `189 round import failed ({d Mon YYYY})`. CLI modes `report --title --log <file>` (body: the failing step from `$FAILED_STEP`, the last 50 log lines, the run URL) and `resolve --title` (closes it with a comment linking the successful run).

- [ ] **Step 1: Write the failing tests**

```ts
expect(changedFrozenSections(oct, { ...oct, updatedAt: "2026-12-15" })).toEqual(
  [],
);
expect(
  changedFrozenSections(
    oct,
    withDataField(oct, "movers", { fell: [], rose: [] }),
  ),
).toEqual(["data"]);
expect(changedFrozenSections(oct, withoutRound(oct, "2026-10-15"))).toEqual([
  "rounds[2026-10-15]",
]);
expect(changedFrozenSections(null, oct)).toEqual([]);
expect(chooseBase([], "data/skillselect-2026-11")).toEqual({
  kind: "new",
  branch: "data/skillselect-2026-11",
});
expect(
  chooseBase(
    [{ number: 12, headRefName: "data/round-2026-12-10" }],
    "data/skillselect-2026-11",
  ),
).toEqual({ kind: "join", branch: "data/round-2026-12-10", number: 12 });
expect(() =>
  chooseBase(
    [
      { number: 12, headRefName: "a" },
      { number: 13, headRefName: "b" },
    ],
    "x",
  ),
).toThrow("More than one open data-update pull request: #12, #13");
expect(
  failureIssueAction(
    [{ number: 4, title: "Monthly SkillSelect update failed (Nov 2026)" }],
    "Monthly SkillSelect update failed (Nov 2026)",
  ),
).toEqual({ kind: "comment", number: 4 });
```

- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Commit** `feat(automation): base branch, frozen-section check and failure issues`.

