# Task 7 report: `stateOutlook()` (rule evaluation and evidence groups)

Status: DONE_WITH_CONCERNS (concerns are design notes for review, not failures)
Commit: 8df0053 feat(state): evaluate state rules into evidence groups (base 20ac282)

## Implemented

- `src/lib/state-outlook/evaluate.ts`: `RuleCheck`, `StreamResult`, `StreamEvaluation`, `evaluateStream(stream, ctx)`. Per stream, in order: federal list, status, cohort, occupation list, then each requirement. Stream outcome = worst check (fail > unverified > needs-answer > pass).
- `src/lib/state-outlook/outlook.ts`: `Group`, `StateOutcome`, `Outlook`, `OutlookInput`, `stateOutlook(input)` (signature as the brief). State = best stream (pass > needs-answer > unverified > fail). A passing state is `strongest` iff `stateEvidence(...).state.peak.invitedAtLeast.min > 0`, otherwise `watching`. Order: group, then peak.min desc, then code. `anyState` comes from `stateEvidence` and never touches a group. `summary` follows the brief exactly, using codes like the spec example ("Strongest evidence in NSW and WA. Not open to you now in 2 states.", with "1 state" singular).
- Supporting modules, split so each file stays under 300 lines: `judge.ts` (RuleCheck type, staleness/secondary gate, severity), `requirements.ts` (requirement labels and judging), `context.ts` (StreamContext, Verdict helpers, `STATE_NAMES`/`STATE_CODES`, cohort derivation, word joining).
- Rulings applied:
  - P6: absent or false in a non-null federal list → fail "Not on the federal list for {visa}". A null federal list → each stream gets one unverified check ("Federal occupation list not available"), so all 8 tiles are unverified.
  - P2/P19: in-state months use the answers only for a user living in that state. For an interstate user, they are unverified on streams whose cohorts include living-in-other-state; otherwise they fail ("You don't currently live in {state}"). Offshore users also fail.
  - P3: aggregation as above. It is tested in both stream orders.
  - P11/P14: secondary fields, `not-imported` refs and status `unknown` are unverified and never fail. Experience windows map ≤3 → Last3, ≤5 → Last5, >5 → Last10. Visa expiry passes on or before the date; an empty or invalid expiry → needs-answer.
  - P15: the months-working question names the relatedness ("…your nominated occupation or one Queensland treats as related (same first 3 ANZSCO digits)?").
  - P16: with `ofLastMonths`, a streak ≥ N passes and a shorter one is unverified. Without a window, a short streak fails.
  - P18: an onshore user (in-state, interstate, or state not given) matches any onshore cohort on the list entry; an offshore user matches only `offshore`.
  - P20: a stream filter checks `entry.streams[visa]` only.
  - Stale: `isStale(checkedAt, asOf, 60)` → unverified, `stale: true`, finding "Rules last checked {d Mon YYYY}; may have changed". Secondary → "Rules not yet verified on the official page".
- reasonText (one factual sentence, from the deciding stream):
  - not-open: first failing finding, e.g. "Not on Western Australia's 2026–27 list for 491", "Closed for 491 in 2026–27", "Not open to those living elsewhere in Australia", "On Queensland's 2026–27 list for 190 only for those living in Australia";
  - needs-answers: "Answer N question(s): {topics}";
  - unverified: first unverified finding;
  - pass: "Meets every verified rule for {stream}".
- Deciding stream among ties:
  - pass and unverified: the first stream, in rules order;
  - needs-answer: the stream with the fewest questions;
  - fail: the stream whose first failing check comes latest ("got furthest"). This keeps a reason from being false when the code is on the list for another stream.

## Tests (TDD)

RED: `npx vitest run src/lib/state-outlook/evaluate.test.ts src/lib/state-outlook/outlook.test.ts src/lib/state-outlook/outlook.real-data.test.ts`
```
FAIL  src/lib/state-outlook/evaluate.test.ts  Error: Cannot find module './evaluate'
FAIL  src/lib/state-outlook/outlook.real-data.test.ts  Error: Cannot find module './outlook'
FAIL  src/lib/state-outlook/outlook.test.ts  Error: Cannot find module './outlook'
Test Files  3 failed (3)   Tests  no tests
```
First implementation run: 4 failed / 101 passed. The test context lacked the `programYear` field that the implementation added. After it was added to the fixture, everything was green.

GREEN: `npx vitest run src/lib/state-outlook/` → 5 files, 106 tests passed. `npm run check` → 51 files, 558 tests passed; Prettier, ESLint (0 warnings) and tsc clean. `npm run build` → static export OK.

Coverage:
- evaluate.test.ts (54 tests):
  - P6 absent, P6 false, null federal and stale federal;
  - closed, secondary closed (unverified), unknown and restricted;
  - cohort fail, cohort fail for offshore, secondary cohort, onshore with no state (needs-answer for the `state` field);
  - list fail; P18 interstate match; offshore on an onshore-only entry; P20 per visa (190 pass, 491 fail); not-imported, none-published, secondary ref, unloaded list and secondary all-federal (all unverified); verified all-federal passes; stale list file;
  - every requirement kind unanswered → needs-answer with field and question; null counts as unanswered; a secondary requirement never asks;
  - P15 wording ×3; months pass/fail; P16; P19; P2 interstate fail; offshore fail on in-state months; months offshore; job offer; visa expiry boundaries; P14 windows 3/4/5/10; regional; studied;
  - stale at +61 days (unverified) vs +60 (applied);
  - worst-check aggregation.
- outlook.test.ts:
  - one test per group (strongest, watching masked-only, watching above-score-only, needs-answers with the question named);
  - Review Focus 1 on the real rules: no Sharpen answers; pass groups only via all-pass streams; null equals undefined;
  - Review Focus 2 (secondary vs needs-answer, both orders; secondary-only; secondary beside passing verified rules);
  - Review Focus 3 (missing from a verified list);
  - Review Focus 4 (asOf 2027-01-17 = +61 days);
  - NSW 491 closed; federally ineligible → all 8 not-open; null federal → all unverified; no rules → unverified;
  - furthest-failing stream decides; ordering; anyState separate; summary variants;
  - BANNED_COPY over every reason, label, question and summary (real rules × 4 profiles × 2 visas).
- outlook.real-data.test.ts: the 3 real profiles. Each test name prints the group table. The test asserts that all 8 states are present, and that every not-open state has a failing check in every stream, each from a directly read host. ACT, VIC, TAS and NT are never in a pass group, NSW 491 is always not-open, and no banned copy appears. No snapshot files.

## Real-data group tables (asOf 2026-11-18, real rules, lists and federal list)

Profiles:
- **ICT BA:** sampleProfile with occupation 261111, onshore VIC, no Sharpen answers.
- **RN:** 254418 onshore QLD, visa expiry 2027-06-30, 14 months living and working in QLD, experience 3/5/8 years, no job offer, not regional, studied nowhere.
- **SE:** 261313 offshore, 24 months offshore, experience 3/5/7 years.

### ICT BA, VIC, no answers — 190 at 90 points
No state shows strong published evidence for your profile yet.

| State | Group | Deciding stream | Reason | Peak ≤ score |
|---|---|---|---|---|
| WA | needs-answers | Graduate stream | Answer 1 question: where you studied | none |
| ACT | unverified | Canberra residents | Rules not yet verified on the official page | none |
| NT | unverified | NT resident | Rules not yet verified on the official page | none |
| TAS | unverified | Tasmanian Skilled Employment (TSE): priority role | Rules not yet verified on the official page | none |
| VIC | unverified | Skilled Nominated (190) Registration of Interest | Rules not yet verified on the official page | none |
| NSW | not-open | Working in NSW | Not on New South Wales's 2026–27 list for 190 | none |
| QLD | not-open | Building and construction workers | Not on Queensland's 2026–27 list for 190 | none |
| SA | not-open | South Australian Graduates | Not open to those living elsewhere in Australia | none |

### ICT BA, VIC, no answers — 190 at 95 points
No state shows strong published evidence for your profile yet.

| State | Group | Deciding stream | Reason | Peak ≤ score |
|---|---|---|---|---|
| WA | needs-answers | Graduate stream | Answer 1 question: where you studied | none |
| ACT | unverified | Canberra residents | Rules not yet verified on the official page | none |
| NT | unverified | NT resident | Rules not yet verified on the official page | none |
| TAS | unverified | Tasmanian Skilled Employment (TSE): priority role | Rules not yet verified on the official page | none |
| VIC | unverified | Skilled Nominated (190) Registration of Interest | Rules not yet verified on the official page | none |
| NSW | not-open | Working in NSW | Not on New South Wales's 2026–27 list for 190 | none |
| QLD | not-open | Building and construction workers | Not on Queensland's 2026–27 list for 190 | none |
| SA | not-open | South Australian Graduates | Not open to those living elsewhere in Australia | none |

### ICT BA, VIC, no answers — 190 at 105 points
No state shows strong published evidence for your profile yet.

| State | Group | Deciding stream | Reason | Peak ≤ score |
|---|---|---|---|---|
| WA | needs-answers | Graduate stream | Answer 1 question: where you studied | none |
| ACT | unverified | Canberra residents | Rules not yet verified on the official page | none |
| NT | unverified | NT resident | Rules not yet verified on the official page | none |
| TAS | unverified | Tasmanian Skilled Employment (TSE): priority role | Rules not yet verified on the official page | none |
| VIC | unverified | Skilled Nominated (190) Registration of Interest | Rules not yet verified on the official page | none |
| NSW | not-open | Working in NSW | Not on New South Wales's 2026–27 list for 190 | none |
| QLD | not-open | Building and construction workers | Not on Queensland's 2026–27 list for 190 | none |
| SA | not-open | South Australian Graduates | Not open to those living elsewhere in Australia | none |

### ICT BA, VIC, no answers — 491 at 90 points
No state shows strong published evidence for your profile yet.

| State | Group | Deciding stream | Reason | Peak ≤ score |
|---|---|---|---|---|
| WA | watching | General stream (Schedule 2) | Meets every verified rule for General stream (Schedule 2) | none |
| ACT | unverified | Canberra residents | Rules not yet verified on the official page | none |
| NT | unverified | NT resident (by exception) | Rules not yet verified on the official page | none |
| TAS | unverified | Tasmanian Skilled Employment (TSE) | Rules not yet verified on the official page | none |
| VIC | unverified | Skilled Work Regional (491) Registration of Interest | Rules not yet verified on the official page | none |
| NSW | not-open | Pathway 1: regional employer | Closed for 491 in 2026–27 | none |
| QLD | not-open | Building and construction workers | Not on Queensland's 2026–27 list for 491 | none |
| SA | not-open | South Australian Graduates | Not open to those living elsewhere in Australia | none |

### ICT BA, VIC, no answers — 491 at 95 points
No state shows strong published evidence for your profile yet.

| State | Group | Deciding stream | Reason | Peak ≤ score |
|---|---|---|---|---|
| WA | watching | General stream (Schedule 2) | Meets every verified rule for General stream (Schedule 2) | none |
| ACT | unverified | Canberra residents | Rules not yet verified on the official page | none |
| NT | unverified | NT resident (by exception) | Rules not yet verified on the official page | none |
| TAS | unverified | Tasmanian Skilled Employment (TSE) | Rules not yet verified on the official page | none |
| VIC | unverified | Skilled Work Regional (491) Registration of Interest | Rules not yet verified on the official page | none |
| NSW | not-open | Pathway 1: regional employer | Closed for 491 in 2026–27 | none |
| QLD | not-open | Building and construction workers | Not on Queensland's 2026–27 list for 491 | none |
| SA | not-open | South Australian Graduates | Not open to those living elsewhere in Australia | none |

### ICT BA, VIC, no answers — 491 at 105 points
No state shows strong published evidence for your profile yet.

| State | Group | Deciding stream | Reason | Peak ≤ score |
|---|---|---|---|---|
| WA | watching | General stream (Schedule 2) | Meets every verified rule for General stream (Schedule 2) | none |
| ACT | unverified | Canberra residents | Rules not yet verified on the official page | none |
| NT | unverified | NT resident (by exception) | Rules not yet verified on the official page | none |
| TAS | unverified | Tasmanian Skilled Employment (TSE) | Rules not yet verified on the official page | none |
| VIC | unverified | Skilled Work Regional (491) Registration of Interest | Rules not yet verified on the official page | none |
| NSW | not-open | Pathway 1: regional employer | Closed for 491 in 2026–27 | none |
| QLD | not-open | Building and construction workers | Not on Queensland's 2026–27 list for 491 | none |
| SA | not-open | South Australian Graduates | Not open to those living elsewhere in Australia | none |

### RN (Medical) 254418, QLD, answers — 190 at 95 points
Strongest evidence in QLD. Not open to you now in 1 state.

| State | Group | Deciding stream | Reason | Peak ≤ score |
|---|---|---|---|---|
| QLD | strongest | Skilled workers living in Queensland | Meets every verified rule for Skilled workers living in Queensland | 39 (2026-10) |
| NSW | unverified | Working in NSW | Rules not yet verified on the official page | 71 (2026-10) |
| VIC | unverified | Skilled Nominated (190) Registration of Interest | Rules not yet verified on the official page | 55 (2026-10) |
| WA | unverified | General stream (Schedule 1) | Rules not yet verified on the official page | 31 (2026-10) |
| ACT | unverified | Canberra residents | Rules not yet verified on the official page | none |
| NT | unverified | NT resident | Rules not yet verified on the official page | none |
| TAS | unverified | Tasmanian Skilled Employment (TSE): priority role | Rules not yet verified on the official page | none |
| SA | not-open | South Australian Graduates | Not open to those living elsewhere in Australia | 22 (2026-10) |

### RN (Medical) 254418, QLD, answers — 491 at 105 points
Strongest evidence in WA. Not open to you now in 2 states.

| State | Group | Deciding stream | Reason | Peak ≤ score |
|---|---|---|---|---|
| WA | strongest | General stream (Schedule 1) | Meets every verified rule for General stream (Schedule 1) | 20 (2026-10) |
| VIC | unverified | Skilled Work Regional (491) Registration of Interest | Rules not yet verified on the official page | 22 (2026-10) |
| ACT | unverified | Canberra residents | Rules not yet verified on the official page | none |
| NT | unverified | NT resident (by exception) | Rules not yet verified on the official page | none |
| QLD | unverified | Skilled workers living in Queensland | Rules not yet verified on the official page | none |
| TAS | unverified | Tasmanian Skilled Employment (TSE) | Rules not yet verified on the official page | none |
| NSW | not-open | Pathway 1: regional employer | Closed for 491 in 2026–27 | 24 (2026-10) |
| SA | not-open | South Australian Graduates | Not open to those living elsewhere in Australia | none |

### Software Engineer 261313, offshore, answers — 190 at 90 points
No state shows strong published evidence for your profile yet.

| State | Group | Deciding stream | Reason | Peak ≤ score |
|---|---|---|---|---|
| NSW | watching | Living offshore | Meets every verified rule for Living offshore | none |
| WA | needs-answers | Graduate stream | Answer 1 question: where you studied | none |
| ACT | unverified | Canberra residents | Rules not yet verified on the official page | none |
| NT | unverified | NT resident | Rules not yet verified on the official page | none |
| TAS | unverified | Tasmanian Skilled Employment (TSE): priority role | Rules not yet verified on the official page | none |
| VIC | unverified | Skilled Nominated (190) Registration of Interest | Rules not yet verified on the official page | none |
| QLD | not-open | Skilled workers living offshore | On Queensland's 2026–27 list for 190 only for those living in Australia | none |
| SA | not-open | Offshore | On South Australia's 2026–27 list for 190 only for those living in Australia | none |

### Software Engineer 261313, offshore, answers — 491 at 100 points
No state shows strong published evidence for your profile yet.

| State | Group | Deciding stream | Reason | Peak ≤ score |
|---|---|---|---|---|
| WA | watching | General stream (Schedule 2) | Meets every verified rule for General stream (Schedule 2) | none |
| ACT | unverified | Canberra residents | Rules not yet verified on the official page | none |
| NT | unverified | NT resident (by exception) | Rules not yet verified on the official page | none |
| TAS | unverified | Tasmanian Skilled Employment (TSE) | Rules not yet verified on the official page | none |
| VIC | unverified | Skilled Work Regional (491) Registration of Interest | Rules not yet verified on the official page | none |
| NSW | not-open | Pathway 1: regional employer | Closed for 491 in 2026–27 | none |
| QLD | not-open | Skilled workers living offshore | On Queensland's 2026–27 list for 491 only for those living in Australia | none |
| SA | not-open | Offshore | On South Australia's 2026–27 list for 491 only for those living in Australia | none |

I spot-checked every not-open reason against the list files:
- 261111 is absent from the NSW and QLD lists;
- 261313 and 254418 are on QLD/SA only for living-in-state (261313) or for both (254418), which matches the reasons;
- the 254418 SA case fails on cohort.

## Files

- Created: src/lib/state-outlook/{context,judge,requirements,evaluate,outlook}.ts and src/lib/state-outlook/{evaluate,outlook,outlook.real-data}.test.ts

## Self-review and concerns

1. **Interface addition.** `RuleCheck` gains an optional `field?: keyof Profile`, the profile answer the question fills in. Task 9's `questionsNeeded` needs it to pick the input and to de-duplicate. Everything else matches the brief verbatim.
2. **Internal `findings`.** `evaluateStream` returns `{ result, findings }`, with one short phrase per check. `stateOutlook` uses the findings to build `reasonText`. They are not exposed on `StateOutcome`. Task 8 may want per-check reason text on panels: expose it then, or reuse `label` and the mark.
3. **Verified `none-published` is unverified.** No rule reaches this case today: NSW 491 is closed first, and TAS/NT are secondary. Treating "no list" as a pass would be a guess.
4. **A stale imported list file is unverified,** like a stale rule: the list check uses the older of the rule's and the list's `checkedAt`. **A stale federal list is unverified, not a fail.**
5. **Restriction text is never evaluated.** For example, QLD 190's "not available to 491/489 holders" goes untested. A verified `restricted` status passes the status check, because the testable parts (SA's expiry gate and cohorts) are requirements. Task 8 panels show `restriction`.
6. **WA 190 cannot pass yet** (P12 contract rule is secondary). It shows needs-answers through the Graduate stream when `studyState` is unanswered, and unverified otherwise. This is honest per P3.
7. **Duplicated constant.** `STATE_NAMES`/`STATE_CODES` are now the typed source in `context.ts`. Older private copies remain in state-answers.ts, the guards and check-flow.tsx; I did not touch them (out of scope).
8. **Federal-null check.** It has `source: ""` and `checkedAt: ""`, because no list means no provenance. Task 8 needs to render it without a link.
9. **Possessive style.** It is "New South Wales's" (Style Manual: 's after singular names ending in s). Change `possessive()` in context.ts if the founder prefers "New South Wales'".

## Fix round 1 (commit 08c49bd)

Changes:
- **I1** (option 2, as preferred): a verified `all-federally-eligible` rule now passes when the federal flag is true and is otherwise unverified ("Federal eligibility for {visa} not confirmed"). Only the federal check can find an occupation ineligible, so a stale federal list can no longer fail a stream through this rule, and the federal test is no longer duplicated. Fresh ineligibility still fails through the federal check, and the "not-open everywhere" test still passes. New test: a stale federal list plus a verified all-federal rule and a code marked false gives checks[0] unverified/stale, checks[3] not a fail, and a STREAM outcome of unverified.
- **I2:** the duplicated loaders now live in `src/lib/state-outlook/__fixtures__/real-data.ts`, which provides validated `realLists()` and `realFederal()`. Both outlook.test.ts and outlook.real-data.test.ts use it.
- **M1:** outlook.real-data.test.ts now has pinned assertions:
  - RN 254418 QLD 190: QLD is strongest, decided by qld-onshore;
  - ICT BA onshore VIC 190: SA is not-open, with every stream's cohort check (index 2) failing and reason "Not open to those living elsewhere in Australia";
  - NSW 491 is not-open with reason "Closed for 491 in 2026–27" for every profile and points value;
  - ACT/VIC/TAS/NT are never strongest or watching.
  Every fail check in every state, whatever its group, now has `stale === false`, a directly read source host, and a rule behind it whose verification is "verified". The test maps the check index back to the Sourced rule: federal, status, cohorts, occupations, then requirements.
- **M2:** `judge.ts` gains `staleFinding`. An unformattable date gives "Rules check date unknown; may have changed".

RED (`npx vitest run src/lib/state-outlook/evaluate.test.ts`, before the fix):
```
× never fails a stream on a stale federal list through an all-federal rule
  AssertionError: expected 'fail' not to be 'fail'
× says the check date is unknown when it cannot be read
  Expected: "Rules check date unknown; may have changed"
  Received: "Rules last checked —; may have changed"
Tests  2 failed | 54 passed (56)
```
The M1 pins describe existing behaviour, so they passed on first run (no RED), as you would expect for pins.

GREEN:
- `npx vitest run src/lib/state-outlook/`: 112 passed;
- `npm run check`: 564 passed, with Prettier, ESLint and tsc clean;
- `npm run build`: OK.
