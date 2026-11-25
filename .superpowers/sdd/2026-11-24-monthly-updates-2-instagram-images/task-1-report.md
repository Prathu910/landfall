# P2 Task 1 report: card view-models

Status: DONE_WITH_CONCERNS (minor, below). Commit: see `git log` ("feat(social): Instagram card view-models").

## Implemented
- `social-spec.ts`: constants exactly as briefed.
- `glyphs.ts`: `parseUnicodeRange`, `charsOutside`.
- `cards.ts`: `CardView` union, `roundSetCards`, `monthSetCards`, `cardStrings` (excludes id, visas, position, share keys; adds "3/6" text). Cover, round-cover, round and closing builders.
- `cards-state.ts`: `buildStateCard` (reuses `buildStateSection` from the recap with a no-op linker, so map labels, shades (`shadeBand`), legend and not-recorded text are the page's own) and `buildSpotlightCard` (from `facts.data.spotlight`, per R10).
- Handles 1-3 `cardPicks`, no previous round (picks null), no comparison (notListed null), no round (5-card set, cover has no round stamp, visas 190/491 only), two rounds (newest used), spotlight not-on-list / not-listed / "Little changed this month." / null cutoffs ("Not listed").

## Tests
- `cards.test.ts` (set shapes, positions, picks, TAS "<20", notRecorded, closing strings, banned copy, no-round, two rounds, spotlight variants), `cards-numbers.test.ts` (every facts file + 3 fixtures; whole-token match against recap view strings; spotlight against formatted spotlight facts, R10; position, tag, MRZ excluded; sources checked against the page), `glyphs.test.ts` (Archivo latin-wdth and Big Shoulders latin-900 ranges read from node_modules).
- TDD note: tests were written together with the implementation in one pass (not run red first); failures found on first run (wrong test expectation for column order, visa tokens, "20") were fixed.
- `npm run check`: pass (166 files, 1701 tests). Output pristine apart from an existing lint warning in `.superpowers/brainstorm/.../lib.js`.

## Notes / concerns
- Big Shoulders' `latin-900.css` has no `unicode-range`; the test reads `900.css` and picks the `latin-900-normal` face block.
- Number test treats "189/190/491" and "20" (the masking threshold) as fixed copy tokens.
- `cards-state.ts` also holds the spotlight card (file list fixed by the plan); `StateCard` is a union of two per-visa types so `Extract<CardView,{id:"state-491"}>` works; builder casts.
- Round card sub-line adds "Lowest scores invited ran 65-100"; the not-listed line says "Listed on {previous round date}, not this round (N): a, b, c, others" (facts hold no per-occupation last-listed date, unlike the mockup). The round card has no round-set-only fields, so the month set's card 2 is `toEqual` to the round set's.
- Card 2 picks' previous label is "4 Jun 2026: 85".
