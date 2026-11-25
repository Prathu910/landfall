# Task 6 report: `monthly-data.yml`

Status: DONE_WITH_CONCERNS. BASE 7dd5ef0.

## Commits

- `3d47d71` test(updates): pin the summary test's snapshot and check date
- `965f970` ci: monthly SkillSelect import workflow

## What I built

### `.github/workflows/monthly-data.yml` (thin)

- Triggers: `schedule: cron "30 20 1-28 * *"` and `workflow_dispatch` with the optional string inputs `month` and `spotlight`. There are no other triggers.
- `permissions`: `contents: write`, `pull-requests: write`, `issues: write`. `concurrency: { group: data-update, cancel-in-progress: false }`. `timeout-minutes: 120`. `ubuntu-latest`. `defaults.run.shell: bash` (bash with `-eo pipefail`, so the `| tee` keeps the script's exit code).
- Job guard `if: github.ref == 'refs/heads/main'`: data branches always start from main, so a dispatch from another branch does nothing.
- Actions are pinned by full SHA, checked with `git ls-remote` against the tags:
  - checkout v4.4.0 `11d5960…`, with `fetch-depth: 0` (the repo is 106 MB; full history avoids shallow-fetch surprises when the job joins a branch);
  - setup-node v4.4.0 `49933ea…` (`node-version: 22`, `cache: npm`);
  - upload-artifact v4.6.2 `ea165f8…`.
- Job env: `BASE_REF: origin/main` and `CHROME_PATH: /usr/bin/google-chrome`. `GH_TOKEN: ${{ github.token }}` is set only on the two steps that call `gh` (R17).
- Every `${{ }}` value reaches `run:` scripts through `env:` only. That covers `inputs.month`, `inputs.spotlight`, `vars.CF_PAGES_PROJECT` and `github.token`. The script validates `MONTH` against `^YYYY-MM$` and `SPOTLIGHT` against six digits.
- Steps:
  1. Checkout.
  2. Node setup.
  3. Chrome sandbox (see below).
  4. `bash scripts/automation/monthly.sh run 2>&1 | tee "$RUNNER_TEMP/monthly.log"`.
  5. `if: failure()`: `monthly.sh collect-failure`, which writes `git-status.log` and copies changed and untracked `data/raw/` files into `$RUNNER_TEMP/failure-raw/` (R20).
  6. `if: failure()`: upload-artifact of `$RUNNER_TEMP/*.log`, `import.json` and `failure-raw/`, with `retention-days: 7` and `if-no-files-found: ignore`.
  7. `if: failure()`: `monthly.sh report-failure`, which runs `failure-issue.ts report --month <month> --log monthly.log` with `FAILED_STEP` taken from the script's step file.

### `scripts/automation/monthly.sh` (the job body)

It uses `set -euo pipefail` and has one function per spec step. The last line is `main "$@"; exit`, so bash never reads the file again after a `git switch` replaces it on disk. It works with bash 3.2, which macOS ships; that is what the local dry runs used.

**Import path, in order:**

1. `npm ci`.
2. `git fetch origin main` (R17).
3. `month-info.ts` names the fresh branch `data/skillselect-<main's asAt+1 or MONTH>`.
4. `base-branch.ts --fresh …` chooses the base.
   - On a join, it fetches the branch and runs `git switch -C`, then runs `npm ci` again if the branch's `package-lock.json` differs from main's. Together, steps 1 and 4 satisfy R14: the installed packages always match the branch the scripts run from, and `npm ci` runs before the probe.
5. `month-info.ts` runs again on the base branch.
6. Probe, skipped when `MONTH` is set: `cli.ts --probe`, then parse `Newest As At Month: YYYY-MM`, then `next-month.ts --newest`. If it prints nothing, the script prints "Nothing to do" and exits 0 before it creates a branch or writes anything.
7. `git switch -C data/skillselect-<target>` for a new branch.
8. Copy the manifest to `$RUNNER_TEMP/previous-manifest.json`.
9. `npm run data:import -- --as-at T --checked-at <Sydney today> --report-file $RUNNER_TEMP/import.json --keep-rounds`. `--keep-rounds` is always passed, per the founder-rule carry-forward. In `DRY_RUN=1` the script runs `data:generate` with the same flags, minus `--keep-rounds`, which the CLI rejects with `--generate-only`.
10. `updates:generate --month T --section data`, unless `BASE_REF` already has T's data section (decision 3). It passes `--previous-manifest` only when the pre-import manifest is for T−1, because `checkPreviousManifest` would throw otherwise; this covers the rehearsal.
11. `social:render --month T --set month` when the data section was regenerated in this run or `public/social/T/month/set.json` is missing. I added the first condition so that regenerated facts never ship with stale cards.
12. `updates:retention`.
13. `npm run check`.
14. `npm run build 2>&1 | tee build.log`.
15. `updates:frozen-check -- --base $BASE_REF`.
16. `updates:summary` (via `tsx scripts/updates/summary.ts`) with `--previous-manifest`, `--import-report`, `--build-log` and `--branch`. On a join it adds `--append-to`, using the body from `gh pr view --json body`.
17. Commit 1: `data: SkillSelect snapshot as at {Mon YYYY}` (`data/raw`, `src/data`, excluding `src/data/updates`). Commit 2: `feat(updates): {Month YYYY} recap and Instagram cards` (`src/data/updates`, `public/social`). An empty commit is skipped. Commits are made with `git -c user.name/email` set to `github-actions[bot]` and the `41898273+…` noreply address, and the git config is left unchanged.
18. `require_clean_tree` fails if anything is left uncommitted outside those paths. This is my addition, so an unexpected change never goes unreviewed or silently missing.
19. Publish, only if anything was committed. First `git push origin HEAD:refs/heads/$BRANCH`. Then, on a new branch: `gh label create data-update --force …` and `gh pr create --base main --head $BRANCH --label data-update --reviewer Prathu910 --title "SkillSelect data as at {Mon YYYY}" --body-file pr-body.md`. On a join: `gh pr edit --body-file` and `gh pr comment`, which lists the new commits.
20. `failure-issue.ts resolve --month T`.

**Swap path** (`SPOTLIGHT` set): `npm ci`, fetch main, then choose the base.

- The swap fails when no PR is open, when `MONTH` isn't the PR's manifest month, or when T's data section is already on `BASE_REF`. A frozen section would also fail the frozen check later, but the early check saves the run.
- It takes main's manifest from `git show $BASE_REF:src/data/manifest.json` and passes it as `--previous-manifest` only if it is for T−1.
- Then `updates:generate --spotlight`, `social:render --set month`, check, build and the frozen check.
- It commits `feat(updates): spotlight {name}`, makes sure the tree is clean, pushes, comments on the PR and resolves any failure issue.

**Dry runs:**
- `DRY_RUN=1` prints `git push` and every `gh` write, and runs `gh` reads as no-ops (base-branch.ts and failure-issue.ts already stub through `gh.ts`).
- `BASE_REF` defaults to `origin/main` (R15).

### `scripts/automation/month-info.ts` (+ test, 5 tests)

This was a new helper, because the shell needs month names and month arithmetic, and BSD and GNU `date` differ. It prints `manifest_month`, `month` (`--month`, or the month after the manifest's), `previous_month`, `short` (`Nov 2026`), `long` (`November 2026`) and `data_on_base`. `data_on_base` uses `verifyBase` and `readBaseFile` from `frozen-check.ts` and `hasPublishedData`, so an unfetched base fails rather than reading as "no". With `--spotlight` it also prints `spotlight_name`. The pure parts (argument parsing, the name lookup and the line format) are tested.

### Chrome sandbox: sysctl, not `--no-sandbox`

I chose `sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0` in its own step, run only when that `/proc` key exists, followed by `"$CHROME_PATH" --version`.

- **Why it's safer:** Chrome's sandbox stays fully on. The change only affects a throwaway runner VM that is destroyed after the job, and it needs no code path that disables the sandbox.
- **Against `--no-sandbox`:** an env-gated flag removes the renderer sandbox, and the gate (`CI=true`) is also true in any other CI context that might one day render less trusted HTML.
- **Possibly not needed at all:** the system Google Chrome .deb also ships a setuid `chrome-sandbox` and an AppArmor profile, so it may start without the sysctl. The step is harmless either way.
- **Result:** `scripts/social/render.ts` is unchanged. The brief made that change conditional on Chrome failing to start its sandbox, which isn't the case with the sysctl.

### Test fix outside the brief (`src/lib/updates/summary-view.test.ts`)

The first dry run's `npm run check` failed in Task 4's "opens with the one-line result" test. That test read the live `src/data/manifest.json` and asserted "checked 17 November 2026". Any re-import (the Task 9 rehearsal) and any new month would fail it inside the job and block every monthly PR. I pinned the three fields the opening line prints (`snapshotId`, `asAt`, `checkedAt`) to the 2026-10 values, following the spec 6.14 rule that tests asserting specific figures don't read live data. The rest of the live manifest is still used.

## Tests and verification

**Linters:** actionlint 1.7.12 and shellcheck 0.11.0 are not installed, and `npx actionlint` doesn't resolve. I downloaded both release binaries into the scratchpad (nothing installed system-wide).
- `actionlint -shellcheck <sc> .github/workflows/monthly-data.yml` → exit 0, no output.
- `shellcheck -x scripts/automation/monthly.sh` → exit 0.
- `bash -n` → exit 0.

**Unit tests:** `npx vitest run scripts/automation/month-info.test.ts` → 5/5 passed. `npx vitest run src/lib/updates/summary-view.test.ts` → 18/18 passed, both in the repo and in a clone whose manifest had a new checkedAt.

**Full gates in the repo, after the changes:**
- `npm run check` → exit 0; 185 test files, 1880 tests passed. The one lint warning is in an untracked `.superpowers/brainstorm/.../lib.js`, not my code.
- `npm run build` → exit 0, 497 pages.

**Dry runs:** all in throwaway `git clone --local` copies under the scratchpad, with the task files committed there as WIP, each running its own `npm ci`. Logs are in `<scratchpad>/run-a … run-f/`.

- **A, the brief's Step 2:** `DRY_RUN=1 MONTH=2026-10 BASE_REF=HEAD bash scripts/automation/monthly.sh run` → exit 0. It matched every expectation:
  - The probe was skipped ("MONTH=2026-10 given").
  - `data:generate` regenerated 2026-10: 493 occupations, 0 validation issues, rounds kept from `rounds.json`.
  - "The 2026-10 data section is on HEAD already; not regenerating it."
  - "The 2026-10 month set is there already; not re-rendering it."
  - Retention pruned 0 files.
  - check: 185/185 files and 1880/1880 tests. Build: 497/497 pages.
  - "No frozen sections changed against HEAD."
  - The PR body was written (13,064 bytes).
  - Commit 1 contained only `src/data/manifest.json` (checkedAt). Commit 2 was skipped as empty.
  - The tree was clean afterwards.
  - Printed: `DRY_RUN: git push origin HEAD:refs/heads/data/skillselect-2026-10`, `gh label create data-update --force …` and `gh pr create --base main --head data/skillselect-2026-10 --label data-update --reviewer Prathu910 --title SkillSelect\ data\ as\ at\ Oct\ 2026 --body-file …`.
  - `failure-issue resolve` printed "none open".
  - The first attempt at A failed at `npm run check` because of the summary test above. The script stopped before any commit or push, which is the intended failure behaviour.
- **B, generate and render path:** `DRY_RUN=1 MONTH=2026-10` with the default `BASE_REF=origin/main`. In the clone, `origin/main` is the local pre-merge main, which has no facts files.
  - The script reported `data_on_base=no`, then ran `updates:generate --month 2026-10 --section data` with no `--previous-manifest` (the manifest is 2026-10, not 2026-09), then rendered the month set with the Mac's Chrome, then ran retention, then check.
  - Check failed in three tests (`meta`, `recap-view`, `sitemap`). They assert the committed 2026-10 section's `updatedAt` of 2026-11-24, and regenerating that section on 25 Nov changes it.
  - This is expected. On a real run that section is frozen on main (path A), and a new month writes only its own file. The script exited 1 with nothing committed or pushed.
- **C, swap with no open PR:** `DRY_RUN=1 SPOTLIGHT=254499 BASE_REF=HEAD` → "Error: No open data-update pull request; a spotlight swap runs on the open one.", exit 1. Then `report-failure` printed `gh issue list …` and `gh issue create --title Monthly SkillSelect update failed (Nov 2026) --body-file - --assignee Prathu910`.
- **D, the one live dashboard hit:** `DRY_RUN=1 BASE_REF=HEAD` with no `MONTH` → "Newest As At Month: 2026-10" (4 s), then "The dashboard has nothing newer than 2026-10. Nothing to do.", exit 0. No branch was created and nothing was written.
- **E and F, failure helpers:**
  - `collect-failure` with one modified and one untracked raw file copied both into `failure-raw/` with their paths, and `git-status.log` listed them. With no changes it ran cleanly.
  - `report-failure` without a known month printed a note and exited 0.
  - A bad `MONTH=2026-1` and an unknown subcommand both exit 1 with a message.

**Not run locally:**
- The join path (a real `gh pr list` result), and real `gh` and `git push` calls. `gh` isn't installed and DRY_RUN stubs reads to `[]`. I reviewed the join code by reading it.
- Chrome on the ubuntu-24.04 runner.

Both get exercised in the Task 9 rehearsal.

## Files

- `.github/workflows/monthly-data.yml` (new)
- `scripts/automation/monthly.sh` (new, executable)
- `scripts/automation/month-info.ts`, `scripts/automation/month-info.test.ts` (new)
- `src/lib/updates/summary-view.test.ts` (pinned manifest fields)

## Self-review notes and concerns

1. **Scope:** I changed a Task 4 test (summary-view) to unblock the job. It is minimal and covered above.
2. **Retention will break live-data tests in about Feb 2027.** `updates:retention` deletes `public/social/2026-10/month/set.json` and the round set's `set.json` once three newer months exist. `summary-view.test.ts` reads both. Any other test that reads `public/social/2026-10/**` or `loadRecap("2026-10")` will then fail `npm run check` inside the job. These need frozen fixtures before then. I haven't fixed this.
3. **"To skip this month, close it" (spec 6.12 item 10) conflicts with oldest-first month choice.** After the founder closes a data PR, the next day's run targets the same month again (`manifest.asAt + 1`). If the closed PR's branch still exists, the fresh-branch `git push` is rejected as non-fast-forward and a failure issue opens daily. I kept a plain push, which never overwrites anything, so this needs a ruling: skip a month whose PR was closed, or force-push.
4. **Token exposure during `npm ci`:** dependency install scripts run with `GH_TOKEN` in the environment and with checkout's persisted credentials in `.git/config`. This is inherent to R14 putting `npm ci` inside the job body, and it relies on the pinned lockfile.
5. **Failures with no issue:**
   - If `npm ci` on main fails, `tsx` isn't available, so no failure issue can be opened. GitHub's failure email still goes out, and `report-failure` exits 0 with a note when no month is known.
   - `if: failure()` steps don't run when the job hits `timeout-minutes` or is cancelled.
6. **The swap only comments on the PR.** It doesn't rewrite the PR summary's spotlight section, as spec 6.8 and the plan describe.
7. **Unproven Chrome step:** the sysctl and `--version` step is untested until the first run on a runner.

---

# Fix round 1

Commits (new, nothing amended):

- `879f8f9` feat(updates): closing a month's PR holds it; swap rewrites its summary
- `c77b9bd` fix(ci): hold, timeouts, swap summary and early failure issues

## What changed, by finding

1. **Closing holds the month.**
   - `base-branch.ts` gains two functions:
     - `isHeld(choice, freshOnOrigin)`, which is pure;
     - `onOrigin(branch, git)`, which reads the exit status of `git ls-remote --exit-code --heads origin refs/heads/<branch>`: 0 means present, 2 means absent, and anything else throws.
   - The CLI now prints `held=yes|no` after `branch=`/`pr=`. `ls-remote` runs only when no PR is open, and Task 7 can ignore the line.
   - `monthly.sh run_import` checks `HELD` straight after `choose_base`, before the probe and the import. When held, it prints `Held: the pull request for <Month YYYY> was closed. Delete branch data/skillselect-<T> to import it again.` and returns 0. It opens no issue and does no resolve.
   - New `publishLine` and `monthBranch` in `summary-view.ts`:
     - For a data section on its own `data/skillselect-<month>` branch, the line says: "To hold this update, close it and keep its branch: the monthly job skips {Month YYYY} while `data/skillselect-YYYY-MM` exists. Delete that branch and the job imports {Month YYYY} again."
     - Otherwise (a round PR, or a month joined onto a round branch, which the hold check can't see) it says: "Closing it does not hold this update: the next scheduled run imports it again."
   - Docs:
     - Spec 6.12 item 10 now describes the hold.
     - Spec 6.8 now says a swap rewrites the summary.
     - The plan's Task 4 snippet is marked superseded.
   - Tests:
     - summary-view: both publish-line wordings.
     - base-branch: `isHeld` (fresh and on origin, fresh and absent, join) and `onOrigin` (exact args; exit 0, 2, and 128 throws).
2. **Timeout.**
   - The main step has `timeout-minutes: 105`.
   - Collect, upload and report run on `if: failure() || cancelled()`.
   - A new `prepare` step runs before the Chrome step and records the month (see 6).
3. **The swap rewrites the summary.**
   - New pure `replaceSwapParts(body, summary, month)` in `summary-view.ts`. It finds the month's data section: either its `## Added …: SkillSelect data as at <d Mon yyyy>` section, or the body's top when the body opens with "SkillSelect data as at <month end>". It throws if neither is there.
   - Inside that section it replaces two parts with the regenerated ones:
     - from `### Notable movers and spotlight` to `### Needs your decision`;
     - from `### Images` to the section's end (images, alt text, captions, preview and the publish line).
   - The import's lines ("Needs your decision" and the pool figures) and other sections stay unchanged.
   - `updates:summary --swap-into <body.md>` uses it. With that flag `--import-report` is optional, because those lines aren't spliced. The flag is rejected with `--append-to` or `--kind round`.
   - `monthly.sh swap_summary` reads the body with `gh pr view` and writes the new one. The swap then runs `gh pr edit <n> --body-file -` with the body on stdin, through the shell `gh_write` wrapper. The comment now says the summary's spotlight, images and captions were updated.
   - Tests:
     - `replaceSwapParts`: the top-of-body case, keeping a later round section and the coverage line; the appended-section case; and the throw for a body with no data section.
     - `parseSummaryArgs --swap-into`: optional report; rejected with append-to and with round.
4. **Install without the token.** `install` runs `env -u GH_TOKEN npm ci`. Its comment says the trust boundary is the pinned lockfile and that checkout's persisted git credentials are still on disk.
5. **Chrome check.** The step now ends with `"$CHROME_PATH" --headless=new --disable-gpu --dump-dom about:blank >/dev/null`.
6. **Failures before the month is known.**
   - `prepare`, also called at the start of `run`, clears the state and records `early_month`: `MONTH`, or main's `asAt + 1`, worked out by a dependency-free `node -p`.
   - `report-failure` uses `failure-issue.ts` when `node_modules/.bin/tsx` exists. Otherwise it uses `report_failure_with_gh`, which matches `failure-issue.ts` in four ways:
     - the same title, built with `node -p` month names;
     - `gh issue list --author app/github-actions` with `--jq`, selecting the exact title;
     - comment or create with `--assignee Prathu910`;
     - a stdin body with the failing step, the run URL and the last 50 log lines inside a fence longer than any backtick run, capped at 60,000 bytes.
7. **Nothing to do resolves.** When the probe finds nothing new, the script prints its message and then runs `resolve_failure "$(field month)"`. `resolve_failure` now takes the month as an argument.
8. **Commit step.** `step "Commit"` comes before `commit_paths` and `require_clean_tree` on both paths.

Dry-run test seams, local only:
- **`DRY_RUN_OPEN_PRS`:** `gh.ts` returns this JSON for `gh pr list` in a dry run. A new `gh.test.ts` has 2 tests for it.
- **`DRY_RUN_PR_BODY`:** a file the shell's `gh_read` prints for `gh pr view`.
- **`TODAY`:** an optional override of the Sydney date. It is passed to `--checked-at`, `updates:generate --today` and `updates:summary --today`. Actions leaves it unset.

## Checks (commands and output)

- `bash -n scripts/automation/monthly.sh` → exit 0.
- `shellcheck -x scripts/automation/monthly.sh` (v0.11.0, scratchpad binary) → exit 0. The first run flagged SC2016 on a JS template literal inside `node -p`; I changed it to string concatenation.
- `actionlint -shellcheck <sc> .github/workflows/monthly-data.yml` (v1.7.12) → exit 0.
- `npx vitest run scripts/automation/` → 7 files, 40 tests passed.
- `npx vitest run src/lib/updates/` → 25 files, 218 passed.
- `npx vitest run scripts/updates/summary.test.ts` → 7 passed.
- `npm run check` (repo) → exit 0; 186 files, 1891 tests passed. The one lint warning is in the untracked `.superpowers/brainstorm/.../lib.js`.
- `npm run build` → exit 0, 497/497 pages.
- `prepare`: with no `MONTH` it recorded `2026-11` (main's asAt 2026-10 + 1); with `MONTH=2026-12` it recorded `2026-12`.

## Dry runs

There were no live dashboard calls. Setup: a scratch bare clone of the repo as `origin`, with test branches `data/skillselect-2026-10` and `data/skillselect-2026-11` at HEAD (c77b9bd), and a working clone of it.

- **Hold:** `DRY_RUN=1 BASE_REF=HEAD bash scripts/automation/monthly.sh run`, with no `MONTH`. It ran `npm ci` and fetched main. `gh pr list` returned `[]`, so the fresh branch was `data/skillselect-2026-11`, which `ls-remote` found on origin. Output: `Held: the pull request for November 2026 was closed. Delete branch data/skillselect-2026-11 to import it again.`, exit 0. There was no probe, the branch was unchanged, the tree was clean, and the last step recorded was "Choose the base branch".
- **Forced failure:** `DRY_RUN=1 BASE_REF=HEAD MONTH=2026-12 … run`. The month was not held, the probe was skipped, and `data:generate --as-at 2026-12` failed with "pool-by-score 2026-12: raw view is missing" (exit 1). The state recorded step `Import 2026-12` and month `2026-12`. Then:
  - `collect-failure` ran cleanly.
  - `report-failure` with tsx printed `DRY_RUN: gh issue create --title Monthly SkillSelect update failed (Dec 2026) --body-file - --assignee Prathu910` and `create`.
  - With `node_modules/.bin/tsx` moved aside, the fallback printed `gh issue list … --author app/github-actions … --jq '.[] | select(.title == "Monthly SkillSelect update failed (Dec 2026)") | .number'` and `gh issue create --title … --body-file - --assignee Prathu910`.
  - Against a stub `gh` on `PATH` that returns issue 17, the fallback ran `gh issue comment 17 --body-file -`. The body read: "Failing step: Import 2026-12", "Run: https://github.com/o/r/actions/runs/1", the log tail, and a five-backtick fence around a log line that contained four backticks.
- **Swap, frozen guard:** `DRY_RUN_OPEN_PRS='[{"number":42,"headRefName":"data/skillselect-2026-10",…}]' DRY_RUN=1 BASE_REF=HEAD SPOTLIGHT=254499 … run`. It printed "Joining pull request #42 on data/skillselect-2026-10." and then "Error: The 2026-10 data section is on HEAD and frozen; its spotlight can't change." (exit 1).
- **Swap, happy path:** the same as the guard run, plus `DRY_RUN_PR_BODY=<body>` and `TODAY=2026-11-24`, with `BASE_REF` defaulting to `origin/main`. That is the pre-merge main with no facts files; with HEAD the frozen guard rightly stops the swap. The body was Run A's PR body plus an appended `## Added 20 Nov: 189 round of 19 Nov 2026` section.
  - **Run:**
    - `updates:generate --spotlight 254499 --today 2026-11-24` ran, and the month set was re-rendered.
    - `npm run check` passed (186 files, 1891 tests) and the build passed.
    - "No frozen sections changed against origin/main."
    - The summary was updated (13,239 bytes).
    - Step "Commit" made `feat(updates): spotlight Registered Nurses nec`, changing `2026-10.json` only (`pickedBy`); the PNGs were byte-identical.
    - `DRY_RUN: git push …`, then `gh pr edit 42 --body-file -`, then `gh pr comment 42 --body $'Swapped the Oct 2026 spotlight to Registered Nurses nec (254499), re-rendered the month cards and updated the summary\'s spotlight, images and captions. New commits:…'`, then resolve. Exit 0.
  - **Body diff:** the spotlight line changed from "picked because its 189 pool changed by at least 3,220 EOIs" to "picked by the founder", and the publish line became the hold wording. Everything else was unchanged, including "Needs your decision" and the appended round section.

## Remaining concerns

- **The hold only sees a month's own branch.** If a month's data was added to a round PR's branch and that PR is closed, the next run imports the month again. The publish line says so for that case.
- **The hold can also come from a failed PR creation.** If the push succeeds and `gh pr create` then fails, the branch is left with no PR, and that also reads as held. The message tells the founder to delete the branch.
- Still open from the first report: retention will eventually delete the 2026-10 `set.json` files that tests read.

---

# Fix round 2

Commits (new, nothing amended):

- `ac49649` fix(automation): hold a closed month even while another data PR is open
- `dc17481` fix(ci): failure issue without tsx survives empty and long logs

## Changes

- **I1.** `isHeld(choice, fresh, freshOnOrigin)` now returns `freshOnOrigin && !(choice.kind === "join" && choice.branch === fresh)`. The CLI calls `onOrigin(fresh)` for joins too.
  - With a round PR open and `data/skillselect-<T>` on origin, the month is held.
  - When the open PR is the month's own branch, it isn't held.
  - When nothing is open and the branch exists, it is held, as before.
  - The hold message now names `data/skillselect-<month>`, not `$BRANCH`, which is the joined branch on a join.
  - Tests cover the new, round-join and own-join cases.
  - A note on the month used: the hold check uses main's next month. For a joined round branch, that is the target month, because round branches start from main. A joined `data/skillselect-M` branch targets M+1, but no separate `data/skillselect-(M+1)` can exist then: M+1 would have joined M's open PR.
- **I2.** The fence is now computed as `{ grep -o '`*' <<<"$log" || true; } | awk …`, so an empty log no longer aborts.
- **M1.** The tail is written to `$STATE/log-tail`, and `head -c 59000` reads that file, not a pipe. When the tail is over the cap, the fence is closed and "(truncated)" is appended, as `failure-issue.ts` does. The body is built with no pipe that can be cut short.
- **M2.** `report_failure` runs `failure-issue.ts` only if `tsx` is executable and the call succeeds. Otherwise it prints "failure-issue.ts is unavailable; reporting with gh directly." and uses the fallback.
- **M3.** `toLf()` normalises `\r\n` in `appendSection`'s existing body, and in `replaceSwapParts`'s body and summary, before any heading match. A new test feeds both functions CRLF bodies: the output has no `\r`, the right section is replaced, and the round section is kept.

## Checks

- `bash -n scripts/automation/monthly.sh` → 0.
- `shellcheck -x` (0.11.0) → 0.
- `actionlint -shellcheck …` (1.7.12) → 0.
- `npx vitest run scripts/automation/ src/lib/updates/summary-view.test.ts` → 8 files, 64 tests passed.
- `npm run check` → exit 0; 186 files, 1893 tests passed. The only lint warning is in the untracked `.superpowers` file.
- `npm run build` → exit 0, 497/497 pages.

## Dry runs (no live dashboard calls)

**Old failure reproduced.** A `git clone --local` at c77b9bd (the previous fix) has no `node_modules`. In it, I ran `prepare`, set the step to "Let Chrome start its sandbox", and then ran each case under `DRY_RUN=1 … report-failure`:
- empty `monthly.log` → **exit 1** after `gh issue list` (no create);
- a 60-line × 3,000-character log → **exit 141** (SIGPIPE).

**Fixed, with the new `monthly.sh` in the same clone and no `node_modules`:**
- **Empty log:** "failure-issue.ts is unavailable…", then `gh issue list …`, then `gh issue create --title Monthly SkillSelect update failed (Nov 2026) --body-file - --assignee Prathu910`, **exit 0**. Against a stub `gh` that captures stdin, the body is "Failing step: Let Chrome start its sandbox", the run URL, and an empty fenced block.
- **60 × 3,000 log:** the same `gh` lines, **exit 0**. The captured body is 59,085 bytes: the log text is cut at 59,000 bytes, then the fence is closed and "(truncated)" follows.
- **Partial install (M2):** with a `node_modules/.bin/tsx` that prints "Cannot find module esbuild" and exits 1, the script took the fallback and printed `gh issue create …`, exit 0.

**Hold while a round PR is open (I1).** The setup was a scratch bare origin with `data/skillselect-2026-11` and `data/round-2026-12-10`, plus `DRY_RUN_OPEN_PRS` naming PR 12 on the round branch. The run `DRY_RUN=1 BASE_REF=HEAD … run` printed:
- "Joining pull request #12 on data/round-2026-12-10.";
- "Held: the pull request for November 2026 was closed. Delete branch data/skillselect-2026-11 to import it again.";
- exit 0, with no probe and no import, and the tree clean.

**Joining the month's own PR is not held.** With PR 11 on `data/skillselect-2026-11` and `MONTH=2026-11`, the run printed "Joining pull request #11 on data/skillselect-2026-11." and went on to "Import 2026-11". It then failed as expected, because the scratch clone has no 2026-11 raw data ("raw view is missing").
