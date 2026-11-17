# SDD ledger — plan: docs/superpowers/plans/2026-11-17-data-foundation.md

Spec: docs/superpowers/specs/2026-11-17-data-foundation-design.md (binding). Branch: roadmap/foundation (feature branch in main checkout; main untouched).
Ruling: execute in current checkout on roadmap/foundation instead of a separate worktree — branch already isolates main; node_modules/venv already set up here — cost if wrong: none beyond shared working dir (no parallel implementers).
Reviewer constraints file: .superpowers/sdd/2026-11-17-data-foundation/global-constraints.md

## Pre-flight scan
| Tasks | Shared file/interface | Finding |
|---|---|---|
| 1→3,4,8,10,11 | types.ts / published-count.ts | consistent |
| 1↔12 | src/lib/pool.ts | T1 aliases countInterval; T12 drops snapshot import — compatible |
| 2→8,11 | guards | consistent |
| 3→4 | __fixtures__/occupation.ts | T4 extends fixture — fine |
| 5→6 | QlikSession.setToggle(`vShow${string}`) vs FIELD_NAMES toggles | consistent |
| 6 views vs spec | invited-profile / invited-profile-state need one run per attribute as a SHOWN column; ViewDefinition.shown is fixed | CONFLICT → Ruling R1 |
| 6→8 | RawViewFile / readRawView | consistent |
| 7→8 | ParsedRound, normalizeOccupationName | consistent |
| 8 vs spec | spec storage layout lists src/data/rounds.json; plan omits it | GAP → Ruling R2 |
| 8 self | test "throwing serialiser" but writeGenerated has no injection point | CONFLICT → Ruling R3 |
| 8→10 | pool[visa].total source unspecified; legacy total = points-hidden SUBMITTED total | AMBIGUITY → Ruling R4 |
| 9→8,6,5 | CLI composes all | consistent |
| 10→12 | legacy JSON stays in src/data until T12 moves it | consistent |
| 11→12 | useOccupationCore / load-server / occupationDataUrl | consistent |
| T1 self | tests vs code | consistent (counts have no thousands separators — recon) |
| T3 self | fixture arithmetic before {30,49}, total {150,169} | consistent |
| T5 self | 3 cols → height 3333 → 3 reads for 7000 rows | consistent |
| T7 self | fixture capture needs network in step 1 only | ok |
| T9 self | cli test after implementation | ok |
| T12 self | large multi-file; browser smoke | ok |

Ruling R1: ViewDefinition gains optional `attributeVariants?: ProfileAttribute[]`; runView runs once per variant adding that attribute to `shown`; assertWithinGuardrail counts shown.length + (attributeVariants ? 1 : 0) ≤ 2. invited-profile = shown [occupation] + variants; invited-profile-state = shown [occupation] + variants, partitionBy [state]. — spec says "one query per attribute" with occ+attribute shown — cost if wrong: small refactor of views.ts.
Ruling R2: T8 also writes src/data/rounds.json = { date, rows: { name, code: string|null, cutoff }[] }[] newest first — spec storage layout lists it; cheap — cost if wrong: one unused file.
Ruling R3: writeGenerated(outRoot, data, options?: { serialize?: (value: unknown) => string }) — test injects a throwing serialiser — cost if wrong: none.
Ruling R4: core.pool[visa].total = status-history SUBMITTED total (points hidden) at asAt; byScore from pool-by-score — matches legacy report-evidence semantics (total read with points hidden) — cost if wrong: reproducibility test catches it.

## Progress
Task 1: dispatched (base f2b73b7, implementer sonnet)
Ruling: accept .superpowers/ in .prettierignore (T1 implementer) — scratch workspace must not fail format:check — cost if wrong: none
Task 1: complete (commits f2b73b7..4039697, review clean; ⚠️ check+build verified by controller)
Task 2: dispatched (base 4039697, sonnet)
Task 2: complete (commits 4039697..7bf6ce5, review clean; check verified by controller)
Parked minor (T2): score keys / profile value keys not validated as numeric; manifest allows empty code — consider in final review.
Task 3: dispatched (base 7bf6ce5, sonnet)
Ruling R5: poolPosition.total = parseCountText(core.pool[visa].total) (the directly published points-hidden total, per R4), NOT the sum of byScore intervals; plan's {150,169} test value was a plan defect — test becomes {150,150} with fixture pool.total "150" — cost if wrong: one-line change.
Note (T3): implementer skipped RED (tests+impl written together) — tests exist and assert real values; noted, not reworked.
Task 3: complete (commits 7bf6ce5..e9b4fce, review clean; check verified by controller)
Parked minor (T3): cohorts.ts cast; no test for cohortOutcomes("older"); comment that same/higher need not reconcile with published total.
Task 4: dispatched (base e9b4fce, sonnet)
Note (T4): RED skipped again; contract tightened (TDD mandatory with captured RED) and attribution now follows each implementer's own harness line.
Task 4: complete (commits e9b4fce..07bbc95, review clean; check verified by controller)
Parked minor (T4) — must address before UI uses it (step 2) or in final review: latestMonthKeys(count<=0) returns all months; peak can be a month with min 0 (masked-only) — consumers must not read as evidence; tie-break comment wording; helpers could move to shared file.
Task 5: dispatched (base 07bbc95, sonnet)
Note (T9 dispatch): package.json has no type:module — CLI must avoid top-level await in .ts (wrap in main()) or use .mts.
Task 5: live smoke by controller OK (nurses 189 INVITED 10/2026 = 2730, header correct, 1 page read).
Task 5: minor (deferred): malformed-frame JSON.parse guard; select() with neither text nor number; qcx===0 guard; row width check; tests for select/clear/bookmark/error reply/throttle spacing; no-send assertion for rejected toggle.
Task 5: fix round 1/5 dispatched — open: (I1) no per-call timeout / no rejection of pending on socket close/error → hang; (I2) transport not closed when OpenDoc/ApplyBookmark fails.
Task 5: fix round 1/5 (2 addressed, 0 open; commits 384259e..dce33d5)
Task 5: minor (deferred): onClose may fire twice (harmless); a call after a drop with nothing pending waits out the timeout instead of failing fast.
Task 5: complete (commits 07bbc95..dce33d5, review clean after 1 fix round)
Task 6: dispatched (base dce33d5, sonnet) with Ruling R1 + view table
Task 6: complete (commits dce33d5..8d3a5fa, review clean)
Task 6: minor (deferred): assert ≤2 toggles on per run in tests; duplicate shown/partition keys unchecked; writeRawView not atomic (CARRY into Task 8 dispatch: temp+rename, supports Review Focus 4); sameContent key-order fragility; temp dirs not cleaned in tests.
Task 7: dispatched (base 8d3a5fa, sonnet)
Ruling R6 (T7): accept trimmed fixtures + fixtures in .prettierignore; accept header-detected cut-off column; "N/A*"/"Not invited" → no row (null downstream) for now — minor (deferred): preserve "not invited" as distinct status later for occupation pages. NOT accepted: silent skipping of previous-page rounds — spec says keep every round; sent back: support blank-first-header occupation tables and surface any skipped rounds with reasons.
Ruling R7 (T7): two-row-header (2022-08..2023-05) rounds: cutoff = lowest of the offshore/onshore 189 minimums — factual as "lowest score invited in that round"; minor (deferred): preserve per-segment cutoffs for occupation pages. Blank 189 cell → not listed.
Task 7: complete (commits 8d3a5fa..07d8c00, review clean after controller-requested rework; reviewer verified 2022–23 cut-offs against fixture)
Task 7: minor (deferred): 6 Oct 2022 round skipped (blank occupation header) — reported, recoverable later; cutoffColumns even-split should throw if (cols-1)%groups≠0 or use colspan; non-integer test should match message; preserve "not invited"/per-segment cut-offs later.
Task 8: dispatched (base 07d8c00, opus) carrying R2, R3, R4, atomic writeRawView (T6 minor)
Ruling R8 (T8): cohorts/cohortsByScore keep submitted months within 36 months of asAt as published; older months dropped (not summed into "older", since CountText cannot express a summed masked interval) — honest, no invented numbers — cost if wrong: older-cohort outcomes unavailable (they show only LODGED/CLOSED anyway).
Task 8 notes: GeneratedData gained rounds+newestRawMonth (accepted); CARRY to T9: gitignore src/data/.generate-*; rollback-after-rename untested (minor).
Task 8: minor (deferred): rollback failure deletes staging backups (skip cleanup + say so); size check uses compact stringify not injected serialiser; dd not validated in dd/mm/yyyy; view.visas not enforced in parsing; rounds.json/index shape not guard-validated; weak /189/ regex; tmp dirs not cleaned; gitignore src/data/.generate-* (T9).
Task 8: ⚠️ carry to T9: run-view must always write a raw file (header, zero rows) for every view at asAt, else generate throws "raw view is missing".
Ruling R9 (T8 fix): occupation set = codes present at asAt (any asAt latest-only view or asAt status-history); history-only codes excluded from index/cores — fixes dead >10% drop guard and avoids matchRounds clash on renumbered codes — cost if wrong: occupations that left the dashboard get no page (they'd have no current data anyway).
Task 8: fix round 1/5 dispatched — open: (I1) >10% drop guard dead because occupation set is cumulative across raw history.
Task 8: fix round 1/5 (1 addressed, 0 open; commits 91e9518..2d81432)
Task 8: complete (commits 07d8c00..2d81432, review clean after 1 fix round)
Task 9: dispatched (base 2d81432, opus) carrying: no top-level await (CJS), gitignore src/data/.generate-*, runView must persist zero-row raw files, print skipped rounds (R6), budgets + pre-approved reductions.
Ruling R10 (T9): resumable backfill accepted — each completed view-month raw file is written atomically as it finishes (raw = permanent history, never partial files); src/data still written only after full validation. Fits Review Focus 4.
Ruling R11 (T9): monthly page-read budget raised 150 → 250 (measured: as-at views 203 + prev-month re-fetch ~15); once-a-month load is negligible; backfill stays 600. Record in docs/DATA.md (T12).
Ruling R12 (T9): skipping the single "None Provided" occupation row (status-history 2026-04) is accepted but must be documented in docs/DATA.md (T12) — not silent.
Note: Qlik client handle caching / toggle de-dup accepted (page reads unchanged) — reviewer to verify guardrail still holds.
Task 9: minor (deferred): cli localToday duplicates migration.localToday; print skipped "None Provided" count; identical-table guard runs only after full read (pre-check qcy); generic "no partition values" error; skipped rounds not printed in --generate-only (resolved by steps-2/3 spec item 7: rounds.json gains skipped).
Task 9: fix round 1/5 dispatched — open: (I1) PAGE_READ_BUDGET.monthly still 150 (R11 says 250).
Task 9: fix round 1/5 (1 addressed, 0 open; commits 3c4bfab..ddb6750)
Task 9: complete (commits 2d81432..ddb6750, review clean after 1 fix round). Import: 493 occupations (479 with data), 0 issues, spot-checks match, ~440 page reads.
Controller: committed steps-2/3 spec + state research (ffce4ed) — outside plan scope, docs only.
Task 10: dispatched (base ffce4ed, sonnet)
Task 10: complete (commits ffce4ed..069b235, review clean; zero differences vs legacy for all 11 codes)
Task 10: minor (deferred): explainedDifferences declared but not applied; no reverse check evidence→pool.
Controller: committed decision rows (2b7517b) — docs only.
Task 11: dispatched (base 2b7517b, sonnet)
Task 11: complete (commits 2b7517b..9375b83, review clean)
Task 11: minor (deferred → CARRY to T12): useOccupationCore effect depends on `index` — callers must pass a stable module-level array; no loader tests.
Task 12: dispatched (base 9375b83, opus)
Task 12 notes: new empty-state wording for 279 occupations with data but no 189 pool (reviewer to check honesty); sample page HTML 97.6→142 KB (index prop) minor; methodology prose dates hard-coded minor.
DATA FINDING (T12): dashboard coverage appears to start ~Oct–Nov 2024; earlier EOIs appear only once closed → SUBMITTED growth over the stored window is partly coverage artefact. IMPACT on steps-2/3 spec: the "net change … up N in M months" line in 189 'Where you stand' must be reconsidered/caveated before step 2 builds.
Ruling R13 (T12): overrides controller note "hasData false keeps 'not in snapshot'": that text is untruthful for indexed occupations. Messages: not indexed/"other" → old text; indexed + hasData false → "No submitted EOIs are published for this occupation in this snapshot…"; indexed + load failed → "could not be loaded" (not a data claim).
Task 12: minor (deferred → final review triage): CLAUDE.md duplicate `npm run check`; DATA.md:111 overstates provenance placement; DATA.md:150 inference stated as fact ("If so,"); 12-month trend/net change still shown without coverage caveat (→ step 2); no-189-pool occupations hide existing 190/491 pools (product gap → step 2); sample HTML +44 KB from index prop; check-flow recomputes report data each render + double fetch of 261313; methodology hard-coded "31 October 2026"; report.tsx 704 lines.
Task 12: fix round 1/5 dispatched — open: (I1) "not in the imported snapshot" shown for indexed hasData-false occupations and failed loads.
Task 12: fix round 1/5 (1 addressed, 0 open; commits 364f767..13b251f)
Task 12: complete (commits 9375b83..13b251f, review clean after 1 fix round)
Final review: dispatched (base 7627d15 merge-base main, opus)
Final review: WITH FIXES — I1 window/zero semantics; I2 rounds misparse (2020-08..2021-10 layout, 491 rows as 189) + name variants; I3 no rows.length===qcy assert; I4 legacy test breaks after next import. Must-fix minors: CLAUDE.md dup check line; DATA.md:111 wording; trend coverage caveat; /189/ regex + even-split cutoffColumns (with I2); explainedDifferences (with I4).
Ruling R14 (final I1): per-occupation multi-month maps carry an explicit key for EVERY covered month (fetched view-month), `{}` when no rows — records stay self-contained; accessors build calendar windows back from core.asAt: covered+absent → 0, uncovered → undefined/not published; similarProfileInvited.latest = as-at month only; legacy trend = last 12 calendar months, zero-filled where covered; latestMonthKeys(count<=0) → []. Cost if wrong: schema churn before step 2 (cheap now).
Ruling R15 (final I2): rounds in the Subclass | Occupation ID | Description layout (2020-08..2021-10) are SKIPPED with a reason (unit-group cut-offs can't honestly be attributed to a 6-digit occupation); header check must require the 189 column explicitly (no loose /189/), and cutoffColumns must use colspan or throw on uneven split; a reviewed alias map handles source name variants (verify each against the fixture and the index). Cost if wrong: older history unavailable (shown as skipped, not "not listed").
Ruling R16 (final I4): legacy reproducibility test regenerates 2026-10 in memory from data/raw (+ rounds ≤ 2026-10-31) instead of reading live src/data. 
Ruling R17 (trend): remove the "Net change … N EOIs" sentence from the 12-month trend; add a one-sentence coverage caveat. Visible copy change accepted for honesty.
Final fix wave: dispatched (opus) with I1–I4 + must-fix minors + trend-chart comma-const style + readStoredRounds guard.
Final fix wave: done (13b251f..c21d23f), check 237 tests + build + headless OK.
Ruling R18: accept that 610a791 alone fails check (schema-2 guards vs schema-1 data until b0e0e7c) — history kept as is, no rewrite; branch head is green — cost if wrong: a bisect step lands on a red commit.
Ruling R19: rounds.json rebuilt once from the recorded 2026-11-17 fixture pages (no network) because stored rounds were misparsed — same capture date, kept rounds identical.
