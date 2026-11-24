# Monthly updates 3: scheduled jobs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three GitHub Actions workflows: a monthly import that opens one data pull request with a plain-English summary (adding to an open data PR when there is one), a 189-round job that does the same for each new round, and a daily page watcher that opens issues. Nothing goes live without the founder merging.

**Architecture:** Workflows stay thin: each step calls an npm script. Decisions (which month, which branch, whether a frozen section changed, which issue to open or comment on, what the summary says) are pure functions in `src/lib/updates/` and `scripts/automation/` with tests; the YAML only wires them together with `gh` and `git`. The importer gains `--probe`, `--keep-rounds`, `--rounds-only` and a machine-readable run report.

**Tech Stack:** GitHub Actions (`ubuntu-latest`, `GITHUB_TOKEN` only), `gh` CLI, Node 22.12+, tsx, Vitest; Chrome from the runner image for `social:render`.

**Spec:** `docs/superpowers/specs/2026-11-24-monthly-updates-design.md` (sections 3, 6.1, 6.3 rules, 6.8 swap, 6.9–6.12, 6.14 rehearsal, 6.15, 6.16, 8 steps 0 and 3–5, risks 1–3, 9, 14–17).

**Depends on:** Task 1 depends on nothing and should run first, before Plans 1 and 2 ship (spec step 0). Tasks 2–9 need Plans 1 and 2 merged. **Branches:** Task 1 on `spike/runner-import`; the rest on `roadmap/monthly-updates-jobs` from `main`.

## Global Constraints

- The repository is public: branches, PRs, summaries, images, issues, logs and artifacts are public. They hold only published government data and our drafts; never a secret, token or personal detail.
- No secrets added. Only the built-in `GITHUB_TOKEN`. No Cloudflare or Supabase credentials, no auto-merge, no deploy step.
- Triggers: `schedule` and `workflow_dispatch` only; never `pull_request_target` or forked PRs. (The throwaway spike in Task 1 also uses `push` to its own branch; it is deleted afterwards.)
- `permissions:` minimal per workflow: monthly and round jobs `contents: write`, `pull-requests: write`, `issues: write`; page watcher `contents: read`, `issues: write`; spike `contents: read`.
- Third-party actions pinned by full commit SHA (with the version in a comment). `actions/setup-node` with `node-version: 22` and `cache: npm`. `timeout-minutes: 120` on import jobs.
- Commits as `github-actions[bot]` (`41898273+github-actions[bot]@users.noreply.github.com`).
- `concurrency: { group: data-update, cancel-in-progress: false }` on the monthly and round jobs.
- At most one open PR labelled `data-update`; a job that finds one works on its branch and appends.
- Importer guardrails (`docs/DATA.md`) are unchanged: page-read budget 250 for a monthly import, ≥ 250 ms between calls, never work around a block. The summary warns above 90% (225 reads).
- Any failed step fails the job: no PR is opened or updated with bad data; a failure issue is opened or commented on.
- Each section of a facts file is frozen once merged: a job never changes a section that exists on `main`.
- Founder's login for reviews and assignment: `Prathu910` (write it without `@` in any text the tooling posts).
- `npm run check` and `npm run build` pass after every task.

## Spec decisions made in this plan

1. **The spike can't be a pure `workflow_dispatch` workflow on a branch.** GitHub only offers "Run workflow" for a workflow file on the default branch. The spike therefore runs on `push` to `spike/runner-import` (and is deleted after). The real workflows can only run, and be dispatched, once merged to `main`; the rehearsal (Task 9) happens after that merge.
2. **"A test on every data PR" runs inside the jobs.** PRs opened with `GITHUB_TOKEN` trigger no workflows (spec 6.15), so the frozen-section check is a step of both jobs, before any commit is pushed, comparing with `origin/main`.
3. **A month whose `data` section is already on `main` is not regenerated.** Re-importing it (a revision, or the rehearsal) leaves the section alone, renders only missing images, and puts any revision under "Needs your decision".
4. **The run report.** The importer writes `--report-file <path>` (page reads, budget, revisions, unmatched names, new rounds) so the summary never parses logs. Build staleness warnings are the `WARNING` lines of the build log.
5. **Preview links.** The Cloudflare preview URL is built from an optional repository variable `CF_PAGES_PROJECT` (not a secret); without it the summary leaves the preview item out (spec open question 1).
6. **`roundsCheckedAt`.** `--rounds-only` sets a new optional `manifest.roundsCheckedAt` and leaves `checkedAt` (the dashboard check) alone.

## Review Focus

- **Two open `data-update` PRs** (a manual mistake): both jobs stop with "More than one open data-update pull request: #a, #b" instead of picking one. Test in Task 5.
- **The dashboard two months ahead** (a missed month): one month per run, the oldest first (`manifest.asAt` + 1), never the newest. Test in Task 2.
- **A round and a new month on the same day:** the second job (serialised by `concurrency`) sees the first job's open PR and joins it; its summary section is appended with its own date. Test in Tasks 4 and 5.
- **A revision of a month whose recap is published:** no section changes; the summary's "Needs your decision" shows the revised files with row counts before and after. Test in Task 4.
- **The page-watch baseline is evicted from the cache, or a page fails twice and then recovers:** a missing baseline stores one and opens no issues; the failure count resets on success, so "Source unreachable" needs 3 consecutive days. Test in Task 8.

---

### Task 1: Runner spike (do this first)

> **Needs the founder's go-ahead to push** `spike/runner-import`. Ask before pushing; do not push any other branch.

**Files:**

- Create (on `spike/runner-import` only): `.github/workflows/spike-runner-import.yml`
- Modify: `.superpowers/sdd/2026-11-24-monthly-updates/progress.md` (results)

**Interfaces:** none (throwaway).

- [ ] **Step 1: Write the workflow.** `on: push: branches: [spike/runner-import]` plus `workflow_dispatch`; `permissions: contents: read`; one job on `ubuntu-latest`, `timeout-minutes: 120`: checkout, setup-node (22, npm cache), `npm ci`, then `npm run data:import -- --as-at 2026-10 --checked-at "$(TZ=Australia/Sydney date +%F)" 2>&1 | tee import.log` (with `set -o pipefail`), then always upload `import.log` and `git status --porcelain` output as an artifact with `retention-days: 7`. No commit, no push from the job.
- [ ] **Step 2: Ask the founder** for the go-ahead, then `git push -u origin spike/runner-import` and watch with `gh run watch`.
- [ ] **Step 3: Record** in the ledger: whether the dashboard page and the websocket answered, total duration (the CLI's `Duration:` line), `Page reads used: N of 250`, revisions found, and any error text.
- [ ] **Step 4: STOP if blocked.** If the dashboard refuses the runner (HTTP 403 or 429 on the dashboard page, the websocket failing to open or closing early, repeated timeouts, or reads far slower than the 12–19 KB/s seen locally), **halt this plan and ask the founder**. Do not retry from another network, do not fall back to the founder's Mac or a self-hosted runner, and do not work around the block (Founder decision, spec section 8). Plans 1 and 2 can continue; Tasks 2–9 wait for the founder's answer.
- [ ] **Step 5: Clean up** (founder's go-ahead): delete the remote branch (`git push origin --delete spike/runner-import`) and the local one. Commit only the ledger note.

### Task 2: `--probe` and the target month

**Files:**

- Modify: `scripts/import/qlik-client.ts` (`listAsAtMonths`), `scripts/import/cli.ts` (`--probe`, `--report-file`), `scripts/import/qlik-client.test.ts`, `scripts/import/cli.test.ts`
- Create: `scripts/automation/next-month.ts`, `scripts/automation/next-month.test.ts`

**Interfaces:**

- Produces: `monthFromSerial(serial: number): MonthKey` (inverse of `asAtSerial`); `QlikSession.listAsAtMonths(): Promise<MonthKey[]>` (a session list object on the `As At Month` field: no `readTable`, no variable or toggle change, not counted as a page read); CLI `--probe` prints `Newest As At Month: YYYY-MM` and exits 0 without writing anything (no other flag allowed with it except `--report-file`).
- Produces: `--report-file <path>` writes `ImportReport = { mode: "probe" | "monthly" | "backfill" | "generate-only" | "rounds-only"; asAt: MonthKey | null; newestAsAt: MonthKey | null; pageReads: number; budget: number | null; revisions: { path: string; rowsBefore: number; rowsAfter: number }[]; unmatched: string[]; newRounds: string[]; durationSeconds: number }` (written on success and on failure, with what is known).
- Produces: `nextImportMonth(manifestAsAt: MonthKey, newest: MonthKey, requested: MonthKey | null): MonthKey | null` (the requested month when given; else `manifestAsAt + 1` when `newest > manifestAsAt`; else null). CLI `tsx scripts/automation/next-month.ts --newest YYYY-MM [--requested YYYY-MM]` prints the month or nothing.

- [ ] **Step 1: Write the failing tests**

```ts
expect(monthFromSerial(asAtSerial("2026-10"))).toBe("2026-10");
it("probes with no table read and no variable change", async () => {
  /* fake transport: record methods */ expect(methods).not.toContain(
    "GetHyperCubeData",
  );
  expect(methods).not.toContain("SetNumValue");
  expect(session.pageReads()).toBe(0);
});
expect(nextImportMonth("2026-10", "2026-10", null)).toBeNull();
expect(nextImportMonth("2026-10", "2026-12", null)).toBe("2026-11");
expect(nextImportMonth("2026-10", "2026-10", "2026-10")).toBe("2026-10"); // rehearsal
expect(() => parseArgs(["--probe", "--as-at", "2026-10"])).toThrow();
```

- [ ] **Step 2–4:** fail, implement, pass. Then run `npm run data:import -- --probe` once locally; expected `Newest As At Month: 2026-10` (until November's data appears).
- [ ] **Step 5: Commit** `feat(import): --probe for the newest As At Month, and a run report`.

### Task 3: `--keep-rounds`, `--rounds-only` and new-round detection

**Files:**

- Modify: `scripts/import/cli.ts`, `scripts/import/generate.ts` (`roundsCheckedAt`), `src/lib/data/types.ts` and `guards.ts` (`Manifest.roundsCheckedAt?: string`), `scripts/import/rounds.ts` (`newestRoundDate`)
- Create: `scripts/automation/detect-round.ts`
- Test: `scripts/import/cli.test.ts`, `scripts/import/rounds.test.ts`, `scripts/automation/detect-round.test.ts`

**Interfaces:**

- Consumes: `writeRoundPage` (Plan 1), `readRoundsFile` (Plan 1, v2).
- CLI: `--keep-rounds` (monthly import that fetches no round pages and regenerates with the stored `rounds.json`, as `--generate-only` does for rounds); `--rounds-only` (no Qlik session: fetches both round pages, stores the current one with `writeRoundPage`, regenerates `src/data/` from stored raw for the current `manifest.asAt` and `manifest.checkedAt`, sets `roundsCheckedAt` to the `--checked-at` date, lists new round dates in the report). `--rounds-only` takes no `--as-at`; `--keep-rounds` requires a monthly import. Plan 1's `--rounds-html <dir>` is also accepted with `--rounds-only` (pages read from disk, for tests and dry runs); `detect-round.ts` reads `$ROUNDS_HTML_DIR/invitation-rounds.html` when that variable is set.
- Produces: `newestRoundDate(currentHtml: string): string`; `newRoundDates(stored: RoundsFile, parsed: RoundPages): string[]` (dates in `parsed` newer than the newest stored round, oldest first). `detect-round.ts` fetches the current page only and prints `new` or `none`.

- [ ] **Step 1: Write the failing tests**

```ts
expect(newestRoundDate(currentFixtureHtml)).toBe("2026-10-15");
expect(newRoundDates(storedUpTo("2026-06-04"), parsedFixtures)).toEqual(["2026-10-15"]);
expect(newRoundDates(storedUpTo("2026-10-15"), parsedFixtures)).toEqual([]);
expect(parseArgs(["--as-at", "2026-11", "--keep-rounds"])).toMatchObject({ mode: "monthly", keepRounds: true });
expect(() => parseArgs(["--rounds-only", "--as-at", "2026-11"])).toThrow();
expect(() => parseArgs(["--as-at", "2026-11", "--backfill", "--keep-rounds"])).toThrow();
it("--rounds-only leaves checkedAt and sets roundsCheckedAt", ...) // generate with a fixture raw root
```

- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Commit** `feat(import): --keep-rounds, --rounds-only and stored round pages`.

### Task 4: PR summary

**Files:**

- Create: `src/lib/updates/summary-view.ts`, `scripts/updates/summary.ts`
- Modify: `package.json` (`"updates:summary": "tsx scripts/updates/summary.ts"`)
- Test: `src/lib/updates/summary-view.test.ts`

**Interfaces:**

- Consumes: `RecapFacts`, `format.ts`, `SetManifest` (Plan 2), `ImportReport` (Task 2), `Manifest`.
- Produces: `buildSummary(input: { kind: "data" | "round"; month: MonthKey; round: string | null; facts: RecapFacts; manifest: Manifest; previousManifest: Manifest | null; report: ImportReport; buildWarnings: string[]; publishedDataMonths: MonthKey[]; sets: SetManifest[]; branch: string; previewBase: string | null; today: string }): string` (Markdown, items 1–10 of spec 6.12 in order; for `kind: "round"` the round items only); `appendSection(existingBody: string, section: string, heading: string): string` (heading "Added {d Mon}: 189 round of {d Mon YYYY}" or "Added {d Mon}: SkillSelect data as at {d Mon YYYY}").
- "Needs your decision" lists: revisions in `report.revisions` (with rows before and after, and "published recap affected" when the revised month is in `publishedDataMonths`); new unmatched round names (`manifest.roundsUnmatched` minus the previous manifest's); page reads above 225; each build `WARNING`; and the coverage-window figure for Software Engineer (`261313`): the 189 all-status sum this month and last as ranges, and their difference.
- Images: a table per set, light and dark side by side, each `![alt](https://github.com/Prathu910/landfall/blob/<branch>/<file>?raw=true)`, then the draft caption in a code block.
- CLI: `--month --kind [--round] --previous-manifest --import-report --build-log --branch [--append-to <body.md>]`; reads `CF_PAGES_PROJECT` from the environment for `previewBase`.

- [ ] **Step 1: Write the failing tests** (2026-10 facts, a fixture report)

```ts
const md = buildSummary({ kind: "data", month: "2026-10", ... });
expect(md.split("\n")[0]).toBe("SkillSelect data as at 31 Oct 2026 (snapshot skillselect-2026-10-31), checked 17 Nov 2026. Validation passed; `npm run check` and `npm run build` passed.");
expect(md).toContain("189 pool: 181,076–182,254 → 166,555–167,904");
expect(md).toContain("Spotlight: Registered Nurses nec (254499)");
expect(md).toContain("To publish: merge this pull request. Cloudflare deploys it in a few minutes. To skip this month, close it.");
expect(buildSummary({ ..., report: { ...r, pageReads: 231 } })).toMatch(/Page reads: 231 of 250/);
expect(buildSummary({ ..., report: withRevision("data/raw/2026-10/status-history.rev-2026-12-14.json", 1200, 1203), publishedDataMonths: ["2026-10"] })).toMatch(/published recap affected/);
expect(buildSummary({ ..., previewBase: null })).not.toMatch(/pages\.dev/);
expect(appendSection(body, roundMd, "Added 12 Dec: 189 round of 10 Dec 2026")).toMatch(/## Added 12 Dec: 189 round of 10 Dec 2026/);
it("passes BANNED_COPY outside quoted occupation names", ...)
```

- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Commit** `feat(updates): plain-English PR summary`.

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

### Task 6: `monthly-data.yml`

**Files:**

- Create: `.github/workflows/monthly-data.yml`, `scripts/automation/monthly.sh` (the job body, `set -euo pipefail`, one function per spec step)
- Modify: `scripts/social/render.ts` (add `--no-sandbox` to Chrome's args when `CI=true`, if the runner's Chrome can't start its sandbox: we render only our own static HTML)

**Interfaces:**

- Consumes: Tasks 2–5; `updates:generate`, `social:render`, `updates:retention` (Plans 1–2).
- Triggers: `schedule: - cron: "30 20 1-28 * *"`; `workflow_dispatch` inputs `month` (optional `YYYY-MM`: import that month instead of probing; the rehearsal) and `spotlight` (optional code: the swap).
- Import path, in order (spec 6.9): choose base (`chooseBase`, fresh branch `data/skillselect-<target>`) and check it out; probe and `nextImportMonth` (exit 0 when null); copy `src/data/manifest.json` to `$RUNNER_TEMP/previous-manifest.json`; `npm ci`; `npm run data:import -- --as-at $TARGET --checked-at $(TZ=Australia/Sydney date +%F) --keep-rounds --report-file $RUNNER_TEMP/import.json`; if `origin/main` has no `data` section for `$TARGET`, `npm run updates:generate -- --month $TARGET --section data --previous-manifest …`; `npm run social:render -- --month $TARGET --set month` when that set is missing; `npm run updates:retention`; `npm run check`; `npm run build 2>&1 | tee $RUNNER_TEMP/build.log`; `npm run updates:frozen-check -- --base origin/main`; `npm run updates:summary …`; commit 1 `data: SkillSelect snapshot as at {Mon YYYY}` (`data/raw/`, `src/data/` except `updates/`), commit 2 `feat(updates): {Month YYYY} recap and Instagram cards` (`src/data/updates/`, `public/social/`), skipping an empty commit; push; `gh pr create --label data-update --reviewer Prathu910 --title "SkillSelect data as at {Mon YYYY}" --body-file pr-body.md`, or on a joined PR `gh pr edit --body-file` with the appended section plus `gh pr comment` saying what was added.
- Swap path (`spotlight` set): check out the open data PR's branch (fail if none); `updates:generate -- --month $MONTH --section data --spotlight $CODE --previous-manifest <(git show origin/main:src/data/manifest.json)`; `social:render -- --set month`; check, build, frozen check; commit `feat(updates): spotlight {name}`; push; PR comment.
- `if: failure()`: upload `$RUNNER_TEMP/*.log`, `import.json` and `git status --porcelain` output as an artifact (`retention-days: 7`); `failure-issue.ts report`. On success: `failure-issue.ts resolve` for that month.

- Environment: `CHROME_PATH: /usr/bin/google-chrome` (the runner image's Chrome); `gh label create data-update --force` before the first PR, so the label exists (spec 6.16 item 4). The summary's preview item links `/updates/<month>/`, the spotlight's page and the two largest movers' pages.

- [ ] **Step 1: Lint the workflow** with [actionlint](https://github.com/rhysd/actionlint) (`brew install actionlint`; `actionlint .github/workflows/monthly-data.yml`) and `bash -n scripts/automation/monthly.sh`. Expected: no errors.
- [ ] **Step 2: Dry-run the job body locally** in a scratch checkout: `DRY_RUN=1 MONTH=2026-10 bash scripts/automation/monthly.sh`. With `DRY_RUN=1` the script runs `data:generate` instead of the network import and prints each `git push`/`gh` command instead of running it. Expected: probe skipped, 2026-10 regenerated, data section not regenerated (it is on `main`), month set rendered if missing, check and build pass, frozen check passes, and the printed `gh pr create` line has `--label data-update`.
- [ ] **Step 3: Commit** `ci: monthly SkillSelect import workflow`.

### Task 7: `round-189.yml`

**Files:**

- Create: `.github/workflows/round-189.yml`, `scripts/automation/round.sh`

**Interfaces:**

- Consumes: Tasks 3–5; `updates:generate --section round`, `social:render --set round`.
- Triggers: `schedule: - cron: "0 21 * * *"`; `workflow_dispatch`. Same `concurrency`, permissions, base-branch rule (fresh branch `data/round-<date>`), failure handling (title `189 round import failed ({d Mon YYYY})`).
- Body (spec 6.10): `detect-round.ts` (exit 0 on `none`); `npm run data:import -- --rounds-only --checked-at … --report-file …`; for each date in `report.newRounds`, oldest first: `updates:generate -- --month <Sydney month of the date> --section round --round <date>` and `social:render -- --month … --set round --round <date>`; check; build; frozen check; summary `--kind round`; commit `data: 189 round of {d Mon YYYY}` and `feat(updates): {d Mon YYYY} round recap and cards`; push; PR or joined PR as in Task 6.

- [ ] **Step 1: Lint** with actionlint and `bash -n`, as in Task 6.
- [ ] **Step 2: Dry-run** `DRY_RUN=1 bash scripts/automation/round.sh`. Expected: `none` (the 15 Oct 2026 round is stored), exit 0, nothing written. Then with a scratch `rounds.json` whose newest round is 4 Jun 2026 and the fixture pages served from disk (`ROUNDS_HTML_DIR=scripts/import/__fixtures__`, honoured by `detect-round.ts` and passed as `--rounds-html` in dry runs): the 15 Oct round is detected, and its section is skipped because `main` already has `rounds[2026-10-15]` (the script says so); the frozen check passes.
- [ ] **Step 3: Commit** `ci: 189 round workflow`.

### Task 8: Page watcher

**Files:**

- Create: `scripts/page-watch/sources.ts`, `scripts/page-watch/normalise.ts`, `scripts/page-watch/watch.ts`, `scripts/page-watch/cli.ts`, `.github/workflows/page-watch.yml`
- Modify: `package.json` (`"page-watch": "tsx scripts/page-watch/cli.ts"`)
- Test: `scripts/page-watch/{sources,normalise,watch}.test.ts` (fixtures: two saved pages under `scripts/page-watch/__fixtures__/`, added to `.prettierignore`)

**Interfaces:**

- Produces: `WatchedSource = { url: string; citedBy: { file: string; item: string; checkedAt: string | null }[] }`; `collectSources(): WatchedSource[]` from `src/data/states.ts`, `src/data/state-rules/2026-27/` (every `source`), the list URLs exported by `scripts/state-lists/*.ts`, and `src/data/guide/` (`SOURCES` and every `source` in fees, steps, visas, points changes), found by `findCitations(value: unknown, file: string): …` (walks objects for string `source`/`url` values starting `https://`, keeping a sibling `checkedAt`); unique by URL, sorted.
- Produces: `normalisePage(html: string, url: string): { title: string; text: string; hash: string }` (drop `script`, `style`, `nav`, `header`, `footer` and elements whose id or class contains `cookie`; prefer `<main>` or `[role=main]`; `decodeEntities` from `scripts/import/rounds.ts`; collapse whitespace to one line per block; drop lines matching `VOLATILE_LINES[host]` (start with `/page last updated/i`, `/last updated:/i`, `/^\d+ (views|visits)$/i`); `hash` = SHA-256 of `text`).
- Produces: `WatchState = Record<string, { hash: string; text: string; firstSeen: string; failures: number }>`; `planWatch(input: { sources: WatchedSource[]; results: Record<string, { ok: true; page: ReturnType<typeof normalisePage> } | { ok: false; reason: string }>; state: WatchState | null; openIssues: { number: number; title: string; body: string }[]; today: string }): { state: WatchState; actions: ({ kind: "create"; title: string; body: string; label: "source-watch" } | { kind: "comment"; number: number; body: string })[]; summary: string }`. Issue titles `Source changed: {title or host}` and `Source unreachable: {host}`; bodies carry `<!-- watch-url: {url} -->` so a later change comments on the open issue for that URL; a change body lists the citing items with their `checkedAt`, the date first seen and up to 40 changed lines as a before/after excerpt (`diffLines(before, after, 40)`).
- Fetching (cli.ts): sequential, ≥ 1 s apart, 30 s timeout, the importer's `User-Agent`, one retry; HTTP ≥ 400, a timeout or a login page (a password field in the normalised page) is a failure. Never works around a block.
- `page-watch.yml`: `schedule: - cron: "0 22 * * *"`, `workflow_dispatch`; `permissions: contents: read, issues: write`; restore `actions/cache` with `restore-keys: page-watch-`, run, save key `page-watch-${{ github.run_id }}`; actions via `gh issue create --label source-watch --assignee Prathu910` / `gh issue comment`; summary to `$GITHUB_STEP_SUMMARY`.

- [ ] **Step 1: Write the failing tests**

```ts
const sources = collectSources();
expect(sources.length).toBeGreaterThanOrEqual(40);
expect(sources.map((s) => s.url)).toContain("https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list");
expect(new Set(sources.map((s) => s.url)).size).toBe(sources.length);
expect(normalisePage(withNavAndCookie, url).text).not.toMatch(/cookie|Skip to content/i);
expect(normalisePage(page("Page last updated: 3 Dec 2026"), url).hash).toBe(normalisePage(page("Page last updated: 4 Dec 2026"), url).hash);
expect(planWatch({ ..., state: null }).actions).toEqual([]);                       // baseline only
expect(planWatch({ ..., state: changedState }).actions[0]).toMatchObject({ kind: "create", title: "Source changed: Skilled occupation list" });
expect(planWatch({ ..., openIssues: [issueFor(url)] }).actions[0]).toMatchObject({ kind: "comment" });
expect(failingDays(2).then(recovers).state[url].failures).toBe(0);
expect(planWatch({ ..., state: failedTwice, results: { [url]: { ok: false, reason: "HTTP 403" } } }).actions[0].title).toBe("Source unreachable: immi.homeaffairs.gov.au");
```

- [ ] **Step 2–4:** fail, implement, pass. Run `npm run page-watch -- --dry-run` locally: it fetches every source, prints the summary and the actions it would take, and writes the state to a temp file.
- [ ] **Step 5: Commit** `feat(automation): daily page watcher for cited state and fee pages`.

### Task 9: Docs, founder setup and the rehearsal

**Files:**

- Modify: `docs/OPERATIONS.md` (new "Monthly data pipeline" section: the three workflows, the one-time setup of spec 6.16, how to swap the spotlight, how to skip a month, what a failure issue means), `docs/DATA.md` and `scripts/README.md` ("After an import" now happens in the workflow; `--probe`, `--keep-rounds`, `--rounds-only`, `--report-file`, `roundsCheckedAt`), `docs/HANDOFF.md`, `docs/STRATEGY.md` (decision log, if the founder decides anything new), `CLAUDE.md` (`.github/workflows/` and `scripts/automation/` lines)

- [ ] **Step 1: Write the docs** and run `npm run check` and `npm run build`; commit `docs: monthly data pipeline operations`.
- [ ] **Step 2: Hand off for merge.** The workflows only run from `main`. Ask the founder to do the one-time setup (Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests"; notifications; labels `data-update` and `source-watch`; confirm Cloudflare previews and, if on, set the `CF_PAGES_PROJECT` variable) and to merge.
- [ ] **Step 3: Rehearse** (after merge): `gh workflow run monthly-data.yml -f month=2026-10`. Expected PR: `src/data/manifest.json` changes only in `checkedAt` (and `data/raw/` only if Home Affairs revised 2026-10, listed under "Needs your decision"); `src/data/updates/2026-10.json` unchanged; `public/social/2026-10/` month set added if it wasn't committed in Plan 2; the summary renders in GitHub with the images. Then `gh workflow run round-189.yml` (expected: no new round, exit 0) and `gh workflow run page-watch.yml` twice (first: "baseline stored", no issues; second: no issues). Record durations and page reads in the ledger.
- [ ] **Step 4:** Leave the rehearsal PR for the founder to merge or close. Target: done before November's data appears (about mid-December 2026).
