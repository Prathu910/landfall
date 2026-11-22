# SDD ledger — plan: docs/superpowers/plans/2026-11-21-report-redesign.md

Spec: docs/superpowers/specs/2026-11-21-report-redesign-design.md (binding). Branch: roadmap/report-redesign (main checkout, not main; founder approved subagent-driven on 21 Nov 2026).
Ruling: work in the existing checkout on the feature branch instead of a new worktree — the branch is already isolated from main and the founder named it — cost if wrong: none beyond a dirty tree, which stays on the branch.

## Pre-flight scan

| Tasks | Shared file / interface | Finding |
|---|---|---|
| T2 → T3–T10, T16 | `__fixtures__/scenarios.ts` (SCENARIOS, ENDOCRINOLOGIST) | T16 moves four profiles to `examples.ts` and the fixture re-exports them. Consistent. |
| T1 → all | `OutlookLabel`, `bestLabel`, names | Consistent. |
| T2 → T4, T5, T8 | `Label189`, `higherScoreCount` | Consistent. |
| T3 → T4, T5 | `VisaLabel`, `StateLabel` | Consistent. |
| T4 → T5–T10 | `OutlookInput`, `ProfileOutlook`, `Stamp` | `OutlookInput.rules` is `StateRuleData` from `src/lib/report/state-outlook-view.ts` (relative import). Consistent. |
| T6 → T7, T8, T9 | `Improve` | Consistent. |
| T9 → T10, T16, T17, T18 | `read-contract.ts` (dependency-free), `checkRead`, `ReportFacts` | Deno imports it with a `.ts` path; it must have zero imports. Consistent. |
| T10 → T14, T15, T16 | `OutlookView`, `OccupationState` | Consistent. |
| T12/T13 → T14/T15 | stamp + chart components (`narrow`, `width`) | Consistent. |
| T14 → T18 | `our-read.tsx` created then modified | Consistent. |
| T15, T19 | both edit `CLAUDE.md`, `docs/ENGINEERING.md` | Sequential edits; T19 must not undo T15's printing sentence. |
| T17 → T18 | `read_token` in calculation response | See ruling R4. |
| T1 | self-consistent | ok |
| T2 | tests vs code | ok (nurse 75 strong: 75 ≥ max(70,75,75)). |
| T3 | tests vs ladder | ok (Meera TAS wins NT on months 3 vs 2). |
| T4 | ok | ok |
| T5 | Kavya numbers hand-derived | R2. |
| T6 | "best" rule vs expected tests | R1 (conflict found). |
| T7, T8 | ok | ok |
| T9 | facts vs banned list | ok |
| T10 | "no banned copy" vs mockup Rahul fact ("a few") | R3. |
| T11–T13 | ok | ok |
| T14 | ok | ok |
| T15 | PDF verification needs scenario selection the CLI can't click | R5. |
| T16 | ok | ok |
| T17 | handler change needs a secret that may be unset | R4. |
| T18, T19 | ok | ok |

## Rulings

- R1: "Biggest jump" = the single move with the highest after-label (then most points, then shortest time); the `combined` move is best only when it reaches a strictly higher label than every single move — reproduces the plan's expected results (Priya english-superior, Meera combined, Kavya/Arjun english-superior) — cost if wrong: one ranking line.
- R2: hand-derived numbers in test expectations (e.g. Kavya pace) yield to the data: if the snapshot gives a different interval, the test asserts the data-derived value and the report notes the difference — cost if wrong: a wrong expected number surfaces in review.
- R3: headline/fact/caption copy must pass REPORT_BANNED_COPY; mockup phrases containing banned words ("a few") are reworded (e.g. "small numbers") — cost if wrong: copy tweak.
- R4: `submit-calculation` returns `read_token` only when `READ_TOKEN_SECRET` is set; submissions never fail because the AI token can't be made — cost if wrong: none; AI stays template.
- R5: PDF and multi-tab browser checks may use a scratch `playwright-core` install outside the repo (no new repo dependency), driving system Chrome — cost if wrong: verification tooling only.
- R6: rules-engine state names that differ from the mockup (e.g. Aarav's best 190 state) are accepted per spec §9 and listed in Task 19 docs — cost if wrong: copy differences the founder will see.

## Tasks
Task 1: complete (commits 6799cdd..057cf6e, review clean)
Task 1: minor (deferred): labels.test.ts asserts only first/last of LABEL_RANK; add a full-order assertion.
Task 1: minor (deferred): repeated indexOf in labels.ts comparisons could share a rankOf helper.
Controller: formatted spec+plan in a style commit (Prettier warnings found by Task 1 implementer).
Task 2: review 1 at 8d61c7c — 2 Important (no-pool very-strong; competitiveWhy wording), fix round 1 dispatched to original implementer.
Task 2: minor (deferred): `r.cutoff as number` could be a type-guard filter (label-189.ts:105).
Task 2: minor (deferred): untested paths — strong with ahead > 19, `tied`, tooFew with a listing, eligible-null suffix on non-top labels.
Task 2: minor (deferred): comment why an absent score key means zero (label-189.ts:25-30).
Task 2: fix round 1/5 (3 addressed, 0 open; commits 8d61c7c..a338dce)
Task 2: complete (commits eda6bbd..a338dce, review clean)
- R7: a visa whose best label is not-invited or no-data names no state in captions, stamp or route (VisaLabel.best may still hold one for ordering) — avoids "best route: ACT" for an occupation no state invites — cost if wrong: a missing state name in a weak case. Apply from Task 4 on.
Task 3: complete (commits a338dce..15b19b5, review clean)
- R8: not-open states sort after every other state when choosing a visa's best state (they can never be the best route); the visa is not-open only when every state is not-open — matches spec intent ("cannot be the best route") over the literal rank — cost if wrong: none observed.
Task 3: minor (deferred): sumScores duplicates a private helper in src/lib/data/state-evidence.ts.
Task 3: minor (deferred): pin Aarav's 190 best state NSW in label-state.test.ts.
Task 3: note: real-data table for every scenario in task-3-report.md (use for later tasks).
- R9: subagent commits keep the Co-Authored-By trailer of the model that wrote them (e.g. Sonnet 5.5) — accurate attribution beats the plan's single trailer — cost if wrong: cosmetic.
Task 4: complete (commits 15b19b5..57541c1, review clean)
Task 4: minor (deferred): scenario stamp tests don't assert `points`/`tooFew` for every path; add cases (189 tooFew losing to 190; not-invited on both state visas).
Task 4: minor (deferred): note that OutlookInput.detail is for later tasks (unused in evaluateProfile).
Task 5: review 1 at 8315f0b approved with minors; Ruling R10: the "missing month → no-pace text" minor violates the global not-fetched≠zero constraint, so it (plus 0-round clamp, exact-cutoff month, required asOf) goes to fix round 1 — cost if wrong: one extra round.
Task 5: minor (deferred): tests for long-wait / not-eligible texts, combined-stamp text, lodged non-strong readers, roundsInLastYear boundaries.
Task 5: fix round 1/5 (4 addressed, 0 open; commits 8315f0b..db51a3a)
Task 5: complete (commits 57541c1..db51a3a, review clean)
Task 5: minor (deferred): lodged text "Roughly 0 EOIs ahead…" for an empty queue reads oddly — word it as "You're at the front of the queue at your score" when ahead max is 0.
- R11: in mode points-not-problem no move is marked best ("Biggest jump" would mislead when no move changes the label) — overrides "exactly one best" for that mode — cost if wrong: one badge.
- R12: improve.ts over 300 lines → move dated losses into src/lib/outlook/losses.ts (implementer's proposed split) — follows ENGINEERING size rule — cost if wrong: none.
Task 6: review 1 at 0dd3bc9 — needs R11 + R12 (+45th-birthday test, cast removal); fix round 1 dispatched.
Task 6: minor (deferred): NAMED_LOSSES depends on buildTimeline title strings; export title constants from migration.ts.
Task 6: minor (deferred): 2-year limit built by string year math; use addYears.
Task 6: minor (deferred): plain (no-data) mode still returns losses with no-data labels; UI must render them label-free (Task 14).
Task 6: minor (deferred): experience move has date null; UI must not imply a date. "never combines two English moves" test is weak.
Task 6: fix round 1/5 (4 addressed, 0 open; commits 0dd3bc9..8c07123)
Task 6: complete (commits db51a3a..8c07123, review clean)
Task 7: review 1 at d478218 — 1 Important (one state attributed to both state visas); Ruling R13: brief's "190 + 491, Tasmania" yields to data honesty, each visa names its own best state — cost if wrong: copy. Fix round 1 dispatched (+ size trim, title-shape test).
Task 7: minor (deferred): a lodged reader with a combined stamp gets the nothing-suits/no-data route, not the lodged route — confirm intent in final review.
Task 7: minor (deferred): "Keep your EOI in" sub "189 + 190 + 491" is static even when visas aren't open.
Task 7: minor (deferred): Meera/Sana route assertions are partial; Rahul deadline lacks afterStep assertion.
Task 7: fix round 1/5 (3 addressed, 0 open; commits d478218..a1b0cb1)
Task 7: complete (commits 8c07123..a1b0cb1, review clean)
Task 7: minor (deferred): collapse "190 X + 491 X" to "190 + 491, X" when both share a state.
Task 8: review 1 at b6d6697 — 1 Important (304 lines); Ruling R14: split queue half into queue-view.ts (later tasks import queueView from there) — cost: one import path. Fix round 1 dispatched (+ cohort-zero comment, masked "about", closed aria).
Task 8: note: implementer wrote code before tests (no RED); reviewer judged tests pin real behaviour.
Task 8: fix round 1/5 (4 addressed, 0 open; commits b6d6697..003b2fa)
Task 8: complete (commits a1b0cb1..003b2fa, review clean). NOTE: queueView now lives in src/lib/outlook/queue-view.ts (R14).
Task 8: minor (deferred): summed masked months render as "about 0–40" for the lodged "earlier" group; consider "under 40".
- R15: `src/data/manifest.json` (~1 KB) may be imported into client code for the data month when there is no core; Task 19 adds it to CLAUDE.md's allowed client JSON list — cost if wrong: 1 KB in the bundle.
- R16: R7 covers invitation evidence only; naming a state because the occupation is on its list (Sana, WA) is allowed and must say so ("on its list") — cost if wrong: copy.
- Task 10 must add the who sub-line (occupation, points, onshore/offshore, "Data to {Month YYYY}.") — Task 9 produces only "{Name}'s report." / "Your report.".
Task 9: minor (deferred): lint warning in charts.test.ts (from Task 8).
Task 9: review 1 at 564a2ca — 3 Important (template infers situation from text; lodged very-strong told to submit; "No EOIs higher" with no pool). Ruling R17: ReportFacts gains `situation` and `lodged` fields — cost: Task 17 prompt sees two more fields. Fix round 1 dispatched (+ checkRead day/month & guarantee\w*/per cent, facts months-waiting, shared wordCount, R16 Dev wording).
Task 9: minor (deferred): roundsFact duplicates facts.ts count; capital() duplicated; moveTitle/lossTitle parse other modules' display copy; lastListedMonth belongs in phrases.ts; lead sentences uncapped; Kavya fact mixes "–" and "to" range styles; rename route() helper so buildFacts param is `route`.
- R18: an exact date in an AI read fails checkRead with reason 'number' (no separate 'date' reason) — callers only need pass/fail — cost: less precise logging.
Task 9: fix round 1/5 (7 addressed, 0 open; commits 564a2ca..235d66c)
Task 9: complete (commits 003b2fa..235d66c, review clean)
Task 9: minor (deferred): DAY_DATE month pattern case-sensitive/unanchored — false positives fall back to template (safe).
- R19: view.ts over 300 lines → VisaCard + card builders move to src/lib/outlook/visa-cards.ts — cost: none.
- R20: a summed interval whose min is 0 renders as "under {max+1}" (e.g. "under 39"), never "0–38"; min > 0 renders as the range — applies to view captions and the queue-view "earlier" group — cost if wrong: copy.
- R21: whoDetail may add "EOI submitted {D Mon YYYY}." for lodged readers (screen only; facts stay month precision) — matches mockup — cost: none.
Task 10: review 1 at 4d0f372 — 3 Important (R19 size, R20 "0–38", unavailable whoDetail untested); fix round 1 dispatched (+ stampBottom from asAt, "the Northern Territory").
Task 10: fix round 1/5 (5 addressed, 0 open; commits 4d0f372..a0613e5)
Task 10: complete (commits 235d66c..a0613e5, review clean)
Task 10: minor (deferred): queue-view about() with min 0 prints "under N" for large behind counts instead of "about N"; headline still uses formatCount (no 0– today).
Task 11: complete (commits a0613e5..0295e4a, review clean). Competitive ink now #996000, long-wait #BE3F0B (AA). Stencil import is extensionless (`@fontsource/big-shoulders-stencil-display/latin-800`). Font families: "Archivo Variable", "Big Shoulders Stencil Display".
Task 11: minor (deferred): palette.ts JSDoc detached by a // line; palette test hex regex could anchor on ";".
- R22: stamps use the report font (Archivo, wide stretch, heavy) as in the mockups the founder actually saw and approved (the mockup CSS overrode the stencil font) — spec's Big Shoulders Stencil is dropped; remove the stencil @fontsource import/dependency and point --font-stamp at Archivo — cost if wrong: founder may want the stencil look; one token + one dependency to restore. Flag in final summary.
- R23: stampFontSize asserts the mockup formula value (40.58), not the brief's 36.2 — the brief's number was a hand error — cost: none.
Task 12: review 1 at a2ad468 approved; fix round 1 dispatched for R22 font swap (+ fit-hook try/catch, arc string cap).
Task 12: note for Tasks 14/15: stamps have inline minWidth — big 230px, visa 116px, shift 240px; layouts must leave that room. VisaStamp has no tooFew prop.
- R24: on phones the visa stamps render at ~140px wide (not the 116px minimum) so dense words aren't squeezed to Archivo's narrowest width — applied in Task 14 — cost: a slightly taller visa row.
Task 12: fix round 1/5 (4 addressed, 0 open; commits a2ad468..65ddf0f). R23 superseded: FIT_RATIO 0.628 makes stampFontSize("COMPETITIVE",250,56)=36.2.
Task 12: complete (commits 0295e4a..65ddf0f, review clean)
Task 12: minor (deferred): no direct test of use-fit-stamp-text hook; capArcText may cut mid-word on unusually long input.
Task 13: review 1 at 68262c3 — 3 Important (RouteLine text <12px at 721–860px; narrow queue note overflows; route list label/points colour-only). Ruling R25: RouteLine only at ≥1024px (tablet/phone use RouteList), text ≥12px at a 760px container — cost: tablets see the vertical route. Fix round 1 dispatched.
Task 13: note: no RED run for route-geometry tests.
Task 13: fix round 1/5 (4 addressed, 0 open; commits 68262c3..fede1ab)
Task 13: complete (commits 65ddf0f..fede1ab, review clean)
Task 13: minor (deferred): deadlineTiers assumes x-sorted input; pass-mark line not offset from You label.
Homepage mockups (founder's extra request): committed 0ac270d in .superpowers/brainstorm/homepage-2026-11-21/ (4 directions + screens + notes). Not part of the plan's tasks.
Task 14: implementer done at d6ee9ce (DONE_WITH_CONCERNS); review dispatched. NOTE: 0ac270d (mockups) sits after d6ee9ce — use d6ee9ce as the fix base for Task 14 fix rounds.
Task 14: review 1 at d6ee9ce — 2 Important (state table masked sum reads as invitations vs tile "none"; points-only lacks footer); fix round 1 dispatched (+ hero breakpoint 720, reuse addYears/assessmentEnd, reform caveat, "(your band)").
- R26: the deleted "Useful definitions" glossary terms are added to the methodology page in Task 19 (content addition only, page not redesigned) — spec 5 says they move there — cost: small.
Task 14: minor (deferred): phone CSS `order` makes visual vs reading order differ in hero; masked pool bars drawn at midpoint (consider hatched); global selector into TrendChart; two h1s on /sample/ (Task 16); dead .report-* rules in globals.css (Task 15); evidence <details> closed in print until Task 15's print tree.
Task 14: fix round 1/5 (6 addressed, 0 open; commits 0ac270d..1fd33b2)
Task 14: complete (commits fede1ab..d6ee9ce + 0ac270d..1fd33b2, review clean)
Task 15: implementer done at 5bd8a9c (DONE_WITH_CONCERNS: 4–5 pages per scenario, within ≤5); review dispatched.
Task 19 note: CLAUDE.md "Product constraints" still says "no ... forecast wait times" — update to the 21 Nov founder decision (estimates computed in code from history, labelled; still no percentages).
Task 15: review 1 at 5bd8a9c — 1 Important (points-only print uses the stamp grid); fix round 1 dispatched (+ aria-hidden print stamp, margin font var, scope global queries, dataMonth once).
- R27: top-level @page changes print margins for all routes to 14/14/18mm — accepted — cost: other pages' prints shift slightly.
Task 15: minor (deferred): label-state questionCount duplicates findingsWith count and its comment is wrong; print note "N rules need your answers" vs screen "Answer N questions"; Rahul's appendix near page limit (cap note length).
Task 15: fix round 1/5 (5 addressed, 0 open; commits 5bd8a9c..6e30bc2)
Task 15: complete (commits 1fd33b2..6e30bc2, review clean). PDF pages: sample 5, strong 4, middle 5, long 5, notinv 5, below 5, nodata 4, none 5, lodged 5, points-only 1.
Task 16: implementer done at 0dcd7fc (DONE_WITH_CONCERNS); review dispatched.
Task 16: complete (commits 6e30bc2..0dcd7fc, review clean)
Task 16: minor (deferred): every sample tab compares with the nurse occupation (254412) — give each example its own comparison; tab aria-controls point at non-existent panel ids; 254499 serialised twice (dedupe); no SampleTabs keyboard test; dead `main:has(.root) > .page-head` rule on /sample/.
- R28: handler.ts over 300 lines → move HTTP helpers to supabase/functions/_shared/http.ts — cost: none.
- R29: send `fallbacks: "default"` (and its beta) only for models that support server-side fallback (Opus 5.5, Sonnet 5.5, Fable 5.2); Haiku 5.5 gets no fallbacks param — per Claude API docs Haiku 5.5 has no server-side refusal fallback — cost: none.
Task 17: implementer done at 6233ad9 (DONE_WITH_CONCERNS); review dispatched.
Task 17: review 1 at 6233ad9 — 1 Critical (retry receipt mints read_token without Turnstile) + R28/R29 open. Ruling R30: read_token only on 201 created after Turnstile; retries get the template — cost: a lost-response retry has no AI read. Fix round 1 dispatched (+ rate-limit map cap, 6 s timeout, comment).
Task 17: minor (deferred): requests without X-Forwarded-For share one "unknown" rate bucket; verify on deploy that Supabase's XFF first entry is trustworthy and that a hosted deploy resolves the npm: SDK with nodeModulesDir none.
Task 17: fix round 1/5 (6 addressed, 0 open; commits 6233ad9..b606449)
Task 17: complete (commits 0dcd7fc..b606449, review clean)
Task 17: minor (deferred): rate-limit comment overstates the token-use map bound.
- R31: Task 18 does NOT bump PRIVACY_VERSION and shows the AI privacy sentence only when NEXT_PUBLIC_READ_ENABLED is on — a version bump would make the currently deployed Functions reject every submission if the frontend merges before a Functions deploy; the bump + AI sentence go live together at enablement (documented in HANDOFF/OPERATIONS-BACKEND) — cost if wrong: one extra step at enablement.
Task 18: implementer done at 1c14aee (DONE_WITH_CONCERNS); review dispatched.
Task 18: complete (commits b606449..1c14aee, review clean)
Task 18: minor (deferred → Task 19): enablement checklist must deploy Functions and frontend back to back (old frontend + new PRIVACY_VERSION rejects submissions); use-our-read doc comment mismatch after 3rd call.
Task 18: minor (deferred): no tests for the 6 s fallback / 3-call cap; StrictMode double effect in dev; eslint-disable reason not inline.
Task 19: complete (commits 1c14aee..17fb5ac, review clean)
Task 19: minor (deferred): CLAUDE.md print bullet looser than the rule; CLAUDE.md should name REPORT_BANNED_COPY for the report; methodology definitions unstyled + stale "11 occupations"; HANDOFF should note the eight-profile /check/ browser gap (email gate).
All 19 tasks complete. Final whole-branch review next.
Final review (fable) at 17fb5ac: With fixes — 0 Critical, 9 Important. Ruling R32: one fix wave covers Important 1–8, the write-read error-class logging and enablement-checklist items from 9, the must-fix deferred minors (Task 5/10 masked lodged text, Task 6 plain-mode template labels), and an all-occupation sweep test; the Postgres-backed per-submission use counter (rest of 9) is deferred to before AI enablement and documented — cost if wrong: AI stays off until it's built.
- R33: the masked-sum fix in src/lib/report/eois-like-yours.ts also changes small-cohort wording on occupation pages and the homepage ("under 39" instead of "0–38") — accepted, same honesty rule (R20) — cost: wording change outside the report.
Final fix wave: 9 commits 17fb5ac..ea076c2; scoped re-review: all 10 findings + extras ADDRESSED; 1 new Important ("opens 189" copy for under-65/expired readers in not-invited occupations) + 4 minors.
- R34: no second fix wave (process); the "opens 189" Important and its 4 minors are parked and written into docs/HANDOFF.md "Known issue to fix before merge" with the exact fix — cost if wrong: ~55 of ~958 low-points views show a contradictory best line until fixed; the branch isn't merged or deployed.
- R35: per repo convention (earlier plans' ledgers are committed), this workspace is committed instead of deleted, excluding the very large whole-branch diff packages (review-53030e6..17fb5ac.diff, final-code.diff, final-docs.diff) — cost: none.
