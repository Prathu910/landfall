# Task 9 report: facts, template read, read check, headline

Status: DONE_WITH_CONCERNS (see Concerns). Commit: `564a2ca feat(outlook): report facts, template read and read check`.

## What was implemented

- `src/lib/outlook/read-contract.ts` (no imports at all): `ReportFacts` (verbatim from the brief), `READ_BANNED` (case-insensitive: guarantee(d), definitely, will be invited, %, chance(s) of, likely to be invited, some invitations, a few), `allowedNumbers`, `checkRead`.
  - `allowedNumbers` = visa points + count numbers + change from/to points + `extraNumbers` + every number token written in any facts string (month strings, captions, route, wait, count text). That is how years and month numbers inside month strings are allowed.
  - `checkRead` reads numbers as `\d[\d,]*(\.\d+)?` tokens with the commas removed. It checks in this order: banned, then number, then length (40–110 words).
- `src/lib/outlook/facts.ts`: `buildFacts(input, o, wait, improve, route)`.
  - `occupation` is the ANZSCO name from the core, or from `occupation-index.json` when there is no core.
  - `dataMonth` is "October 2026", taken from `core.asAt` or else from `manifest.json`.
  - `stamp` and `visas` use display labels and full state names. Ruling R7: the state is null when the best label is not-invited, no-data or not-open.
  - Captions: 189 uses the why line without the confirm note, plus "The last round that listed it was in {Month YYYY}" when 189 isn't inviting. State visas get `stateSentence`. A visa with no core gets a sentence about federal list membership.
  - `counts`: 189 ahead, 189 tied, the last-3 cut-offs, "189 rounds of the last 6 at or below your points", and the latest month of invitations at or below the reader's points for each named state.
  - `route`: each step is written as "Title (sub, N points, Label)". Deadlines are inserted as "Deadline: … (Month YYYY)". Every exact date is cut to month and year by `monthOnly`.
  - `changes`: the biggest jump first, then the other moves, then dated losses with month and year. Loss titles are written to sit in a sentence: "Turning 33 costs 5 points", "Your English test expires".
  - `extraNumbers`: 65, the nomination bonuses (5, 15), each change's points delta, and 3, 4, 6, 60.
- `src/lib/outlook/read-template.ts`: `readTemplate(facts)` uses only `facts`.
  - There are three leads: a 189 stamp (very strong / lodged / other), a state stamp (189 not invited / not eligible / other, then the stamped state and the biggest jump), and a combined stamp (no data / not invited / other).
  - Optional sentences follow, each added only while the read stays at 110 words or fewer: the first dated loss, "Next steps" (combined stamps only), "Estimated wait: …", and the data month.
- `src/lib/outlook/headline.ts` (+ `headline-best.ts`, `headline-context.ts`, split to keep each file under 300 lines): `buildHeadline(input, o, improve)` → `{ who, h1, fact, best, why }`.
  - All eight h1 strings are exact.
  - The who line is "{Name}'s report." or "Your report.".
  - When a state route is stamped while 189 is long-wait, not-invited or not-eligible, the fact sentence also states the 189 position (spec 6.4).
  - The why line keeps "Confirm your English and skills assessment dates." when the dates are unconfirmed (Review Focus 4). For combined stamps the note is moved to the end.
- `src/lib/outlook/phrases.ts`: shared helpers.
  - Text helpers: `longMonth`, `occupationName`, `dataMonth`, `lowerFirst`, `withoutConfirm`, `moveName`, `joinAnd`, `theState` / `theStateName` ("the Northern Territory").
  - State helpers: `stateWhy` (the ladder reason), `namedState` (R7), `stateVisaOf`, `stateSentence`.
- `src/lib/report/copy.ts`: adds `REPORT_BANNED_COPY = READ_BANNED`; `BANNED_COPY` is untouched.
- Small changes to existing modules: `label-189.ts` now exports `MIN_POINTS`; `wait.ts` now exports `roughly`.
- Test fixture `__fixtures__/scenario-input.ts`: real-data `OutlookInput` per scenario, with the detail file loaded. `nodata` has `core: null` and `detail: null` (the product path).

## Output per scenario (real data)

| Scenario | h1 | best |
|---|---|---|
| Aarav | You're at the front of the queue. | 189 Independent, with NSW 190 as a strong backup. |
| Priya | You're on the edge for 189. | 189, with VIC 190 alongside. |
| Meera | Your best chance is Tasmania, not 189. | 190 or 491 in Tasmania (we're still checking Tasmania's rules). |
| Rahul | Your way in is state nomination, not 189. | 190 or 491 in the Northern Territory (we're still checking the Northern Territory's rules). |
| Arjun | 190 in Tasmania is open to you now. 189 isn't, yet. | 190 in Tasmania now; 189 after your English retake. |
| Sana | There isn't enough published data to judge your occupation. | 190 or 491 in Western Australia (your occupation is on its list). |
| Dev | None of the three visas is inviting Internal Auditor right now. | None right now. Stay in the pool and watch SA and WA. |
| Kavya | You're in the queue, right at the cut-off. | Stay in the 189 queue; Superior English moves you to the front. |

Template reads come to 73–108 words. All of them pass `checkRead` and contain no `REPORT_BANNED_COPY` match.

## Tests and TDD evidence

RED: `npx vitest run src/lib/outlook/read-contract.test.ts src/lib/outlook/read-template.test.ts src/lib/outlook/headline.test.ts` → `Test Files 3 failed (3)`: "Cannot find module './read-contract'" and "Cannot find module './facts'". I had drafted `read-contract.ts` before writing its test. I moved it aside to run RED and restored it after.

GREEN: the same command → 73 passed. One of my own test-fixture mistakes was fixed (the comma test had replaced `counts`). Kavya's hand-written expectation 760–850 was replaced by the data value 760–840 (R2).

Full: `npm run check` → `Test Files 100 passed`, `Tests 1084 passed`, with 0 lint errors. The one lint warning is in `charts.test.ts`, which was already there and isn't mine. `npm run build` passes.

The tests cover:
- `checkRead`:
  - It accepts the mockup's Priya read when the facts hold 10, 80, 6, 190, 85 and 168.
  - It rejects 999 (`number`), "will be invited" (`banned`), 30 words and 111 words (`length`). 110 words are accepted.
  - It reads commas as part of one number.
  - It allows a year that appears in a month string and rejects 2025, which doesn't.
- `READ_BANNED`: matches for each banned phrase, and no match for "Your best chance is Tasmania" or "Small numbers".
- For each of the eight scenarios:
  - `readTemplate(buildFacts(...))` passes `checkRead`.
  - Neither the read nor the facts JSON matches `REPORT_BANNED_COPY`.
  - The h1 is exact, and no headline line matches the banned copy.
- Facts: no exact dates (no `D Mon YYYY` and no ISO dates) and no reader name in any scenario; R7 for Dev; Sana's facts with no core (name from the index, data month from the manifest).
- Headline: the who line for an empty name; exact fact and best lines for Aarav, Priya, Arjun, Sana, Dev and Kavya; key phrases for Meera and Rahul.

## Files changed

- New: `src/lib/outlook/{read-contract,facts,read-template,headline,headline-best,headline-context,phrases}.ts`, `src/lib/outlook/{read-contract,read-template,headline}.test.ts`, `src/lib/outlook/__fixtures__/scenario-input.ts`.
- Modified: `src/lib/report/copy.ts`, `src/lib/outlook/label-189.ts` (export `MIN_POINTS`), `src/lib/outlook/wait.ts` (export `roughly`).

## Data vs brief/mockup differences (R2 / R6)

- Priya's state is VIC 190 in the data (best line "189, with VIC 190 alongside."). The mockup says NSW 190; the rules engine ranks VIC first.
- Kavya's fact is "Roughly 870 to 970 EOIs … about 760 to 840 at 70 submitted before March 2026". The mockup says 870–990 and 760–860.
- Rahul: the data names the Northern Territory only, because each visa's best state is NT. The mockup says "Northern Territory or Tasmania" (R13).
- Meera and Rahul state why: "under-20 invitations at or below your points in at least 2 of the last 3 months". `StateLabel` holds no per-month detail, so the line states the ladder rule rather than the mockup's "each of the last 3 months".
- The fact sentences use the ANZSCO name as it is, for example "No Registered Nurses nec EOIs score higher than your 90" and "1,841 Registered Nurses nec EOIs are tied with you at 70". The mockup's "nurse" plurals are not used, because hand-made plurals are not allowed.
- Aarav's fact uses the last 3 listed rounds ("cut-offs of 75 or less"). The mockup said 6 rounds at 80 or less.

## Self-review findings / concerns

1. **The manifest is imported into a client-reachable lib module.** `phrases.ts` imports `src/data/manifest.json` (about 1 KB) for `dataMonth` when there is no core. That file isn't on the CLAUDE.md list of JSON a client may import. The alternative is to pass the snapshot month in, which would change `OutlookInput`. Task 10 (`dataMonth` in `OutlookView`) faces the same need, so the controller may want to rule on it.
2. **Sana's best line names Western Australia from list membership.** R7 is about invitation evidence: Sana's 190 and 491 states stay null in the facts, and no state is named from evidence. The best line and the route ("Check WA's program") do name WA, because it lists the occupation, as the mockup does. A comment in `headline-best.ts` records this.
3. **The who line is only "{Name}'s report." / "Your report.".** The brief and the test require exact equality. The mockup's sub-line (occupation, points, where, "Data to October 2026.") would need to come from Task 10 or a new field.
4. **`readTemplate` reads its situation from the facts text.** A route that starts with "EOI submitted" means lodged, and a `stamp.state` of null means combined. That keeps the `ReportFacts` contract exactly as the brief gave it. Facts for plain mode (no data) don't include the plain "available points" lines.
5. **Some h1 strings are my own wording.** These cover situations that none of the eight scenarios reach: 189 strong, lodged strong, a state better than a competitive 189, and combined long-wait, not-eligible or not-open. They are untested beyond typecheck.

## Fix round 1 (commit 235d66c)

### Changes

- **R17.** `ReportFacts` now has `situation: "189" | "state" | "combined"` and `lodged: boolean`. `read-contract.ts` still has zero imports.
  - Both values come from shared helpers in `phrases.ts`: `situationOf(o)` and `isLodged(input)`. `buildFacts` and `buildHeadline` both use `isLodged`, so they always agree on lodged.
  - `readTemplate` and `nextSteps` now branch only on `facts.situation` and `facts.lodged`. `nextSteps` drops the first route step by position (the reader's starting point) instead of matching its text.
- **1.** `lead189` checks lodged first. A lodged reader gets "Your EOI is already in the 189 queue at N points, which reads as X." A lodged Very strong reader also gets "Get your documents ready: once you're invited, you have 60 days to lodge." and is never told to submit.
- **2. No published pool.** When there is no pool (`ahead` is null):
  - `frontFact` gives "Your {p} is above every cut-off in your occupation's last N listed rounds ({top} or less), and no 189 pool is published for {name}."
  - The Very strong why line in `label-189.ts` gives "{p} is above your occupation's last N listed cut-offs (…). No 189 pool is published for it."
- **3. checkRead safety.**
  - `checkRead` rejects a day next to a month, in either order: `\b\d{1,2} Month[a-z]*\b` and `\bMonth[a-z]* \d{1,2}\b`. Month names are case-sensitive, so "you may 5…" isn't caught. This returns reason `number`, because the contract's reason set has no `date` value and an exact day is a number the facts never hold. Say if you want a separate reason.
  - `READ_BANNED` now covers `guarantee\w*` and `per ?cent`.
- **4. Months, not days, in the facts.** The facts route turns "N days waiting" into "about M months waiting" (days ÷ 30.44, rounded, at least 1). Kavya's step reads "Today (about 8 months waiting)". The screen route in `route.ts` is unchanged.
- **5. One word counter.** `read-contract.ts` exports `wordCount`, `MIN_WORDS` and `MAX_WORDS`. `read-template.ts` imports them, so the duplicate is gone.
- **6. R16.** Dev's best line is now "None right now. Stay in the pool and watch SA and WA, which still list your occupation." It says "lists" when only one state is named.

### Tests

New tests:
- `read-contract.test.ts`: four day-precise dates are rejected even when their day numbers are allowed; "guarantees", "per cent" and "percent" are banned; "You may update your EOI in March 2027." is allowed.
- `label-189.test.ts`: the why line for the no-pool Very strong case.
- `headline.test.ts`: Dev's new best line; the fact and why for a nurse core at 90 with no pool.
- `read-template.test.ts`:
  - Kavya's read opens with the lodged lead.
  - A lodged nurse at 90 isn't told to submit, and the read passes `checkRead`.
  - The situation and lodged values for all 8 scenarios.
  - Kavya's facts route has no "days waiting" and contains "Today (about 8 months waiting)".

RED: `npx vitest run src/lib/outlook/read-contract.test.ts src/lib/outlook/read-template.test.ts src/lib/outlook/headline.test.ts src/lib/outlook/label-189.test.ts` gave `Tests 20 failed | 97 passed (117)`. Kavya's lodged-lead test already passed: it is a regression guard.

GREEN: the same command gave `Tests 117 passed (117)`. One of my own assertions was too strict: it matched `/days/` and so also caught "60 days to lodge". I narrowed it to `/days waiting/`.

`npm run check` gave `Test Files 100 passed`, `Tests 1104 passed`, with 0 errors. The one lint warning is in `charts.test.ts`, which I haven't touched.
