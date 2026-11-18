# Task 7 report: Stageshow hero demo

Status: DONE_WITH_CONCERNS (gate passes everywhere; concerns are listed at the end)
Commit: 83a4304 feat(home): Stageshow hero demo from the sample report (base c06bf19)

## What was built

- `src/components/stageshow-kit/` holds a vendored copy of the parts of the kit that the demo uses: Stage, act, clock, cursor(s), keys, looks, measure, reduced-motion, util, ease, window (Window and Bar only), motion/Count and motion/States, their CSS, plus the MIT LICENSE and an index.
  - React 19 needed no code change. Lint fixes were made in the files themselves:
    - Unused ternary expressions became if/else.
    - The playground-only `installVirtualClock` was removed, which also removed `any`.
    - Every `eslint-disable` now carries a `-- reason`.
    - `Text`, `Prompt` and `Caret` were removed from window.tsx so it has no hooks or context and can render on the server.
  - `eslint.config.mjs` has a narrowly scoped override for `src/components/stageshow-kit/**` that turns off only `react-hooks/refs` and `react-hooks/set-state-in-effect`. The kit's frame-accurate playback depends on two patterns those React Compiler rules reject wholesale: it reads the latest props through refs during render, and it resets the scene from effects. The reason is written in the config comment.
- `demo-scene.ts` is pure and tested. It holds the `DemoScene` state, `PAYOFF_SCENE`, `EMPTY_SCENE`, `groupsOf(tiles)` (the order the tiles light up) and `splitLine`.
- `demo-sheet.tsx` with `demo-sheet.module.css` is the single frame, hook-free.
  - Wide (720×356): a desktop window bled off the right and bottom. On the left are the check's points (occupation, six points lines, the "90 points" total and the button). On the right are the 189/190/491 cards (each with its own points, its count label, the figure and "At your score") and the 190 tiles with status chips.
  - Compact (358×560): the page itself, with no desktop window. A portrait desktop window fails the skill's window-shape rule. It shows the occupation, the total and the button, the scorecard as ruled rows, and the tiles in a 4×2 grid. The six points lines are left out on phones (see concerns).
- `hero-demo.tsx` (`HeroDemo`) is the Stage plus the script. `Count` rolls each published figure in from zeros. `States` crossfades the button between "Start over" and "Try sample answers".
- `hero-demo-poster.tsx` (`HeroDemoPoster`) renders the same sheet in its payoff state inside a static `.ss-stage`. It scales with CSS alone (`tan(atan2(100cqw, 720px))` plus container queries), so the real numbers are in the server HTML.
- `hero-demo-loader.tsx` (`HeroDemoLoader`) renders the figure:
  - a visually hidden `<figcaption>` holding `posterAlt`;
  - the poster first, `aria-hidden` and `inert`;
  - `next/dynamic` (`ssr: false`) mounts `HeroDemo` only when `shouldAnimate(reduced, seen)` is true. Reduced motion is read with `useSyncExternalStore`, and the server snapshot counts as "reduced".
  - The poster fades out under the identical stage frame. Print shows the poster and hides the stage.
- `should-animate.ts` is the pure helper, tested.
- Interface additions, all report strings and tested:
  - `DemoContent.cards[]` gains `points` and `aheadLabel`. Without them, 190 at 95 points and 491 at 105 points would read as if they were at 90.
  - `tiles[]` gains `tone`, the outlook group, which selects the status colour.
  - `labels` = { atScore, pointsUnit, startOver, trySample }, the product's own words. `AT_SCORE_LABEL` is now exported from `scorecard.ts` and used by `scorecard.tsx`, so that label has a single source.

## Story

1. The loop opens on the payoff, which is the poster.
2. The cursor presses "Start over" and everything clears in a reverse stagger, so the reset has a visible cause.
3. The same button now reads "Try sample answers". Pressed, it fills the occupation and points lines, then shows "90 points".
4. The three cards count in.
5. The 190 tiles light group by group, each with its chip.
6. The payoff holds.

Loop length, measured from marks: 12.1 s at 1440 and 12.3 s at 390.

## Gold example and gate

- Gold example: `hero-demo` (still and loop filmed; still saved as screenshots/task7-gold-hero-demo.png). Motion was borrowed from `payout-flow`.
- Final gate line on every run: `rehearsal passed (necessary, not sufficient: references/verify.md and the fresh eye in review.md still stand)`.
  - Wide loop at 1440: passed.
  - Compact loop at 390: passed.
  - `--states --gate` at 1440 and at 390: passed.
  - Hero-like 566 px column: passed. Film notes "scale 0.78; type reads small below about 0.85".
- Non-gate lines still printed:
  - `near-empty frames` during the Start over beat. This is the beat itself.
  - One `appears with no entrance: span.ss-count` at 1440, with no timestamp. The 80 ms beat sheets show no pop; it is probably the stage mounting over the poster.
  - Coverage reads "inconclusive" because of sampling gaps in headless Chrome.
- REHEARSAL.md: /Users/aveomac/aveo-projects/landfall/src/components/home/REHEARSAL.md
- Screenshots in screenshots/:
  - task7-gate-loop-1440.png, task7-gate-loop-390.png
  - task7-gate-states-1440.png, task7-gate-states-390.png
  - task7-gate-column-566.png
  - task7-beat-count-80ms.png, task7-beat-reset-80ms.png
  - task7-poster-1440.png, task7-poster-390.png
  - task7-print-1440.png, task7-print-390.png
  - task7-reduced-still.png
  - task7-gold-hero-demo.png

## Bundle

- Demo chunk (698.*.js, loaded only by the loader's dynamic import): 41,758 B raw, **16,548 B gzipped**. The target was 40 KB or less.
- Its own CSS chunk: 7.7 KB raw, 2.1 KB gzipped.
- The poster adds the kit's stage.css and window.css (about 6.1 + 4.1 KB gzipped at source) plus the sheet CSS to the CSS of any page that uses it.
- On the page bundle, the poster pulls in only the kit's `Window` and `Bar` (hook-free).
- Under reduced motion the demo chunk is never requested. This was verified with Playwright: 698.*.js was requested only with motion allowed.

## Tests and TDD evidence

- RED:
  - `npx vitest run src/components/home/should-animate.test.ts src/lib/home/demo-content.test.ts` failed with "Cannot find module './should-animate'" and 3 failures (cards missing points/aheadLabel; labels undefined).
  - Tile tone: 2 failures ("maps cards and 190 tiles…", "maps the 190 tiles one to one…").
  - `demo-scene.test.ts` failed with "Cannot find module './demo-scene'".
- GREEN: each of those suites passed after implementation.
- Final suite: `npm test` passed 68 files and 721 tests. `npm run lint` and `npm run typecheck` are clean. `npm run build` succeeded.
- `npm run check` fails only at `format:check`, on `.claude/settings.local.json`. That file is the user's local harness permissions file (untracked, globally git-ignored, created during this session, not touched by me). Every other file passes `prettier --check`.

## Browser checks

All checks ran against the built `out/` served on 127.0.0.1:3017 from a temporary `/demo-preview/` page. The page was removed before commit and `.next` types were cleaned; the final build has no demo-preview route.

- 1440 and 390, with and without reduced motion:
  - nothing focusable inside the figure;
  - figcaption = posterAlt;
  - the poster stays in place under reduced motion.
- Print emulation: poster opacity 1, stage display none.

## Self-review

- Every on-stage string comes from `DemoContent`, the report's own view-models and labels; no new numbers.
- Saffron appears only as the total's rule.
- Status chips carry their labels.
- No icons and no logos.

## Concerns and what I did not check

1. **Compact leaves out the six points lines.** The total stands for them, because the phone column cannot hold them alongside the scorecard and tiles. Beat 1 on phones fills the occupation and the total only.
2. **Design height is 356, not 340.** The extra 16 px keeps a full gutter under the content. Compact is 358×560.
3. **Small text in narrow columns.** Below a hero column of about 612 px, the wide design scales under 0.85, so its 12 px labels read at about 10 px. Task 8 should give the demo a column of 612 px or more, or accept that.
4. **One shared button.** "Start over" and "Try sample answers" share one button that changes label in place. In the product they are separate buttons.
5. **No fresh-eye review.** The skill calls for one, but the contract forbids dispatching reviewers.
6. **Not checked:**
   - Safari and Firefox (the poster's CSS-only scaling uses `tan(atan2())` and container units);
   - a real touch device;
   - hidden-tab resume;
   - live rAF pacing;
   - the demo on the real homepage (Task 8 places it).
7. **Leftover install.** I ran `npm install` in `.agents/skills/stageshow` to film. Its node_modules is ignored by `node_modules/` and is not committed.

---

# Fix report: ruling B9 (I1), minors 1–8 and ruling B8

Commits:
- e6bf2b6 chore: leave the user's local Claude Code settings to Prettier's ignore list
- 9d70e15 fix(home): keep the demo's text at 12px or more at every width

## B9: text at 12px or more

- The smallest design text is now **15px** in both designs. Nothing in `demo-sheet.module.css` is smaller.
- The wide design is used only from a **576px** column. The values live in one tested module, `src/components/home/demo-layout.ts`:
  - `MIN_DESIGN_TEXT = 15`, `WIDE = 720×436`, `COMPACT = {below: 576, 358×660}`;
  - `layoutFor(column)` and `scaleFor(column)`.
  - The Stage uses `COMPACT.below`. The poster's container query (`width < 576px`) and its sizes repeat the same values, with a comment pointing to the module.
  - Test: for every column from 288 (a 320 phone) to 1440, `15 × scaleFor(column) ≥ 12`.
- Redesign. At 15px the report and the check no longer fit one 720 frame, so the demo is now one window with two views, crossfaded as a page swap inside the window:
  - **Report** (the poster and the loop's start): occupation and "90 points" with "Start over", the three cards, the 190 tiles.
  - **Check**: occupation, six form fields (label over box), the saffron rule, the total, "Try sample answers" and "Open my overview".
  - Story: report → "Start over" → empty check → "Try sample answers" fills it → "Open my overview" → the figures count in → the tiles light by group → payoff.
  - Loop: 13.2 s at 1440 and at 390, measured from the stage's marks.
  - The profile lines are back in the compact design too.
- Design size changed from 720×356 to **720×436**; compact from 358×560 to **358×660**.

### Rendered text size

Measured as computed font-size × stage scale, over every non-empty text node. Measured in Chrome against the built `out/` at each viewport width. The temporary page mimicked the homepage hero: a 1fr / 1.05fr grid from 900px in a 1200 container, with 16px page padding (so the hero column is 584px at 1440 and 288px at 320). The live stage's node count includes the counters' digit strips.

| Viewport | Surface | Design | Stage scale | Text nodes | Smallest rendered | Smallest text |
|---|---|---|---|---|---|---|
| 320 | poster | compact | 0.804 | 53 | 12.07px | points |
| 320 | long-name poster | compact | 0.804 | 53 | 12.07px | points |
| 320 | live stage | compact | 0.804 | 922 | 12.07px | points |
| 360 | poster | compact | 0.916 | 53 | 13.74px | points |
| 360 | long-name poster | compact | 0.916 | 53 | 13.74px | points |
| 360 | live stage | compact | 0.916 | 922 | 13.74px | points |
| 375 | poster | compact | 0.958 | 53 | 14.37px | points |
| 375 | long-name poster | compact | 0.958 | 53 | 14.37px | points |
| 375 | live stage | compact | 0.958 | 922 | 14.37px | points |
| 390 | poster | compact | 1 | 53 | 15px | points |
| 390 | long-name poster | compact | 1 | 53 | 15px | points |
| 390 | live stage | compact | 1 | 922 | 15px | points |
| 768 | poster | wide | 1 | 53 | 15px | points |
| 768 | long-name poster | wide | 1 | 53 | 15px | points |
| 768 | live stage | wide | 1 | 922 | 15px | points |
| 1440 | poster | wide | 0.811 | 53 | 12.16px | points |
| 1440 | long-name poster | wide | 1 | 53 | 15px | points |
| 1440 | live stage | wide | 0.811 | 922 | 12.17px | points |

The smallest rendered text anywhere is **12.07px**, at 320. Every row is ≥ 12px.

### Gate after the change

All runs used the final build. Every one ended `rehearsal passed (necessary, not sufficient: references/verify.md and the fresh eye in review.md still stand)`:

- loops at 320, 360, 375, 390, 768 and 1440;
- `--states --gate` at 1440 and at 390.

Lines that remain are not gate lines:
- `near-empty frames` during the Start over beat;
- `appears with no entrance: span.ss-count`, with no timestamp (the stage mounting over the poster);
- `scale: 0.81` at 1440 and `shrunk … drawn at 0.80` at 320. Both are what ruling B9 sets: 0.8 × 15 = 12px.

Fixes made while filming:
- compact rows run edge to edge;
- the check footer's saffron rule is its own hairline;
- the legend chips stack in compact;
- the stacked compact buttons are 10px apart, which renders at 8px at 0.8;
- "At your score" sits 6px from its value in compact.

Sheets are saved as screenshots/task7-fix-gate-loop-{320,360,375,390,768,1440}.png, task7-fix-gate-states-{1440,390}.png, task7-fix-check-view-{1440,390}.png and task7-fix-long-name-390.png. task7-poster-{1440,390}.png and task7-print-{1440,390}.png were refreshed.

## Minors

1. `--ss-accent: var(--slate)` is set in the demo's look, so the click ripple is slate.
2. `Window lights="grey"`.
3. The poster degrades without `tan(atan2())`:
   - `.poster` and `.frame` have `overflow: clip` and fixed 1:1 heights;
   - the scaled heights and the transform apply only under `@supports (scale: tan(atan2(1px, 1px)))`;
   - an older browser shows the design at 1:1, cropped to the column.
4. Long occupations:
   - The compact button is `flex: none`, beside the occupation, which can shrink.
   - A long occupation is clamped to two lines in compact.
   - Checked with "Software and Applications Programmers nec": the button keeps the profile's right gutter at 390 and 1440 (task7-fix-long-name-390.png), and the long-name poster's text stays ≥ 12px (table).
5. The cards' points are a `Slot` gated by `answered`. After "Start over" no points show until the profile is filled. In the new story the report view is also hidden while the check is empty.
6. Labels come from shared constants, with no duplicated literals:
   - New `src/lib/check-actions.ts`: `START_OVER`, `TRY_SAMPLE_ANSWERS` and `OPEN_OVERVIEW`, used by `check-flow.tsx` and the demo.
   - `POINTS_UNIT` is exported from `src/lib/report/scorecard.ts` and used by `scorecard.tsx` and `demo-content`. `profileLines`' total uses it too.
   - `TRY_IT_ROW_LABELS.same` is now `AT_SCORE_LABEL`.
   - `DemoContent.labels` = { atScore, pointsUnit, startOver, trySample, openOverview }; tested by identity against the constants.
7. `DemoContent.cards[]` now has a typed `visa: Visa` key plus `title`. The outlook heading looks up `card.visa === "190"`.
8. The "Needs your answers" chip and tile are dashed (`border-style: dashed` in muted-soft).

The kit's `States` is no longer used and was removed from the vendored kit.

## B8

`.prettierignore` now lists `.claude/settings.local.json`, with a one-line comment. The file itself was not touched. `npm run check` passes in full (exit 0).

## TDD evidence

- RED: `npx vitest run src/lib/home src/lib/check-actions.test.ts src/components/home` failed with:
  - `Cannot find module './check-actions'`, `'./demo-layout'` and `'../check-actions'`;
  - `demo-scene` ("expected { answered: true, … } to deeply equal { view, … }").
- GREEN: the same suites passed (476 tests) after `check-actions.ts`, `demo-layout.ts`, `demo-scene.ts` (`view`) and the `DemoContent` changes.

## Verification

- `npm run check`: exit 0 (Prettier, ESLint with 0 warnings, tsc, 70 test files / 726 tests).
- `npm run build`: exit 0. No demo-preview route is left (the temporary page was removed and `.next` types cleaned).
- Demo chunk: 41,444 B raw, **16,419 B gzipped**. Its CSS is 1.9 KB gzipped.
- Reduced motion at 1440 and 390: no stage, and the demo chunk is not requested.
- With motion allowed: one stage, nothing focusable, figcaption = posterAlt.
- Print: poster opacity 1, stage display none.

## Not checked

- Safari and Firefox (the CSS fallback path was not run in a browser without `tan(atan2())`);
- a real touch device;
- the demo on the real homepage (Task 8 must give the hero column ≥ 576px to get the wide design; below that it shows compact);
- a fresh-eye review (the contract forbids dispatching reviewers).

Design-size change for Task 8: 720×436 wide and 358×660 compact.
