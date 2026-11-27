# Instagram launch pack: builder report

Branch `social/launch-pack` (from 76a6a77). Not pushed, not merged. No live services, keys or Supabase CLI touched; `SITE_INDEXABLE` unchanged; nothing written to `public/`. Every Chrome the renderer started was closed (`pgrep` finds none).

## Commits

- `d08426f` feat(social): launch pack view-models from the site's own data
- `c9b9c97` feat(social): render the launch pack with --set launch
- `cdf6ad6` chore: keep the local Instagram launch pack out of git
- `facf395` docs: the launch pack's command and options
- (this report and the brief) docs: launch pack brief and report

## What was built

- **View-models, `src/lib/social/`** (pure, relative imports): `launch-types.ts`, `launch-common.ts`, one builder per post (`welcome-post`, `reused-posts` for posts 2 and 3, `points-post`, `visas-post`, `jargon-post`, `enough-post`, `state-post`, `occupation-post`), `stories.ts` (4 story frames, avatar, 4 highlight covers), `captions.ts` (alt text, caption text, captions.md), `calendar.ts`, `profile.ts`, `launch-pack.ts` (`buildLaunchPack`), `load-server.ts` (`loadLaunchInput({ state, occupation })`). The state and occupation spotlights take any state code and ANZSCO code.
- **Templates, `scripts/social/templates/`**: `launch-cover`, `launch-list`, `launch-text`, `launch-chart`, `launch-compare`, `launch-link`, `launch-story`, `launch-stamp`, `profile-avatar`, `highlight-cover`, styled by `launch.css` on top of `card.css` (tokens only). The Chrome renderer moved to `renderer.ts` (re-exported from `render.ts`) and is shared. `browser-checks.ts` now also applies the grid-crop check to every launch cover and a 540px crop-circle check (`[data-circle]`) to the profile picture and highlight covers. New format `square` (1080×1080). Small refactors: `closingCardFor`, `SKILLSELECT_SOURCE` and `ROUND_SOURCE` exported from `src/lib/updates/cards.ts`; `CardPage` takes a structural `PageMeta`; the source line also bolds " · checked …".
- **Command**: `npm run social:render -- --set launch --out <dir> [--theme light|dark] [--state NSW] [--occupation 254499] [--start YYYY-MM-DD] [--guides] [--html-only <dir>]` (`scripts/social/launch.ts`, `launch-jobs.ts`, `launch-preview.ts`, `contact-sheet.ts`). Refuses an `--out` inside `public/`. Limits checked per folder (300 KB an image, 2.5 MB a folder). `--guides` renders only the stories with dashed sticker boxes into `<out>/stories-guides/`; the final PNGs never have them.
- **Output**: `/Users/aveomac/aveo-projects/landfall/.superpowers/social/launch-2026-11/` (gitignored): `01-welcome/` (4), `02-round-oct/` (3, copied), `03-update-oct/` (6, copied), `04-points-table/` (10), `05-189-190-491/` (7), `06-jargon/` (8), `07-is-65-enough/` (5), `08-state-nsw/` (8), `09-occupation-254499/` (8), each with `caption.json`; `stories/` (4), `profile/` (avatar + 4 highlights); `captions.md`, `calendar.md`, `profile.md`, `preview.html`, `contact.png`. 68 images.
- **Tests**: `src/lib/social/launch-pack.test.ts` (frozen 2026-10 snapshot: post order and pins, numbering, reused paths, every points-table row once, no charge row, R3 headings, "<20" as a range, "Not listed" never 0, masked pool bars), `src/lib/social/copy-sweep.test.ts` (live pack: BANNED_COPY, number rules, no prices, no "invitations issued" in the state post, font subsets, 5–8 hashtags, 2–4 body sentences, profile limits), `scripts/social/launch-jobs.test.ts`, `launch-preview.test.ts`, `launch-render.test.ts` (Chrome; every points slide, the occupation post, stories, profile kit, a failing crop circle, guides only with the flag), title-fit additions. `tokens.test.ts` now allows the chart bars' own layout variables.
- **Docs**: `scripts/README.md` ("The launch pack"), CLAUDE.md "Instagram cards" paragraph, `.gitignore`.

## Command output

- `npm run check`: format, lint (0 errors; 2 warnings are in pre-existing untracked `.superpowers/brainstorm/*/lib.js`), typecheck, tests: 254 files, 2421 tests passed.
- `npm run build`: passed; postbuild "bundle lock: 3 pages clean, 68 chunks scanned".
- `npm run social:render -- --set launch --out .superpowers/social/launch-2026-11`: exit 0, "Wrote 68 images", every page check passed. Largest image 103 KB (`04-points-table/05.png`); largest folder 760 KB (points table). Dark (`--theme dark`) and `--guides` renders also pass (rendered to the scratchpad, not kept).
- I looked at every light PNG (half size, as on a phone) and fixed overflow and sparse layouts (title fitting to two lines, row density, link cards centred, URLs break only after "/"). `contact.png` is in the output folder; `preview.html` checked at 390px (no horizontal scroll).

## Where each figure comes from

- Post 1: `ABOUT_INTRO` and the "editorial"/"updates" paragraphs of `src/lib/about/copy.ts`; the data month from the manifest; the latest round date from `loadLatestRound`.
- Posts 2 and 3: the existing PNGs in `public/social/2026-10/round-2026-10-15/` and `month/`; alt text from `altText` on `roundSetCards`/`monthSetCards`; captions from the same cards.
- Post 4: `POINTS_TABLE`, `PASS_MARK`, `checkedAt` (23 Nov 2026) in `src/data/guide/points-table.ts`; caption body is `pointsTableAnswer`.
- Post 5: `VISA_GUIDES` (`src/data/guide/visas.ts`), `compareRows` (charge row removed), `differenceAnswer`, `GUIDE_CHECKED_AT`; the 191 rules are the guide's three "191:" rules.
- Post 6: `glossaryTerms` (eoi, invitation-round, invited, state-nomination, nomination-points, masked-count, cut-off, not-listed, tie-break-date, date-of-effect).
- Post 7: `latestRound` and the 2026-10 recap's round section (distribution: 44 occupations at 65); text from `enoughFaq`, `latestRoundLine`, `cutoffSpanText`.
- Post 8: `loadStatePageView("NSW")`: hero answer, months cards (month-end EOIs holding an invitation, "<20" kept as hatched ranges), score views, top occupations, verified stream rows and selection lines only (NSW 190 selection text is unverified, so it is left out).
- Post 9: core 254499 with `dated189Sentence`, `datedLead`/`poolSentence`, `statesSentence`, `stateRows`, `occupationFaq` (tie-break 19 Nov 2025 via `tieBreakFor`), `poolBars`, `poolTotalLabel`, `occupationPath`.
- Calendar reply example: the same occupation sentences plus its page link.

## Concerns

1. Post 3's month set already has a Registered Nurses nec spotlight card, so post 9 goes deeper into the same occupation six days later.
2. The 2026-10 data and the 15 Oct round are about six weeks old; if the November round or data lands during the 10 days, the calendar says to post the new set instead.
3. NSW month charts: the hidden ranges ("<20" cells at up to 19 each) dwarf the published floors, so solid bars are thin. This mirrors the state page; the value labels ("790+", "<20") carry the reading.
4. The occupation post's state list shows "Rules being checked" for VIC, ACT, TAS and NT (honest, but four of eight rows).
5. Instagram behaviour I couldn't verify: the pinned-row order (the calendar tells the founder to check it and re-pin) and the exact sticker sizes (sticker spaces are generous estimates; see the `--guides` render).
6. Hashtags are common, non-spammy tags I chose; their reach isn't researched.
7. `src/lib/social/copy-sweep.test.ts` reads live data through `loadLaunchInput`, which `live-data-tests.test.ts` can't detect, so it isn't on that list (listing it fails that test). It asserts only copy invariants; figures are tested on the frozen snapshot.
8. The dark pack renders and passes the checks but I reviewed only a sample of its cards.
