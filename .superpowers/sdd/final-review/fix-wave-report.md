# Final-review fix wave: report

Branch `roadmap/monthly-updates`. Nothing was pushed. Every item in `fix-wave.md` is done.

## Commits

| SHA | Subject |
| --- | --- |
| 5dd36af | fix(updates): monthly PRs pass check; dropped occupations stay in last month's sums (area A) |
| 759f064 | fix(updates): 12px map labels at 320px, keyboard-scrollable nominations (area B) |
| 0f5411e | fix(automation): hold needs a closed PR, polite round reads, page-watch failures (area C) |
| 96a8fb5 | chore(automation): page-watch.sh is executable like the other job scripts |
| 991f892 | docs: close the rehearsal pull request before the next run |

## Area A: data and facts

### A1: the first real monthly PR passes `npm run check`

- **Outlook no-core tests.**
  - `src/lib/outlook/view.test.ts:12` and `src/lib/outlook/read-template.test.ts:19` now `vi.mock("../../data/manifest.json")` with `frozenManifest()` (dynamic import inside the factory).
  - The no-core path (`phrases.ts:41`, `manifest.asAt`) now reads the frozen 2026-10 manifest, like the frozen cores those tests already use, so "October 2026" stays correct.
- **Social tests.**
  - `scripts/social/title-fit.test.ts:12` and `scripts/social/spotlight-render.test.ts:20` call `popularOccupations(frozenCores(), "2026-10")`.
  - `frozenCores()` is new in `src/lib/data/__fixtures__/frozen-2026-10.ts:44`.
- **Summary test.** `src/lib/updates/summary-view.test.ts:24` uses `{ ...frozenManifest(), checkedAt: "2026-11-17" }` instead of the live manifest.
- **R8 guard** (`src/lib/data/live-data-tests.test.ts`):
  - It now scans `src/lib` and `scripts` (line 35), with repo-relative paths.
  - It also catches `from "…data/manifest.json"`, the `"src/data/manifest.json"` path literal and `loadAllCores`.
  - Listed invariants (line 11): `scripts/import/generate-rounds.test.ts` (byte-identical regeneration), `scripts/social/title-fit.test.ts` (its "every index name fits" sweep is a live invariant; the popular-20 test is frozen) and `scripts/updates/generate.test.ts` (the pinned-maxima test that skips after asAt moves), plus the existing ones.
  - A new self-test (line 91) shows that a manifest import, a manifest path literal and `loadAllCores` are flagged, and that `vi.mock` of the manifest is not.
- **Covering tests:** `live-data-tests.test.ts` (4 tests), `view.test.ts`, `read-template.test.ts`, `title-fit.test.ts`, `spotlight-render.test.ts`, `summary-view.test.ts`.

#### The November simulation

The simulation is in a throwaway `git worktree`, run by `scratchpad/sim-november.sh`:

1. Copy `data/raw/2026-10` to `data/raw/2026-11`, relabelling its As At Month to 11/2026.
2. Run `npm run data:generate -- --as-at 2026-11 --checked-at 2026-12-02`. This uses the real generator, moving 986 occupation files and the manifest to 2026-11.
3. Run `npm run updates:generate -- --month 2026-11 --section data --previous-manifest <the 2026-10 manifest>`.
4. Run `npm run check`.

Results:

- **Before the fixes (at 95f62dd)**, the simulation reproduced the review: 5 failing tests in 4 files.
  - title-fit and spotlight-render: "fits … 20 most popular names"
  - read-template: Sana no-core
  - view: no-core and points-only
- **At the final commit (96a8fb5)**, the worktree was removed afterwards (`git worktree list` shows only the main checkout):

```
Validation issues: 0
Wrote src/data (skillselect-2026-11-30)
Wrote …/wt-nov/src/data/updates/2026-11.json (data section)
 M src/data/manifest.json
?? data/raw/2026-11/
?? src/data/updates/2026-11.json
occupation files changed: 986
All matched files use Prettier code style!   (format:check)
eslint . / tsc --noEmit: clean
 Test Files  196 passed | 1 skipped (197)
      Tests  2010 passed | 2 skipped (2012)
```

The skipped file is `src/app/updates/built-copy.test.ts`, because the worktree has no `out/`.

### A2: last month's sums include occupations dropped this month

- **National figures.** `previousMonthCores` (`src/lib/updates/facts-national.ts:70`) returns current cores plus the dropped cores whose `asAt` is last month. `nationalFigures(cores, month, dropped)` (line 84) sums `previous` over that set.
- **State figures.** `stateFigures(cores, month, dropped)` (`facts-states.ts:97`) does the same for `previousFloor`.
- **The section builder.** `droppedThisMonth` (`facts-data.ts:121`) picks cores whose manifest entry has `lastAsAt === previousMonth`. `buildDataSection` passes them in (lines 214 and 219).
- **The frozen `src/data/updates/2026-10.json` is untouched.**
- **Tests:**
  - `facts-data.test.ts:210`: a synthetic November from the 2026-10 cores with Registered Nurses nec (254499) dropped.
    - For every visa, last month's SUBMITTED and INVITED intervals equal what October's own section showed as current.
    - The VIC 190 `previousFloor` equals October's floor.
    - The current 189 SUBMITTED min falls by exactly 4,280.
    - `occupationsRemoved` names 254499.
  - RED check: with `dropped` removed from the two calls, the test fails with `189: expected { min: 162275, max: 163624 } to deeply equal { min: 166555, max: 167904 }`.
  - `facts-national.test.ts:117`: counts in last month only, ignores a core dropped earlier, and refuses a month no core has.
  - `facts-states.test.ts:122`: the same for `previousFloor` and the top list.

### A3 (and C1): retention and the files tests read

- **Fixtures.** Copies of the two set.json files are in `src/lib/updates/__fixtures__/social-2026-10/month-set.json` and `round-2026-10-15-set.json`. `summary-view.test.ts:27-31` reads them.
- **monthly.sh.** `monthly.sh:132` runs `npm run updates:retention -- --month "$TARGET"`. The dry run printed `tsx scripts/updates/retention.ts --month 2026-10`.
- **round.sh.** It doesn't run retention: per R11, only the monthly job prunes, so there was nothing to change there.

### A-m4: round-only title

- **Change.** `recapTitle` (`src/lib/updates/meta.ts:20`) returns "SkillSelect {Month YYYY} update: 189 round results | MigrateLens" when `data === null`.
- **Spec.** The spec's title line (6.6) now records this case.
- **Test.** `meta.test.ts:28` (the round-only fixture gives "SkillSelect November 2026 update: 189 round results | MigrateLens").

### A-m5: no silent zero

- **National.** `monthPair` (`facts-national.ts:47`) throws "No occupation has {visa} figures for {month}" instead of `{0,0}`.
- **State.** `stateFigure` (`facts-states.ts:57`) throws "No occupation has {visa} {state} figures for {month}".
- **Real data is safe.** All 493 cores carry every visa and state month (checked on 2026-10).
- **Synthetic test helpers.** These now fill each visa's and state's as-at month with `{}`, as a real import does.
- **Tests.** The two "refuses a month no occupation has" tests.

### A-m6: revision lines show the figures

- **Summary view.** `revisedFigureLines` (`summary-view.ts:98`) adds one sub-line per visa under a revision of a published month: `EOIs submitted {before} before, {after} after; invited {before} before, {after} after`.
  - "Before" is the published recap's `national[visa].*.current`.
  - "After" is this section's `national[visa].*.previous`. That is available when the revised month is last month, the month the importer re-reads (`import-plan.ts`).
  - With either side missing, there is no sub-line.
- **Summary CLI.** `SummaryInput.publishedDataMonths` became `published` (national figures by month). `scripts/updates/summary.ts:180` `publishedNational` reads them from BASE_REF's facts files, with the same fallback as before.
- **Tests.**
  - `summary-view.test.ts:174` checks before and after for 2026-09: "189: EOIs submitted 181,000–182,000 before, 181,076–182,311 after;".
  - A test that the figures are omitted when the revised month isn't last month.
  - The existing "published recap affected" test, updated to the new field.

### A-m7: Notes section

- **Change.** The coverage-window line moved out of "Needs your decision" into a following `### Notes` section, built by `noteLines` (`summary-view.ts:146`) and placed at line 251. The section is omitted when there is no coverage.
- **Spec.** Spec item 7 is updated.
- **Test.** `summary-view.test.ts:203`: "Nothing needs a decision." appears, the coverage check is under "### Notes", and a summary with no coverage has no Notes section.
- **Dry run.** The monthly dry run's `pr-body.md` shows "### Needs your decision / Nothing needs a decision. / ### Notes / - Coverage-window check: …".
- **Spotlight swaps.** The swap's `SWAP_PARTS` ranges are unchanged; Notes is kept, like the decision lines.

## Area B: pages

### B1: map labels at 320 px

- **Size steps.** In `src/components/updates/state-recap-map.module.css`:
  - The <400px step (line 96) now also moves the south-east labels apart (NSW `translate(8px,-10px)`, VIC `translateX(-22px)`, TAS `translate(6px,14px)`, in map units).
  - A new `@container (width < 300px)` step (line 116) sets codes and figures to 34 units (bigLong 33).
- **Markup.** Each label is a `<g className={styles.label} data-state={state}>` (`state-recap-map.tsx:24`).
- **Phone padding.** On phones (≤420px) the map card's padding is 6px (`state-section.module.css:115`), with legend padding, so the frame is 274px at a 320px viewport.
- **The Instagram card map** has its own markup and styles, so it is unaffected.
- **Verification.** Checked in the built `out/` (static server, headless Chrome via puppeteer-core, deviceScaleFactor 2, `prefers-color-scheme` light and dark). For every `tspan` it measures the rendered size (font-size × frame/750) and checks the boxes of different labels for overlap.
  - Before (old build), at 320px: min 10.5px ("WA"), overlaps "790 x VIC" and "1,018 x TAS". At 375px: "1,018 x TAS".
  - After, on the final build:

```
320px light frame 274px: min label 12.42px ("WA"), overlaps none, page scrollWidth 320 OK   (both maps)
320px dark  frame 274px: min label 12.42px ("WA"), overlaps none, page scrollWidth 320 OK   (both maps)
375px light/dark frame 329px: min label 13.6px, overlaps none OK
```

  - Also checked at 340, 360, 390, 414, 430, 480, 540, 600, 768 and 1024px: no overlaps, min ≥ 12.7px.
  - At 1280px each state's code and figure line boxes touch by 0.6px. That is the unchanged desktop layout, and the glyphs don't collide.
  - Screenshots: `scratchpad/shots-after/map-320-{light,dark}.png` and `figure-320.png`.

### B2: keyboard access to the nominations table

- **Change.** `state-section.tsx:105-111`: the scroll wrapper has `tabIndex={0}`, `role="region"` and `aria-label={nominations.heading}`.
- **Built page check.** `tabIndex 0`, label "Home Affairs nominations, 2026–27 program year to 30 Sep 2026".

### Cheap items

- **B-m1.**
  - `not-listed-card.tsx:22` has `{item.pool}{" "}` before `<small>`.
  - `.figure small` loses its margin-left (`recap-parts.module.css:88`), so the gap isn't doubled.
  - No other `.figure small` use exists: `move-list.tsx` has no `<small>`.
- **B-m2.** `src/app/sample/page.tsx:38-39` uses `dayText(monthEnd(loadSampleMeta().asAt))`, giving "31 Oct 2026". One `meta` is shared with `reportSource`.
- **B-m4.**
  - New `src/app/updates/built-copy.test.ts` runs `BANNED_COPY` over the title, meta description and `<main>` text of every `out/updates/**/index.html`, with script and style stripped and entities decoded.
  - It is `describe.skipIf` when `out/updates` is missing.
  - On the final build: 3 tests pass (the index, plus 2026-10).
- **B-m5.** `round-section.module.css:9` adds `.single`. `round-section.tsx:46` uses it for a round block with no aside, and the pool-only grid uses it too.

## Area C: scheduled jobs and docs

### C2: hold needs a closed, unmerged PR

- **`base-branch.ts`:**
  - `closedUnmerged` (line 68) runs `gh pr list --head <fresh> --state closed --json number,mergedAt,headRefName,isCrossRepository`. It counts a PR with an empty or null `mergedAt`, from this repo, with that exact head.
  - `originTip` (line 118) reads the sha from `ls-remote --exit-code`.
  - `freshState` asks gh only when origin has the branch.
  - `isHeld` (line 95) requires tip, a closed unmerged PR and not joining `fresh`.
  - `outputLines` (line 150) prints `branch`, `pr`, `held` and `tip` (the observed sha when the run restarts `fresh`).
- **`lib.sh`:**
  - `choose_base` reads and validates `TIP` (line 84).
  - `push_branch` (line 148) replaces a branch with a tip using `--force-with-lease=refs/heads/$BRANCH:$TIP`, after checking for an open unlabelled PR (`open_prs_on_branch`, line 133, moved from round.sh).
  - round.sh's own `push_round_branch` is gone; both jobs use `push_branch`.
- **`gh.ts`:** a dry run returns `DRY_RUN_CLOSED_PRS` for `pr list --state closed`.
- **Docs.** `OPERATIONS.md:117` ("Only a pull request closed without merging holds…"). The publish line still reads true ("close it and keep its branch"), so it is unchanged.
- **Tests.**
  - `base-branch.test.ts` (15): outputs and tip, `closedUnmerged` (null and "" `mergedAt`; merged, fork and other branch ignored), `isHeld` (closed holds, no PR doesn't, the round-join case), and `originTip`/`freshState`.
  - `gh.test.ts` (closed-PR stub).

### C3: the round job's requests

- **New `scripts/automation/round-pages.ts`.** `savedRoundPage(dir, page, deps)` (line 68):
  - It reads `<dir>/<page>.html` when saved.
  - Otherwise it reads robots.txt once per run (`robotsRules`, line 47, saved as `robots.json`, using page-watch's `readRobots`/`isAllowed`). A stop throws, and a disallowed page throws without being requested.
  - It waits until 10 s after the folder's `last-request` (`politeTurn`, line 36), fetches once and saves the page.
- **`detect-round.ts --dir`** (line 47) saves the current page. A second detect reads that file.
- **`round.sh`:**
  - `ROUND_PAGES="$WORK/rounds-html"` (line 40).
  - `prepare` clears it, and seeds it from `ROUNDS_HTML_DIR` in dry runs (line 67). The guard still refuses `ROUNDS_HTML_DIR` without `DRY_RUN=1`.
  - `fetch_previous_page` (line 86) runs `round-pages.ts --page previous` only for a new round.
  - The import always passes `--rounds-html "$ROUND_PAGES"` (line 97). These are pages this run saved, so the path works outside dry runs.
- **Result.** At most robots.txt plus one request per page per run, each 10 s apart.
- **Monthly importer.** `fetchRoundPages` (`scripts/import/rounds.ts:341`) is sequential with `ROUND_PAGE_GAP_MS = 10_000` (line 335) between the two pages, using the browser `USER_AGENT`. Before, it fetched both with `Promise.all` and a bare "Mozilla/5.0".
- **Docs made true.** `OPERATIONS.md:127`, `DATA.md:228` (and the `detect-round.ts` entry at `DATA.md:212`), `CLAUDE.md:57` and `scripts/README.md`.
- **Tests:**
  - `round-pages.test.ts` (5): robots once, then each page once, ≥10 s apart, with USER_AGENT, and a second read from the copy. Also: no request for a saved page; a disallowed page isn't requested; a robots 403 or 503 stops with no page request; a refused page isn't retried.
  - `rounds.test.ts`: `fetchRoundPages` makes sequential requests ≥10 s apart with USER_AGENT, and doesn't retry a 403.
  - `detect-round.test.ts` updated.

### C4: robots.txt per RFC 9309

- **Change.** `readRobots` (`scripts/page-watch/fetch-pages.ts:115`):
  - Timeout: stop, kind `timeout`.
  - Network error or 5xx: stop, kind `error`.
  - 401, 403 or 429: stop, kind `refused` (line 137).
  - 404 or any other 4xx: no rules, no note.
- **Tests** (`fetch-pages.test.ts`): 404, 410 and 400 allow all; 401 and 403 refuse; 503 and a network error give `error`; a robots 503 in `readAll` skips a baselined page and fails a never-read one.

### C5: one 403 no longer blinds a host

- **Stop rules.**
  - `readPage` returns `forbidden` for a 403. Only 429 and timeouts stop at once (`STOPS_HOST`).
  - `readAll` counts 403s per host and stops at the second (`FORBIDDEN_LIMIT = 2`, line 25; check at line 256).
  - A robots stop also stops the host.
- **Skipped pages.** A page not requested because of a stop gets `kind: "skipped"` ("not requested: {host} stopped earlier this run ({reason})") when it is in `baselined` (line 212). A never-read page keeps the host's failure.
- **CLI.** `cli.ts:171` passes the baselined set (state entries with a hash).
- **Tests:** "keeps asking a host after one page's 403", "…after a second 403", "skips, not fails, a page with a baseline when its host stopped" (429), and the robots-503 case.

### C6: page-watch failure issue

- **`failure-issue.ts`.** `PAGE_WATCH_TITLE = "Page watch failed"` (line 58) and the `--page-watch` key (line 162).
- **New `scripts/automation/page-watch.sh`.** It sources `lib.sh` and has these modes:
  - `prepare`: records "Install dependencies".
  - `run`: creates the label and runs `npm run page-watch`.
  - `resolve`.
  - `report-failure`: `report_failure_issue` with the tsx-less `gh` fallback and `failure_title`.
- **`page-watch.yml`:**
  - A Prepare step.
  - The check is tee'd to `$RUNNER_TEMP/page-watch.log` (line 76).
  - "Close any failure issue" runs after the baseline is saved (line 89).
  - The `if: failure() || cancelled()` report step is at line 95.
- **Tests.** `failure-issue.test.ts`, "gives the page watcher its own issue".
- **Dry runs** (below): both the tsx and the tsx-less paths, plus resolve.

### Cheap items

- **C-m1.**
  - monthly: `MAIN_MONTH` (`monthly.sh:153`). `resolve_month_failures` (line 205) closes the target month's issue and main's next month's issue, de-duplicated, both on "nothing newer" and at the end.
  - round: `resolve_round_failures` resolves `NEWEST` plus every date in `NEW_ROUNDS`, de-duplicated and bash-3.2-safe (`round.sh:190`).
- **C-m2.** The Chrome step is renamed "Start Chrome" and writes that name to `$RUNNER_TEMP/monthly-state/step` (`monthly-data.yml:72`) and `round-state/step` (`round-189.yml:59`). page-watch has no Chrome step.
- **C-m3.**
  - `open_or_update_pr` takes an optional title (`lib.sh:176`, array args).
  - monthly's `joined_title` (`monthly.sh:197`) gives "SkillSelect data as at {short} and 189 rounds" when joining a PR whose branch isn't the month's own. The month comes from `month-info.ts` (validated).
- **C-m4.** `page-watch.yml:31`: `if: github.ref == 'refs/heads/main'`.
- **C-m5.** `OPERATIONS.md:113` and `HANDOFF.md:15`: "Start Chrome" runs on every run, and the first real puppeteer render is the untested step.
- **C-m6.** `OPERATIONS.md:93`: "GitHub keeps one run going and one waiting in that group: a third queued run cancels the waiting one."
- **C-m7.** Checked with `git ls-remote` and shallow fetches of each tag.
  - Every current pin ran on `node20`: checkout 11d5960 "v4.4.0", setup-node 49933ea v4.4.0, cache 0057852 v4.3.0, upload-artifact ea165f8 v4.6.2.
  - Newer majors on `node24`, all dated well over two weeks ago, are now pinned by full commit SHA:

    | Action | Version | Commit | Dated |
    | --- | --- | --- | --- |
    | `actions/checkout` | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` | 2026-07-17 |
    | `actions/setup-node` | v7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` | 2026-10-07 |
    | `actions/cache/restore` and `save` | v6.1.0 | `55cc8345863c7cc4c66a329aec7e433d2d1c52a9` | 2026-06-23 |
    | `actions/upload-artifact` | v7.0.2 | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` | 2026-10-07 |

  - Every input we use still exists. The breaking changes don't touch us:
    - checkout v6 moves persisted credentials to a separate file, and `git push` still works.
    - checkout v7 refuses fork PRs under `pull_request_target`, which we don't use.
    - setup-node v7 drops the dummy `NODE_AUTH_TOKEN`; we set no `registry-url`.
- **Rehearsal list.**
  - Added to `HANDOFF.md:10-16` and `OPERATIONS.md` "Rehearsal": a `monthly-data` run with no inputs (probe); close the rehearsal PR before the next run; `round-189` opens a PR if a November round is published; hold, swap, replace and the failure path are covered only by dry runs.

## Verification

- **`npm run check`** (final, 96a8fb5): format, lint and typecheck clean.

  ```
  Test Files 197 passed (197) / Tests 2009 passed (2009)
  ```

- **`npm run build`:** exit 0, no warnings. `built-copy.test.ts` on that build: 3 passed.
- **Linters:**
  - `actionlint -shellcheck` 1.7.12 on all three workflows: exit 0.
  - `shellcheck -x scripts/automation/*.sh` 0.11.0: exit 0.
  - `bash -n` on lib.sh, monthly.sh, page-watch.sh and round.sh: exit 0.
  - These are the release binaries an earlier task saved in the scratchpad. A fresh download was blocked by the permission classifier.
- **Dry runs.**
  - Setup:
    - Each runs in a `git clone --local` of the branch, with `origin` pointed at a scratch bare clone, so there is no network.
    - `npm ci` ran with `npm_config_offline=true`.
    - The settings were `DRY_RUN=1 BASE_REF=HEAD TODAY=2026-11-25`.
  - Monthly A (`MONTH=2026-10`): exit 0.
    - Install, fetch, choose base, import (data:generate), prune `--month 2026-10`, check, build, frozen check, summary.
    - The summary showed "Nothing needs a decision." and a "### Notes" coverage line.
    - Commit "data: SkillSelect snapshot as at Oct 2026"; `git push origin HEAD:refs/heads/data/skillselect-2026-10` and `gh pr create …` printed.
    - It closed one failure issue (2026-10, de-duplicated).
  - Monthly hold (the origin has `data/skillselect-2026-10`, with `DRY_RUN_CLOSED_PRS` naming an unmerged closed PR): exit 0.
    - It made the closed-PR `gh pr list --head … --state closed` call.
    - It printed "Held: the pull request for October 2026 was closed. Delete branch data/skillselect-2026-10 to import it again." It did nothing else, and the tree was clean.
  - Monthly takeover (the same origin branch at 759f064 and no PR): exit 0.
    - The full run did `gh pr list --head … --state open`.
    - "==> Replace data/skillselect-2026-10, left by an earlier run" printed `git push --force-with-lease=refs/heads/data/skillselect-2026-10:759f064eed1b… origin HEAD:refs/heads/data/skillselect-2026-10`, then `gh pr create`.
    - Run for real against the scratch origin, a stale lease was "rejected (stale info)" and the observed tip pushed (`759f064..94e454f`).
    - `push_branch` with `DRY_RUN_HEAD_PRS` naming #12 failed with "Pull request #12 is open on data/skillselect-2026-10 without the data-update label…", exit 1.
    - `open_or_update_pr` with a third argument printed `gh pr edit 12 --body-file … --title SkillSelect\ data\ as\ at\ 30\ Nov\ 2026\ and\ 189\ rounds`.
  - Monthly forced failure (`MONTH=2026-12`): run exit 1 at "Import 2026-12". The state held step "Import 2026-12" and month "2026-12". `report-failure` printed `gh issue list …` and `gh issue create --title Monthly SkillSelect update failed (Dec 2026) --body-file - --assignee Prathu910`.
  - Round, new round (`ROUNDS_HTML_DIR` = the fixture current page re-dated to 12 Nov 2026, plus the previous page): exit 0.
    - "status=new newest=2026-11-12", choose base, and "==> Read the previous rounds page / previous-rounds.html was saved already in …/rounds-html".
    - The import said "New rounds: 2026-11-12". Then: write the facts, render the round set (local Chrome), check, build, frozen check, summary.
    - Two commits; `git push origin HEAD:refs/heads/data/round-2026-11-12` and `gh pr create … --title 189 round of 12 Nov 2026` printed.
    - It closed the round-check issue and the 2026-11-12 issue.
  - Round, joined PR that has the round (`DRY_RUN_OPEN_PRS` #40 on `data/round-2026-11-12`): exit 0. "Joining pull request #40", then the second detect (read from the saved copy) said "status=none", then "Pull request #40 has the 2026-11-12 round already. Nothing to do.", and both resolves.
  - page-watch.sh:
    - Without tsx (a fresh clone with no node_modules): `prepare`, then `report-failure` printed "failure-issue.ts is unavailable; reporting with gh directly." and `gh issue create --title Page\ watch\ failed --body-file - --assignee Prathu910`, exit 0.
    - With tsx: `gh issue create --title Page watch failed …` and "create".
    - `resolve`: "none open".
- **The November simulation** (A1): it passes at 96a8fb5, as shown above. The worktree was removed.
- **The 320px map check** (B1): passes in both themes on the final build, as shown above.

## Not run, and why

These would be live requests, and the rules allow none:

- `page-watch.sh run` and `npm run page-watch` (about 50 live requests).
- A monthly run without `MONTH` (a live dashboard probe).
- A round run without `ROUNDS_HTML_DIR` (live robots.txt and current page).

The unit tests cover their request logic. The only network calls were `git ls-remote`/`git fetch` of the four actions' tags for C-m7, which that item asks for.

## Notes and concerns

- **User-Agent.** Round pages now go out with the browser `USER_AGENT` (`scripts/state-lists/shared.ts`), for both the importer and the round job. Before, they used a bare "Mozilla/5.0". The robots token is "Mozilla" either way. This follows the 25 Nov rule and R19 ("one source per fact"), but it is a change in what Home Affairs sees.
- **Importer robots check.** The monthly importer's own round fetches (a manual `data:import` without `--keep-rounds`) are now spaced 10 s apart, as asked. Unlike the round job, they don't check robots.txt, and the scheduled monthly job never fetches them (`--keep-rounds`).
- **Hold wording.** A held month logs "No open data-update pull request; the run starts … from main." just before "Held: …". This was already the case, and the order reads oddly.
- **Unrelated untracked files** under `.superpowers/` were left alone.
