# Final fix wave: report

Status: DONE_WITH_CONCERNS (all items are done; the concerns are listed at the end)

Base: 6d10ca6. Commits:

- 70727b1 fix(home): key every outcome the EOI sentence counts, with its notes (I1 + minor 2)
- daf4e7e fix: plain headings site-wide, no decorative eyebrows, no synthesized italics (B11)
- b06c951 fix(home): demo figures settle in as published; compact fits a 320 phone (B12 + minor 10 + T7)
- 5cabccd fix(home): keep the door link's own focus ring without :has() (minor 1)
- acc450e fix(home): one EOI caveat wording; no retry promised on load failure (minor 3 + T6)
- 4d53d23 fix(states): plain wording instead of the possessive brand (minor 5)
- 2dc306f fix(footer): show the data month as Oct 2026, like the rest of the site (minor 9)
- 59f7a30 docs: note the MigrateLens brand on the old product direction and README (minor 8)

Final state: `npm run check` passes with 0 warnings (748 tests in 71 files). `npm run build` passes (static export, 8 pages).

## I1: the homepage outcome key (+ minor 2)

- **View-model:** `buildEoisLikeYours` (src/lib/report/eois-like-yours.ts) gains `outcomes: OutcomeRow[]`.
  - Each row is `{key, label, count, interval}` for every outcome the sentence's total counts: the bar's four, plus "On hold" when it isn't zero.
  - `OUTCOME_LABELS` now lives in the view-model.
- **OutcomeBar:**
  - The key renders from `view.outcomes`. With `withCounts` it lists "On hold" too, with no swatch, because the bar doesn't draw it.
  - With `withCounts`, the bar is `aria-hidden` (minor 2). Without it, the bar keeps `role="img"` and its label.
- **The report's stats list** (eois-like-yours.tsx) now renders from the same rows, so the report and the homepage share one source.
- **Homepage** (three-questions.tsx) now renders `statusNote` and `closedNote` under the key. They are 14px, and 16px at 720px and below.
- **Tests:**
  - RED: `npx vitest run src/lib/report/eois-like-yours.test.ts src/components/home/sample-view.test.ts` gave 3 failed, each with `TypeError: Cannot read properties of undefined (reading 'map'/'reduce')`.
  - GREEN: 18 passed.
  - New tests:
    - the key's intervals sum to the sentence's "Of the …" total (fixture 887–906);
    - "On hold" is left out when zero;
    - for the real sample, the sum equals the total in the sentence, and "hold" is present.
- **Browser** (out/, 1440 and 390): the key reads "Invited, not yet lodged: 0", "Lodged a visa: under 20", "Still waiting: 267", "Closed: under 20" and "On hold: under 20". That sums to 267–324, which is the sentence's "Of the 267–324". The status note renders.

## B11: headings, eyebrows, italics

- **Guard test:** src/app/no-synthesized-italic.test.ts checks that:
  - no italic face is loaded;
  - no italic or oblique `font-style` appears in src (the vendored kit is excluded);
  - globals.css sets `em, i, cite, dfn, var, address` to `font-style: normal`;
  - no `<h1>`–`<h6>` contains an `<em>`.
  - RED: 2 failed. The heading check listed 20 em-split headings in 10 files.
  - GREEN: 4 passed.
- **CSS:**
  - `em` is now upright, with weight 600 as its emphasis.
  - Removed as dead: `.eyebrow` (all 9 rules), `.final-cta em`, `.report-heading h1 em`, `.report-section h2 em` and the print `.report-heading em`.
- **IDs and anchors:** all kept. Only text inside the headings changed.
- **Browser:** computed `font-style` is `normal` for every visible text node on /, /sample/, /check/, /states/, /methodology/ and the 404 page, at 1440 and 390.

Old → new, for the founder:

| Where | Old | New |
|---|---|---|
| 404 eyebrow | A small detour | (removed) |
| 404 h1 | Let’s find _your way back._ | Page not found |
| 404 body | That page isn’t here. Your next chapter starts with a little clarity. | That page isn’t here. Check the address, or go back to the homepage. |
| /states/ eyebrow | Eight jurisdictions. Different rules. | (removed) |
| /states/ h1 | Understand _the state picture._ | State and territory nomination programs |
| /sample/ eyebrow | See what clarity looks like | (removed) |
| /sample/ h1 | One person. _Their whole picture._ | A sample report for one fictional profile |
| /check/ eyebrow | A little context. A clearer picture. | (removed) |
| /check/ h1 | Start with _your points._ | Check your points |
| /check/ step 1 h2 | Let’s start with you. | You and your occupation |
| /check/ step 2 h2 | English. Education. Possibility. | Your English and qualifications |
| /check/ step 3 h2 | Complete your picture. | Your work and other points |
| /check/ step 4 h2 | Looking good. One last check. | Review your answers |
| /methodology/ eyebrow | Know what’s behind the numbers | (removed) |
| /methodology/ h1 | Good information starts with _honest methods._ | Methodology and limitations |
| #sources | Every number has _a starting point._ | Our sources |
| #pool | A pool comparison, _with context._ | How to read the pool |
| #points (methodology) | Rules first. _Your answers give them context._ | How we calculate points and dates |
| #limitations | What we can’t _tell you._ | What we can’t tell you |
| #privacy | Your answers _stay with you._ | Your answers stay in your browser |
| #questions | A few useful _answers._ | Common questions |
| Report nav label | YOUR PERSPECTIVE | IN THIS REPORT |
| Report heading eyebrow | THE MIGRATELENS PERSPECTIVE | (removed; the "Sample report" / "Your free overview" pill stays) |
| Report h1 | {Name}, here’s / _your migration picture._ | {Name}, here’s your skilled-migration report (without a name: "Here’s your skilled-migration report") |
| Report #points | Every point, _accounted for._ | Your points, category by category |
| Report #scenarios | One change. _A different picture._ | What could change your score |
| Report #timeline | The next chapter, _on your timeline._ | Your dates for the next three years |
| Report #compare | A little more _perspective._ | Compare another occupation at your score |
| Report #prepare | Bring the evidence _together._ | Organise your evidence |
| Report #definitions | The terms, _made clearer._ | Terms used in this report |
| Report warnings | What’s behind _your picture._ | Assumptions behind your points |
| /sample/ final CTA eyebrow | MAKE THE PICTURE YOUR OWN | (removed) |
| /sample/ final CTA h2 | Now, _your numbers._ | Check your own points |

Kept, because they are functional labels:

- the numbered report section labels ("05 / YOUR POINTS AUDIT" and the rest, numbered to the nav);
- "Your reality check";
- "Subclass 189/190/491";
- the homepage's "Why we built it" (a section name in the spec).

The check-flow step titles had no `<em>`, but they were the same kind of poetic fragment the spec's tone rules out, so I rewrote them too. Every new string is free of BANNED_COPY terms.

## B12: the demo's count-in

- **Change:**
  - hero-demo.tsx no longer uses the kit's `Count`. The `Figure` odometer, the `zeroed` state and its snap are gone.
  - DemoSheet's `figure` prop is removed.
  - Each published figure now settles into its slot as its final string: an opacity fade (0.6 s) and a 4px rise (0.8 s), staggered 120 ms across 189, 190 and 491.
  - Reduced motion still shows only the poster.
- **RED:** a 30 ms DOM sampler over one loop on the old build found odometer digit strips ("0123456789…–0123…") inside every figure.
- **GREEN:** the same sampler over 15 s found only the six published strings, at both 1440 and 390: 865–903, 1,093, 882–920, 1,293, 541–579 and 878 ("intermediate": []).
- **Gate:** `node .agents/skills/stageshow/scripts/film.mjs http://127.0.0.1:3017/ --gate …` on the final build. Every run ended `rehearsal passed (necessary, not sufficient: references/verify.md and the fresh eye in review.md still stand)`:
  - the loop at 1440 (`--select` on the demo slot), 390, 375, 360 and 320;
  - `--states` at 1440 and 390.
  - Remaining non-gate lines: `scale: 0.83` at 1440, `shrunk … drawn at 0.80` at 320 (B9), and "inconclusive" coverage from sampling gaps.
- **REHEARSAL.md** is updated with B12, the 346 compact, the re-run gate lines and the text-floor numbers.
- **Demo vs /sample/:** the poster's figures equal the /sample/ scorecard's. Checked in the browser, and by the existing sample-view test.

## Minor 10 (compact space) and a B9 bug found on the way

- **The bug:** on the real homepage, a 320 phone leaves a 278px column (21px phone gutters in globals.css), not the 288px Task 7 assumed. That drew the compact demo at 0.777, with its smallest text at **11.65px**, which breaks B9. It was already there before this wave.
- **Fix:**
  - The compact design is now 346 × 660 (was 358 × 660), so 278 / 346 = 0.803.
  - The page keeps its 16px gutter and is 314 wide.
  - A 10px inset (to keep the page 326 wide) was tried first and failed the gate (`framing: … ends 10px short`).
  - The B9 floor test now starts at 278. RED: `expected 11.648 to be greater than or equal to 12`. GREEN after the change.
- **Rendered minimum** (computed size × scale, poster and live stage): 320 → 12.05px, 360 → 13.79, 375 → 14.44, 390 → 15, 768 → 14.75 and 1440 → 12.4.
- **Height:** I tried 636 first, but at 314 wide "ICT Business Analyst" wraps to its two-line clamp. The content then ends at 645, so 636 would crop the last tile row, and the gate doesn't flag crops at the stage edge. The 660 height was always the reserve for two-line names, so it stays.
- **Net effect at 390:** the stage now draws 1:1, and the gap from the last tile to the figure's foot fell from 36px to 15px. See final-home-390.png.

## T7: poster CSS pinned to demo-layout.ts

- **Tests** in demo-layout.test.ts:
  - every px literal in hero-demo.module.css is one of WIDE.width/height, COMPACT.width/height and COMPACT.below, and each `atan2`, `calc` and `@container` use matches;
  - the window and the page both bleed 40px off the stage's foot (demo-sheet.module.css).
- **TDD:** the tests passed on the old CSS. Changing `COMPACT` in demo-layout.ts turned them RED (2 failed), and updating the CSS turned them GREEN. That happened twice, for 636 and then 346 × 660.

## Minor 1: door focus ring

doors.module.css: `.action:focus-visible { outline: none }` is now inside `@supports selector(:has(*))`. Without `:has()`, the link keeps its own ring. This is CSS only, so it has no unit test.

## Minor 3 + T6: try-it wording and one EOI caveat

- **Wording:** `TRY_IT_LOAD_FAILED` is now "Couldn't load the published data for this occupation. Reload the page or choose another occupation." A test asserts the exact text and that it never offers "try again".
- **Shared caveat:**
  - `EOI_CAVEAT` ("Counts are EOIs (one person can hold several).") is exported from src/lib/report/scorecard.ts.
  - The scorecard's source line uses it, lower-cased mid-line. Its wording is unchanged, and the existing source-line test still passes.
  - try-it.ts imports it in place of its own copy.
- **RED:** 3 failed: the export was missing, plus the wording and note tests.
- **GREEN:** 29 passed.

## Minor 5: the possessive brand

- **Strings:**
  - sa.ts:40 is now "Our months question does not say whether…".
  - sa.ts:137 now reads "…which our question asks about…".
  - nsw.ts:80, also user-facing, now reads "'At least 1 month' is our approximation for the months-working question…".
- **Comments:** qld.ts, nsw.ts and sourced.ts now say "our", and REHEARSAL.md says "the site's".
- **Test:** no-old-name.test.ts now also checks that src never contains "MigrateLens's". RED listed 4 files; GREEN passed.

## Minor 8: docs

- docs/PRODUCT.md gets a dated brand note under its title and a "Superseded" line under "First release design". Both point to the spec. The doc is not otherwise rewritten.
- README.md gets a note under its title.

## Minor 9: footer month

site-footer.tsx drops its own full-month list and uses `formatMonth` from src/lib/report/copy.ts. The rendered footer reads "Published SkillSelect data, as at Oct 2026.", and "October 2026" no longer appears in out/index.html. There is no new logic (`formatMonth` is already tested), so there is no new test.

## Browser verification (built out/, served on 127.0.0.1:3017, then stopped)

- **Pages and widths:** /, /sample/, /check/, /states/, /methodology/ and 404, at 1440 and 390.
- **Results:** horizontal overflow 0 everywhere, no visible text under 12px (stage scale included), no non-normal `font-style` and no console errors.
- **Homepage outcome key:** sums to 267–324, matching the sentence.
- **Poster figures:** equal /sample/'s scorecard.
- **Screenshots** in screenshots/:
  - final-home-desktop-top.png, final-home-390.png (full page), final-sample-top.png and final-sample-390-top.png;
  - gate sheets final-gate-loop-{1440,390,375,360,320}.png and final-gate-states-{1440,390}.png.

## Self-review

- The commits are grouped by item. The I1 view-model change removed the report's separate "On hold" branch, so the report and the homepage now share one list.
- No `.superpowers/` files were staged.

## Concerns

- **Founder copy review:** the new headings in the table above are my wording, and the founder may want to tweak them. Body copy that is still somewhat poetic was not in scope and is left alone. For example: the check-flow step intros ("A few details turn the bigger picture into your picture."), the /states/ and /check/ ledes, and the methodology sentence "People can submit multiple EOIs…", which uses "People" (BANNED_COPY is for the report and homepage).
- **Not re-checked at 314:** a long occupation name ("Software and Applications Programmers nec") in the compact poster. It should still clamp to two lines, as designed, but I did not re-film it.
- **Report numbered labels:** the report's numbered section labels ("EXPLORE THE WHAT-IFS", "GET ORGANISED" and the rest) were kept as functional labels. Their wording differs from the nav titles, so a later pass could align the two.
