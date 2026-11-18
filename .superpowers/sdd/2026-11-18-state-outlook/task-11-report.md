# Task 11 report: integration, scorecard summary, old state cards removed, docs, browser checks

Status: DONE_WITH_CONCERNS (concerns at the end; none blocks shipping)

Commits (base c43bc8e):

- 7163150 feat(report): show the state outlook and retire the interim state sentences
- 041ec3c docs: record the state outlook release

## Implemented

- **View assembly (pure).** New `src/lib/report/state-outlook-view.ts` exports `buildStateOutlookView({core, profile, asOf, points, data})`. It runs `stateOutlook` for 190 (points = subclass190) and 491 (points = subclass491) and returns `subtitle`, `summaryByVisa`, `tilesByVisa`, `panelsByVisa`, `anyStateByVisa`, `defaultVisa: "190"` and `questions` (`questionsNeeded([out190, out491], profile)`). `buildReportView` builds it only when the occupation core is ready; `ReportView.stateOutlook` is null otherwise, so the outlook and the Sharpen form are omitted for loading, no-data, load-failed and points-only reports. `ReportViewInput` gains `stateRuleData: StateRuleData` (rules, lists, federal), injected so tests use the real checked-in data.
- **Scorecard (S1 retired).** `buildScorecard` takes `stateSummaries: Record<StateVisa,string> | null`. The 190 and 491 sentence is `summaries[visa]`, and the chip stays "State decides" (amber). `stateSentence` and the invitation-window logic are deleted. Ready data with null summaries throws, which is a programming error; `buildReportView` always supplies them. The loading, no-data, load-failed and points-only branches are unchanged.
- **panel-nominated.** `statesLink` is `{ href: "#state-outlook-190" | "#state-outlook-491", text: "See your state outlook" }`, with a template-literal type.
- **Nav.** "State pathways" (`states`) is removed. `["state-outlook", "State outlook"]` sits in the panels group, after "491 in detail", which matches spec §3.3 ("State outlook, below" the 190/491 panels). It therefore appears only when the outlook renders, and the later section numbers follow.
- **Report.** The old `#states` section (statePrograms cards, `/states/` link) is gone, along with its dead `.report-state-row` CSS (48 lines). New `src/components/report/state-outlook-section.tsx` renders `StateOutlook` followed by `SharpenForm`, directly after `VisaPanels`. The "What this report can and cannot tell you" text now describes the state outlook and what it does not calculate. `report.tsx` went from 537 to 500 lines.
- **Sharpen form wiring.** `Report` gains `onAnswer?: (patch: Partial<Profile>) => void`. In check-flow, `update(key, value)` now delegates to a new `updateMany(patch)`, the single `setProfile` merge path, which is passed as `onAnswer`. The existing opt-in saving effect therefore applies unchanged; nothing writes storage or the URL directly. Cleared answers arrive as `{field: null}` from SharpenForm and are merged as is. `/sample/` passes no `onAnswer`, so the form is `readOnly`.
- **Fix found in browser verification.** `questionsNeeded` drops a question as soon as its answer settles the rule. The input therefore disappeared while the user was typing, for example after the first digit, and "Clear this answer" could never be reached. I added a pure `keepAskedQuestions(shown, needed)` in `questions.ts` (3 tests, TDD) and hold the shown list in `StateOutlookSection` state, so a question stays in the form for the session once shown.
- **buildStatePanel** accepts `rules: StateVisaRules | undefined`, so a state with no recorded rules still gets a panel (its tile links there). All 16 state×visa rules exist today; this is defensive and tested.
- **Client data.** New `src/components/data/state-rule-data.ts` imports the rules (TS), the 4 lists and the federal list, and validates the JSON with `isImportedList` / `isFederalList`. It fails closed: an invalid list is omitted, so its rules read "Not yet verified", and an invalid federal list becomes `null`, so every tile is unverified. **List size decision (P24):** SA is 174 KB and WA 138 KB raw, over the 100 KB guide, but the 5 files total about 10 KB gzipped. I kept the whole import, recorded it in DATA.md, and noted to split per state if the ~60 KB budget is ever exceeded.
- **/states/ page:** kept as is. It still uses `state-explorer.tsx` and `src/data/states.ts`, so neither was deleted. The choice is recorded in HANDOFF and in the STRATEGY decision-log row.
- **Carried a11y heading item:** no change needed. In the current markup the panels sit inside the visa block, under its `h3 "Subclass {visa}"`, so the outline is already h2 State outlook > h3 Subclass 190 > h4 "{State} · 190" > h5 blocks. The browser check asserts that no level is skipped (outline below).
- **Prebuild warning.** New `scripts/check-rule-staleness.ts` runs in `prebuild` after copy-public-data. It loads rules via dynamic `import()` inside `main().catch(...)` (no top-level await). It prints `staleRules(stateRules, localToday(), 45)` as `WARNING …` (first 20 paths, then "…and N more"), or a one-line all-fresh message. It always exits 0, including when loading the rules throws. Tested with a faked clock (2027-01-15): 268 stale rules listed, exit 0.
- **Docs:** DATA.md has a "State rules" section (files, sources with URLs, verification, federal and fail-closed behaviour, staleness at render and build, monthly re-verify routine with `npm run data:state-lists [-- --only … --checked-at …]`, client-import budget and size numbers) plus a pointer in "Where the data lives". REPORT-COVERAGE.md updates the scorecard row, the 190/491 row, the "Eight state and territory pathways" row (now "Supported (state outlook)"), the "Personal state ranking" row ("Partly supported") and the data-sources paragraph. HANDOFF.md has a new "Latest" section and roadmap step 3 marked done. STRATEGY.md decision-log row: "State outlook shipped; interim 190/491 sentences (S1) retired…". scripts/README.md has a short state-lists / staleness section.
- **CLAUDE.md:** the harness allowed the edit. Two lines changed: "Loading data" (state rule data via `state-rule-data.ts` is an allowed client import) and the UI line (report order now includes the state outlook section and `state-outlook-view.ts`).

## TDD evidence

RED for the scorecard and panel link, before any implementation (`npx vitest run src/lib/report/scorecard.test.ts src/lib/report/panel-nominated.test.ts`):

```
× lists 12 months newest first with the exact copy      (expected '#states' → '#state-outlook-190')
× works for 491 using the 491 pool                      (Expected "#state-outlook-491", Received "#states")
× uses each visa's state outlook summary as the 190 and 491 sentence
   Expected: "Strongest evidence in SA and WA. Not open to you now in 2 states."
   Received: "At least 35 invited as at Oct 2026, across all states. Each state selects by its own rules."
× no longer counts invitations across all states in the 190 and 491 cards
× refuses to build 190 and 491 cards from data without state summaries
Tests  5 failed | 19 passed (24)
```

GREEN: `Tests 24 passed (24)`.

RED for the view assembly (`npx vitest run src/lib/report/`): `Cannot find module './state-outlook-view'`, and 8 report-view tests failed (`Cannot read properties of undefined (reading '190')`, `expected undefined to be null`). GREEN: `Tests 241 passed`. The one remaining failure was my banned-copy test matching an official URL (`…-for-onshore-applicants`); the test now ignores `source`/`href` keys.

RED for keepAskedQuestions: `3 failed | 12 passed (15)` with `keepAskedQuestions is not a function`. GREEN: `15 passed`.

Final: `npm run check` passes (prettier, eslint 0 warnings, tsc, **618 tests**). `npm run build` passes and prints `check-rule-staleness: every state rule was checked within 45 days of 2026-11-18`.

New and updated tests:

- `state-outlook-view.test.ts` (real data, fixed asOf 2026-11-17): 8 tiles and 8 matching panels per visa; default 190 and exact subtitle; VIC/ACT/TAS/NT unverified in both visas and NSW 491 not-open for the sample; summaries and any-state tiles; the nurse's questions and QLD wording; answering yearsExperienceLast10 = 8 moves WA 491 out of needs-answers and drops the question; federal null makes every tile unverified; a panel for a state without rules; no banned copy in visible text.
- `report-view.test.ts`: the outlook is built and its summaries are the 190/491 card sentences, with panels read at 95/105 points; the outlook is null for loading, notIndexed, noData and loadFailed.
- `scorecard.test.ts`, `panel-nominated.test.ts`, `questions.test.ts`: as above.

## First-load JS (P24)

Next 16's build output no longer prints first-load sizes. I measured every `/_next/static/chunks/*.js` referenced by `out/<page>/index.html`, raw and gzipped (Node zlib):

| Page    | Before (c43bc8e)            | After (7163150)             | Delta                        |
| ------- | --------------------------- | --------------------------- | ---------------------------- |
| /check/ | 1149.3 KB raw / 364.5 KB gz | 1457.9 KB raw / 393.5 KB gz | **+29.0 KB gz** (+309 KB raw) |
| /sample/ | 1074.0 KB raw / 341.6 KB gz | 1463.0 KB raw / 394.9 KB gz | **+53.3 KB gz** (+389 KB raw) |

Both are under the ~60 KB stop line, but /sample/ is close. Its larger delta comes from code /check/ already loaded (Mantine Select/DateInput/NumberInput and @mantine/dates, pulled in by the Sharpen form) on top of the shared outlook chunk (`904-*.js`, 48 KB gz: rules, lists, outlook logic and components). The 5 data files alone are about 9.7 KB gzipped.

## Browser verification

Setup: headless Chrome 157 (`--headless=new --remote-debugging-port`), driven over the DevTools protocol by a Node script using the built-in WebSocket (no dependencies, scripts kept in the scratchpad), against `out/` served by `python3 -m http.server 3017`. I stopped both afterwards. Clicks are real `Input.dispatchMouseEvent` presses.

### /sample/ (ICT Business Analyst, onshore VIC), 41/41 pass

- PASS: nav lists "05 State outlook" → `#state-outlook`, and there is no "State pathways". The full nav is: Reality check, 189/190/491 in detail, State outlook, Your points, What could change, Your personal dates, Occupation context, Get organised, Useful definitions.
- PASS: the old `#states` section and `.report-state-row` are absent.
- PASS: the 190 grid renders 8 tiles and 8 panels, and so does the 491 grid.
- PASS: the scorecard 190 card shows the 190 outlook summary ("No state shows strong published evidence for your profile yet."), and the 491 card shows the 491 summary.
- PASS: the scorecard has no "across all states" S1 sentence.
- PASS: VIC, ACT, TAS and NT read "Not yet verified" for 190 and for 491 (8 tiles), each with published evidence ("under 20 invited, so may be zero"), not reason text.
- PASS: NSW 491 reads "Not open to you now" ("Closed for 491 in 2026–27").
- PASS: VIC, ACT, TAS and NT are never Strongest evidence or Worth watching.
- PASS: each visa has an "Any state" tile.
- PASS: "Not advice to apply. Rules change; check the official page." appears in 16 of 16 panels.
- PASS: every tile (16), clicked with a real mouse, opens its panel. 491 tiles are clicked after switching the control to Subclass 491.
- PASS: every opened panel is scrolled into view and its `<summary>` holds focus (16/16).
- PASS: the 491 panel link reads "See your state outlook" → `#state-outlook-491`, and following it displays the 491 grid and hides 190.
- PASS: the Sharpen form renders after the outlook and is read-only on /sample/ (visible inputs read-only, "Sample answers can't be changed.").
- PASS: the heading outline never skips a level: H2 State outlook | H3 Subclass 190 | H4 Western Australia · 190 | H5 Can you apply? | H5 What the data shows | H5 Your points there.
- PASS: no console errors or exceptions at desktop width.
- PASS: at 390px there is no horizontal overflow (scrollWidth 390, and no element in the outlook beyond the viewport).
- PASS: at 390px the tiles sit in 2 columns.
- PASS: no console errors at 390px.
- PASS: with reduced motion, the scorecard and outlook show at opacity 1 with transform none 80 ms after scrolling to them. A 0.6 s reveal would still be mid-way at that point.
- PASS: with reduced motion, scroll-behaviour is `auto`.
- PASS: in print media both visa grids are displayed (block, block), all 16 state panels are expanded (16/16), and the visa switch is hidden.
- PASS: the printed PDF (`Page.printToPDF`, text via pdftotext) contains "Subclass 190" and "Subclass 491", all 16 "{State} · {visa}" panel headings, the panel footer 16 times, and the Sharpen form.
- PASS: no console errors under reduced motion or print.

### Nurse /check/ flow (Registered Nurse 254418, living in QLD), 18/18 pass

The profile was restored through the check's own opt-in saved-profile path, then the four steps were submitted.

With opt-in saving:

- PASS: the report shows the state outlook.
- PASS: WA 491 starts in "Needs your answers" ("at least 20 invited at ≤105 (as at Oct 2026)").
- PASS: the editable Sharpen form asks: months lived in Queensland; months worked in Queensland "…or one Queensland treats as related (same first 3 ANZSCO digits)"; years of skilled work in the last 10 years; study state.
- PASS: typing "8" into "Years of skilled work … last 10 years" moves WA 491 live: Needs your answers → **Strongest evidence**. Needs-answers tiles drop from 3 to 2.
- PASS: the scorecard 491 card follows the new summary: "Strongest evidence in WA. Not open to you now in 2 states."
- PASS: the answer is not in the URL (`http://127.0.0.1:3017/check/`).
- PASS: opt-in saving stores `yearsExperienceLast10 = 8`.
- PASS: "Clear this answer" restores WA 491 to Needs your answers and saves `yearsExperienceLast10: null`.
- PASS: the /check/ report at 390px has no overflow (390).
- PASS: no console errors.

Without saving (the "Save my progress" box unchecked before the report):

- PASS: the same outlook, starting tile, questions and live move to Strongest evidence.
- PASS: the URL is unchanged.
- PASS: nothing is written to localStorage (`null`).
- PASS: no console errors.

### Other pages, 4/4 pass

- PASS: `/states/`, `/methodology/` and `/` render.
- PASS: no console errors on those pages.

### Screenshots

In `/Users/aveomac/aveo-projects/landfall/.superpowers/sdd/2026-11-18-state-outlook/screenshots/`:

- `task11-sample-desktop-1440-outlook.png`: sample outlook, 190 grid, WA panel open, Sharpen form (read-only).
- `task11-sample-desktop-1440-top.png`: sample report top (header and scorecard).
- `task11-sample-mobile-390-outlook.png`: sample outlook at 390px (2 × 4 grid, WA panel open, form).
- `task11-sample-mobile-390-top.png`: sample report top at 390px.
- `task11-nurse-check-answered-1440.png`: nurse check, 491 grid after answering 8 years. WA is now Strongest evidence, and the answered question stays visible with "Clear this answer".
- `task11-sample-print.pdf`: the printed sample report.

(The older `desktop-1440.png`, `mobile-390.png` and `print.pdf` in that folder are from Task 10.)

## Files changed

Code commit 7163150:

- New: `src/lib/report/state-outlook-view.ts` and its test, `src/components/data/state-rule-data.ts`, `src/components/report/state-outlook-section.tsx`, `scripts/check-rule-staleness.ts`.
- Modified: `src/lib/report/{scorecard,panel-nominated,report-view}.ts` and their tests, `src/lib/state-outlook/{questions,view}.ts`, `questions.test.ts`, `src/components/report.tsx`, `src/components/report/{report-sections,report-view}.ts`, `src/components/check-flow.tsx`, `src/app/globals.css` (dead CSS removed), `package.json` (prebuild).

Docs commit 041ec3c: `CLAUDE.md`, `docs/{DATA,HANDOFF,REPORT-COVERAGE,STRATEGY}.md`, `scripts/README.md`.

## Self-review

- Every new string was checked against `BANNED_COPY`: subtitle, panel and tile copy via the test, and the "can and cannot tell you" text by reading.
- No profile data reaches the URL or storage except through check-flow's existing effect.
- Components only render.
- The state-outlook view and keepAskedQuestions are pure and tested.
- `report.tsx` shrank by 37 lines.
- No new dependencies.
- `.superpowers/` was never staged.

## Concerns / follow-ups

1. **Answered-but-settled questions after a reload.** `keepAskedQuestions` keeps a question visible for the session. After a page reload with saved answers, a question whose answer already settles its rule is not shown again, so the user can't see or change that saved answer except by clearing all saved data. A pure fix needs `RuleCheck.field` on pass/fail verdicts as well, not only needs-answer, which changes `requirements.ts` (Task 7 code). I suggest it as a follow-up.
2. **/sample/ JS delta is +53 KB gz,** under the ~60 KB line but close. If step 4 adds weight, consider lazy-loading the Sharpen form (Mantine dates) or the state rule chunk.
3. **The state outlook has no numbered section label** ("05 / …"), unlike the older `report-section` blocks. Nor do the visa panels, so it is consistent with them. I left it as Task 10 built it.
4. **The 190/491 chip is still "State decides" (amber)** even when the summary says "Strongest evidence in WA". The brief didn't ask to change it; a group-driven chip could be a later polish item.

---

# Fix report: ruling P25, M1 and M2 (commit 4e9e517)

Commit: `4e9e517 fix(state): reset state-relative answers on a state change and keep answered questions editable`

## Defect, reproduced before the fix

The nurse (254418) lives in QLD and answers `monthsLivingInState: 14` and `monthsWorkingInState: 14`. The state is then edited to NSW with those answers kept. Scratch script on real data:

```
defect (state edited, answers kept): strongest
with reset: needs-answers
```

## Changes

**(a) Reset on a state change.**

- `resetStateRelativeAnswers(previous, next)` lives in `src/lib/state-answers.ts`.
- When `state` or `onshore` changes, it sets `monthsLivingInState`, `monthsWorkingInState` and `livesRegional` to null. When `onshore` changes, it also sets `monthsLivingOffshore` to null.
- It returns `next` untouched when neither field changed.
- It is applied in check-flow's single update path: `updateMany` does `setProfile(p => resetStateRelativeAnswers(p, {...p, ...patch}))`, and `update` delegates to `updateMany`. Every answer, from the main steps or the Sharpen form, therefore goes through it.
- Profile restore, `?occupation=`, the clear action and "use example" replace the profile wholesale, as before.

**(b) Answered questions stay editable.**

- In `requirements.ts`, pass, fail and short-streak-unverified verdicts that an answer decided now carry `field` through an `answered(field, verdict)` helper. This covers the months fields, years experience, visa expiry, job offer, lives-regional and study state.
- Verdicts decided by residence, such as "You don't currently live in X" or "Not checked … while you live in another state", carry no field.
- Work-months checks keep `related` whenever they carry a field, so an answered work question keeps its state's definition of related work.
- `questionsNeeded` lists two kinds of field:
  - Open questions, as before: needs-answer checks of a needs-answer deciding stream.
  - Every answered field (a non-needs-answer check with `field`) from **all** of that state's streams. The ruling said "deciding streams". I used all streams on purpose: an answer that fails one stream can switch the deciding stream. For example, typing "1" on the way to "10" years fails WA General, so Graduate decides. With deciding streams only, the question would still vanish mid-typing.
- The result is computed from the profile alone, so it survives a reload and Edit.
- Removed: `keepAskedQuestions` and its tests, plus the `useState` / in-render `setShown` in `StateOutlookSection`, which no longer needs `"use client"`.
- Visible effect: answered main-check fields that a state rule uses now appear as well. On the sample, the read-only "When does your current visa expire?" is listed next to the study question. For the nurse, the list is months lived, months worked, years in last 10, visa expiry, study state.

**M1.** `src/components/data/state-rule-data.test.ts` checks that `stateRuleData.lists` holds exactly nsw, qld, sa and wa, that `federal` is not null, and that every `listId` the rules reference is loaded.

**M2.** I measured once at gzip's default level: the four lists plus the federal list are 10,757 bytes. Every mention now reads "about 11 KB gzipped": the `state-rule-data.ts` comment, DATA.md (which also gives "10.8 KB measured … 18 Nov 2026"), HANDOFF.md and CLAUDE.md. HANDOFF and REPORT-COVERAGE no longer mention `keepAskedQuestions` or the reload follow-up, and they describe the reset.

## TDD evidence

RED for the reset and view tests, before implementation (`npx vitest run src/lib/state-answers.test.ts src/lib/report/state-outlook-view.test.ts src/components/data/state-rule-data.test.ts`):

```
× clears the answers about the state you live in when the state changes
× also clears months offshore when onshore changes
× keeps every answer when neither the state nor onshore changes
× never reads months lived in one state as months in another after a state change
× keeps a saved answer that settles its rule among the questions, so it can be changed
× words an answered work question with the state's definition of related work
TypeError: resetStateRelativeAnswers is not a function (×4)
AssertionError: expected [ 'monthsLivingInState', …(2) ] to include 'yearsExperienceLast10'
Tests  6 failed | 17 passed (23)
```

The M1 tests passed from the start; they guard existing behaviour.

I wrote the requirement-level field tests in `evaluate.test.ts` after the `requirements.ts` change. To capture their RED honestly, I temporarily restored the original `requirements.ts` with `git diff > patch; git checkout; run; git apply`:

```
× names the answer that decided a pass or fail, so it stays editable
× keeps the related-work definition on an answered work check
× asks the questions that would change a tile, plus answered ones, worded for the user's state
× keeps a saved answer that settles its rule among the questions, so it can be changed
× words an answered work question with the state's definition of related work
× does not ask an unanswered question whose answer could not change a tile
Tests  6 failed | 66 passed (72)
```

With the patch re-applied: `Tests 72 passed (72)`.

I updated three existing view-test expectations for the intended change: `visaExpiry` is now listed as an answered field, and the answered years question now stays listed.

Final: `npm run check` passes (**627 tests**, 0 lint warnings). `npm run build` passes, with the staleness line "every state rule was checked within 45 days of 2026-11-18".

## Browser re-run (headless Chrome over CDP, `out/` on python http.server, both stopped afterwards)

New QLD→NSW edit scenario: 11/11 pass.

- PASS: QLD 190 starts in Needs your answers.
- PASS: typing 14 and 14 months in the QLD questions makes QLD 190 **Strongest evidence** live.
- PASS: both answered questions stay visible with the value 14. The wording names Queensland, and the work question says "same first 3 ANZSCO digits".
- PASS: after a page reload and resubmit, both saved answers are still listed and editable, and QLD 190 is still Strongest evidence.
- PASS: Edit answers → Back ×3 → choose NSW in "Current state or territory" (a real Mantine option click) → resubmit.
- PASS: NSW 190 is **Needs your answers**, neither Strongest evidence nor Worth watching.
- PASS: the save holds `state: NSW`, `monthsLivingInState: null`, `monthsWorkingInState: null`.
- PASS: the months question asks again, empty, worded "…have you lived in New South Wales?".
- PASS: the URL has no query.
- PASS: no console errors.

Nurse suite, re-run: 18/18 pass.

- PASS: live change (8 years moves WA 491 to Strongest evidence).
- PASS: "Clear this answer" (the button is reachable now that answered questions stay listed) restores the tile and saves null.
- PASS: saving on and off both behave as before.
- PASS: the URL is clean.
- PASS: 390px has no overflow.
- PASS: no console errors.

`task11-nurse-check-answered-1440.png` was regenerated.

Sample suite, re-run: 41/41 pass. The read-only form now has 2/2 read-only inputs (visa expiry and study state).

First-load JS after the fix: /check/ 393.6 KB gz and /sample/ 395.0 KB gz (deltas from c43bc8e: +29.1 and +53.4 KB), effectively unchanged.

## Remaining notes

- The main-check "state" question (asked only when onshore with no state) carries no `field` once answered, so it leaves the Sharpen form after it is answered. It stays editable in step 1 via Edit answers.
- An answered field shows whenever any stream of any state used it, which can include main-check answers such as visa expiry. That is intended under "answered stays visible".
