# Task 10 report: Outlook view-model

Status: DONE_WITH_CONCERNS (view.ts is 382 lines, over the 300-line limit; see Concerns)

Commit: 4d0f372 feat(outlook): one view-model for the redesigned report

## What I implemented

`src/lib/outlook/view.ts`:

- `OccupationState`, `VisaCard`, `OutlookView`, `OutlookViewInput` and `buildOutlookView(input)`, using the brief's interfaces plus two fields the controller asked for:
  - `whoDetail`: "{ANZSCO name}, {base} points, {onshore in STATE | onshore | offshore}.{ EOI submitted D Mon YYYY.} Data to {Month YYYY}."
  - `improveLabels: boolean`: false in plain (no-data) mode, so the UI renders moves and losses without labels (the Task 6 deferred minor).
- Order of checks: `profile.occupation === ""` gives `points-only` with "Choose an occupation to see how your points compare." (Review Focus 2). After that, `loading` gives `{ kind: "loading" }`. `unavailable` gives the no-core report (core and detail null, so the stamp is combined no-data and both charts are null). `ready` passes the core and detail through (Review Focus 1).
- Report view: composes `evaluateProfile`, `buildImprove`, `estimatedWait`, `buildRoute`, `buildFacts`, `buildHeadline`, `readTemplate`, `cutoffColumns`, and `queueView` from queue-view.ts. queueView's `stampedClosed` is `v189.label === "not-invited"`, the same value the Task 8 tests use. Nothing is re-implemented.
- Stamp ring: "SUBCLASS 189", "SUBCLASS 190 TAS", or "189 • 190 • 491" when combined. Bottom: "{MON YYYY} • {points} POINTS", using the stamped visa's points, or the base points when combined. The month comes from `dataMonth(input)`, which falls back to manifest.json when there is no core (R15).
- Visa cards: the shapes are rect, hex and oval; the titles are "189 Independent", "190 Nominated" and "491 Regional"; `stampWord` comes from `stampName`.
  - 189: top is always "189 ANY STATE". Captions follow the mockup's style:
    - "No EOIs ahead of you." or "{count} EOIs ahead of you."
    - Not invited: "Not listed since {Month YYYY}. {count} EOIs score higher."
    - Below the pass mark: "You need N more points." If `eligible === false`, the why line instead.
    - No data: "No published pool or rounds." When every count is masked: "Every published 189 count is under 20."
    - Lodged: "Waiting N days. Roughly X to Y EOIs ahead." when there is a pace; otherwise "Waiting N days. {count} EOIs score higher.".
  - 190/491, R7: a state is named only through `namedState`, so only for competitive or better, or long wait. The caption is "{State} invited {count} EOIs at or below your points in {Month YYYY}." from `latest`; without `latest` it is the stateWhy sentence. `flagText` comes from a new `flagNote` helper. Otherwise the card shows "{visa} ANY STATE" with a plain caption for not-invited, not-open or no-data.
  - R16: when a visa is no-data, on the federal list, and some state lists the occupation, one state gives "190 WA" / "On WA list" with the captions "Listed by Western Australia." and "Check Western Australia's regional program.". Several states give "{visa} ANY STATE" / "On N state lists", with the states named in the caption. These conditions match headline-best's combined no-data line.
- Empty lines:
  - cutoffsEmpty: "No 189 round in the published results lists {name}, so there are no cut-offs to show."
  - queueEmpty: "SkillSelect hasn't published any 189 EOI counts for {name}, so there's no queue to show."
- `METHOD_LINES`: the mockup's eight bullets, each written as "Term: text", or for the last one, "The stamp shows …". `footer`: the exact sentence from Global Constraints, with the data month filled in.

Small supporting changes:

- `phrases.ts`: new `flagNote(state)`; `stateSentence` now uses it, and its output is unchanged.
- `route.ts`: `daysBetween` is now exported, reused for "Waiting N days".
- `charts.test.ts`: removed the unused `queue` helper and the `queueView` import. That was the lint warning, and `npm run check` is now warning-free.

## Tests

`src/lib/outlook/view.test.ts`, 31 tests:

- A table over the eight scenarios. Each row checks the stamp (kind, visa, state, label), the three card labels, `wait` and the best move id.
- Stamp ring and bottom.
- whoDetail for onshore, offshore and lodged readers.
- Aarav's three full cards, including flagText.
- R7: Dev's three "ANY STATE" cards.
- A long-wait state with an older month (Arjun 491 SA).
- R16: Sana's "On WA list" cards.
- 189 captions: below the pass mark, lodged, and competitive.
- Charts and their empty lines.
- The not-moving queue.
- improveLabels.
- Facts, template read and data month.
- The method lines and the exact footer.
- Banned copy: every string in each scenario's view, walked recursively, is checked against REPORT_BANNED_COPY. The footer is checked separately with "not a guarantee" removed.
- Loading gives `{ kind: "loading" }`. Unavailable gives a combined no-data report with no charts. An empty occupation gives points-only.

### TDD evidence

RED: `npx vitest run src/lib/outlook/view.test.ts`. The run failed to import `./view` (`Test Files 1 failed (1)`, `Tests no tests`).

GREEN:

- `npx vitest run src/lib/outlook/view.test.ts`: `Tests 31 passed (31)`.
- `npx vitest run src/lib/outlook`: `Test Files 16 passed (16)`, `Tests 273 passed (273)`.
- `npm run check`: format, lint (no warnings), typecheck, and tests `101 passed (101)` files, `1135 passed (1135)` tests.

## Files changed

- src/lib/outlook/view.ts (new)
- src/lib/outlook/view.test.ts (new)
- src/lib/outlook/phrases.ts (flagNote)
- src/lib/outlook/route.ts (export daysBetween)
- src/lib/outlook/charts.test.ts (lint fix)

## Self-review

- Everything is composed from Tasks 1–9; no logic is duplicated except the small `aheadOfYou` and `scoreHigher` sentence helpers.
- No `any`, relative imports only, and the module is pure.
- The order of checks is right: a points-only reader never reaches the loading state.
- A future or invalid EOI date gives no "Waiting" text (`eoiDate > asOf` or not ISO).
- The banned-copy test walks the whole view, including chart and queue aria text, route, improve, facts and the template read, so new strings are covered automatically.

## Concerns

1. **Size: view.ts is 382 lines, over the 300 limit.** Following the implementer instructions, I did not split it. Proposed split, like R12 and R14: move `VisaCard` and the card builders (`card189`, `caption189`, `stateCard`, `listText`, `listedBy`, `invitedCaption`, `unnamedCaption`, `aheadOfYou`, `scoreHigher`, `daysWaiting`, `plural`) into `src/lib/outlook/visa-cards.ts`, about 190 lines, which leaves view.ts at about 200. view.ts would re-export the `VisaCard` type.
2. A summed masked state count reads "Tasmania invited 0–38 EOIs …" (Meera 491 TAS). It is accurate interval arithmetic and matches the facts' count text (formatCount), but the reading is odd. This is the same issue as the Task 8 deferred minor ("about 0–40"). It may be worth a shared "under 39" or "up to 38" wording later.
3. whoDetail follows the controller's "onshore in STATE" rather than the mockup's "living in NSW". It adds the mockup's "EOI submitted 12 Mar 2026." for lodged readers, as the mockup's Kavya line does. The controller's format didn't mention it, so drop it if unwanted.
4. The 189 caption uses "ahead of you" (mockup wording) for the higher-score count. For not-invited and for lodged readers without a pace it uses "score higher" instead, because there the higher-score count is not the whole queue.
5. Unchanged from Task 5: `wait` for a state stamp reads "Northern Territory invited …" without "the", unlike `theState` elsewhere. That text comes from wait.ts.

## Data-vs-brief/mockup differences (R2: data wins)

- Aarav 491: VIC (Strong, rules being checked), not WA. Its caption reads "98–136 EOIs … October 2026".
- Priya and Kavya: 190 is VIC and 491 is NT, not NSW and WA.
- Kavya: "Roughly 870 to 970 EOIs ahead", not "870 to 990" (the Task 5 data value). The stamp bottom uses the brief's "OCT 2026 • 70 POINTS", not the mockup's "254 DAYS • 70 POINTS"; the 254 days appear in the 189 caption.
- Rahul 491: NT only, not "NT / TAS".
- Arjun 491: SA long wait (June 2026), not TAS.
- Captions use the published ANZSCO occupation names and full state names ("New South Wales invited 327–346 EOIs …"), not the mockup's hand-written plurals ("nurses").

---

## Fix round 1 (rulings R19, R20 and review items)

Commit: a0613e5 refactor(outlook): split visa cards; read summed counts as under N

### Changes

1. **R19.** The card logic moved from `view.ts` to the new `src/lib/outlook/visa-cards.ts` (223 lines): `VisaCard`, `visaCards(input, o, wait)`, `card189`, `caption189`, `stateCard`, `listText`, `listedBy`, `invitedCaption`, `unnamedCaption`, `daysWaiting`, `plural`, `SHAPES`, `TITLES`, `ANY_STATE` and `ISO_DATE`.
   - `aheadOfYou` and `scoreHigher` are merged into `countSentence(count, suffix)`, where the suffix is "ahead of you" or "score higher".
   - `view.ts` (175 lines) re-exports `VisaCard` and calls `visaCards`.
2. **R20.** New `formatSummed(i)` in `src/lib/report/copy.ts`, next to `formatCount`: {0, max > 0} reads "under {max + 1}", masked {0, 19} stays "under 20", and anything else is passed to `formatCount`.
   - Used in the visa cards and in facts `countOf`. `intervalNumbers` now allows `max + 1` for any count from zero, which is 20 when masked, as before.
   - Used everywhere in queue-view. Its `about()` returns `formatSummed` for any count from zero, so the lodged "earlier" and "later" groups and "behind" never read "0–N" or "about 0–N". Single published counts read exactly as before.
   - Meera's 491 TAS card now reads "Tasmania invited under 39 EOIs …", and the facts count text is "under 39" (numbers [39]).
3. **Tests added.**
   - A whoDetail and stampBottom assertion on the `unavailable` path.
   - A banned-copy check on the points-only line.
   - `{ status: "loading" }` with occupation "" gives points-only.
4. **stampBottom.** It is now `formatMonth(dataMonthKey(input)).toUpperCase()`. New `dataMonthKey(input)` in phrases.ts returns `core.asAt` or `manifest.asAt`, and `dataMonth` uses it.
5. **"the" before territories.** wait.ts's state text now uses `capital(theState(state))`: "The Northern Territory invited …", and the same for the Australian Capital Territory.
   - `capital` moved from headline-context.ts to phrases.ts, so wait.ts doesn't depend on the headline. `headline.ts` imports it from phrases.ts, and `stateSentence` uses it (same output).
   - route.ts's "Northern Territory and Tasmania" step sub is a list label, not a sentence, so I left it unchanged.

### Tests

- `view.test.ts`:
  - The notinv row's wait now starts "The Northern Territory".
  - New: the summed under-20 card and the facts agree, and `JSON.stringify(view)` has no "0–".
  - New: unavailable whoDetail and stampBottom; the points-only banned check; loading with occupation "" gives points-only.
- `visa-cards.test.ts` (new): card order, shapes, titles and points; the "The Northern Territory" caption; no "Waiting" for a future EOI date.
- `queue-view.test.ts`: two masked earlier months give "At 70, earlier: under 39" and no "0–".
- `copy.test.ts`: `formatSummed` cases (0–38, masked, zero, exact, range).
- `wait.test.ts`: Rahul's regex now expects "The Northern Territory".

### Commands and output

- RED, before implementing: `npx vitest run src/lib/outlook src/lib/report/copy.test.ts` gave `Test Files 4 failed | 14 passed (18)`, `Tests 6 failed | 283 passed (289)`. The failures were the 3 formatSummed tests, wait "rahul", view "notinv", view summed count, and visa-cards.test.ts not resolving its module.
- RED for the queue test, with the queue-view and copy changes stashed: `Tests 1 failed | 8 passed (9)`.
- GREEN: `npx vitest run src/lib/outlook src/lib/report/copy.test.ts` gave `Test Files 18 passed (18)`, `Tests 293 passed (293)`.
- `npm run check` passed: format, lint with no warnings, typecheck, and tests `Test Files 102 passed (102)`, `Tests 1144 passed (1144)`.

### Remaining notes

- Headline lines still use `formatCount` or `countInSentence` for their counts. I didn't change them because the ruling named the cards, facts and queue. Today the headline's quoted counts are higher-score counts above zero, so it doesn't show "0–".
