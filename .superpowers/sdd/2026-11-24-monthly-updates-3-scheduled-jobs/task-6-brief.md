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

