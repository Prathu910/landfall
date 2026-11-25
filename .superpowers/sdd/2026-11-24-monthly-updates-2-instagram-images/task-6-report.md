# Task 6 report

Implemented `ogImageFor(month, publicFiles)` in `src/lib/updates/meta.ts` (own og.png, else newest round's og.png, else /og.png) with three tests in `meta.test.ts`; the page builds the file set from `public/social/<month>` and passes the result to `openGraph.images`, twitter and `recapJsonLd`. Tests were written alongside the implementation (no separate RED run recorded). Re-rendered 2026-10 from scratch (removed `public/social/2026-10`, round then month): 22 PNGs, all well under 300 KB, sets 0.8 MB (round) and 1.2 MB (month). I viewed every PNG in light and dark; no overflow, clipping or safe-zone problems. Docs: HANDOFF (where and how to post), STRATEGY decision log (R16), CLAUDE.md (`scripts/social/` line), ledger. scripts/README.md already documented the commands.

Commits: 187ed3f feat(updates): recap OG image from the card set; 4d6ea4f data: 2026-10 Instagram card sets.
Verification: `npm run check` exit 0 (1787 tests), `npm run build` ok, `out/updates/2026-10/index.html` og:image = https://migratelens.com/social/2026-10/og.png. I did not run Lighthouse in this task.

## Files (bytes)
Month set (public/social/2026-10/month/): closing-dark 103786, closing-light 84791, cover-dark 132493, cover-light 93299, spotlight-dark 113895, spotlight-light 97022, state-190-dark 96192, state-190-light 100737, state-491-dark 96790, state-491-light 101135, story-cover-dark 133796, story-cover-light 96878, set.json 7599.
Root: public/social/2026-10/og.png 63197.
Round set (round-2026-10-15/): closing-dark 102056, closing-light 82524, cover-dark 96088, cover-light 77220, og.png 54187, round-dark 108308, round-light 95393, story-cover-dark 101000, story-cover-light 81304, set.json 4333.

## Captions
Round: 
20,000 EOIs invited in the 189 round of 15 Oct 2026, across 159 occupations. Lowest scores invited ran 65–100.
Full figures and sources: migratelens.com/updates/2026-10/
General information, not migration advice.

#australiapr #skillselect #189visa

Month:
SkillSelect update for October 2026. 20,000 EOIs invited in the 189 round of 15 Oct 2026, across 159 occupations. Lowest scores invited ran 65–100. 190 and 491 EOIs by state, as at 31 Oct 2026, with every figure a minimum. Occupation spotlight: Registered Nurses nec, as at 31 Oct 2026.
Full figures and sources: migratelens.com/updates/2026-10/
General information, not migration advice.

#australiapr #skillselect #189visa #190visa #491visa

## Concerns
- Instagram safe-zone/grid-crop guidance was not re-checked online (spec risk 19); social-spec.ts unchanged.
- Round card 2: rows read "65  4 Jun 2026: 85" (current lowest vs previous round's), which is terse for a reader; wording is from earlier tasks.
- Month cover says "in five cards" while numbered 1/6 (card 2 is the round card from the round set).
- Lighthouse not re-run.

## Fix round 1

Commits: edeb7c5 (fix: code, tests, HANDOFF), 3be848a (data: re-rendered 2026-10 sets).

1. Cover copy: `coverCard` in `src/lib/updates/cards.ts` now says "in the next N cards" (N = carousel length minus one), so it cannot contradict the 1/6 counter. Test in `cards.test.ts` ("the cover's sub-line"): the number word equals `cards.length - 1` and `position.of` equals `cards.length`, for a round month (6), a month with the round removed (5) and a data-only month (5).
2. Card 2 alt text: `scripts/social/jobs.ts` `setManifest` now appends two `images` entries (`card: "round"`, light and dark) to the month manifest. Their `file` is the round set's file (same as `reused`) and `alt` starts "Card 2 of 6." Test in `scripts/social/compress.test.ts`. HANDOFF now lists the 6 files in order, says where each alt text is, and describes the round set as a separate 3-card carousel.
3. Previous cutoffs now read "65 was 85 on 4 Jun" (year dropped so it fits; the line below carries the full date); alt text "(was 85 on 4 Jun)". The full "4 Jun 2026" version overflowed `.inner` by 21 px, so the year was dropped. The fit checks pass.

Re-render: removed `public/social/2026-10`, round set then month set, exit 0. Changed PNGs viewed in light and dark: round-light/dark, month cover-light/dark, og.png (story covers carry the same cover text).
Commands and results: `npx vitest run scripts/social src/lib/updates` 255 passed; `npm run check` exit 0 (1791 tests; a first run during the edits returned 1 and the immediate rerun passed, cause not isolated); `npm run build` ok, og:image = /social/2026-10/og.png; `npm run lighthouse -- --only /updates/2026-10/`: mobile light 100/100/100/100, LCP 1.1 s, TBT 6 ms, CPU 4235; desktop light 100s, LCP 292 ms; dark accessibility 100 on both; CPU about 4,200 on all rows.

Concern: "on 4 Jun" has no year; if a previous round fell in an earlier calendar year the line would be ambiguous (not the case for 2026-10).

## Fix round 1, addendum (cross-year previous cutoff)
Rule: "was 85 on 4 Jun" when the previous round is in the same year as this round, "was 85 on 13 Nov 2025" otherwise (`previousDayText` in `cards.ts`; alt text follows). The cross-year text did not fit, so the row layout changed: `.row` padding 7px to 5px, `.was` is an inline-block capped at 170 px (it may wrap to two lines) and the template keeps the date unbreakable (`WasText` in `round-card.tsx`). Tests: `cards.test.ts` (same-year and cross-year strings) and `render.test.ts` (a cross-year fixture renders in Chrome without overflow; the fit check still throws on overflow, as it did before the layout change). Because the layout changed, the round set and month set were re-rendered and the round card viewed in light and dark: all three rows now show "was 85 on / 4 Jun" on two lines. Result: `npx vitest run scripts/social src/lib/updates` and `npm run check` (see output below).
