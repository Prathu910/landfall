# SDD ledger — plan: docs/superpowers/plans/2026-11-18-state-outlook.md

Spec: docs/superpowers/specs/2026-11-17-reality-check-and-state-outlook-design.md (§4–6 + resolutions + founder decisions; binding). Branch: roadmap/reality-check (founder: continue step 3 on the same branch, subagent-driven, 18 Nov 2026). Base dc0fd56.

## Pre-flight scan
| Tasks | Shared file/interface | Finding |
|---|---|---|
| 1→2..11 | rules-types (Sourced, Stream, Requirement, ImportedList, FederalList), guards, isStale | consistent |
| 1↔3,4 | ImportedList entries gain optional `streams?: string[]` (T3) and `viaUnitGroup?: string` (T4) | CONFLICT (T1 guard must tolerate) → Ruling P1 |
| 2,3,4→5 | listIds wa/sa/qld/nsw + federal-occupations.json | consistent |
| 5→7 | StateRules + OccupationListRef | consistent |
| 6→7,9 | new optional Profile fields | consistent |
| 7 self | requirement → profile field mapping unspecified for min-years-experience windows and in-state months for other states | AMBIGUITY → Ruling P2 |
| 7 self | test sentence "secondary gives unverified even when another stream needs answers… expected needs-answers" reads contradictory | clarified: state = best stream; test both orders → Ruling P3 |
| 7→8,9,11 | Outlook/StateOutcome/Group, summary | consistent |
| 8→10 | Tile/StatePanel/buildAnyStateTile | consistent |
| 9 | questionsNeeded(outlook) in view.ts (T8 file) | consistent (T9 extends view.ts) |
| 11 vs step 2 | scorecard 190/491 sentence from Outlook.summary (retires S1); panel-nominated statesLink | consistent |
| 2 risk | federal list source may block automation | BLOCKED path defined (stop + report) |

Ruling P1: isImportedList accepts optional per-entry `streams?: string[]` and `viaUnitGroup?: string` (unknown extra keys rejected) — cost if wrong: guard tweak.
Ruling P2: requirement mapping — min-months-living-in-state/working-in-state use monthsLivingInState/monthsWorkingInState only when profile.state === rule state (and onshore); if the user lives elsewhere or offshore, the requirement fails with "You don't currently live in {state}" (cohort rule normally catches this first); min-years-experience: withinYears ≤ 3 → yearsExperienceLast3, otherwise yearsExperienceLast5; min-months-living-offshore → monthsLivingOffshore (fails if onshore); job-offer-in-state → jobOfferState === state; visa-expiry-before → profile.visaExpiry (empty → needs-answer); lives-regional → livesRegional; studied-in-state → studyState === state. Null/undefined → needs-answer — cost if wrong: re-mapping in one function.
Ruling P3: state outcome = best stream (pass > needs-answer > unverified > fail); stream outcome = worst check (fail > unverified > needs-answer > pass) — exactly as the plan's aggregation section says.

## Progress
Task 1: dispatched (base dc0fd56, sonnet) with P1
Ruling P4 (T1): isStale treats an unparseable checkedAt/asOf as stale (fail closed → "Not yet verified") — honesty over silence — cost if wrong: none.
Task 1: minor (deferred): no year-boundary/leap-day isStale test; staleRules restriction/ownScoreSystem paths + exact-45-day case untested.
Task 1: fix round 1/5 dispatched — open: (I1) weak "XX" state test; plus P4.
Task 1: fix round 1/5 (2 addressed, 0 open; commits b498e4b..dcb85d8)
Task 1: complete (commits dc0fd56..dcb85d8, review clean after 1 fix round)
Task 1: minor (deferred): isStale relies on Date.parse (V8 may roll "2026-02-30" over) — could reuse the guard's real-calendar check.
Task 2: dispatched (base dcb85d8, opus — source discovery + BLOCKED discipline)
Ruling P5 (T2): accept mapping the 3 "ANZSCO 2022"-only rows (311214, 252112, 139914) where the dashboard index has the identical code AND name — exact, documented — cost if wrong: 3 occupations' federal flags.
Ruling P6 (CARRY to T7): a code absent from federal entries OR false = federally ineligible ("not-open"); only federal === null means list unavailable ("unverified").
Task 2: accepted extras: fixtures dir in .prettierignore; decodeEntities exported from rounds.ts; checkedAt = fetch date (page shows no update date).
Task 2: complete (commits dcb85d8..c9869d8, review clean). Federal list: 674 entries; all 493 dashboard occupations listed (420 eligible 190, 493 eligible 491).
Task 2: minor (deferred): state-lists cli duplicates isCalendarDate/localToday; importFederal untested; caveat heuristic; unlabelled naming.
Task 3: dispatched (base c9869d8, sonnet)
Ruling P7 (T3, pre-review): SA duplicate codes under different names → UNION of cohorts (the list does include the code for that cohort under one title; intersection would produce false "Not open" claims); record both titles in streams/notes. SA "Any Location" block: read and map faithfully per its wording (if it means available regardless of residence → all cohorts listed by the source); never silently drop a listed code. Accepted: lists dir in .prettierignore.
Ruling P8 (T3 fix): SA Any-Location-only codes (no cohorts from other blocks) → importer throws "review" (fail closed; never drop, never guess); when other blocks exist, the visa takes their cohorts (documented heuristic, comment in code). WA "Regional WA only" deliberately ignored for membership (comment + test). Validate every row's v190/v491 (no short-circuit). SA floor 300. Federal importer reuses the shared fetch/sort/write helpers.
Task 3: fix round 1/5 dispatched — open: (I1) Any-Location silent drop; (I2) duplicated fetch/sort/write helpers.
Task 3: minor (deferred): SA HEADER regex brittle (fails closed).
Task 3: fix round 1/5 (2 addressed + extras, 0 open; commits 4b7fcb7..e838297; data unchanged on re-import)
Task 3: complete (commits c9869d8..e838297, review clean after pre-review P7 + 1 fix round). WA 384 codes, SA 351.
Task 3: minor (deferred): sortedEntries uses localeCompare (use plain compare).
Ruling P9 (T4): list files record membership only; residence/cohort restrictions belong to rules (T5). QLD onshore list → living-in-state, offshore list → offshore (like SA). NSW single list → all three cohorts for 190 (NSW's residence options are rules); NSW 491 absent (closed). NSW 4-digit unit groups → every 6-digit code in src/data/occupation-index.json with that prefix, entry.viaUnitGroup set; federal eligibility is checked downstream. Same never-drop / union-duplicates / fail-closed principles as P7/P8.
Task 4: dispatched (base e838297, sonnet)
Ruling P10 (T4): code+data in one commit (ebebd61) accepted, no history rewrite — cost if wrong: less granular history. QLD source joins two URLs with ' ; ' (accepted); graduate pathway not named in QLD tables (accepted).
Task 4: complete (commits e838297..ebebd61, review clean). QLD onshore 209 / offshore 97; NSW 78 unit groups → 233 codes.
Task 4: minor (deferred): QLD tick detection by literal "tick" (add per-column tick guard); QLD codes not in index unreported; empty table TypeError; textOf duplicates decodeEntities; NSW writeList floor 1; blank unmatched print.
Task 5: dispatched (base ebebd61, opus)
Ruling P11 (T5): accept OccupationListRef extensions — list refs may carry a `streams` filter; new kind `not-imported` (state publishes a list we haven't imported). Task 7 must support both; `not-imported` → unverified.
Ruling P12 (T5): WA employment-contract rule stays secondary (B&C exemption unknown without sector column) → WA 190 passes only via Graduate for now — honest, costs coverage. Follow-up (deferred): import the WA sector column and split the stream.
Ruling P13 (T5 concern 3): NSW "working in NSW" encoded as min-months-working-in-state ≥1 is OUR inference (NSW sets no minimum) → that requirement must be verification "secondary" with the note; the 6-month residence / offshore alternatives stay as the research verified them. (Fix in T5 fix round.)
Ruling P14 (CARRY to T6/T7): add profile field `yearsExperienceLast10?: number|null`; min-years-experience mapping: withinYears ≤3 → yearsExperienceLast3, ≤5 → Last5, >5 → Last10. Evaluator (T7): secondary field / not-imported ref / status unknown → unverified (never fail); visa-expiry-before = on or before the date.
Task 5 review: Needs fixes — no invented numbers; 3 Important (NSW/QLD-B&C interstate cohort; related-occupation work months SA/QLD; QLD regional + N-of-M months).
Ruling P15 (T5 I2): `min-months-working-in-state` gains `related: "same-occupation" | "anzsco-2-digit" | "anzsco-3-digit"` (SA onshore → 2-digit; QLD → 3-digit; others → same-occupation unless research says otherwise); the Sharpen question (T9) is worded per the user's own state with that definition ("…in your nominated occupation or one {state} treats as related: same first {2|3} ANZSCO digits"); rules stay verified (answers are self-reported like the rest of the check).
Ruling P16 (T5 I3): months questions (T6/T9) ask "continuous months up to now" in that state (current streak). Requirements gain optional `ofLastMonths?: number` for "N of the last M months" rules: streak ≥ N → pass; streak < N → unverified (gaps possible), never fail. Rules stated as N months (no window) → plain pass/fail. QLD 491 "regional" months component → secondary (current lives-regional cannot prove 6 of 9 months regional). Fix the qld.ts comment accordingly.
Ruling P17 (T5 I1): nsw-190-working cohorts += living-in-other-state; qld-building cohorts += living-in-other-state (research states no residence condition).
Task 5 extras in the fix round: NSW note says 78 imported unit groups (research said 80); rename module const `window` in qld.ts; VIC cohorts ALL_COHORTS (secondary); index.ts validation error names state/visa/stream; guard rejects duplicate stream tags.
Task 5: minor (deferred → T7 must check): WA per-code visa flags are a union across streams — quantify Schedule-2 190-only-but-Graduate-491 risk against the full CSV before relying on wa-491 Schedule 2 pass; store per-stream visa flags if non-zero (Task 3 importer follow-up). Closure notes for secondary-closed programs must be prominent in T8/T10.
Task 5: fix round 1/5 dispatched — open: I1 (P17), I2 (P15), I3 (P16) + extras.
Ruling P18 (CARRY to T7): list-membership check treats the user's cohort living-in-state OR living-in-other-state as "onshore" and matches any onshore cohort recorded in the list entry (lists record onshore/offshore list categories; residence is enforced by stream rules, P9). No re-import.
Ruling P19 (CARRY to T7, amends P2): a min-months-working/living-in-state requirement for a user who lives in another state, on a stream whose cohorts include living-in-other-state → "unverified" (we don't ask about working in a state you don't live in), never fail. P2 fail stands for streams whose cohorts exclude living-in-other-state (cohort check fails first anyway).
Task 5: fix round 1/5 (3 addressed + extras, 0 open; commits 239b439..4107d85)
Task 5: complete (commits ebebd61..4107d85, review clean after P13 pre-review + 1 fix round)
Task 6: dispatched (base 4107d85, sonnet) carrying P14 (yearsExperienceLast10) and P16 (months fields = continuous months up to now)
Task 6: complete (commits 4107d85..b91620c, review clean)
Task 6: minor (deferred): no-op Number.isInteger check; STATE_CODES hand-copied (use satisfies); test title vs assertions.
Ruling P20 (inserted Task 6b before T7): list entries must carry per-visa stream tags so a rule's `streams` filter is evaluated per visa (WA union risk from the T5 review: a Schedule-2 190-only code with a Graduate 491 row would falsely pass wa-491 Schedule 2). Shape: replace entry `streams?: string[]` with `streams?: { "190"?: string[]; "491"?: string[] }` (title:<name> tags for SA duplicates go per visa too); update guard + tests, WA/SA/QLD importers (re-import from the live sources), and the T5 rules test "every tag resolves" to resolve per visa. Report how many WA codes change membership for wa-491 schedule-2 / wa-190 streams.
Task 6b: dispatched (base b91620c, sonnet)
Task 6b: closed 4 real SA false passes (sa-190 Skilled Employment: 149212, 149913, 222113; sa-190 Offshore: 332211); WA/QLD 0; per-visa membership unchanged (0 diffs).
Task 6b: complete (commits b91620c..20ac282, review clean; membership unchanged verified by reviewer)
Task 6b: minor (deferred): guard doesn't check stream-tag visa has a cohort on the same entry.
Task 7: dispatched (base 20ac282, opus) carrying P2/P19, P3, P6, P11, P14, P15 (question text), P16, P18, P20, T5 evaluator notes.
Task 7 notes accepted: RuleCheck.field optional (for T9); unevaluated `restriction` text → Ruling P21 (CARRY to T8): a passing/strongest state whose deciding stream has a restriction must show that restriction prominently in the tile panel's "Can you apply?" list as an unchecked "?" line ("Also required: {restriction} — not checked here"); stale list/federal → unverified; verified none-published → unverified (unreached).
Task 7: minor (deferred): possessive "New South Wales's" → use "the {State} 2026–27 list"; federal-null check has empty source/date; STATE_NAMES duplicated in older private copies.
Task 7: fix round 1/5 dispatched — open: (I1) all-federally-eligible list check ignores stale federal list → false fail; (I2) duplicated real-data loader. Also in this round (controller choice, cheap safety): M1 pin known real outcomes + assert no stale fail checks; M2 "Rules check date unknown" fallback.
Task 7: minor (deferred): M3 consolidate state-name maps; M4 answered-profile copy test; M5 offshore vs interstate in-state months asymmetry (confirm if a stream ever has that shape).
Task 7: fix round 1/5 (2 addressed + M1/M2, 0 open; commits 8df0053..08c49bd)
Task 7: complete (commits 20ac282..08c49bd, review clean after 1 fix round)
Task 7: minor (deferred): verificationBehind hard-codes check order.
Task 8: dispatched (base 08c49bd, sonnet) carrying P21 (restriction "?" line), secondary-closure note prominence, possessive wording.
Task 8 notes: signature deviations accepted for review (points arg to buildTiles/buildAnyStateTile; StatePanel.streamName; competitor as-at = newest covered month); possessive removed in T7 text; real-data cases moved to fixtures.
Ruling P22 (T8 fix round, copy): (a) empty invitedAtOrBelow (no published month) → fragment/sentence "no published invitation data for this state in the last 12 months"; missing statePool → competitor sentence "No published count of competing EOIs for this state" (never a confirmed zero); (b) secondary-closure panel: drop the duplicate status check line; (c) one shared note function; (d) score range: "Published invitations in the last 12 months were at {n} points" / "…were between {a} and {b} points" (as at …); (e) competitors: "{n} EOIs for the {visa} visa name {State} and have {p} points or more (as at …)"; masked → "Published as under 20: EOIs for the {visa} visa that name {State} and have {p} points or more (as at …)"; (f) peak line only when it differs from a shown month: "Highest month: at least {n} invited at {p} points or below ({Mon YYYY})"; (g) restriction line format (amends P21): "Restriction, not checked here: {restriction}" ; (h) own-system: "{State} ranks with its own {system}, which is not calculated here."; (i) `source` optional (no empty links); sweep includes streamName and any-state note.
Task 8: fix round 1/5 dispatched — open: empty-coverage false zero; duplicate closure line; duplicated note logic; + P22 copy items.
Task 8: minor (deferred): ✗ lines lack the finding text (consider exposing finding on RuleCheck).
Task 8: fix round 1/5 (3 addressed + P22 copy, 0 open; commits 10a87ea..35b4bdc)
Task 8: complete (commits 08c49bd..35b4bdc, review clean after 1 fix round)
Task 8: minor (deferred): closure filter matches label string (share a constant with evaluate.ts); no-data wording "for this state" on the any-state tile.
Task 9: dispatched (base 35b4bdc, sonnet) carrying P15 (state-specific relatedness wording), P16 (continuous months), RuleCheck.field.
Task 9 notes: questions only from deciding streams' needs-answer checks (accepted: answering them changes the tile); optional RuleCheck.related added; form <details open> for print; onChange gives validated Partial<Profile>, cleared = {field:null} (CARRY to T11 save path).
Task 9: fix round 1/5 dispatched — open: (I1) years NumberInput controlled by parsed number blocks decimals/silently snaps back; (I2) question wording uses first-seen state not profile.state (P15). Also in round: readOnly instead of disabled (legibility), help text step mismatch (0.1 vs 0.5), visible feedback for an out-of-range value.
Task 9: fix round 1/5 (2 addressed + extras, 0 open; commits 44df359..338a639)
Task 9: complete (commits 35b4bdc..338a639, review clean after 1 fix round)
Task 9: minor (deferred): error text could say the answer isn't used until valid; no NumberAnswer component tests. CARRY to T11: pass live profile to questionsNeeded(outlooks, profile).
Task 10: dispatched (base 338a639, sonnet)
Ruling P23 (T10 pre-review, founder decision + spec §4): tiles in "Not yet verified" and "Needs your answers" groups show the EVIDENCE fragment (same as passing groups), not the reason text; only "Not open to you now" tiles show the short reason. Reasons stay in the panels. Fix in src/lib/state-outlook/view.ts (buildTiles) + tests; remove the unused countInSentence import (lint warning).
Task 10: fix round 1/5 dispatched — open: (I1) source-link contrast 4.35–4.44 on tinted ?/✗ lines. Also in round: heading element for the state name inside <summary> (a11y), cancel rAF on unmount.
Task 10: minor (deferred): 14–15px secondary text vs 16px body rule; preventDefault hijacks modifier clicks.
Task 10: fix round 1/5 (I1 + headings + rAF addressed; commits 5daf8cf..c43bc8e)
Task 10: complete (commits 338a639..c43bc8e, review clean after P23 pre-review + 1 fix round)
Task 10: minor (CARRY to T11): panel state-name heading is h4 directly under the section h2 — make it h3 (or nest under the visa h3) without changing the look.
Ruling P24 (T11): client components may import the state rules (TS), the 4 lists and the federal list directly (≈470 KB raw JSON but ≈12 KB gzipped total); report the /check/ and /sample/ first-load JS delta from the build output; if the gzipped JS delta exceeds ~60 KB, stop and report instead of shipping. Update CLAUDE.md's allowed client imports.
Task 11: dispatched (base c43bc8e, opus) carrying: S1 retirement (scorecard 190/491 = outlook summary), panel-nominated statesLink, nav rename, SharpenForm wiring (questionsNeeded(outlooks, profile), save via existing opt-in path, cleared → null), /sample/ read-only, P21/P22/P23 render, h3 heading fix, prebuild stale-rules warning, docs, browser checks + screenshots.
Task 11 notes: keepAskedQuestions added; JS delta /check/ +29 KB, /sample/ +53 KB gz (under P24 60 KB); /states/ kept with states.ts; h3 carry already satisfied (verified in browser). Concerns: saved answers that settle a rule are hidden after reload (can't edit) — reviewer to judge; 190/491 chip stays 'State decides' amber even with strongest summary.
Ruling P25 (T11 I1): (a) pure tested helper in src/lib/state-answers.ts clears state-relative answers (monthsLivingInState, monthsWorkingInState, livesRegional) when `state` or `onshore` changes, and monthsLivingOffshore when `onshore` changes; applied in check-flow's single update path. (b) answered questions stay visible: requirements.ts tags pass/fail checks with `field` too, questionsNeeded includes fields that are answered OR still needed for the deciding streams (computed purely from the profile) — remove keepAskedQuestions/in-render setShown if no longer needed. Also M1 test for state-rule-data (4 lists + federal non-null); M2 consistent size wording.
Task 11: fix round 1/5 dispatched — open: (I1) hidden, reused state-relative answers → false Strongest (reproduced NSW 190 after QLD→NSW).
Task 11: minor (deferred): M3 nav/section derive from one flag; M4 discriminated input for buildScorecard summaries; M5 staleness script test; M6 "State pathways" (/states/) vs "State outlook" naming — founder-visible, raise in summary.
Ruling P26 (T11 fix): answered fields gathered from ALL of a state's streams (not only deciding) — prevents questions vanishing mid-typing when a partial answer switches the deciding stream; main-check answers (e.g. visa expiry) may appear read/edit in Sharpen when a state rule uses them; state question stays in step 1 only — cost if wrong: a slightly longer question list.
Task 11: fix round 1/5 (I1a/I1b + M1/M2 addressed; commits 041ec3c..4e9e517)
Task 11: complete (commits c43bc8e..4e9e517, review clean after 1 fix round)
Final review: dispatched (base dc0fd56, opus)
Final review: NO (close) — sweep of ~213k outcomes: evaluator invariants hold; input gaps: C1 federal baseline missing; C2 study answers treated as verified for WA/SA graduate; I3 not-open panel explanations false/mislabelled; I4 occupation change keeps occupation-relative answers; I5 experience question narrower than rules.
Ruling P27 (C1): add a federal baseline check first in checksFor: PointsResult.eligible === false → fail with the named reason (age 45+, English below competent, assessment expired — use PointsResult warnings/missing); visa points < 65 → fail "Under the 65-point pass mark for {visa}"; eligible === null → needs-answer ("Complete your points check") — never pass on unknown. OutlookInput gains `points: PointsResult` (or eligible + total).
Ruling P28 (C2): WA graduate study rule and SA Graduates study rule, plus SA "6 months living and working after completing the course", become `secondary` with notes (Landfall's questions can't test 87 weeks face-to-face / CRICOS 46 weeks, 75% in SA / timing after completion).
Ruling P29 (I3): RuleCheck carries `finding` (the specific reason); ✗ lines and unverified lines whose rule is verified+fresh show the finding (e.g. "Not checked while you live in another state", "Under 9 of the last 12 months — can't confirm gaps"); "Not yet verified on the official page" only for secondary/stale rules; filtered list labels include the stream name; not-open panels list each stream's first failing finding.
Ruling P30 (I4): resetStateRelativeAnswers also clears monthsWorkingInState and yearsExperienceLast3/5/10 when `occupation` changes.
Ruling P31 (I5): min-years-experience gains `related` (same-occupation | anzsco-4-digit | anzsco-3-digit | any-skilled) set from the research (WA Sch1 4-digit; QLD offshore 3-digit; SA offshore any-skilled; others same-occupation); the experience question names the definition for the state(s) it affects (or neutral wording); when related ≠ same-occupation, an answer below the threshold → unverified (not fail).
Also in wave (cheap, honesty/safety): QLD importer throws if the Building-and-Construction heading is missing (no silent drop); surface QLD onshore ATO Notice of Assessment gate + "Queensland employer" as restriction lines; split view.ts under 300 lines; stable keys for panel lines; shared constant for the closure label; "for this state" wording fixed on the Any-state tile.
Deferred (can wait, per reviewer triage): T1, T2, T3, T4 (except heading throw), T6, T6b, T7 M3/M4/M5, T9, T10, T11 M3–M5; "Affects" listing already-failing states; chip "State decides" (spec-mandated). Founder-visible: M6 "State pathways" vs "State outlook" naming.
Final fix wave: dispatched (opus).
Final fix wave: done (commits 4e9e517..e93d078); sweep: 0 Strongest/Watching for ineligible or <65; 0 unbacked not-open; 0 WA/SA graduate Strongest/Watching. Concerns 2–4 accepted (federal-null keeps all-unverified per global constraint; tile shows furthest-reaching stream's reason with the panel explaining every stream; ACT/NT same-occupation, secondary).
Ruling P32 (fix-wave concern 1): eligible === null is common (englishDate and assessmentDate are optional in the form), so the baseline needs-answer must be answerable in place: the baseline check names exactly what's missing ("Add your English test date" / "Add your skills assessment date" / the PointsResult.missing items), and questionsNeeded offers englishDate and assessmentDate (and assessmentExpiry only if already relevant) as Sharpen date questions affecting every state when they are the cause; items not answerable in Sharpen (e.g. date of birth, English level) say "Edit your answers" — answers go through the same update path; points recomputed live. Cost if wrong: two extra optional questions.
P32 fix: ff174e7 (concern: answered date question leaves Sharpen once points check completes — accepted, editable in main check; date inputs commit whole values). Final re-review: dispatched (4e9e517..ff174e7, opus).
Final re-review: READY TO MERGE (all C1/C2/I3/I4/I5/also-in-wave/P32 addressed; strict sweep 7 profiles × 283,968 outcomes, every invariant 0).
Deferred (post-merge, recommended soon): Sharpen date inputs lack the main check's no-future-date rule (future English date → 0 English points → may fall under 65); date questions say "Affects every state" even for verified not-open states; P31 shared-wording latent gap (unreachable on today's data); panel needs-answer experience line uses generic wording; PROGRAM_YEAR hard-coded in panel-lines.ts.
Founder-visible: "State pathways" (/states/) vs "State outlook" naming; verifying ACT/VIC/TAS/NT.
Step 3: COMPLETE (dc0fd56..ff174e7).
