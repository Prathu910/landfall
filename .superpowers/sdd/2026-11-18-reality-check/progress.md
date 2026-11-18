# SDD ledger — plan: docs/superpowers/plans/2026-11-18-reality-check.md

Spec: docs/superpowers/specs/2026-11-17-reality-check-and-state-outlook-design.md (binding). Branch: roadmap/reality-check (from main dddd7f9). Founder chose subagent-driven (18 Nov 2026).
Ruling: execute in the main checkout on roadmap/reality-check (same as step 1) — branch isolates main — cost if wrong: none.

## Pre-flight scan
| Tasks | Shared file/interface | Finding |
|---|---|---|
| 1→2,3,4,5 | copy.ts formatCount/countPhrase/formatMonth/submissionMonth/BANNED_COPY | consistent |
| 1→2 | summarise189Rounds / CHIP_LABEL | consistent |
| 2 vs step-1 accessors | poolPosition(core, detail, visa, score, submittedMonth); invitationActivity(core, visa, months?) | consistent with HEAD signatures |
| 3→5,8,9 | WhereYouStand / buildWhereYouStand | consistent |
| 3→6 | buildRounds(core, skippedRounds) param supplied later by rounds-meta (T6) | consistent (param) |
| 4 vs lib layering | "too old" uses cohortWindowStart, which lives in scripts/import/generate-assemble.ts | CONFLICT (lib must not import scripts) → Ruling S2 |
| 4 self | buildWhatCouldChange scenarios {label, delta}: scenarios.ts exposes Scenario {id,title,description} only; deltas need applyScenarios+calculatePoints per scenario | AMBIGUITY → Ruling S3 |
| 6→7..10 | ReportOccupation.ready gains core + detail:DetailLoad; rounds-meta.json; useOccupationDetail | consistent |
| 8 | reuses TrendChart (trend-chart.tsx) with legacy evidence trend + R17 caveat | consistent |
| 10 | deletes pool-section/rounds-section; keeps compare-section, trend-chart | consistent |
| T2 self | SE fixture: higher 608+229+35+<20 = 872–891 ✓; same 1,132 ✓ | consistent |
| T3 self | lower = 9464−(872..891)−1132 = 7441..7460 ✓ | consistent |
| T4 self | Feb 2025 nurse total 142+175+60+510+<20 = 887–906 ✓; latest complete for 2026-10 = Sep 2026 ✓ | consistent |

Ruling S2: move `cohortWindowStart(asAt)` into src/lib/data/months.ts (pure) and have scripts/import import it (removes the duplicate month arithmetic flagged in step 1's final review); Task 4 uses it for "too old" — cost if wrong: trivial refactor.
Ruling S3: buildWhatCouldChange accepts precomputed `{ label: string; delta: number }[]`; the report (T10) computes each scenario's delta as calculatePoints(applyScenarios(profile,[id],asOf),asOf).base − result.base, label = scenario.title — cost if wrong: small signature change.
Ruling S1 (from plan, founder-visible): until step 3, 190/491 card sentences summarise national invitations (invitationActivity), not the state outlook.

Carried from step 1 ledger (deferred minors touching this plan's area): peak may be masked-only (handled by R14 fix: peak null unless confirmed); 190/491 pools hidden when no 189 pool (T12 product gap) — the new panels must show 190/491 pools even when 189 pool is absent; sample HTML +44 KB from comparisonIndex prop; report.tsx 704 lines (T10 should extract, not grow).

## Progress
Task 1: dispatched (base b06558f, sonnet)
Task 1: complete (commits b06558f..e478b8a, review clean; build verified by controller)
Task 1: minor (deferred): BANNED_COPY tests lack case/false-positive cases; formatMonth on malformed input; masked-interval constant duplicated.
Task 2: dispatched (base e478b8a, sonnet)
Ruling S4 (T2): "No occupation data" headline only when kind none or no 189/190/491 pool at all; missing-189-only keeps round headline + 189 "No 189 EOIs are published…" and still shows 190/491 numbers (addresses step-1 T12 product gap); kind none → chips "No data"/"State decides" neutral, sentence "No published data to compare for this occupation."; sourceLine without date when no core — cost if wrong: copy tweak.
Ruling S5 (T2): pass months=12 explicitly to invitationActivity for the 190/491 card sentence (default window is 24; copy says 12) — overrides my 'default window' note — cost if wrong: none.
Task 2: ⚠️ headline wording verified by controller against spec section 1 — matches.
Task 2: complete (commits e478b8a..ab29a05, review clean)
Task 2: minor (deferred, honesty — CARRY): (a) 190/491 fallback "No {visa} invitations recorded…" also fires when no month was fetched → should say not published (fix in final wave or T10); (b) kind loading gives cards "No data"/"No published data…" → T7 must hide cards (or show loading) while loading; occasional headline test uses toContain; no-189-pool chip untested.
Task 3: dispatched (base ab29a05, sonnet)
Task 3: review Approved; controller promotes 2 user-facing copy minors to fix (honesty):
Ruling S6: SameScore gains kind "unavailable" {text: "Published counts by submission month aren't available at your score."} for a valid EOI month with no split (overrides my "else prompt" decision); masked counts in where-you-stand clauses read naturally: "{Count} EOIs have a higher score[, so this may be zero]." — clause capitalised when it starts the sentence, and each clause whose count is masked ends with ", so this may be zero"; add masked regression tests (ahead/same/total "<20"; subtraction that would go negative).
Task 3: fix round 1/5 dispatched — open: S6 (a) prompt shown to users with EOI date; (b) masked-count grammar + regression tests.
Task 3: minor (deferred): test couples two fixtures without comment; formatDate en-GB may print "Sept".
Task 3: fix round 1/5 (2 addressed, 0 open; commits 1e40b8d..fa1b62c)
Task 3: complete (commits ab29a05..fa1b62c, review clean after 1 fix round)
Task 3: minor (deferred): clamp test weak; countPhrase maybe unused; UI must handle SameScore "unavailable" kind (CARRY to T8).
Ruling S7 (T4): masked counts mid-sentence in EOIs-like-yours read "under 20 (so may be zero)"; numbers block uses formatCount.
Task 4: dispatched (base fa1b62c, sonnet) with S2, S3, S7
Task 4: complete (commits fa1b62c..d6b2f14, review clean; TimelineEvent shape verified by controller)
Task 4: minor (deferred): inSentence duplicates countPhrase (add parenthesised variant to copy.ts); non-null assertion comment; explicit "0" hold test; type-guard filter.
Task 5: dispatched (base d6b2f14, sonnet)
Task 5: complete (commits d6b2f14..6b48edb, review clean; check+build verified by controller; TDD evidence not verbatim in report — noted)
Task 5: minor (deferred): invitedText guard for non-masked {0,N}; full-order test with mixed coverage.
Task 6: dispatched (base 6b48edb, sonnet)
Task 6: complete (commits 6b48edb..53b9fd4, review clean; ⚠️ items verified by controller: only rounds-meta.json regenerated, check OK, hasData-false never fetched)
Task 6: minor (deferred): rounds-meta validator test; useValidatedRecord race test; rounds-meta rollback test; two import type lines; CARRY to T10: /sample/ must fail the build if the sample occupation's detail is missing (requireDetail), not silently degrade.
Task 7: dispatched (base 53b9fd4, sonnet) carrying T2 minor (b): hide cards / show loading while data loads
Task 7: minor (deferred): duplicate print break-inside; link text from title.split (use visa); .row b selector. CARRY to T8/T9/T10: panel sections need id visa-189/190/491 + focusable target (tabIndex -1 or heading); Reveal opacity must be visible in print (verify T10).
Task 7: fix round 1/5 dispatched — open: (I1) same-page hash links via next/link → plain <a>.
Task 7: lint warning: unused countPhrase import in src/lib/report/scorecard.ts — CARRY to T8 (remove).
Task 7: fix round 1/5 (1 addressed, 0 open; commits 9cbb59c..f5212e6)
Task 7: complete (commits 53b9fd4..f5212e6, review clean after 1 fix round)
Task 8: dispatched (base f5212e6, sonnet) carrying: id visa-189 focusable; SameScore "unavailable" kind; remove unused countPhrase import in scorecard.ts; details visible in print
Task 8: CARRY to T10: verify built CSS emits details-print rule once panel is wired; See-all-rounds shown only when rounds > tiles (accepted).
Ruling S8 (T8): the details-print rule goes in src/app/globals.css's existing @media print block as a global rule (`details:not([open]) > :not(summary) { display: block !important; }`, plus content-visibility: visible for Chrome), removed from the CSS module (non-pure selector would break the build — my instruction caused it) — cost if wrong: one CSS rule.
Task 8: minor (deferred): 13–14px secondary text vs 16px body rule; duplicated legend/swatch styles + raw hex (#3f9a74, #e0a33a, #b9c7c0) → tokens; tile key by date.
Task 8: fix round 1/5 dispatched — open: (I1) non-pure print selector in panel-189.module.css; (I2) nearby-months table lacks accessible name.
Task 8: fix round 1/5 (2 addressed, 0 open; commits 7ac45f6..6e464db; temp import revert verified by controller via clean git status)
Task 8: complete (commits f5212e6..6e464db, review clean after 1 fix round)
Task 9: dispatched (base 6e464db, sonnet)
Ruling S9 (T9): no component tests for presentational components (no component test setup; logic tested in view-models; visual check in T10) — TDD concern accepted — cost if wrong: rendering bugs found later in browser checks.
Task 9: complete (commits 6e464db..13a7399, review clean)
Task 9: minor (deferred): cross-module import of panel-189 classes (consider shared report-panel.module.css); isQuiet by string prefix → add quiet flag to InvitationRow; trailing space in class attr.
Task 10: dispatched (base 13a7399, opus) carrying: T2(a) not-published fallback in scorecard; T6 requireDetail on /sample/; T7 Reveal print visibility; T8 built-CSS details print rule; S3 scenario deltas; 190/491 panels render without a 189 pool; report.tsx must not grow.
Ruling S10 (T10, pre-review): loadFailed must get its own headline ("Published data for {occupation} could not be loaded. Your points breakdown is below.") — a network failure is not a data claim; update stale CLAUDE.md lines about pool/rounds sections; formatDate prints "Sep" (not "Sept") to match formatMonth and the plan's date format — cost if wrong: copy tweak.
Task 10: minor (accepted): old trend chart labels small at 390px; report.tsx 537 lines (> guideline, shrank from 716); "Compare this scenario in the pool" button removed (recorded in REPORT-COVERAGE).
Task 10 S10 fix: done (92de400). Controller edited CLAUDE.md report architecture (3c35b37) — implementer's harness declined CLAUDE.md edits.
Task 10: minor (deferred): failed-load 189 chip label "No data" → "Not loaded"; trend axis labels use locale month names (possible "Sept").
Task 10: minor (deferred → FINAL REVIEW must triage): pool caveat ("not your exact queue position… EOIs are not unique people" + /methodology/#pool link) dropped — honesty, likely must-fix; sectionLabel silent "00" fallback; calculatePoints ×4 per render; noPoolsCore edge (headline vs panels); failed-load chip "No data"; two report-view.ts files; trend axis "Sept"; report.tsx 537 lines.
Task 10: fix round 1/5 dispatched — open: (I1) HANDOFF.md lists two fixed items as open follow-ups.
Task 10: fix round 1/5 (1 addressed, 0 open; commits 3c35b37..fbd7db6)
Task 10: complete (commits 13a7399..fbd7db6, review clean after pre-review S10 + 1 fix round)
Final review: dispatched (base b06558f, opus)
Final review: WITH FIXES — 6 Important honesty gaps (I1 queue caveat dropped; I2 current-status caveat + "Invited 0"; I3 same-score masked counts; I4 EOI month after snapshot / missing in-window row; I5 points-only headline; I6 190/491 invitation rows lack national qualifier) + must-fix minors (failed-load chip "Not loaded"; inSentence/countPhrase dedupe).
Ruling S11 (I1): caveat line under the scorecard cards and under every queue bar: "Counts of EOIs with a higher score, not your place in a queue: ties use an unpublished date of effect, and one person can hold several EOIs." + link "How to read the pool" → /methodology/#pool; 190/491 card labels "Higher score (national pool)"; 491 nationalNote regains "state/territory nominated, excluding family sponsorship".
Ruling S12 (I2): EOIs-like-yours note "Each EOI is counted once, in its status as at {Mon YYYY}; EOIs that lodged or closed may have been invited earlier."; tile/column "Invited, not yet lodged".
Ruling S13 (I3): same-score sentence uses the shared sentence form for masked counts; inSentence folded into copy.ts (one helper), countPhrase dead export removed or used.
Ruling S14 (I4): EOI month after core.asAt → "Your EOI month ({Mon YYYY}) is after this snapshot (as at {Mon YYYY}), so it isn't in the published data yet." for both same-score and EOIs-like-yours; in-window month with no cohort row → "No {occupation} 189 EOIs from {Mon YYYY} appear in this snapshot."
Ruling S15 (I5, founder-visible copy, overrides plan T10 expectation): notIndexed/"other" headline "You chose a points check only, so there is no occupation data to compare. Your points breakdown is below."; cards say "Points check only."
Ruling S16 (I6): heading "Invitations recorded, all states"; masked row "under 20 invited, so may be zero (as at …)"; 190/491 card sentence adds "; later months under 20, so may be zero" when months after the last confirmed month are masked.
Minor fixed in wave: failed-load chip "Not loaded".
Final fix wave: dispatched (opus).
Final fix wave: done (fbd7db6..fdecda6), check 323 tests, build, headless 73/73.
Final fix wave re-review: all findings addressed, no new Critical/Important (fbd7db6..fdecda6).
Final: minor (deferred → step 3 or polish): EOIs lead "0 are invited" → "are invited and not yet lodged"; "About under 20 (so may be zero)" awkward; bracketed masked form vs spec §7 comma form; 189 card label "Ahead of you" beside queue caveat (founder may prefer one label); saved profile with dropped occupation code reads as points-only; HOLD not in bar legend.
Workspace kept and committed (founder wants .superpowers in git).
PLAN COMPLETE.
