# Final-review fix wave (all three areas)

Branch `roadmap/monthly-updates`, base 52ddb66. Fix all items below in new commits (group them sensibly, e.g. one commit per area). Don't amend, don't push.

## Must fix

### Data (area A)
A1. **The first real monthly PR fails `npm run check`.** These tests hard-code October 2026, or read live data that moves when the month changes:
- `src/lib/outlook/view.test.ts:376` and `src/lib/outlook/read-template.test.ts:167` expect "October 2026". The no-core path uses the live `manifest.asAt` (`phrases.ts:2,41`). Fix: pin these tests to frozen data or a mocked manifest, or derive the expectation from `manifest.asAt`.
- `scripts/social/title-fit.test.ts:11` and `scripts/social/spotlight-render.test.ts:20` call `popularOccupations(loadAllCores(), "2026-10")`. Use frozen 2026-10 cores (`frozenCore`/fixtures) or the manifest month.
- Widen the R8 guard (`src/lib/data/live-data-tests.test.ts`) to cover imports of `src/data/manifest.json` and `scripts/**/*.test.ts`.
- **Prove it:** in a throwaway git worktree, simulate a November month and run `npm run check` there. The reviewer did this with a synthetic data month via `updates:generate --section data --previous-manifest`, editing the manifest's `asAt` to 2026-11, or any equivalent. It must pass. Remove the worktree afterwards.

A2. **Previous-month sums must include occupations dropped this month** (Plan 1 Task 9 ruling). In `nationalFigures` (`src/lib/updates/facts-national.ts:62-73`) and `stateFigures` (`facts-states.ts:73,92`), compute the `previous` sums over the current cores plus the cores whose manifest entry has `lastAsAt === previousMonth`. Pass those in from `buildDataSection` (`facts-data.ts:170`). Add a test with one dropped core: last month's interval must equal what last month's own facts showed. Leave the frozen 2026-10 file as it is; its data section is frozen.

A3/C1. **Retention will delete files that tests read.** `src/lib/updates/summary-view.test.ts:29-32` reads `public/social/2026-10/{month,round-2026-10-15}/set.json`. Copy both files into `src/lib/updates/__fixtures__/` and read them from there. Also pass `--month "$TARGET"` to `updates:retention` in `monthly.sh:127`, so that a round-only folder never counts as "latest". Check `round.sh` for the same problem.

### Jobs (area C)
C2. **A failed `gh pr create` is read as "held".** Make `isHeld` (`base-branch.ts:59`) require a closed, unmerged PR on that head branch (`gh pr list --head <fresh> --state closed --json number,mergedAt` with an empty `mergedAt`), on top of the branch existing on origin. A branch with no PR at all is not held, and the next run takes it over. Use force-with-lease on the tip you observed, as the round job does. Add tests. Update the docs and the publish-line wording if they need it.

C3. **The round job breaks the 25 Nov request rules.** `detect-round.ts` fetches the current page; a joined PR fetches it again (`round.sh:222`); and `--rounds-only` then fetches both pages with `Promise.all` (`scripts/import/rounds.ts:331`). Fix:
- `detect` saves the current page to `$WORK/rounds-html/`, and a second detect reads that file.
- Check robots.txt for the host once, using `scripts/page-watch/robots.ts`.
- Wait at least 10 s, then fetch `previous-rounds` once.
- Pass `--rounds-html` to the import, renaming or relaxing the `ROUNDS_HTML_DIR` guard so that this path works outside dry runs, safely.
- The result is at most one request per page per run, with a 10 s gap.
- Make the docs at `OPERATIONS.md:125`, `DATA.md:228` and `CLAUDE.md:57` true.
- Check the monthly importer's round-page fetches for the same `Promise.all` problem, and space them out.

C4. **robots.txt handling** (`scripts/page-watch/fetch-pages.ts:119-137`). Per RFC 9309:
- A 5xx or a network error stops the host with kind `error`.
- A 401 or 403 stops the host with kind `refused`.
- A 404 or any other 4xx allows everything.
- Add tests.

C5. **One page-level 403 shuts off its whole host** (`fetch-pages.ts:21,195-197`). Stop a host only on a 429, a timeout, a robots refusal or error, or a second page 403 in the same run. Pages skipped because of a stop get `kind: "skipped"` when they have a baseline, so they don't count as failed days. Add tests.

C6. **`page-watch.yml` has no failure-issue step.** Add a new key to `failure-issue.ts`, `--page-watch`, titled "Page watch failed". Add an `if: failure() || cancelled()` step that reports through it, with the same tsx-less fallback pattern as `lib.sh`. Resolve it on a successful run. Add tests.

### UI (area B)
B1. **State map labels are under 12 px at a 320 px viewport** (`src/components/updates/state-recap-map.module.css:89-99`). Add a `@container (width < 300px)` step, or trim the card padding on phones, so every map label is at least 12 px at 320 px with no collisions (VIC, TAS, NSW, "1,018"). Verify it in the built `out/` with headless Chrome at 320 px, in both themes. This applies to the recap map, and to the card map only if it shares the CSS.

B2. **The nominations table scrolls but has no keyboard access** (`state-section.tsx:~100`, `.nominationsScroll`). Give the wrapper `tabIndex={0}`, `role="region"` and an `aria-label` from `nominations.heading`.

## Also fix (cheap)
- B-m1: in `not-listed-card.tsx:22-23`, add `{" "}` before `<small>`, and do the same in any other `.figure small` use.
- B-m2: in `src/app/sample/page.tsx:56`, derive "as at 31 Oct 2026" from `loadSampleMeta()`.
- B-m4: add a test that runs `BANNED_COPY` over the built `out/updates/**/index.html`. Skip it if `out/` isn't built.
- B-m5: in `round-section.module.css`, use a single column when there is no aside.
- A-m4, **controller ruling**: when `data === null`, `recapTitle` returns "SkillSelect {Month YYYY} update: 189 round results". The page title changes when the data section arrives.
- A-m5: `monthPair` (`facts-national.ts:56`) and the state floor fallback throw when no core has the month, instead of returning `{0,0}`.
- A-m6: `revisionLines` (`summary-view.ts:90-99`) also shows the affected month's national 189/190/491 intervals, before and after, when they are available.
- A-m7: move the coverage line out of "Needs your decision" into a notes section, so that "Nothing needs a decision." can appear.
- C-m1: on success, also resolve main's next month's issue in `monthly.sh:148/160`. In `round.sh:207`, resolve every date in `NEW_ROUNDS`.
- C-m2: the Chrome step writes its step name ("Start Chrome") to the state step file, in all three workflows where it applies.
- C-m3: when monthly data joins a round PR, update the PR title with `gh pr edit --title` (the arguments are an array, and the title is built from the validated month).
- C-m4: `page-watch.yml` gets `if: github.ref == 'refs/heads/main'` on the job.
- C-m5: HANDOFF and OPERATIONS say that the Chrome smoke test runs on every run, and that the first real puppeteer render is the untested step.
- C-m6: the docs get one line saying that a third queued `data-update` run cancels the pending one.
- C-m7: check whether checkout, setup-node, cache and upload-artifact v4 still run on Node 20 and are deprecated on runners. If a newer major is current and at least two weeks old, pin its full SHA (from `git ls-remote`) with the version in a comment. Otherwise leave them as they are, and say so.
- Rehearsal list in `docs/HANDOFF.md`:
  - a `monthly-data` run with no inputs, to exercise the probe;
  - close the rehearsal PR before running `round-189`, or the round run joins it;
  - `round-189` opens a PR if a November round is already published;
  - swap, hold and the failure path are covered only by dry runs.

## Rules
- Follow the global constraints of all three plans: `.superpowers/sdd/2026-11-24-monthly-updates-*/global-constraints.md`.
- Follow `CLAUDE.md` and `docs/ENGINEERING.md`.
- Make no live network calls, except where a step above says otherwise. The `.github` changes can't be run here: lint them and dry-run the shell.
- Run `npm run check` (with `--maxWorkers=4` if it times out under load), `npm run build`, actionlint, shellcheck, `bash -n`, the monthly and round dry runs (`DRY_RUN=1 BASE_REF=HEAD`), and the November simulation from A1.
- End each commit message with the trailer line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
