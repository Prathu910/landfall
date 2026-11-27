# Reel 1, "Is 65 points enough?": builder report

Branch `social/launch-pack` (from 2272774). Not pushed, not merged. No live services or keys touched; nothing installed or downloaded (no ffmpeg, no npm packages); nothing written to `public/` by the reel (the build's usual `prebuild` data copy aside). Every Chrome the renderer and tests started was closed (`pgrep -f -- --headless` finds none; the founder's own Chrome was left alone), and the temporary frame folders are deleted (none left in `$TMPDIR`).

## Commits

- `796c89f` refactor(social): share post 7's wording, the logo and the page checks
- `db1034b` feat(social): the "Is 65 points enough?" reel as a view-model
- `fa83bb1` feat(social): render reels to MP4 with npm run social:reel
- `b7544e1` docs: the reel command
- (this report and the brief) docs: reel brief and report

## What was built

- **View-model, `src/lib/social/`** (pure, relative imports): `enough-reel.ts` (`enoughReel`: the five storyboard scenes, their timings and the caption), `reel-motion.ts` (each element's Web Animations keyframes over the whole reel: `fadeTrack`, `growTrack`, `cutTrack`, and `countAt`, the count-up curve), `reel-types.ts`, `reel-text.ts` (`caption.md`, `sceneText`), and `loadEnoughInput` in `load-server.ts` (the newest round from `loadLatestRound` and its recap section, `PASS_MARK`). `enough-post.ts` now exports `passMarkStamp`, `CUTOFFS_PAGE`, `CUTOFFS_URL`, `HISTORY` and `atPassMarkTitle`, so post 7 and the reel share one wording (post 7's cards are unchanged).
- **Page**: `scripts/social/templates/reel-page.tsx` and `reel.css` (on `card.css` and `launch.css`; tokens only, so `tokens.test.ts` now also covers `reel.css`) draw every scene on one passport page with the guilloche paper, the logo row, the source line and the MRZ line (`P<AUSMIGRATELENS<<IS<65<ENOUGH<<<…`). `reel-html.ts` adds a player that plays every track paused and exposes `window.seek(ms)`, which sets every `document.getAnimations()` item's `currentTime` and the count-up numbers.
- **Renderer**: `scripts/social/reel-browser.ts` opens the page in headless Chrome (puppeteer-core) and checks it before any frame: both faces, no `.fit` overflow, every `[data-safe]` box inside x 60–940 and y 250–1540, the hook inside the profile grid's 4:5 crop (y 285–1635), `--paper`, then at each scene's hold time that its elements are fully shown and every other scene's hidden. `browser-checks.ts` gained `checkPage` and an optional x range in `safe` for this. Then it seeks and screenshots 450 frames to a temporary folder.
- **Encoder**: `scripts/social/encode-mp4.swift`, run with `/usr/bin/swift`: `encode` (AVAssetWriter + AVAssetWriterInputPixelBufferAdaptor, H.264 High, 9 Mbps average, BT.709, keyframe every second, `shouldOptimizeForNetworkUse = true`, session ended at exactly 15 s) and `probe` (AVURLAsset: duration, size, codec, nominal frame rate, sample count via AVAssetReader, bytes, whether `moov` precedes `mdat`; with a folder and times, it saves frames with AVAssetImageGenerator at zero tolerance).
- **Command**: `npm run social:reel -- --reel enough --out <dir> [--html-only <file>]` (`scripts/social/reel.ts`). It refuses an `--out` inside `public/`, fails and writes nothing if the probe finds anything other than 15 s, 1080×1920, `avc1`, 30 fps, 450 frames, under 30 MB, fast start; it always closes Chrome and deletes its temporary folder.
- **Tests**: `src/lib/social/enough-reel.test.ts` (frozen 2026-10 recap: scenes and timings, end-card hold, move durations, the hook equal to `enoughFaq`'s question, the eight bars and their counts, the 65 bar alone strong, the reading and link wording, one track per element, stamps only hard-cut, caption.md; plus the motion helpers); `scripts/social/reel.test.ts` (args, probe problems, the page HTML, and in Chrome: the page checks pass, the count-up matches `countAt` and lands on the published values, a too-long line fails the check); `src/lib/social/copy-sweep.test.ts` now sweeps the live reel's scene text, stamps, caption and caption.md (`BANNED_COPY`, number rules, no prices, font subsets) and checks the caption's shape.
- **Docs**: `scripts/README.md` ("The reels") and the "Instagram cards" paragraph in CLAUDE.md.

## Storyboard as built (ms)

| Scene | On screen | Content |
|---|---|---|
| Hook | 0–2,000 (fades out 1,700–2,000) | "Is 65 points / enough for / Australian PR?" on screen from frame 1; "What the 15 Oct 2026 189 round shows." rises in at 0.4 s; the PASS MARK 65 round stamp (hard cut in at 0, out at 2.0 s). |
| Chart | 2,000–7,000 | "189 round · 15 Oct 2026", "44 occupations were invited at 65", "Occupations by lowest score invited"; eight bars grow one after another from 2.5 s (every 280 ms, 600 ms each) as their counts tick up to 44, 36, 9, 36, 19, 10, 3, 2; the 65 bar in ink. |
| Reading | 7,000–10,000 | "The plain reading", "Each occupation has its own cut-off", "In this round they ran from 65 to 100 points.", then "65 points is the pass mark to be invited, not a promise of an invitation." (`enoughSentences`, saffron rule). |
| Link | 10,000–12,500 | "Your occupation", "Check your occupation's cut-off", the cut-offs page line, "Visit migratelens.com/occupations/189-cut-offs/". |
| End card | 12,500–15,000 | The logo (mark and wordmark), the FREE POINTS CHECK stamp (hard cut at 13.0 s, after the card has settled), "Check your points free", "migratelens.com", "@migratelens", "General information, not migration advice." Fully settled from 13.0 s: a 2.0 s hold. |

Moves: text fades and rises 32 px in (500 ms) and 24 px out (300 ms), ease-out cubic; bars scale from the baseline (600 ms); 120 ms stagger. The guilloche paper never moves.

## Command output

- `npm run check`: format, lint (0 errors; the same 2 warnings in untracked `.superpowers/brainstorm/*/lib.js`), typecheck, tests: 256 files, 2,445 tests passed.
- `npm run build`: passed; postbuild "bundle lock: 3 pages clean, 68 chunks scanned".
- `npm run social:reel -- --reel enough --out .superpowers/social/launch-2026-11/10-reel-is-65-enough`: exit 0 in about 46 s, "Wrote reel-is-65-enough.mp4 (5.0 MB, 15 s, 1080x1920, avc1, 30 fps), cover.png, caption.md and frames-check/". Two runs gave byte-identical sizes (5,243,887 bytes).
- Probe (`swift scripts/social/encode-mp4.swift probe …`): `{"bytes":5243887,"codec":"avc1","duration":15,"fastStart":true,"fps":30,"frames":450,"height":1920,"width":1080}`. `mdls` returns null for this gitignored folder (not indexed) and `afinfo` reads audio only, so the Swift AVAsset probe is the read-back.

## Output

`/Users/aveomac/aveo-projects/landfall/.superpowers/social/launch-2026-11/10-reel-is-65-enough/` (gitignored):
- `reel-is-65-enough.mp4` (5.0 MB, silent);
- `cover.png` (the hook at 1.0 s, 1080×1920; the hook and stamp sit inside the 4:5 grid crop);
- `caption.md` (the caption ready to paste, the cover note and each scene's words);
- `frames-check/at-1s.png`, `at-4s.png`, `at-8.5s.png`, `at-11.5s.png`, `at-14.5s.png`, read back from the MP4.

I looked at all five check frames and at transition frames (1.85 s, 2.4 s, 6.85 s, 12.7 s): nothing overflows, every line and bar stays inside x 132–940 and y 250–1540, text reads at phone size, the hook stamp stays fully inked while the hook text fades and then cuts, the end card fades in without its stamp and the stamp cuts in once it settles. At 4 s the count-up is mid-way (85 shows 18, 90 is fading in), as intended.

## Where each figure comes from

- Round date, the 44 at 65, the 65-to-100 span: `loadLatestRound` (`latestRound` over the recap facts) and `recap.rounds["2026-10-15"].distribution`, through `atPassMarkTitle`, `cutoffSpanText` and `dayText`.
- Hook: `enoughFaq(round).question` (the view-model throws if the forced lines stop matching it).
- Pass mark sentence: `enoughSentences(round)[0]`; the source line: `ROUND_SOURCE`; stamps: `passMarkStamp` (post 7's cover) and the closing card's stamp; the end card: `closingCardFor`.
- Caption: `enoughCaption` (post 7's caption: the question, the two FAQ sentences and the history line, the reply call to action, the cut-offs link, 7 hashtags).

## Concerns

1. Small frame text: the tag (28 px), source line (30 px) and MRZ (26 px) are under the 36 px body minimum. They are the passport frame, not body copy; every scene's text is 36 px or more and the hook and headings 80 px or more. Easy to raise if the founder wants.
2. The chart heading "Occupations by lowest score invited" wraps to two lines at 36 px with its letter-spacing.
3. The caption is post 7's caption verbatim. The reel and the carousel will read as one pair; if the founder wants them distinct, `enoughReel` can take its own caption.
4. The 9 Mbps target is an average; on this mostly still artwork AVFoundation lands at about 2.8 Mbps (5.0 MB). Instagram re-encodes anyway.
5. The figures are the 15 Oct 2026 round, about six weeks old; re-run the command after the next round lands and the reel updates itself.
6. macOS only: the encoder needs `/usr/bin/swift` with AVFoundation, so the reel can't render on the Linux CI runner (no job runs it).
7. The site's "respect reduced motion" rule doesn't apply to a pre-rendered video; the reel's motion is calm by design.
8. I didn't verify the result in the Instagram app (upload, cover crop, how the trending sound sits).
