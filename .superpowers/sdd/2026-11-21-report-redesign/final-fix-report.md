# Final whole-branch review: fix report (ruling R32)

Branch `roadmap/report-redesign`, base 17fb5ac, head ea076c2. Not pushed.

## Commits

| SHA | Subject |
|---|---|
| ffc22d5 | fix(backend): log the write-read failure class and status; enablement prerequisites |
| eda5b0b | fix(methodology): describe labels and waits as computed estimates |
| ba0acb5 | fix(report): live homepage deep links; hash links open the evidence fold |
| bdfd101 | fix(report): a failed data fetch shows points only, not a SkillSelect fact |
| f5a9c47 | fix(outlook): combined stamps, not-eligible readers, no-data 189 and lodged copy |
| 6ae9f1f | perf(outlook): evaluate improve candidates once, and only when read |
| 9223ae8 | fix(report): a cohort total of masked counts reads "under N" |
| 6b766c9 | test(outlook): sweep every occupation at 60 to 90 points |
| ea076c2 | docs: record the final-review fix wave in HANDOFF and REPORT-COVERAGE |

## Verification (final run at 6b766c9 + docs)

- `npm run check`: exit 0. 113 files before the sweep, 1276 tests passing after it (format, lint with no warnings, typecheck).
- `npm run build`: exit 0.
- `npm run backend:check`: ok. `npm run backend:test`: 37 passed, 0 failed (was 35 + 2 new).
- Reviewer's scratch `sweep.mts` (3451 views): **problems 101 → 0**.
- Built `out/` with scratch playwright-core and system Chrome (`final-check.mjs`, `loadfail.mjs` in the scratchpad):
  - Each homepage `/sample/#…` link resolves. `#charts` scrolls to the charts. `#evidence`, `#state-outlook` and all eight `#state-190-XX` links open the evidence fold and scroll into view. The fold is closed on a plain load. A `#sharpen` hashchange opens it, and so does a second click on a link whose hash is already current.
  - `/sample/` h1 "You're at the front of the queue."; no "0–N", "0 to N", "about 0", NaN or undefined in the article text; no page errors.
  - `/methodology/#limitations`: the old "advise which visa" text is gone, the new "computed from published SkillSelect history" wording shows, and the 10 label lines are listed, including "Estimated wait".
  - `/check/` with "Try sample answers" and `/data/occupations/**` aborted. Screen: h1 "You have 90 points.", the load-failed line, no stamp and no "hasn't published" fact. Print media: the line is visible once and there is no stamp.

## Per item

### 1. Combined "Long wait" stamp contradicted its cards
- **Change:** the new `src/lib/outlook/combined.ts` words the combined h1 and wait from the three actual labels. Visas with the same label are grouped, best label first:
  - h1: "190 and 491 are a long wait at your points, while 189 isn't inviting your occupation."
  - wait: "190 and 491: unlikely without more points. 189: no invitations to measure."
  - "Every visa is a long wait…" is kept only when all three really are long waits.
- The closed-all banner ("Points won't change this. No visa is inviting…") now shows only for a combined **not-invited** stamp. Other combined stamps with 189 not invited get "More points won't open 189: it needs to start listing your occupation again." State-stamped readers keep the old 189 banner.
- A combined not-open stamp's wait was "We can't estimate one without data." It now reads "None of the three visas is open to you, so there's no wait to measure."
- Combined not-invited keeps the spec 6.5 text, "No 189 invitations to measure."
- **Files:** combined.ts (new), headline.ts, wait.ts, improve.ts.
- **Tests:** review-repros.test.ts (Management Accountant 221112 at 65), improve.test.ts (banner), and the sweep's "no visa is inviting" assertion.

### 2. Readers under 65 or failing a basic requirement
- **New candidates:** `eligibility.ts` adds a blocker (age / expired / points) and the requirement wording. `improve-candidates.ts` adds `english-retake` (Competent, expired) and `assessment-renewal` (expired assessment). A candidate is kept when it adds points **or** lifts the 189 label, so a 0-point restore counts.
- **Biggest jump:** it is marked only when it lifts the label. So it is never "still Not eligible", and never shown at 45 or over.
- **Opener:** `Improve.opener` is the change that opens 189. It is the biggest jump if there is one, otherwise the first move that leaves not-eligible. It works in plain mode too, and is null at 45+.
- **When 189 is not eligible under a combined stamp:**
  - Best line comes from `notEligibleBest`, e.g. "None yet. Superior English would take you to 75 points, which opens 189."
  - Route comes from `route-combined.ts` `notEligible`: Today → opener (titled "English retake" when the blocker is expiry) → "Submit EOI, at N points" (or "Update your EOI" if lodged) → "Watch listing states".
- **Age 45+:**
  - h1: "189, 190 and 491 all need you to be under 45 when you're invited."
  - wait: "Not possible at 45 or over, and points can't change that."
  - fact: "At 45 or over you can't be invited for 189, 190 or 491, whatever your points."
  - route: "Points-tested visas closed" → "Talk to a registered migration agent".
- **Expiry:**
  - h1: "Your English test has expired, and 189, 190 and 491 all need a valid one."
  - wait: "Not possible until you retake your English test: a valid one is a basic requirement, not a points question."
- `label189` takes `reasons`, so the 189 why and card caption name the actual requirement.
- The template read no longer says "biggest jump" for a change that leaves the label as it is.
- **Files:** eligibility.ts, improve-candidates.ts, improve.ts, label-189.ts, evaluate-profile.ts, combined.ts, headline-best.ts, headline.ts, route-combined.ts, route-steps.ts, route.ts, read-template.ts.
- **Tests:** improve.test.ts (retake, renewal, age, label-unchanged), review-repros.test.ts (expired English, age 46, Aquaculture at 55).

### 3. 189 with no data gave "NO DATA → NO DATA" cards
- **Change:** plain mode is used whenever `no189Data(core)` is true (no core, or no 189 pool and no listing). This covers state stamps and combined long-wait stamps, not just combined no-data.
- The template's loss sentence and the route facts never quote "Not enough data" or "Too few to count". This also covers read-template.ts:43 on the no-core path.
- Route improvement steps with a no-data after-label get no label bubble.
- **Files:** label-189.ts, improve.ts, read-template.ts, facts.ts, route-steps.ts.
- **Tests:** improve.test.ts (131112, 121111), review-repros.test.ts ("prints no no-data label on the no-core path", Aquaculture read).

### 4. Failed fetch reported as a SkillSelect fact
- **Change:** `OccupationState` gains `{ status: "load-failed" }`. In `report.tsx`, `occupationState` uses `unavailableReason(code, occupationIndex)` and maps loadFailed to load-failed.
- `buildOutlookView` then returns the points-only view (shared `pointsOnly` helper) with "We couldn't load the published data. Reload to try again." It has no stamp, on screen and in print, because PrintReport already renders points-only.
- **Files:** view.ts, report.tsx.
- **Tests:** view.test.ts ("shows points only, no stamp, when the published data failed to load"), plus the browser check above.

### 5. Lodged readers in small pools saw masked counts as numbers
- **Change:**
  - `roughly` returns "under N" when min is 0. Values under 10 are no longer rounded, so "3 to 40" can't become "0 to 40".
  - New `roughlyEois` ("Roughly 870 to 970 EOIs" / "Under 39 EOIs" / "No EOIs") and `aboutCount` ("about 50" / "under 39" / "none").
  - These are used in the headline lodged fact, the pace text and the 189 card. `formatSummed` replaces `formatCount` and `countInSentence` for the summed higher-score count, including position189.
  - The queue's own month reads "Your month: none published", and its aria says "none published in your month".
  - An EOI past two years: whoDetail says "EOI submitted 12 Jan 2024, expired 12 Jan 2026: a new EOI gets a new date of effect." The analysis then plans as for a new EOI. The points page and its warnings keep the answers as entered.
  - An EOI date after today no longer gives "-39 days waiting".
- **Files:** wait.ts, headline.ts, visa-cards.ts, queue-view.ts, view.ts, route-steps.ts.
- **Tests:** review-repros.test.ts (Economist 224311 lodged at 75, zero month, expired EOI, future EOI), and the sweep (BAD_TEXT).

### 6. Lodged reader with a state stamp got a contradicting 189 route
- **Change:** a lodged reader with a state stamp now takes the state route behind the lodged start. Route: "EOI submitted" → "Today (N days waiting)" → "Check state rules" (if any) → "Update your EOI: add 190 X + 491 Y" → "Keep 189 ticked".
- A lodged reader with no 189 data also gets "Keep your EOI in" instead of "Submit EOI".
- **Files:** route.ts, route-steps.ts (`lodgedStart`), route-combined.ts.
- **Evidence:** explore `edge` "lodged rahul" now shows the state route. The existing route tests pass.

### 7. Dead homepage deep links
- **Change:**
  - three-questions "stand" → `/sample/#charts`; "outcomes" → `/sample/#evidence`; `#state-outlook` is kept.
  - home-faq "ahead" → `/sample/#charts`.
  - The new `use-open-on-hash.ts` (used by EvidenceSection) opens the fold when the hash names `#evidence` or anything inside it. It runs on load, on hashchange, and on a repeat click of the current hash.
  - The Sharpen form's details got `id="sharpen"`.
- **Also fixed:** a visa card's needs-answers note has a new `flagHref: "#sharpen"` and renders as a link on screen only; print stays plain text.
- **Files:** three-questions.tsx, home-faq.ts, evidence-section.tsx, use-open-on-hash.ts (new), sharpen-form.tsx, visa-cards.ts, visa-row.tsx, visa-row.module.css.
- **Tests:** components/home/sample-links.test.ts checks every homepage `/sample/#` hash against the ids the report renders. visa-cards.test.ts covers the link and the no-link case. Browser check above.

### 8. Methodology contradicted the report
- **Change:** the new `src/lib/outlook/method.ts` holds `METHOD_LINES`, moved out of view.ts, plus a new 10th line: "Estimated wait: an estimate from published history, never a percentage. …".
- It also holds `METHOD_LIMITS`. The methodology "What we can't tell you" section renders these in place of "does not advise which visa…/predict an invitation", and lists the label lines.
- The copy avoids "guarantee" so it passes REPORT_BANNED_COPY.
- **Files:** method.ts (new), view.ts, methodology/page.tsx.
- **Tests:** method.test.ts (wait line present, old wording gone, banned copy). view.test.ts now expects 10 lines.

### 9. write-read (logging and checklist only)
- **Change:** the catch-all 503 now logs `failureLine(error)`: "write-read failed: <ErrorClass> (HTTP <status>)", never the message.
- HANDOFF and OPERATIONS-BACKEND now list three prerequisites before turning AI on:
  - set an Anthropic workspace spend limit;
  - build a Postgres-backed use counter per submission id (ids only), and keep `READ_ENABLED` off until it exists;
  - confirm Supabase's X-Forwarded-For handling and that the hosted deploy resolves the `npm:` SDK.
- OPERATIONS-BACKEND's logging paragraph mentions the new line.
- The Postgres counter was **not** built, as instructed.
- **Files:** supabase/functions/_shared/read.ts, supabase/tests/write_read_test.ts, docs/HANDOFF.md, docs/OPERATIONS-BACKEND.md.
- **Tests:** two new Deno tests (class + status; class only); the existing 503 test now silences the log.

### Also: "N of the last 6 months" denominator
- **Change:** `StateLabel` gains `monthsFetched6`. The new `monthsOfSix(state)` gives "2 of the last 6 months", or "2 of the 4 published months of the last 6" when months weren't fetched.
- It is used in the headline state fact, the state wait, stateWhy and the evidence table.
- **Tests:** phrases.test.ts.

### 10. Sweep test
- `src/lib/outlook/__fixtures__/sweep.ts` plus `sweep-60/70/80/90.test.ts` (one file per level, so they run in parallel).
- **Coverage:** all 493 occupations. Occupations with `hasData: false` take the unavailable path. Each level is a planner; 70, 80 and 90 also run lodged (EOI 2026-02-10). Each level's points are asserted.
- **Assertions:**
  - `checkRead` passes on the template read;
  - no string anywhere in the view matches `\b0–|\b0 to \d|\babout 0\b|NaN|undefined|Infinity`;
  - no best move keeps its label;
  - only a not-invited combined stamp says "No visa is inviting".
- **Runtime:** the full `npx vitest run` is ~4.4 s wall (was ~3.3 s).
- **Found extra:** "Of the 0–38 … EOIs" in `src/lib/report/eois-like-yours.ts`. It now uses `formatSummed` (commit 9223ae8, with a test). That module also feeds occupation pages and the homepage, which now read "Of the under 39 …" for small cohorts; large cohorts are unchanged.

## Notes and concerns

- **Size and structure:** route.ts was 282 lines and improve.ts 280, and both would have passed 300. They were split into `route-steps.ts`, `route-combined.ts` and `improve-candidates.ts`, the same way ruling R12 handled an earlier split. headline.ts is now 276 lines.
- **Performance:** improve now scores candidates once (6ae9f1f). The scratch sweep (3451 views) takes about 5 s.
- **Copy the founder may want to review:**
  - "opens 189" is used even when 189 has no published data. It means the reader becomes eligible to submit.
  - The age route step "Talk to a registered migration agent / about visas without this age limit".
  - Plain-mode lines for 0-point restores read "{name}. Keeps you at N."
- **Expired EOI:** these readers are now treated as planners (no lodged route, queue or pace). This is a behaviour decision. The alternative would be a lodged view with an expiry note.
- **Not fixed:** nothing from the list. The Postgres per-submission counter is deferred per R32 and documented.
