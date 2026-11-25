# P2 Task 2 report

Implemented `src/lib/updates/social-copy.ts` (`HASHTAGS`, `hashtagsFor`, `caption`, `altText`) and `social-copy.test.ts`.

- Captions: dated sentences built from the cards' own strings (round: title + sub; month: SkillSelect update line, newest round sentence if any, 190/491 as-at sentence, spotlight name), then the recap URL `migratelens.com/updates/YYYY-MM/`, the disclaimer, a blank line and the hashtags.
- Alt text: per card id, every figure in reading order (state map as "NSW at least 790"), prefixed "Card i of n." when numbered.
- Tests: hashtag sets, final hashtag line, URL/disclaimer/date, BANNED_COPY / NaN / "at least 0" / "people" / "next round" across every facts file and fixture (round and month sets), alt text <= 1000 chars.
- TDD: the test file and implementation were written together, so there is no separate red run (a missing module would have failed it).
- `npm run check`: 167 files, 1713 tests passing.
- Concern: none significant. Alt text omits the card's source line and tag by design.
