# Task 4 report: render script

Status: DONE. Commit `f73a61c feat(social): render cards with puppeteer-core` (base 98d57cd). Not pushed.

## What I implemented

- `scripts/social/jobs.ts`
  - `RenderJob` is an alias of `HtmlJob`: `{ card, format, theme, out }`.
  - `roundSetJobs(facts, roundDate)` returns 9 jobs under `public/social/YYYY-MM/round-YYYY-MM-DD/`: `cover-`, `round-` and `closing-{light,dark}.png`, `story-cover-{light,dark}.png` and `og.png` (light). The story and OG images come from `round-cover`.
  - `monthSetJobs(facts)` returns 13 jobs: `cover`, `state-190`, `state-491`, `spotlight` and `closing` in both themes, plus `story-cover` in both themes, under `month/`. It adds `public/social/YYYY-MM/og.png` (light). Card 2 is filtered out, so it is never a job.
  - `reusedRoundFiles(facts)` gives the newest round set's `round-light.png`/`round-dark.png`. It serves R13 here, and Task 5's `reused`.
  - `jobsFor(facts, args)` picks the set. `--round` defaults to the newest round. It throws "`<month>` has no data section; run … --section data first" and "`<month>` has no 189 round".
  - `parseRenderArgs(argv)` follows `parseGenerateArgs`'s style. It accepts `--month`, `--set round|month`, `--round` (round set only, YYYY-MM-DD) and `--html-only <dir>`. It rejects unknown flags, repeated flags and missing values.
- `scripts/social/browser-checks.ts`: `checkCard(page, job)` evaluates page source passed as a string, per the Task 3 hand-off. It throws `"<job.out>: problem; problem"`.
  - Fonts: `document.fonts.load(f)`, then `check(f)`, for the four exact descriptors. A rejected load or an empty match fails. That way a face the card doesn't use still gets checked, and an undeclared face can't pass as a vacuous `true`.
  - Overflow: `.fit, .inner` scroll versus client size.
  - Story: every `[data-safe]` box lies within y 250…1580, and at least one must exist.
  - Feed cover (`cover`/`round-cover`): every `[data-essential]` box lies within x 34…1046, and at least one must exist.
  - The computed `--paper` must equal `cardColour("paper", theme)`.
  - The bounds come from `social-spec.ts` (`STORY`, `FEED`, `FEED_GRID_WIDTH`).
- `scripts/social/render.ts`
  - `openRenderer(chrome?)` launches with the brief's exact options. For each job it sets the viewport at device scale 1, emulates `prefers-color-scheme`, writes the HTML to a temp file and opens it with `page.goto(file://…)`. It then awaits `document.fonts.ready`, runs `checkCard` and returns the `screenshot({ clip })` buffer.
  - `main` renders every PNG before it writes any file, so one failure leaves no partial set. It exits 1 with the message.
  - `--html-only` calls `writeCardHtml` and never launches Chrome.
  - R13: `--set month` exits 1 when the newest round's card 2 files are missing ("render the round set first").
  - R11: it never prunes.
- Small supporting edits:
  - `tokens.ts` gains `cardColour(role, theme)`, with a test.
  - `html.ts` exports `CARD_SIZES`; it was the private `SIZES`.
  - `spotlight-render.test.ts` imports `DEFAULT_CHROME` from `render.ts`.
- `package.json`: the `social:render` script, and exact devDependencies `puppeteer-core 25.18.1` and `sharp 0.35.5`. In the lockfile, sharp changed from `optional` to `devOptional`.
- `scripts/README.md`: a new "Instagram cards" section covering the commands, the sets, R13 and the checks.

## Tests

- `scripts/social/jobs.test.ts` has 24 tests. They cover:
  - every brief assertion, plus the full round-set file list;
  - story and OG cards from the cover;
  - a month without a round still gives 13 jobs;
  - `reusedRoundFiles`, including two rounds and no round;
  - `parseRenderArgs`, with valid input and 9 rejections;
  - `jobsFor`: newest-round default, a round-only month, "rejects --set month for a month without a data section", no round, and a round outside the month.
- `scripts/social/render.test.ts` runs in Chrome and has 7 tests. It is skipped when neither `CHROME_PATH` nor the macOS Chrome exists, and each test has a 60 s timeout. The tests:
  - a dark feed card gives a 1080×1350 PNG;
  - the story is 1080×1920 and the OG image 1200×630;
  - the "Supercalifragilisticexpialidocious Specialist" spotlight throws `test/spotlight-feed-light.png: text overflows .title.fit`;
  - a dark job given light HTML throws `--paper is <light paper>, not …`, which is the Review Focus "dark falls back to light" case;
  - a missing Big Shoulders file throws `font 900 40px "Big Shoulders Stencil Display" did not load`;
  - a story `[data-safe]` box shifted up fails the safe-zone check;
  - a feed cover `[data-essential]` box shifted left fails the grid-crop check.

### TDD evidence

- RED:
  - `npx vitest run scripts/social/jobs.test.ts` gave "Test Files 1 failed … no tests". `./jobs` did not exist yet, as expected.
  - `npx vitest run scripts/social/render.test.ts` gave "1 failed, no tests". `./render` did not exist yet.
  - After implementing, one test still failed: "refuses feed cover text outside the grid crop" reported "promise resolved … instead of rejecting". The cover content starts at x=132, so `margin-left:-80px` stayed inside the band. The check was correct and the fixture CSS was not, so I changed it to `transform:translateX(-200px)`.
- GREEN:
  - `npx vitest run scripts/social/` passed 6 files and 59 tests.
  - `npm run check` passed: format, lint and typecheck were clean, and tests were 173 files and 1773 passing.
  - `npm run build` succeeded.

### Manual CLI run (2026-10)

- `--set month` before the round set: exit 1, "Missing …/round-light.png, …/round-dark.png; render the round set first: …".
- `--set round` wrote 9 PNGs and exited 0 in about 1.3 s. `--set month` then wrote 13 and exited 0 in about 1.6 s. That makes 22 PNGs. I viewed `month/cover-dark.png` (correct dark theme) and `round-…/story-cover-light.png` (content inside the safe band).
- `--html-only <dir>` wrote 13 HTML files and exited 0.
- `--month 2026-09` exited 1 with ENOENT (no facts file). `--round 2026-10-16` exited 1 with "No round on 2026-10-16 in 2026-10".
- I deleted the local renders afterwards. Nothing under `public/social/` is committed.
- File sizes before quantising (Task 5) were about 124–320 KB each. Two were over 300 KB: `month/cover-dark` at 312 KB and `month/story-cover-dark` at 320 KB. The month set was about 2.9 MB. Task 5's quantise and limits handle this.

## Deviations and notes

- The brief's step 3 says `setContent`. I used `page.goto(file://…)` on a temp file instead, per the Task 3 hand-off and the ledger, because Chrome refuses `file://` fonts on `about:blank`.
- Feed file names use the card id, but both covers are named `cover-*` (the round cover is `cover-*` in its round folder), to match Task 5's `month/cover-light.png` example. Card 2 is `round-*`, as the brief requires.
- The brief's `fonts.check` requirement is met after an explicit `fonts.load`. Without the load, `check` is false for a weight the card never uses, such as 400 on a card with no regular text. Without the "empty match" guard, an undeclared face could pass as true.
- I implemented R13 here, because the check lives in `render.ts`. The ruling doesn't name a task. Task 5 can reuse `reusedRoundFiles` for `set.json`'s `reused`.

## Concerns

- No `--no-sandbox` flag. The brief's args are exact, and ledger row 13 leaves it to Plan 3's CI job. On ubuntu-24.04 Plan 3 will probably need to add it, for example when `CI` is set.
- `render.test.ts` adds about 2 s of Chrome work to every local `npm run check`. The ledger already accepts that.
