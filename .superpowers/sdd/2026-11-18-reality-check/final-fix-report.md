# Final whole-branch review: fix report (S11–S16 + minor)

Branch `roadmap/reality-check`, base `fbd7db6`. Status: **DONE**.

## Commits

| SHA     | Subject                                                                                 |
| ------- | --------------------------------------------------------------------------------------- |
| 80b8f04 | fix(report): say masked same-score counts may be zero (S13)                             |
| 61f942d | fix(report): say an EOI month after the snapshot isn't published yet (S14)              |
| a85f9a4 | fix(report): say higher-score counts are not a queue place (S11)                        |
| d87d964 | fix(report): say EOIs like yours counts each EOI in its current status (S12)            |
| b29059e | fix(report): tell points-only users they chose a points check (S15) (+ "Not loaded" chip) |
| cbcff97 | fix(report): mark 190/491 invitation counts as all states (S16)                         |
| 2e19247 | docs: record the final-review honesty fixes (S11–S16)                                   |
| fdecda6 | style(report): show the queue-note link as a link; keep card counts on one line         |

Final state: `npm run check` passes with 0 warnings (37 files, 323 tests). `npm run build` passes (static export). Headless Chrome against `out/`: **73/73 checks PASS**.

## Per finding

### I1 / S11: queue caveat

- **Change.** `copy.ts` exports `LinkedNote` and `QUEUE_NOTE` (the ruled text, with the link "How to read the pool" → `/methodology/#pool`). The `/methodology/` page already had `<section id="pool">` ("A pool comparison, with context."), so no methodology change was needed. Changes in the view model:
  - `Scorecard.queueNote`: set when any card shows a higher-score count, otherwise null. No note appears for points-only, no-data or failed loads.
  - `ScorecardCard.aheadLabel`: "Ahead of you" (189), "Higher score (national pool)" (190/491).
  - `WhereYouStand` (segments variant) `.queueNote`. This one builder serves 189, 190 and 491.
  - The 491 `nationalNote` uses the ruled text; 190 keeps its note.
  - The new `src/components/report/note-with-link.tsx` (with a CSS module) renders the note once under the scorecard cards and under the sentence below each queue bar.
- **RED.** `npx vitest run src/lib/report`: 6 failed | 78 passed (84). `queueNote` and `aheadLabel` were undefined, and the 491 note had the old text.
- **GREEN.** 84/84; check 322/322.
- **Browser.** /sample/:
  - One note sits after the cards, and the 189, 190 and 491 queue bars each have the note after the bar, with `href="/methodology/#pool"`.
  - The 190/491 rows read "Higher score (national pool)".
  - The 491 note matches the ruling, and the 190 note is unchanged.
  - Clicking the scorecard link lands on `/methodology/` with hash `#pool` and the section at the top of the viewport.
  - The PDF text has the note 4 times and "How to read the pool" 4 times.
- **Follow-up styling (fdecda6).** In the first screenshots the link was muted and not underlined, and "882–920" broke at the en dash next to the longer 190/491 label. The link now has the forest colour and an underline, and `.row b` uses `white-space: nowrap`. Re-verified at 1440 and 390 with no overflow.

### I2 / S12: current-status caveat

- **Change.** `EoisLikeYours` ready now has `statusNote`: "Each EOI is counted once, in its status as at {Mon YYYY}; EOIs that lodged or closed may have been invited earlier." It renders under the lead sentence. The tile, legend, bar aria-label and table column now say "Invited, not yet lodged".
- **RED.** 1 failed | 10 passed (11): `statusNote` was undefined.
- **GREEN.** `src/lib/report` 84/84.
- **Browser.** The sample shows the note ("as at Oct 2026"). The tile, legend, table header and aria-label all start "Invited, not yet lodged", and no bare "Invited" tile remains. The note is also in the PDF.

### I3 / S13: same-score masked counts

- **Change.** `copy.ts` now has exactly one mid-sentence helper, `countInSentence` ("under 20 (so may be zero)"), and one clause helper, `countClause`, moved from panel-189's private `clause`. Removed: the unused export `countPhrase` and the duplicate `inSentence` in eois-like-yours.ts. The same-score sentence uses `countInSentence` for before, same month and after.
- **RED.** 6 failed | 21 passed (27). Received "…, under 20 in the same month…" and "About under 20 were submitted before…".
- **GREEN.** 76/76. New tests: masked same-month, masked before, plus unit tests for both helpers.

### I4 / S14: EOI month after the snapshot, and a missing row

- **Change.** A shared `afterSnapshotText(month, asAt)` lives in `copy.ts`.
  - `SameScore` gains `after-snapshot`. It returns once `submittedMonth > core.asAt`, after the existing prompt check for no or future month, and before loading, so it never waits on the detail file.
  - `EoisLikeYours` gains `after-snapshot`, checked first, and `no-eois`: "No {occupation} 189 EOIs from {Mon YYYY} appear in this snapshot." `no-eois` applies when the 189 cohort table exists but has no row for an in-window month.
  - The too-old and loading paths are unchanged.
  - The existing components already render `view.text` for non-ready kinds.
- **Judgement call.** When a detail file has **no 189 cohort table at all** (283 of 493 occupations), the "not available for this occupation" text stays. That case concerns the whole occupation, not one missing month.
- **RED.** 3 failed | 77 passed (80). The same-score block printed "About 95–114 were submitted before Nov 2026, 0 in the same month and 0 after." EOIs like yours said "not available for this occupation" for both Nov 2026 and Aug 2025.
- **GREEN.** 80/80.
- **Browser.** Nurse check (`?occupation=254499`, EOI date 05 Nov 2026): both "Among your score" and "What happened to EOIs like yours" show "Your EOI month (Nov 2026) is after this snapshot (as at Oct 2026), so it isn't in the published data yet." There is no "About …" split and no "not available". Screenshot: `screenshots/nurse-eoi-after-snapshot-1440.png`.

### I5 / S15: points-only users

- **Change.** `notIndexed`:
  - Headline: "You chose a points check only, so there is no occupation data to compare. Your points breakdown is below."
  - Every card: sentence "Points check only.", chip "Points only" (neutral).
  - `noData` keeps "too limited to compare" with the "No data" / "State decides" chips.
  - The no-data card logic moved into `noneCardParts`.
  - The old Task 10 test expectation was replaced, per the ruling.
- **RED.** 2 failed | 14 passed (16) (shared with the minor fix). The headline was still "too limited"; the loadFailed chip was still "No data".
- **GREEN.** 84/84.
- **Browser.** `/check/?occupation=other` shows the S15 headline, three "Points only" chips with "Points check only.", no queue note, no panels, and consistent nav numbering.

### I6 / S16: national qualifier for invitations

- **Change.**
  - `NominatedPanel.invitationsHeading` is "Invitations recorded, all states". It is rendered from the view model instead of being hard-coded.
  - Masked rows read "under 20 invited, so may be zero (as at {Mon YYYY})".
  - Scorecard 190/491 sentence: when any month in the 12-month window after `lastConfirmedMonth` is masked, it reads "At least N invited as at {Mon YYYY}, across all states; later months under 20, so may be zero. Each state selects by its own rules."
- **RED.** 3 failed | 82 passed (85).
- **GREEN.** 85/85; check 323/323.
- **Browser.** Sample 190 card: "At least 29 invited as at May 2026, across all states; later months under 20, so may be zero. Each state selects by its own rules." 491 card: the same with 21 / Mar 2026. Both panels are headed "Invitations recorded, all states", and all 15 masked rows match the new form. All of this is in the PDF.

### Minor: failed-load 189 chip

- `loadFailed` 189 chip is "Not loaded" (190/491 keep the neutral "State decides"). Covered in the S15 test commit (RED/GREEN above).

## Docs

- `docs/REPORT-COVERAGE.md`: updated the scorecard, 189 pool, 190/491 and EOIs-like-yours rows, plus the no-data paragraph (points-only and "Not loaded").
- `docs/HANDOFF.md`: updated the card description and added a final-review fixes bullet.
- `docs/STRATEGY.md`: added the decision-log row "Points-only users see 'You chose a points check only…' (S15)".

## Browser verification

- Setup: headless Chrome 157 via CDP with Node's built-in WebSocket and no new dependencies, against `python3 -m http.server 3017 --directory out`. Both were stopped afterwards.
- Script: `/private/tmp/claude-501/-Users-aveomac-aveo-projects-landfall/bf2c0e48-6228-44dd-99b2-f35c431c2c58/scratchpad/view/verify-final.mjs`. It extends the Task 10 regression script, and its output is in `verify-final-output.txt` beside it. The Task 10 expectations for points-only and the "Invited" tile were updated to the new rulings.
- Result: **73/73 PASS**. The run still includes the Task 10 regressions: order, nav, focus, 390 layout, the 12px floor, print, reduced motion and no console errors.
- Refreshed in `screenshots/`: `sample-desktop-1440.png`, `sample-mobile-390.png`, `sample-print-a4.pdf` (verified with `pdftotext`), `nurse-check-desktop-1440.png` and `nurse-check-mobile-390.png`. Also added `nurse-eoi-after-snapshot-1440.png`.

## Self-review

- The diff is limited to `src/lib/report`, `src/components/report` and the three docs. There are no new dependencies and nothing under `.superpowers/` was staged.
- Every masked count in a sentence now goes through `countInSentence` or `countClause`. There are no dead exports.
- New copy passes the `BANNED_COPY` tests: the scorecard, panel and EOIs banned-copy tests now include the new texts and variants.

## Concerns

None blocking. Two notes:

- I kept "not available for this occupation" for occupations with no 189 cohort table at all (described under S14 above).
- The EOIs-like-yours lead sentence still says "{N} are invited". The ruling did not change it, and the new status note directly below qualifies it.
