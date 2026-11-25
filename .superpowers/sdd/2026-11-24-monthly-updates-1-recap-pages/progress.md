# SDD ledger — plan: docs/superpowers/plans/2026-11-24-monthly-updates-1-recap-pages.md

Spec: docs/superpowers/specs/2026-11-24-monthly-updates-design.md
Branch: roadmap/monthly-updates (in the main checkout). Push to origin after every task (founder instruction, 24 Nov 2026: "push everything steps wise"). Founder is away; never merge.

## Controller rulings
- Ruling: Plans 1, 2 and 3 all run on roadmap/monthly-updates, in order 1 → 2 → 3 — the founder is away and can't merge between plans; Plan 3 says tasks 2–9 need 1 and 2 merged, which stacking on one branch satisfies for building and testing — cost if wrong: one larger PR to review.
- Ruling: Plan 2's open question (commit locally rendered 2026-10 images for an early first post) → yes, commit them — Claude's recommendation sent to the founder on 24 Nov; the founder said "go ahead" without objecting — cost if wrong: a few hundred KB in git that a later task can delete.

## Pre-flight scan

Scanned 24 Nov 2026 against the spec (binding), CLAUDE.md, docs/ENGINEERING.md and the code on `roadmap/monthly-updates`. Checked: fixture pages (`previous-rounds.html` has 0 "State and Territory nominations" tables and "Total EOIs Invited" in only 6 of 12 rounds), `src/data/rounds.json` (Task 7 figures reproduce: 159 listed, 78/9/50, 22 new, 3 dropped, picks 134214/342111/272311), `readRoundsFile` (returns name+cutoff only), `generate.ts` (filters raw months ≤ asAt), no vitest config (no `@/` alias in tests), existing stamps (`@/` imports, CSS modules, `useFitStampText`), layout title template `"%s · MigrateLens"`, `.prettierignore`, the live-data test list.

### Pair rows (P = plan, T = task)

| # | Pair | Produces → consumes | Finding |
|---|---|---|---|
| 1 | P1T1 → P1T2 | `generateFrozenSnapshot`, `frozenCore/Detail` → sample freeze + equality test | Clean. |
| 2 | P1T1 → P1T3 | `frozenCore/Detail/Index` → loader swaps | Clean. |
| 3 | P1T1 ↔ P1T4 | Task 1 test calls `readRoundsFile(src/data/rounds.json)`; Task 4 makes it v2-only and splits code/data commits | The code commit fails Tasks 1/legacy tests until the data commit lands. See R13. |
| 4 | P1T2 ↔ P1T3 | `sample-data.test.ts` imports `load-server` → Task 3 guard ("imports `load-server`") | Guard flags a frozen-sample test. See R8. |
| 5 | P1T10/T11 ↔ P1T3 | `src/lib/updates/load-server.ts` read by Task 11 `copy-sweep.test.ts` (and Plan 2 tests) → guard regex | Same false positive. See R8. |
| 6 | P1T4 → P1T6/T7 | `StoredRound.totals: RoundTotal[] \| null` → `RoundSection.totals: RoundTotal[]` (non-null), H1 needs the total | Type mismatch; older rounds have no totals table. See R4. |
| 7 | P1T4 → P1T7/T8/T9 | live `src/data/rounds.json` (tests read it for Oct/Jun) | Tests break when a later round re-parses Oct from the previous-rounds page (R1) or leaks into month facts (R5). |
| 8 | P1T4 → P1T9 | `nominations` "newest stored round's table that isn't null" | Matches spec 6.9 step 4 ("stored with the latest round"); depends on R1 so Oct's table isn't lost. |
| 9 | P1T5 → P1T6 | `formatLongMonth` in `copy.ts` → re-exported by `format.ts` | Clean. |
| 10 | P1T5 ↔ P1T8/T9 | carried-forward dropped cores (old snapshot) → `nationalFigures`, `stateFigures`, movers, popular-20, notable, notListed | `buildDataSection` has no index input, so dropped cores would be summed into this month. See R6. |
| 11 | P1T5 ↔ P1T11 | both modify `src/lib/occupation-page/meta.ts` (sitemap date; `datasetLd` move) | Sequential, clean. Spec 6.17 gap: see R21. |
| 12 | P1T6 → P1T7–T11 | types, `format.ts`, `merge.ts` | Clean. |
| 13 | P1T8 → P1T9 | `pickSpotlight` → `buildDataSection` (`previousCode` from previous facts) | Clean apart from R5 and R6. |
| 14 | P1T10 → P1T11/T12/T13 | `listRecapMonths`, `loadRecap` | Clean. |
| 15 | P1T11 → P1T12 | `buildRecapView`, `recapTitle`, `recapJsonLd` → route metadata | `recapTitle` ends "\| MigrateLens", but the layout template adds "· MigrateLens", so the brand would show twice. See R20. |
| 16 | P1T12 → P1T13 | page + components → index, sitemap, Lighthouse | Clean. |
| 17 | P1T4 ↔ P3T3 (cross) | v2 round parse + `--rounds-html` → `--rounds-only` re-parses both pages | Once the Oct round moves to the previous-rounds page, a re-parse drops its per-row tie-breaks and nominations (and totals for older rounds). See R1. |
| 18 | P1T4 ↔ P3T3 (cross) | `readRoundsFile` → `--keep-rounds` / `data:generate` rebuild `rounds.json` | Today it keeps only name+cutoff, so v2 fields would be stripped. See R2. |
| 19 | P1T4 ↔ P3T3 (cross) | Task 4 test "rejects --rounds-html without --generate-only" ↔ Plan 3 allows it with `--rounds-only` | Contradiction. See R3. |
| 20 | P1T5 ↔ P3T3 (cross) | `GenerateInput.previous` ↔ `--rounds-only`/`--keep-rounds`/`--generate-only` regenerations | Pages for dropped occupations are lost unless every writing mode passes previous. See R7. |
| 21 | P1T7/T10 ↔ P3T3/T7 (cross) | `RoundSection.sources.checkedAt` ↔ new `manifest.roundsCheckedAt` | See R22. |
| 22 | P1T8/T9 ↔ P3T6/T7 (cross) | data facts read `rounds.json`, which the round job grows before the next data import | See R5. |
| 23 | P1T11 ↔ P2T1 (cross) | `RecapView` (no spotlight slice) ↔ cards-numbers test "every card number appears in the recap view" | The spotlight card's numbers aren't in the view. See R10. |
| 24 | P1T11 → P2T1 (cross) | `shadeBand` | Clean. |
| 25 | P1T12 ↔ P2T3 (cross) | `round-stamp.tsx`/`rect-stamp.tsx` → `renderToStaticMarkup` templates under tsx and vitest | Vitest has no `@/` alias and static markup runs no effects. See R9. |
| 26 | P1T12 ↔ P2T6 (cross) | page OG "file exists in public/" → replaced by `ogImageFor` | Clean (transitional). |
| 27 | P1T6 ↔ P3T5 (cross) | `withRoundSection`/`withDataSection` → `changedFrozenSections` | Clean. |
| 28 | P1T10 ↔ P3T6 (cross) | `updates:generate` CLI flags → `monthly.sh` | Clean. |
| 29 | P1T13 ↔ P2T6, P3T9 (cross) | all edit CLAUDE.md, HANDOFF, DATA.md, scripts/README | Sequential, clean. |

### Per-task rows

| Task | Self-consistent? | Finding |
|---|---|---|
| P1T1 | Yes | `readRoundsFile` returns `RoundPages`, matching `generateFrozenSnapshot`'s parameter; raw months are already filtered ≤ asAt. Clean. |
| P1T2 | Yes | Touches `report.tsx` (1,000+ lines; boy-scout rule). See R25. |
| P1T3 | Mostly | The file list matches the grep of live readers (examples.test goes through scenario-input; `state-outlook/__fixtures__/real-data.ts` reads state lists, not SkillSelect, so it stays). Guard scope: R8. |
| P1T4 | Partly | Tests and interfaces agree; the regeneration round trip and re-parse behaviour are unspecified (R1, R2). |
| P1T5 | Partly | Same-month regeneration edge case: R7. Title, description and Dataset for dropped occupations: R21. |
| P1T6 | Partly | `RoundSection.totals` non-null versus the nullable stored totals: R4. Format tests are consistent (about/range/under). |
| P1T7 | Yes | Figures verified against `rounds.json`. Clean. |
| P1T8 | Partly | `rounds: last six parsed rounds` isn't bounded to the month (R5); the override must be a current code (R6). |
| P1T9 | Partly | R5, R6. |
| P1T10 | Yes | Clean. |
| P1T11 | Partly | Title suffix: R20. |
| P1T12 | Partly | Stamp purity (R9); the four map fill tokens carry labels and need text pairs (R23). No Mantine is mandated; if the FAQ uses Mantine, import per component (no `@mantine/core` barrel in a Server Component) and register its CSS in `mantine-styles.ts`. |
| P1T13 | Yes | Clean. |
| Plan header | No | Ledger path `.superpowers/sdd/2026-11-24-monthly-updates/progress.md` and the per-plan branch names are superseded. See R24. |

### Proposed rulings

- **R1** Ruling: A round already in `rounds.json` is never re-derived from the previous-rounds page. Regeneration keeps each stored round verbatim (or re-parses it from its own `data/raw/rounds/<date>.html`) and only appends new dates. Add a test that parses pages where the Oct round sits only on the previous-rounds page and asserts Oct's stored tie-breaks and nominations are unchanged. — Why: spec 6.10 (the round job "owns every round"), the 6.3 freeze, and the spec's reason for storing round HTML; the fixtures show the previous-rounds page has no nominations or per-row tie-breaks. — Cost if wrong: the first November round wipes Oct's tie-breaks and nominations, breaks P1T7, P1T8 and P1T9 tests and the spotlight tie-break, and blocks the round PR.
- **R2** Ruling: `readRoundsFile` round-trips every v2 field (code, totals, round and row tie-breaks, nominations). Add a test that `npm run data:generate` without `--rounds-html` leaves `rounds.json` byte-identical. — Why: `--keep-rounds` (spec 6.9 step 4) regenerates from the stored file. — Cost if wrong: every monthly import silently strips v2 fields.
- **R3** Ruling: Plan 3 Task 3 changes P1T4's test to "`--rounds-html` requires `--generate-only` or `--rounds-only`". — Why: Plan 3 Task 3 interface. — Cost if wrong: a red test or a blocked dry run.
- **R4** Ruling: Keep `RoundSection.totals` non-null. `buildRoundSection` throws "Round totals missing" when the round being written has no totals table or no 189 row; a previous round may have null totals. — Why: the spec 6.4 H1 needs the total, and 6.15 says fail rather than publish bad data. — Cost if wrong: an "undefined EOIs invited" headline.
- **R5** Ruling: `buildDataSection` and `pickSpotlight` see only rounds dated on or before the month's last day (spotlight `latest189`, `rounds` and `tieBreak`; `notable189`; `largePoolsNotListed`). `nominations` stays "the latest stored round's table". Tests pass month-filtered rounds. — Why: spec 6.9 step 4 says this job never writes a round dated after the as-at month into a facts file or card. — Cost if wrong: November's data section quotes a December round, and the 2026-10 tests fail on the first round PR.
- **R6** Ruling: `buildDataSection` takes the index and drops entries with `lastAsAt` from every aggregate, ranking and pick; `--spotlight` must name a current code. — Why: spec 6.17 (old figures never presented as current) and 6.13 rule 6. — Cost if wrong: last month's figures get summed into this month's national and state totals.
- **R7** Ruling: The CLI passes the current `src/data` as `previous` in every mode that writes `src/data` (monthly, `--generate-only`, `--keep-rounds`, `--rounds-only`). An unmarked code missing from a regeneration of the same month is a validation error. — Why: the spec 6.17 "never removed" decision. — Cost if wrong: a rounds-only run 404s indexed pages.
- **R8** Ruling: The Task 3 guard targets live SkillSelect readers only: `lib/data/load-server`'s core, detail and index loaders and `occupation-index.json`. Readers of frozen sample data and facts files are allowed. — Why: spec 6.14 (only figure tests on live data move). — Cost if wrong: the guard fails, or bogus allowlist entries pile up.
- **R9** Ruling: `round-stamp.tsx` and `rect-stamp.tsx` use relative imports only, no CSS module, no `"use client"` and no hooks except `useId`, with sizing from `stamp-geometry.ts`. — Why: Plan 2 Task 3 renders them under vitest and tsx, which have no `@/` alias, and `renderToStaticMarkup` runs no effects. — Cost if wrong: Plan 2 Task 3 can't import them and rework lands in Plan 1 code.
- **R10** Ruling: The cards-numbers test checks every card except the spotlight against the recap view, matching whole tokens and excluding position, tag and MRZ. The spotlight card's numbers are checked against `facts.data.spotlight` formatted through the same helpers. Don't add a spotlight section to the page. — Why: spec 6.4 lists no spotlight section and the mockup page has none (the spec wins); 6.7's aim, no disagreement between page and card, still holds. — Cost if wrong: the test can't pass, or the view carries an unrendered slice.
- **R20** Ruling: Set the metadata `title: { absolute: recapTitle(facts) }`, and the same for `/updates/`. — Why: the spec 6.6 wording against the layout's `"%s · MigrateLens"` template. — Cost if wrong: the title reads "… \| MigrateLens · MigrateLens".
- **R21** Ruling: P1T5 also makes a dropped occupation's title, description and `Dataset.temporalCoverage` use its core's own snapshot, with a test. — Why: spec 6.17. — Cost if wrong: an old page claims the current month.
- **R22** Ruling: A round section's `sources.checkedAt` = `manifest.roundsCheckedAt ?? manifest.checkedAt` (Plan 3 Task 3 adds the field). — Why: Plan 3 decision 6. — Cost if wrong: a wrong "Sources checked" date on round pages.
- **R23** Ruling: P1T12 adds a `text-pairs.ts` entry for the label ink on each of the four `--updates-map-*` fills, light and dark. — Why: CLAUDE.md "Both themes" and Lighthouse 100 for contrast. — Cost if wrong: an a11y failure in one theme.
- **R24** Ruling: Write to the per-plan ledgers (`…-1-recap-pages/`, `…-2-instagram-images/`, `…-3-scheduled-jobs/`), not `2026-11-24-monthly-updates/`. All three plans run on `roadmap/monthly-updates` (controller ruling). — Why: controller rulings. — Cost if wrong: notes in the wrong place.
- **R25** Ruling: In `report.tsx`, pass `fixedComparisons` through only; the logic goes in `compare-section.tsx` and the comparison hook. — Why: the ENGINEERING.md boy-scout rule. — Cost if wrong: a review finding.
- **R13** Ruling: Keep P1T4's two commits but run `npm run check` only after the data commit, and push both together. — Why: Global Constraints say check passes after every task, not every commit. — Cost if wrong: one red intermediate commit.

- Controller (24 Nov): all proposed pre-flight rulings above are ACCEPTED as written; implementers follow the ones naming their task.

## Execution
- P1 Task 1: BASE 84e617a, implementer dispatched (sonnet)
Task 1: complete (commits 84e617a..971a169, review clean). Note for Task 4: frozen-snapshot test + fixture read src/data/rounds.json via readRoundsFile — keep working across code and data commits.
- P1 Task 2: BASE 971a169, implementer dispatched (sonnet)
Ruling: SAMPLE_CODES lives in src/lib/outlook/examples.ts, not src/lib/sample.ts — sample.ts is imported by examples.ts, so the other way is circular — cost if wrong: a later import path differs from the brief.
Task 2: complete (commits 971a169..f0de65c, review clean; minors: dead fallback in compare-section default, loadSampleMeta partial guard). scripts/sample/freeze.ts also reads rounds.json via readRoundsFile (R2).
- P1 Task 3: BASE f0de65c, implementer dispatched (sonnet)
Task 3: complete (commits f0de65c..72fd148, review clean; minor: guard misses namespace/JSON/fs reads of src/data — revisit when Tasks 4-11 add live rounds.json reads).
- P1 Task 4: BASE 72fd148, implementer dispatched (opus)
Ruling: Task 4 shipped as one commit (code+data+docs) instead of two — every commit must pass check (R13), a v2-only code commit could not — cost if wrong: none beyond history granularity.
Ruling: misprinted tie-break dates (13/10/206, 01/07/206) and month-only tie-breaks stored as null, not guessed — no invented data — cost if wrong: two occupations show no tie-break date on the Oct recap.
Ruling: accept split of rounds.ts into html-tables.ts and round-tables.ts — ENGINEERING readability limits — cost if wrong: none.
Task 4: minor (deferred): writeRoundPage overwrites a stored round page while keepStoredRounds freezes the round — saved HTML can stop matching rounds.json; decide (rev files or re-parse current round) before Plan 3 Task 3.
Task 4: minor (deferred): cli.ts parses the current page twice.
Task 4: minor (deferred): PAGE_STATE_HEADERS / NOMINATION_STATES order coupling across files — use one explicit map.
Task 4: minor (deferred): generate-rounds.test.ts cwd-relative paths.
Task 4: minor (deferred): no test pins skip ordering for mixed new+stored skips.
Task 4: minor (deferred): npm run check lint warning from untracked .superpowers brainstorm asset — ignore .superpowers in eslint.
Task 4: fix round 1/5 (1 addressed, 0 open — unpadded tie-break dates; commits 660d516..2327ba7)
Task 4: complete (commits 72fd148..2327ba7, review clean after 1 fix round)
- P1 Task 5: BASE 2327ba7, implementer dispatched (sonnet)
Task 5: minor (deferred): docs/DATA.md index-file table row not updated for the dropped mark (implementer's sed failed).
Task 5: minor (deferred): months.ts nextMonth sits between calendarMonths JSDoc and function; report-occupation.ts long comment; carriedForward error should say 'missing or invalid'.
Task 5: complete (commits 2327ba7..3f3bc36, review clean)
- P1 Task 6: BASE 3f3bc36, implementer dispatched (sonnet)
Task 6: minor (deferred): aboutText can return 'about 0' for small narrow ranges; stateFigureText floor 0 & no masked → 'at least 0'; guard DATE_RE accepts impossible dates; shallow section guard; formatToParts called 3x.
Carry-forward: no helper yet for the '+ N hidden small counts' state rule — Task 9/11 must supply it.
Task 6: complete (commits 3f3bc36..8573d4a, review clean)
- P1 Task 7: BASE 8573d4a, implementer dispatched (sonnet)
Task 7: minor (deferred): pickCards with exactly 1 fall + 1 rise returns 2 picks (card 2 consumer must accept 1–3); untested names override / totals-without-189 / name tiebreak; byName uses code-unit compare.
Task 7: complete (commits 8573d4a..c81b71f, review clean)
- P1 Task 8: BASE c81b71f, implementer dispatched (sonnet)
Carry-forward to Task 9: pickSpotlight takes cores (OccupationCore[]) and ignores cores whose asAt != month; Task 9 must pass cores for all indexed codes.
Task 8: cannot-verify resolved — docs/DATA.md:108 defines pool[visa].total as the SUBMITTED total from status-history, so popularity by pool.total = SUBMITTED totals per spec.
Task 8: minor (deferred): untested latest189 not-listed/not-on-list branches; no relative-change tie-break or INVITED-series-wins test.
Task 8: complete (commits c81b71f..2eede89, review clean)
- P1 Task 9: BASE 2eede89, implementer dispatched (opus)
Ruling: Task 9 sums every current occupation including hasData:false ones with published "<20" cells, so 4 maxima exceed the brief (189 prev submitted max 182,311; 189 invited max 16,700; 190 invited max 9,905; NSW 190 max 6,946 with 324 hidden) — an interval must contain the true value (spec 6.13 number rules); the brief's figures came from the mockup which omitted those occupations — cost if wrong: maxima slightly wider than mockup; later tasks/tests must use these figures.
Ruling: buildDataSection takes optional spotlight override (string|null) — Task 10's --spotlight needs it — cost if wrong: none.
Ruling (deferred to final fix wave): national/state PREVIOUS-month sums should include cores dropped this month (their asAt = previous month, data valid for that month); R6's exclusion targets current-month sums — spec 6.13 containment — cost if wrong: in a month where an occupation drops, the previous max could understate (rare).
Task 9: minor (deferred): silent {0,0}/floor-0 fallbacks when no core has the month — throw instead; no value pin for 2026-10 score totals; fixture cwd-relative + live federal list coupling; notable189 previousCutoff null conflates 'no previous round' with 'not listed'; largePoolsNotListed count when never listed; newest-first sort duplicated.
Carry-forward to Task 10: confirm previousManifest wiring for a spotlight-swap rerun on the same month (previousSource falls back to previous facts or null).
Task 9: complete (commits 2eede89..1e46d9a, review clean)
- P1 Task 10: BASE 1e46d9a, implementer dispatched (sonnet)
Ruling: facts file written as compact JSON (32 KB) — indented was 65 KB, above the spec's 20–60 KB bound; the PR summary, not the raw JSON diff, is the founder's review surface and the frozen-section check compares parsed sections — cost if wrong: JSON diffs are one line.
Task 10: fix round 1/5 (2 addressed, 0 open — hasData filter in generate.ts; untested rerun wiring; commits 4733be5..df2a228)
Task 10: minor (deferred): pinned-maxima live test skips after asAt moves (buildDataSection maxima are also pinned on frozen fixtures by Task 9 tests); cwd-relative paths; generate.ts index casts skip guards; loadRecap untested.
Task 10: complete (commits 1e46d9a..df2a228, review clean after 1 fix round)
- P1 Task 11: BASE df2a228, implementer dispatched (opus)
Carry-forward to Task 12: pass ctx.occupationPages = codes of index entries with hasData (pages exist only for those); else 253315/253513/399112 links 404.
Founder review list: wording 'Highest published minimum', 'none published', 'none recorded'; not-listed FAQ uses Chef (largest pool) instead of mockup's Software Engineer.
Task 11: minor (deferred): meta descriptions cut mid-date — prefer last whole sentence; occupationLinker defaults to linking all codes (make occupationPages required); duplicated cutoffRange/PASS_MARK/earlier-round sentence/Round type; about.slice string surgery in faq.ts; round-view.ts hosts recap-wide helpers (extract recap-common.ts); dateline 'sources checked' omits federalListCheckedAt when not-listed shown; stateLeader ties; previousFloor===0 read as all-masked; datasetLd lacks source org; no direct tests for hero/data/compare/method views; lint warning from .superpowers asset.
Carry-forward to Task 12: routes set title: { absolute: recapTitle(facts) } (R20); pass ctx.occupationPages; FAQ section id="faq"; render spec 6.4 item 8 CTA card statically.
Task 11: complete (commits df2a228..1e87237, review clean)
- P1 Task 12: BASE 1e87237, implementer dispatched (opus)
Task 12: minor (deferred): missing space before <small> label (not-listed-card, .figure small); map codes <12px at 320px viewport; summary ::after +/− read aloud (use content: '+' / ''); copy outside view-model (FAQ heading, 'The 189 pool', 'Read that round's update', DirectAnswer regex split); actions[0] coupling; no test for sectionKinds on data-only/round-only; empty grid half for earlier rounds without aside.
Task 12: complete (commits 1e87237..f58d58f, review clean)
- P1 Task 13: BASE f58d58f, implementer dispatched (opus)
Founder review list: /updates/ index copy incl. title 'SkillSelect monthly updates: 189 rounds, 190 and 491 by state | MigrateLens'.
Task 13: minor (deferred): updates index imports recap-hero/recap-parts CSS modules (class-name coupling); sitemap newest computation clarity; HANDOFF 'points-check card' wording.
Task 13: complete (commits f58d58f..b1cc161, review clean). Full lighthouse matrix run by controller after the build (see below).
Ruling: one whole-branch final review after Plan 3 covers Plans 1–3 together (single branch, one PR) — avoids three overlapping final reviews — cost if wrong: Plan 1 issues found later rather than now.
Full lighthouse after Task 13: all A11y/BP/SEO 100; Perf rows <100 were at CPU ~870 (mediaanalysisd + mds_stores busy) except /check/ desktop 99 at CPU 4291 — re-run flagged rows at final verification.
Founder review list: round card previous-cutoff rows read '65  4 Jun 2026: 85' (terse; could be 'was 85 on 4 Jun 2026').
Founder (in chat): stop pushing after every task; push once at the end. Also: do NOT shut down the Mac or close the terminal.
Founder (25 Nov, chat): at the end push roadmap/monthly-updates but do NOT create or open the PR page; founder creates it manually.
