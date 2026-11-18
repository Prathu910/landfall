# Task 8 report: state tile and panel view-models

Commit: see `git log -1` (feat(state): build state tiles and panels).

## Implemented
- `src/lib/state-outlook/view.ts`: `buildTiles`, `buildStatePanel`, `buildAnyStateTile`, types `Tile`, `StatePanel`, `CanApplyLine`.
- P21: deciding stream's `restriction` becomes a final "?" line "Also required: {text} — not checked here" (trailing full stop stripped) with the restriction's source and its own checked note.
- Secondary closure (deciding stream status closed + secondary): first canApply line "Reported closed for {visa} in 2026–27, not yet verified on the official page" with the status source.
- Possessive removed in Task 7 text (`evaluate.ts`, `context.ts` `possessive` deleted): "Not on the Western Australia 2026–27 list for 190", "Occupation list for X is not available"; tests updated.
- Real-data profiles moved from `outlook.real-data.test.ts` into `__fixtures__/real-data.ts` (`cases`, `Case`) so both suites share them.

## Deviations from the brief's signatures (needed by the spec'd text)
- `buildTiles(outlook, points)` and `buildAnyStateTile(anyState, points)`: "≤{points}" needs the score and `Outlook` does not carry it. `visa` param of `buildAnyStateTile` dropped (unused; lint). It also returns `note`.
- `StatePanel` gains `streamName: string | null` (the panel must name the deciding stream).

## Notes
- Competitors sentence reads "{count} EOIs for visa 190 nominating {State} have {n} points or more (as at Mon YYYY)" (avoids "1,132 190 EOIs"); masked starts "Under 20 (so may be zero)". The pool's as-at month is the newest month StateSide covers (StateSide has no explicit as-at).
- ✗ lines show the rule's label (e.g. "Closed in 2026–27") with the ✗ mark; RuleCheck carries no separate failure finding.
- Checked note: stale -> "Last checked {date}; may have changed"; unverified (secondary or otherwise) -> "Not yet verified on the official page"; else "checked {date}". Federal list rows show its own import date (18 Nov).

## TDD
RED: `npx vitest run src/lib/state-outlook/view.test.ts` failed (module ./view missing, "no tests"). GREEN after implementation; 2 test expectation fixes (federal checked date, capitalisation), then restriction/results tweaks. Final: `npm run check` 52 files / 588 tests pass, 0 warnings; `npm run build` passes.

## Sample panels (real data, as at 2026-11-18)
### Queensland · 190 (Strongest evidence), nurse, 95 points
Stream: Skilled workers living in Queensland
- ✓ On the federal occupation list for 190 (checked 18 Nov 2026)
- ✓ Open in 2026–27 (checked 17 Nov 2026)
- ✓ Open to those living in Queensland
- ✓ On the Queensland 2026–27 list for 190
- ✓ At least 9 of the last 12 months living in Queensland
- ✓ At least 9 of the last 12 months working in Queensland in your nominated occupation or one Queensland treats as related (same first 3 ANZSCO digits)
- ? Also required: Not available to anyone nominated for, applying for or holding a 491 or 489 visa — not checked here (source: QLD page, checked 17 Nov 2026)
Data:
- Under 20 (so may be zero) EOIs for visa 190 nominating Queensland have 95 points or more (as at Oct 2026)
- At least 39 invited at 95 points or below (as at Oct 2026)
- No invitations recorded at 95 points or below (as at Sep 2026)
- No invitations recorded at 95 points or below (as at Aug 2026)
- Peak in the last 12 months: at least 39 invited at ≤95 (as at Oct 2026)
- Invited scores ran only at 80 over the last 12 months (as at Oct 2026)
Points: "95 federal points with nomination". Results link: none (QLD rules have no resultsUrl). Footer: "Not advice to apply. Rules change; check the official page."

### Victoria · 491 (Not yet verified), ICT BA, 90 points
Stream: Skilled Work Regional (491) Registration of Interest
- ? Reported closed for 491 in 2026–27, not yet verified on the official page (source: liveinmelbourne.vic.gov.au/.../491; Not yet verified on the official page)
- ✓ On the federal occupation list for 491 (checked 18 Nov 2026)
- ? Closed in 2026–27 (Not yet verified on the official page)
- ? Open to those living in Victoria, in another state or offshore (Not yet verified ...)
- ? Any occupation on the federal list for 491 (Not yet verified ...)
Data: "859–878 EOIs for visa 491 nominating Victoria have 90 points or more (as at Oct 2026)"; three "No invitations recorded at 90 points or below (as at Oct/Sep/Aug 2026)".
Points: "90 federal points with nomination"; "Victoria ranks with its own Victorian Points Test (VPT) (not calculated here)."

## Fix report (P22)
Changes: (a) StateSide.competitorsAtOrAbove is now `Interval | null` (null = no pool published; state-evidence.ts and its test updated); empty invitedAtOrBelow gives "no published invitation data for this state in the last 12 months" (tile) and the capitalised data sentence; "No published count of competing EOIs for this state"; "none recorded" only for covered zero months. (b) secondary closure drops the stream's own "Closed in 2026–27" line (asserted). (c) one `checkedNote(checkedAt, stale, unverified)` used by checks and restrictions. (d)(e)(f)(g)(h) copy per P22. (i) `source` optional, omitted when empty (withSource); sweep now covers streamName and any-state label/note and asserts no empty source.
RED: new/changed tests failed (10 failures) before implementation. GREEN: `npm run check` 52 files / 592 tests pass; `npm run build` passes.

Sample panels re-rendered (real data, as at 2026-11-18):
```
Queensland · 190 | Strongest evidence | Skilled workers living in Queensland
✓ On the federal occupation list for 190 [checked 18 Nov 2026]
✓ Open in 2026–27 [checked 17 Nov 2026]
✓ Open to those living in Queensland [checked 17 Nov 2026]
✓ On the Queensland 2026–27 list for 190 [checked 17 Nov 2026]
✓ At least 9 of the last 12 months living in Queensland [checked 17 Nov 2026]
✓ At least 9 of the last 12 months working in Queensland in your nominated occupation or one Queensland treats as related (same first 3 ANZSCO digits) [checked 17 Nov 2026]
? Restriction, not checked here: Not available to anyone nominated for, applying for or holding a 491 or 489 visa [checked 17 Nov 2026]
-- data
Published as under 20: EOIs for the 190 visa that name Queensland and have 95 points or more (as at Oct 2026)
At least 39 invited at 95 points or below (as at Oct 2026)
No invitations recorded at 95 points or below (as at Sep 2026)
No invitations recorded at 95 points or below (as at Aug 2026)
Published invitations in the last 12 months were at 80 points (as at Oct 2026)
-- points
95 federal points with nomination

Victoria · 491 | Not yet verified | Skilled Work Regional (491) Registration of Interest
? Reported closed for 491 in 2026–27, not yet verified on the official page [Not yet verified on the official page]
✓ On the federal occupation list for 491 [checked 18 Nov 2026]
? Open to those living in Victoria, in another state or offshore [Not yet verified on the official page]
? Any occupation on the federal list for 491 [Not yet verified on the official page]
-- data
859–878 EOIs for the 491 visa name Victoria and have 90 points or more (as at Oct 2026)
No invitations recorded at 90 points or below (as at Oct 2026)
No invitations recorded at 90 points or below (as at Sep 2026)
No invitations recorded at 90 points or below (as at Aug 2026)
-- points
90 federal points with nomination
Victoria ranks with its own Victorian Points Test (VPT), which is not calculated here.

```
