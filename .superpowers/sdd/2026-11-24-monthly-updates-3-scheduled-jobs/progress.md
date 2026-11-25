# SDD ledger — plan: docs/superpowers/plans/2026-11-24-monthly-updates-3-scheduled-jobs.md

Spec: docs/superpowers/specs/2026-11-24-monthly-updates-design.md
Branch: roadmap/monthly-updates for Tasks 2–9 (controller ruling: Plans 1 → 2 → 3 stacked; the plan's `roadmap/monthly-updates-jobs` and "Plans 1 and 2 merged" are superseded). Task 1 (spike) runs separately on `spike/runner-import`. Push after every task; never merge.

## Pre-flight scan

Scanned 24 Nov 2026. Environment: there is no `gh`, `actionlint`, `docker` or `go` on this Mac; `brew` is present. `.github/` doesn't exist. `origin/main` has none of Plans 1–2 until the founder merges. Code checked: `cli.ts` flags and revision logging, `fetchRoundPages` (UA "Mozilla/5.0"; `scripts/state-lists/shared.ts` has `USER_AGENT`), round fixtures (the previous-rounds page has no nominations table or per-row tie-breaks).

### Pair rows

| # | Pair | Produces → consumes | Finding |
|---|---|---|---|
| 1 | P3T2 → P3T6 | `--probe`, `nextImportMonth`, `ImportReport` → `monthly.sh` | `monthly.sh` probes before `npm ci`, but the probe runs under tsx. See R14. |
| 2 | P3T2 → P3T4 | `ImportReport.revisions`, `pageReads` → summary | Clean. `cli.ts` already collects revisions. |
| 3 | P3T3 → P3T7 | `detect-round.ts`, `--rounds-only`, `report.newRounds` → `round.sh` | Clean. |
| 4 | P3T4 → P3T6/T7 | `buildSummary`, `appendSection` → PR body | `buildSummary` has no core input but must report the Software Engineer coverage figure. See R16. |
| 5 | P3T5 → P3T6/T7 | `chooseBase`, frozen check, failure issue → scripts | Needs `GH_TOKEN` and a fetched `origin/main` on the runner (R17). Locally, `gh` is absent and `origin/main` lacks the facts (R15). |
| 6 | P3T6 ↔ P3T7 | shared base-branch, commit and PR logic | Clean (same concurrency group). |
| 7 | P3T8 → P3T8 | `collectSources` → `planWatch` → workflow | The workflow must create `source-watch` too (R18). For UA, use `USER_AGENT` from `scripts/state-lists/shared.ts` (R19). |
| 8 | P3T1 → ledger | spike results → `.superpowers/sdd/2026-11-24-monthly-updates/progress.md` | Wrong path. Record them here (R24). |
| 9 | P1T4 ↔ P3T3 (cross) | v2 round parse ↔ `--rounds-only` re-parses both pages | Re-parsing drops the Oct round's per-row tie-breaks and nominations once it sits on the previous-rounds page. See R1. |
| 10 | P1T4 ↔ P3T3 (cross) | `readRoundsFile` ↔ `--keep-rounds` | v2 fields aren't round-tripped. See R2. |
| 11 | P1T4 ↔ P3T3 (cross) | "rejects --rounds-html without --generate-only" ↔ allowed with `--rounds-only` | See R3. |
| 12 | P1T5 ↔ P3T3 (cross) | `GenerateInput.previous` ↔ rounds-only and keep-rounds regenerations | See R7. |
| 13 | P1T7/T10 ↔ P3T3/T7 (cross) | round `sources.checkedAt` ↔ `roundsCheckedAt` | See R22. |
| 14 | P1T8/T9 ↔ P3T6/T7 (cross) | data facts read a `rounds.json` that the round job has already grown | See R5. |
| 15 | P1T6 ↔ P3T5 (cross) | merge helpers ↔ `changedFrozenSections` | Clean. |
| 16 | P1T10 ↔ P3T6 (cross) | `updates:generate` flags | Clean. |
| 17 | P2T4 ↔ P3T6 (cross) | `CHROME_PATH=/usr/bin/google-chrome`, `--no-sandbox` | Clean. |
| 18 | P2T5 ↔ P3T6/T7 (cross) | render "prune" ↔ `updates:retention` step | See R11. |
| 19 | P2T5 → P3T4 (cross) | `set.json` → images table | Clean. |
| 20 | P2T5 ↔ P3T6 (cross) | `public/social/**/set.json` ↔ `npm run check` in the job | See R12 (Plan 2 ledger). |
| 21 | P2T6 ↔ P3T9 (cross) | committed 2026-10 sets ↔ rehearsal | Clean (controller ruling). |
| 22 | P1T13, P2T6 ↔ P3T9 (cross) | doc edits | Sequential, clean. |

### Per-task rows

| Task | Self-consistent? | Finding |
|---|---|---|
| P3T1 | n/a (running separately) | Step 2 `gh run watch` can't run on this Mac; watch the run in the GitHub UI or the Actions API. The ledger path is wrong (R24). Decision 1 (push trigger) departs from spec 8 step 0 with a valid reason. |
| P3T2 | Yes | Clean. |
| P3T3 | Partly | R1, R2, R3, R7. |
| P3T4 | Partly | R16. |
| P3T5 | Yes | Pure functions are testable without `gh`. The CLIs are CI-only. Failure issues should also be assigned to Prathu910 (spec 6.15); include that in R17. |
| P3T6 | No | R14 (order), R15 (dry run), R17 (`GH_TOKEN`, fetch). The failure artifact misses "raw files fetched" (spec 6.15, R20). Step 1 needs `brew install actionlint` (network). Action SHAs must be resolved with `git ls-remote`, not `gh`. |
| P3T7 | No | Step 2's expectation "skipped because main already has rounds[2026-10-15]" is false before the merge (R15). Its scratch `rounds.json` must stay uncommitted. |
| P3T8 | Partly | R18, R19. `--dry-run` fetches about 50 government URLs; allowed but slow. |
| P3T9 | Deferred | Steps 2–4 need the founder's setup and merge, and `gh workflow run` (not available locally). R21. |

### Proposed rulings

- **R1** Ruling: Regeneration never re-derives a stored round from the previous-rounds page. Keep stored rounds verbatim (or re-parse each from `data/raw/rounds/<date>.html`) and append only new dates. — Why: spec 6.10 (the round job owns every round; HTML is stored for this reason) and the 6.3 freeze; the fixtures show the loss. — Cost if wrong: the first live round PR strips Oct's tie-breaks and nominations and fails Plan 1's tests.
- **R2** Ruling: `readRoundsFile` round-trips every v2 field, and a byte-identical `data:generate` test proves it. — Why: spec 6.9 step 4 (`--keep-rounds`). — Cost if wrong: every monthly PR strips v2 data.
- **R3** Ruling: P3T3 changes Plan 1's rejection test to "requires `--generate-only` or `--rounds-only`". — Why: the P3T3 interface. — Cost if wrong: a red test.
- **R5** Ruling: Data facts see only rounds dated on or before the month's end (spotlight, notable, not-listed). — Why: spec 6.9 step 4. — Cost if wrong: a later round leaks into a month's facts.
- **R7** Ruling: Every mode that writes `src/data` passes the current data as `previous`. — Why: spec 6.17. — Cost if wrong: `--rounds-only` drops kept pages.
- **R11** Ruling: Only the monthly job's `updates:retention` step prunes; `social:render` never does. — Why: spec 6.7. — Cost if wrong: round PRs delete images.
- **R14** Ruling: `monthly.sh` runs `npm ci` straight after checking out the base branch, before the probe. — Why: the probe is `tsx scripts/import/cli.ts`. — Cost if wrong: every scheduled run fails at the probe.
- **R15** Ruling: `monthly.sh`, `round.sh` and `frozen-check` take `BASE_REF` (default `origin/main`). In `DRY_RUN=1`, every `gh` call is stubbed (reads return `[]`) along with `git push`. Local dry runs set `BASE_REF=HEAD`. Adjust the dry-run expectations; they hold against `HEAD` and not against `origin/main` before the merge. — Why: single-branch execution (controller ruling); `gh` isn't installed here. — Cost if wrong: the dry runs can't pass and the implementer weakens the checks.
- **R16** Ruling: The summary CLI computes `coverage: { current: Interval; previous: Interval | null }` from the 261313 core and passes it into `buildSummary`. — Why: spec 6.12 item 7. — Cost if wrong: an untestable item, or a pure function that reads files.
- **R17** Ruling: Every workflow step that calls `gh` sets `GH_TOKEN: ${{ github.token }}`. Jobs run `git fetch origin main` before the frozen check. Failure issues use `--assignee Prathu910`. — Why: the plan's Global Constraints and spec 6.15. — Cost if wrong: the first live run fails at its first `gh` call, or the frozen check compares against nothing.
- **R18** Ruling: `page-watch.yml` runs `gh label create source-watch --force` before creating issues. — Why: spec 6.16 item 4. — Cost if wrong: the first issue creation fails.
- **R19** Ruling: The page watcher uses `USER_AGENT` from `scripts/state-lists/shared.ts`. — Why: one source per fact (ENGINEERING.md); the importer's UA is a bare "Mozilla/5.0". — Cost if wrong: minor.
- **R20** Ruling: The failure artifact also includes the changed files under `data/raw/` (`git status --porcelain data/raw`). — Why: spec 6.15. — Cost if wrong: harder diagnosis.
- **R21** Ruling: P3T9 steps 2–4 (founder setup, merge, `gh workflow run` rehearsal, recording page-watch baselines) and P3T1 steps that need `gh` are deferred. Write the handoff in `docs/HANDOFF.md`, with the GitHub UI "Run workflow" path as the alternative to `gh`. — Why: workflows can't be dispatched before they're merged to `main`, the founder is away, and `gh` isn't installed locally. — Cost if wrong: none; it's the only possible order.
- **R22** Ruling: Round sections use `manifest.roundsCheckedAt ?? manifest.checkedAt`. — Why: P3 decision 6. — Cost if wrong: a wrong date.
- **R24** Ruling: Record the spike results in this ledger, not in `2026-11-24-monthly-updates/progress.md`. — Why: the controller's ledger layout. — Cost if wrong: results get lost.

- Controller (24 Nov): all proposed pre-flight rulings above are ACCEPTED as written; implementers follow the ones naming their task.

## Execution (Tasks 2–9 on roadmap/monthly-updates; Ruling: same single branch as Plans 1–2, founder away)
Carry-forwards into Plan 3:
- Render launch has no --no-sandbox; ubuntu-24.04 runners restrict unprivileged user namespaces — CI must handle Chrome sandbox (P2 Task 4).
- Plan 1 Task 4 deferred: writeRoundPage overwrites saved round HTML while keepStoredRounds freezes the round — decide in Task 3 (rev files or re-parse current round from its own page).
- Plan 1 Task 10: roundsCheckedAt read via cast; Task 3 adds manifest.roundsCheckedAt.
- Plan 1 Task 9 ruling (deferred to final wave): previous-month sums should include cores dropped this month.
- Possible flaky vitest timeouts under load.
- P3 Task 2: BASE c6790a8, implementer dispatched (sonnet)
Task 2: minor (deferred): listAsAtMonths doesn't filter qState (excluded months could appear newest); report write in finally can mask original error; no test that requested wins over newer newest; argv suffix guard.
Task 2: complete (commits c6790a8..516c31f, review clean)
- P3 Task 3: BASE 516c31f, implementer dispatched (opus)
Ruling: stored round pages are never overwritten once the round is in rounds.json (no rev files) — R1 freezes the round so only its source page matters — cost if wrong: a corrected Home Affairs page during a current round is not captured (prints 'Kept … differs').
Task 3: minor (deferred): revisionsUpTo compares UTC revision dates with local checkedAt (rare silent drop); cli.ts usage comment wrong about --probe --report-file; --rounds-only uses mode 'monthly' + booleans (discriminated run kind later); cli.ts 512 lines — extract round-input.ts; --generate-only --rounds-html keeps old roundsCheckedAt; untested detect-round main & no-Qlik-session for --rounds-only; full npm run check under load needs quiet re-run.
Carry-forward to Task 6: monthly job MUST pass --keep-rounds (founder rule depends on it). Reading confirmed: --keep-rounds adds no rounds and removes none already stored by the round job; month facts filter rounds by R5.
Task 3: complete (commits 516c31f..670b18c, review clean)
- P3 Task 4: BASE 670b18c, implementer dispatched (sonnet)
Task 4: minor (deferred): BANNED_COPY test strips whole To-publish line (narrow to the phrase); publishedDataMonths bare catch silent fallback + untested; report/set JSON cast not validated; hard-coded 'about 885 a month' note; test gaps (coverageLine previous null, missing sections, budget null); argv suffix guard.
Task 4: fix round 1/5 (2 addressed, 0 open — src/lib→scripts type imports; banned-copy exclusion narrowed; commits cbb32ca..0057f92)
Task 4: minor (deferred): SetImage format/theme literal unions duplicate CardFormat/Theme; import-direction guard partial (dynamic imports, __fixtures__ blanket skip).
Task 4: complete (commits 670b18c..0057f92, review clean after 1 fix round)
- P3 Task 5: BASE 0057f92, implementer dispatched (sonnet)
Ruling: Task 5 fix round includes the security-relevant minors (fork/branch validation, issue author filter, body fence/cap via --body-file, title built from --month/--round, log tail) with the Important frozen-base finding — public repo + Task 6 builds on these CLIs — cost if wrong: slightly larger fix diff.
Task 5: minor (deferred): deleted facts file not noticed by frozen check; 'in' vs Object.hasOwn; weak hasPublishedData test; frozen-check CLI untested; main() not wrapped.
Carry-forward to Tasks 6/7: failure-issue takes --month YYYY-MM or --round YYYY-MM-DD (no raw --title); data branches must match ^data/[a-z0-9-]+$.
Task 5: fix round 1/5 (3 addressed, 0 open — frozen base verification; fork/branch validation; failure-issue hardening; commits 96ae3d5..7dd5ef0)
Task 5: minor (deferred): resolveFailure comment+close two calls; date regex accepts 31 Feb.
Task 5: complete (commits 0057f92..7dd5ef0, review clean after 1 fix round)
- P3 Task 6: BASE 7dd5ef0, implementer dispatched (opus)
Carry-forward to final wave: updates:retention will delete 2026-10 set.json that live-data tests read (~Feb 2027) — move those tests to frozen fixtures or guard them.
Ruling: "close to skip" means HOLD — if data/skillselect-<T> exists on origin with no open PR (founder closed it), the job exits 0 before any import, logging "held: PR closed; delete the branch to re-import <T>"; PR text and docs say the same. Spec 6.9 imports oldest-first so a true skip would need skipped-month state; hold is cheap and reversible — cost if wrong: founder must delete a branch to resume rather than auto-skipping.
Ruling: Task 6 fix round includes timeout handling, swap summary regeneration and the cheap minors (env -u GH_TOKEN npm ci + trust-boundary comment, Chrome headless smoke test, pre-install month record + tsx-less issue fallback, resolve on successful empty probe, step "Commit").
Note: Task 9 rehearsal (MONTH=2026-10) will not exercise Chrome (month set exists) — first real render is the first real month; the smoke test mitigates.
Task 6: fix round 1/5 (8 addressed, 2 new Important open — I1 hold bypassed on join; I2 tsx-less fallback aborts on empty log; commits 965f970..c77b9bd)
Task 6: fix round 2/5 (5 addressed, 0 open — hold on join; empty-log fallback; long-log SIGPIPE; run_tsx failure fallback; CRLF; commits c77b9bd..dc17481)
Task 6: minor (deferred): monthly.sh:46 HELD comment stale; month added to a round PR then closed isn't held; failed pr create after push reads as held (failure issue still filed); manual cancel opens failure issue; swap/hold wiring dry-run only.
Task 6: complete (commits 7dd5ef0..dc17481, review clean after 2 fix rounds)
- P3 Task 7: BASE dc17481, implementer dispatched (opus)
Founder (in chat): stop pushing after every task; push once at the end. Also: do NOT shut down the Mac or close the terminal.
Ruling: closed round PRs are NOT held (keep force-with-lease replace) — a round hold would last only until the next round re-imports it and needs join-path checks; PR text already says closing doesn't hold a round — cost if wrong: founder sees a closed round PR return next day.
Task 7: minor (deferred): repeated 'Needs your decision' lines across several new rounds; Chrome smoke test daily even with no new round.
Task 7: fix round 1 dispatched (I1 stable pre-detection failure key; M2 empty lease fallback; M3 unlabelled open PR guard).
Task 7: fix round 1/5 (3 addressed, 0 open — stable '189 round check failed' key; empty-tip push fallback; open-PR guard before force-push; commits f517eea..1a3a1ef)
Task 7: complete (commits dc17481..1a3a1ef, review clean after 1 fix round)

## HARD STOP (founder request, 25 Nov 2026) — system restart
RESUME HERE: Plan 3 Task 8 (page watcher), then Task 9 (docs, founder setup; rehearsal deferred until merge), then the whole-branch final review (Plans 1–3, see deferred minors in all three ledgers + Plan 1 Task 9 previous-month ruling + retention/set.json test carry-forward), final fix wave, quiet full `npm run lighthouse`, then ONE push of roadmap/monthly-updates and the PR. Local commits after dc17481 (Task 7) are NOT pushed yet, by founder instruction. Do not shut down or close the terminal.
- P3 Task 8: BASE 1a3a1ef, implementer dispatched (opus) — resumed after restart
Ruling: pages never readable (no baseline, 4xx) open no per-host issue; listed under a summary section "Not watched: refuses automated reads" and in ONE standing issue "Sources the watcher cannot read", edited only when the set changes. Per-host "Source unreachable" kept for pages that had a baseline then failed 3 days — STRATEGY 19 Nov already records VIC/ACT/TAS/NT block bots — cost if wrong: founder wanted per-host issues.
Task 8: fix round 1 dispatched (per-host stop + run deadline; never-readable handling; minors: failures per date, cache key run_attempt, marker outside fence, split watch.ts, cookie wrapper, comment wording). User-Agent question sent to founder (I3).
Founder decision (25 Nov 2026, in chat): automated jobs keep the browser User-Agent with rules — ≤1 request per page per day, 10 s per-site gap, never retry a refusal, skip robots.txt-disallowed URLs, record in STRATEGY decision log. Task 8 adds robots.txt check; Task 9 records the decision.
Founder (25 Nov, chat): at the end push roadmap/monthly-updates but do NOT create or open the PR page; founder creates it manually.
Ruling: no 5xx retry (founder's one-request-per-page-per-day wins over the reviewer's minor); closed standing issue stays closed (founder acknowledged); timeout-only never-read pages listed in summary only.
Task 8: fix round 1/5 (all addressed, 0 open — budget + per-host stop; never-readable standing issue; robots.txt; minors; commits 79c279e..4f41b3f)
Task 8: minor (deferred → final wave): robots.txt 403 should stop the host; robots.txt 5xx/network should be treated as disallow-all per RFC 9309 (more conservative, fits founder rule) — Ruling: apply in final fix wave; one page-level 403 blinds its host (stop only on 429/timeout or second 403); standing body wording for 404s and skipped reasons; standing-issue search-index duplicate on immediate rerun.
Task 8: complete (commits 1a3a1ef..4f41b3f, review clean after 1 fix round)
- P3 Task 9: BASE 4f41b3f, implementer dispatched (sonnet)
Task 9: fix round 1/5 (all addressed; commits 53f35ca..95f62dd)
Task 9: complete (commits 4f41b3f..95f62dd, review clean after 1 fix round). Plan 3 tasks complete; rehearsal deferred until founder merges.
Ruling: commit the plan ledgers/reports at finish instead of deleting the workspace — CLAUDE.md says .superpowers/sdd/<plan>/progress.md is the project's committed working history — cost if wrong: extra files in the repo.

## Final review (3 area reviewers) + one fix wave (95f62dd..991f892), re-review clean
Parked — Ruling: closedUnmerged doesn't compare headRefOid to the tip, so an old closed PR can hold a month after branch delete + failed pr create — narrow path, failure issue still filed — cost if wrong: founder deletes branch again. Follow-up.
Parked — Ruling: page-watch.sh report-failure doesn't mkdir $STATE, so a failure before Prepare opens no issue (GitHub email still sent) — one-line follow-up — cost if wrong: one silent early failure.
Parked — Ruling: page-watch step labels can name the neighbouring step — cosmetic.
