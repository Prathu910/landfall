# Task 7 report: `round-189.yml`

Status: DONE_WITH_CONCERNS. BASE dc17481.

## Commits

- `01f2a92` refactor(ci): move the data jobs' shared shell steps into lib.sh
- `f517eea` ci: 189 round workflow

## What I built

### `scripts/automation/lib.sh` (new, sourced)

The shared shell steps moved here from `monthly.sh` with no change to their text or behaviour: constants (`FOUNDER`, `LABEL`, bot identity, `LOG_CAP`), `BASE_REF`/`DRY_RUN`/`TODAY` defaults, `BRANCH`/`PR`/`HELD`/`COMMITS`, `fail`, `step`, `run_tsx`, `print_dry`, `gh_write`, `gh_read`, `install` (`env -u GH_TOKEN npm ci`), `fetch_main`, `choose_base` (with the lock-file reinstall), `check_and_build` (check, build to `build.log`, frozen check), `commit_paths`, `require_clean_tree`, `push_branch`, `comment_on_pr` and `collect_failure`. Only these were made parametric:
- `open_or_update_pr TITLE COMMENT`;
- `resolve_failure --month|--round KEY`;
- `report_failure_issue FLAG KEY TITLE_FUNCTION LOG`, which is the tsx path with the tsx-less fallback. `report_failure_with_gh TITLE LOG` keeps the capped, fenced body and the empty-log and long-log safety. The title function runs only when it falls back, and a `node` failure there still ends the script (`title="$(…)"`), as before.

Bash reads a sourced file whole, so a `git switch` that changes `lib.sh` never changes a running job. `main "$@"; exit` stays the last line of both scripts.

`monthly.sh` sources it. What's left in `monthly.sh` is its own logic: `field`, `early_month`, `probe`, `import_month`, recap, render, prune, summary, swap, `report_failure` and `failure_title`.

### `scripts/automation/round.sh` (new)

The subcommands are `prepare | run | collect-failure | report-failure`, matching `monthly.sh`. `run` does the following, in order:

1. `install`, `fetch_main`.
2. **Detect** (`detect-round.ts`) on the checked-out main. On `none`, it prints "The <date> round on the Home Affairs page is in src/data/rounds.json already. Nothing to do.", resolves the failure issues and exits 0. Nothing is written.
3. `choose_base "data/round-<newest>"`.
   - **Joining an open data PR:** detect again on that branch's `rounds.json`. If the branch has the round already ("Pull request #N has the <date> round already."), it exits 0.
   - **No open PR:** `git switch -C data/round-<date>`.
4. Copy `manifest.json` to `previous-manifest.json` (the summary uses it to find new unmatched round names). Then `npm run data:import -- --rounds-only --checked-at <Sydney today> --report-file $RUNNER_TEMP/import.json`, adding `--rounds-html $ROUNDS_HTML_DIR` in dry runs.
5. Read `report.newRounds` and sort it oldest first. It fails if the list is empty or lacks the page's round. `round-info.ts` gives each round its month, `d Mon YYYY` and `on_base`.
6. For each round:
   - `updates:generate -- --month <its month> --section round --round <date> --today …`, unless main has `rounds[<date>]`. In that case it prints "The <date> round section is on <BASE_REF> already; not regenerating it."
   - `social:render -- --month … --set round --round <date>`, unless the section was skipped and the `set.json` exists ("…not re-rendering it"). It never prunes (R11).
7. `check_and_build` (check, build, frozen check).
8. Summary: one `--kind round` section per round, chained with `--append-to`, starting from the joined PR's body.
9. Commits:
   - `data: 189 round of {d Mon YYYY}` covers `data/raw` and `src/data` except `updates`.
   - `feat(updates): {d Mon YYYY} round recap and cards` covers `src/data/updates` and `public/social`.
   - With several rounds, the subjects read "189 rounds of 4 Jun 2026 and 15 Oct 2026" and "… round recaps and cards".
   - Then `require_clean_tree`.
10. Push, then `gh pr create` titled "189 round of {d Mon YYYY}" (label, reviewer Prathu910), or on a joined PR `pr edit` and a comment.
11. Resolve the failure issues.

Failure issue key: `prepare` records the run's Sydney date. Detection replaces it with the page's round date. That gives the title `189 round import failed ({d Mon YYYY})` through `failure-issue.ts --round` or the tsx-less fallback. A successful run resolves the issue for the round date and for the run's date.

`ROUNDS_HTML_DIR` is refused unless `DRY_RUN=1`, so production can never build a PR from saved pages. A dry run without it stops before the import rather than fetching live pages.

### `.github/workflows/round-189.yml` (new)

This is a copy of `monthly-data.yml`'s structure with these differences:
- `cron: "0 21 * * *"` and `workflow_dispatch` with no inputs.
- The upload artifact is named `round-189-failure-<run_id>`.
- The log is `round.log`.
- The job is called `round`.

Everything else is identical:
- the same three SHA-pinned actions;
- permissions `contents: write`, `pull-requests: write` and `issues: write`;
- `concurrency: data-update`, not cancelled in progress;
- the `refs/heads/main` guard;
- `timeout-minutes: 120` on the job and 105 on the run step;
- the prepare step and the guarded Chrome sysctl smoke test;
- `GH_TOKEN` only on the two `gh` steps;
- failure steps on `if: failure() || cancelled()`.

No `${{ }}` appears in any `run:`.

### TypeScript helpers

- `detect-round.ts`: a new pure function, `detectionLines`. The CLI now prints `status=new|none` and `newest=<YYYY-MM-DD>`, because the branch name needs the date before the import. The test is in `detect-round.test.ts`. `docs/DATA.md` and `scripts/README.md` are updated to match.
- `round-info.ts` (new, with a test): `--round DATE` prints `month=`, `day=` and `on_base=`, using `monthOfDate`, `dayText` and `hasPublishedRound` against `BASE_REF`. This keeps date and JSON logic out of the shell, as `month-info.ts` does.

## Tests

- `bash -n` passes on all three scripts.
- `shellcheck -x` 0.11.0 on `lib.sh`, `monthly.sh` and `round.sh` → exit 0. The directives are SC2034 on `HELD`, which the sourcing script reads, and SC2329 on `failure_title`, which is called indirectly.
- `actionlint -shellcheck …` 1.7.12 on both workflows → exit 0.
- `npx vitest run` on `round-info` and `detect-round` → 8/8.
- `npm run check` → exit 0 (187 files, 1,897 tests). The only lint warning is in an untracked `.superpowers/brainstorm` file that isn't mine.
- `npm run build` → exit 0, with no WARNING lines.

## Dry runs

All dry runs ran in throwaway clones under `scratchpad/t7/` (`new`, `newm`, `j`, `base`, `base-nm`, `new-nm`), using `TODAY=2026-11-25` and `BASE_REF=HEAD`.

- **r1, Step 2a:** `DRY_RUN=1 … round.sh run`, with no `ROUNDS_HTML_DIR`. This was the one live fetch of the current-round page. Output: `status=none`, `newest=2026-10-15`, "Nothing to do", then the two resolve calls. Exit 0. The tree was clean and no branch was made.
- **r2, Step 2b:** a scratch `rounds.json` without 2026-10-15 (newest 4 Jun 2026), left uncommitted, with `ROUNDS_HTML_DIR=scripts/import/__fixtures__`.
  - Detection said `new`, and the run started `data/round-2026-10-15`.
  - The import reported "New rounds: 2026-10-15" and "Unchanged data/raw/rounds/2026-10-15.html".
  - It printed "The 2026-10-15 round section is on HEAD already; not regenerating it." and "…set is there already; not re-rendering it."
  - Check passed (1,897 tests), the build passed and the frozen check said "No frozen sections changed against HEAD."
  - The summary was 5,487 bytes, with publish line "Closing it does not hold this update…".
  - Commit `data: 189 round of 15 Oct 2026` changed only `manifest.json` (`roundsCheckedAt` 2026-11-25; `checkedAt` stays 2026-11-17). `rounds.json` was regenerated byte-identical to HEAD. The `feat(updates)` commit had nothing to commit.
  - It printed a dry `git push` and `gh pr create … --title 189\ round\ of\ 15\ Oct\ 2026`. Exit 0.
- **rb, forced failure:** the pages folder had only `invitation-rounds.html`. The import failed on ENOENT for `previous-rounds.html` (exit 1). The state was step "Import the 189 rounds" and round 2026-10-15. `collect-failure` wrote `git-status.log`. `report-failure` with tsx printed `gh issue create --title 189 round import failed (15 Oct 2026) … --assignee Prathu910` and `create`.
- **rc, join path:** a scratch bare origin with `data/skillselect-2026-11` holding the round, `DRY_RUN_OPEN_PRS` naming PR 12, and main's committed `rounds.json` without the round. Output: "Joining pull request #12…", "Look for the round on data/skillselect-2026-11", `status=none`, "Pull request #12 has the 2026-10-15 round already. Nothing to do." Exit 0.
- **rd, two rounds over a closed round PR's branch:** main without the 4 Jun and 15 Oct rounds, with origin holding `data/round-2026-10-15` and no open PR.
  - It reported "New rounds, oldest first: 2026-06-04 2026-10-15". It generated and rendered the 2026-06-04 section and set (real Chrome) and skipped 2026-10-15.
  - Check (1,902 tests), the build and the frozen check passed.
  - Commits: `data: 189 rounds of 4 Jun 2026 and 15 Oct 2026` (`manifest`, `rounds.json`) and `feat(updates): 4 Jun 2026 and 15 Oct 2026 round recaps and cards` (`2026-06.json` and the set).
  - Step "Replace data/round-2026-10-15, the branch of a closed pull request" printed `git push --force-with-lease=refs/heads/data/round-2026-10-15:<old sha> …`.
  - `gh pr create --title 189\ rounds\ of\ 4\ Jun\ 2026\ and\ 15\ Oct\ 2026`.
  - The body had the first round's summary, then `## Added 25 Nov: 189 round of 15 Oct 2026`. Exit 0.
- **Round reporting without tsx (`new-nm`, no node_modules):**
  - After `prepare` with `TODAY=2026-11-05` and step "Install dependencies", a fake `gh` received title `189 round import failed (5 Nov 2026)` and the fenced body.
  - With no state, it printed "…before it recorded a date…" and exited 0.
  - `ROUNDS_HTML_DIR` without `DRY_RUN` was refused (exit 1), and a missing subcommand printed the usage line (exit 1).

### `monthly.sh` behaviour unchanged

- **Run A:** `DRY_RUN=1 MONTH=2026-10 BASE_REF=HEAD TODAY=2026-11-25 … run`, at dc17481 (`base`) and after the refactor (`newm`). After normalising scratch paths and times, the logs are identical except for the test count (186/1,893 → 187/1,897: the new tests). `pr-body.md` is byte-identical (13,220 bytes), and both made the same `data:` commit.
- **tsx-less failure report** (no node_modules) at dc17481 and after:
  - `DRY_RUN` output with a backtick log and an empty log: identical.
  - A fake `gh` capturing the stdin body, with a 60 × 2 KB log (truncated) and a backtick log: identical, including `(truncated)` and the 4-backtick fence.
- **Hold path:** with `data/skillselect-2026-11` on the scratch origin and no open PR, the run printed "Held: the pull request for November 2026 was closed. Delete branch data/skillselect-2026-11 to import it again."

## Self-review notes and concerns

1. **Round PRs are not held. A closed round PR's branch is force-replaced** (with a lease on the tip the run saw). The summary's publish line for round PRs already says "Closing it does not hold this update: the next scheduled run imports it again". Without the replace, the push would fail as non-fast-forward every day. The consequence is that a founder who closes a round PR gets a new one the next day. If a hold is wanted for rounds as well, that needs a ruling, and the publish line would change.
2. **Failure issue key before detection.** A failure before the page is read (npm ci, Chrome, the fetch) is filed under the run's date, because no round date is known yet. A run on the same day resolves it, but a later day's success does not. A persistent pre-detection failure (for example a Chrome change on the runner) opens one issue a day rather than commenting on one. Alternatives: key it by the newest stored round, which is stable but misleading, or close every open round failure issue on success.
3. The Chrome smoke test runs every day, even when no round is new. This matches the monthly job and takes seconds.
4. The brief's `DRY_RUN=1 bash scripts/automation/round.sh` needs the `run` subcommand here, as `monthly.sh` does.
5. `detect-round.ts`'s output format changed (Task 3 interface). `round.sh` is its only consumer, and the docs are updated.
6. Two small helper files were added beyond the plan's file list: `round-info.ts` and its test. They follow the `month-info.ts` pattern.
7. With several new rounds, every summary section repeats the same "Needs your decision" lines (unmatched names, build warnings), because there is one import per run.
8. The plan's Step 2 expectation, "skipped because main has rounds[2026-10-15]", holds against `BASE_REF=HEAD`, per R15.

---

# Fix round 1

Commit: `1a3a1ef` fix(ci): one round check issue for failures before the page is read (a new commit; nothing amended).

## Changes

**I1: one issue for failures before the round page is read.**
- `failure-issue.ts`:
  - New `ROUND_CHECK_TITLE = "189 round check failed"`.
  - New exported `titleFromArgs(argv)`, which replaces `titleFromFlags()`. It takes exactly one of `--month YYYY-MM`, `--round YYYY-MM-DD` or `--round-check` and throws otherwise. There is still no raw `--title`. `main` passes `process.argv.slice(3)`.
  - The usage text is updated.
- `lib.sh`: the signature is now `report_failure_issue LOG TITLE_FUNCTION KEY...`. It passes the key flags through to `failure-issue.ts` and to the title function, so a key can have no value. `monthly.sh`'s call and its `failure_title` (which now reads `$2`) follow suit, and their output is unchanged.
- `round.sh`:
  - `prepare` records `check`. Detection still replaces it with the round date.
  - `report_failure` sends `check` to `--round-check` and a date to `--round`.
  - `failure_title` returns "189 round check failed" for `--round-check`.
  - `resolve_round_failures` runs on every success, including both "Nothing to do" paths. It closes the round check issue (step "Close any round check failure issue") and then the page round's issue. The `--round "$TODAY"` resolve is gone.
- `round-189.yml`: the Prepare step's comment is updated.

**M2:** `push_round_branch` does a plain `push_branch` when the observed tip is empty, whether there was no closed PR or the branch has gone since `base-branch.ts` looked.

**M3:** before a force-replace, `open_prs_on_branch` runs `gh pr list --head "$BRANCH" --state open --json number,headRefName` (no label filter) and filters by `headRefName`. Any open PR stops the run with "Pull request #N is open on <branch> without the data-update label; label it or close it, then run again." In `DRY_RUN` the call is printed, not run, and the new seam `DRY_RUN_HEAD_PRS` (documented in the header) supplies the JSON, defaulting to `[]`.

The ruling on closed round PRs is followed: they are not held, and the force-with-lease replace and the PR text are kept.

## Tests

- `bash -n` passes on all three scripts. `shellcheck -x` 0.11.0 on `scripts/automation/*.sh` → exit 0. `actionlint -shellcheck` 1.7.12 on both workflows → exit 0.
- `npx vitest run scripts/automation/failure-issue.test.ts` → 13/13. The new `titleFromArgs` tests cover the three keys and `ROUND_CHECK_TITLE`, and reject no key, a raw `--title`, two keys, a missing `--month` value and a malformed round.
- `npm run check` → exit 0 (187 files, 1,899 tests).

## Dry runs (scratch clones reset to 1a3a1ef; no live calls)

- **Failure before detection, no tsx** (`new-nm`): `prepare` stored `check`, with step "Install dependencies".
  - With a fake `gh`, the fallback looked up and filed under title `189 round check failed` with the fenced body.
  - Under `DRY_RUN` it printed `gh issue create --title 189\ round\ check\ failed --body-file - --assignee Prathu910`.
- **Failure before detection, with tsx** (`new`, step "Let Chrome start its sandbox"): `gh issue create --title 189 round check failed … --assignee Prathu910`, printing `create`.
- **Successful empty run afterwards** (`new`, `DRY_RUN=1 BASE_REF=HEAD ROUNDS_HTML_DIR=scripts/import/__fixtures__ … run`, exit 0): `status=none` and "Nothing to do", then "==> Close any round check failure issue" and "==> Close any failure issue for 2026-10-15". There was no run-date resolve.
- **Close against open issues:** `failure-issue.ts resolve --round-check` with a fake `gh` listing #31 "189 round check failed" commented "Resolved: a later run succeeded. <run url>", closed #31 and printed `closed`. `resolve --round 2026-10-15` closed #32 the same way. `resolve --title x` was rejected with "Give one of …" (exit 1).
- **M3 in the full run** (`j`): origin had `data/round-2026-10-15` from a closed PR, and `DRY_RUN_HEAD_PRS` named #40 on it.
  - The import, check (187 files), build, frozen check and summary ran, and the data commit was made locally.
  - It then printed `gh pr list --head data/round-2026-10-15 --state open …` and "Error: Pull request #40 is open on data/round-2026-10-15 without the data-update label; …" (exit 1).
  - Nothing was pushed. The state was step "Commit" and round 2026-10-15.
- **M2 and M3 through `push_round_branch` directly** (its functions sourced in bash 3.2, `HELD=yes`, `DRY_RUN=1`):
  - A branch absent from origin got a plain `git push origin HEAD:refs/heads/data/round-2099-01-01`.
  - The closed branch with no open PR printed `gh pr list --head …` and then the force-with-lease replace.
  - With #41 open, the run stopped with the error (exit 1).
- **`monthly.sh` is unchanged:**
  - Run A (`DRY_RUN=1 MONTH=2026-10 BASE_REF=HEAD TODAY=2026-11-25`) matches the dc17481 baseline log, apart from scratch paths and the test count (1,899). `pr-body.md` is byte-identical (13,220 bytes).
  - The tsx-less failure reports against a fake `gh` (a backtick log, a 60 × 2 KB truncated log) and a dry run with an empty log are identical to dc17481.
