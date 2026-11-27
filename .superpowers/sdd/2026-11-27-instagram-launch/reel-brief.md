# Reel 1, "Is 65 points enough?": builder brief

The founder (27 Nov 2026) chose the first Instagram reel:
- a silent vertical video, 1080×1920 MP4 (H.264), 30 fps, about 15 s;
- the passport theme, light;
- the founder adds a trending sound in the Instagram app.

It pairs with launch post 7, which is built by `src/lib/social/enough-post.ts`.

**Branch:** `social/launch-pack`. Its HEAD is 2272774 and its upstream is unset. Use small conventional commits that end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push or merge, and never touch live services.

**Read first:**
- CLAUDE.md (Product constraints, Brand, Instagram cards);
- `scripts/README.md`, the "Instagram cards" and "launch pack" sections;
- `scripts/social/` (renderer.ts, launch.ts, templates/, launch.css, browser-checks.ts);
- `src/lib/social/enough-post.ts` and `launch-pack.ts`.

Look at `.superpowers/social/launch-2026-11/07-is-65-enough/*.png` and match their look exactly.

## Storyboard (founder-approved)

| Time | Scene |
|---|---|
| 0–2 s | The hook, big: "Is 65 points enough for Australian PR?" |
| 2–7 s | "189 round · 15 Oct 2026". Eight bars rise in sequence: how many occupations were invited at each lowest score (65, 70 … 100). Each count ticks up to its value as its bar rises. The 65 bar is highlighted in the ink colour, as in post 7. |
| 7–10 s | "Each occupation has its own cut-off: in this round they ran from 65 to 100 points." Also 65 is the pass mark, not a promise. Use the wording of `enoughSentences`/the site's "Is 65 points enough?" answer. |
| 10–13 s | "Check your occupation's cut-off", with `migratelens.com/occupations/189-cut-offs/`. |
| 13–15 s | Logo (the Open lens mark plus wordmark), "Check your points free · migratelens.com", "@migratelens", "General information, not migration advice." Hold this end card for at least 2 s. |

Every figure and date comes from `loadLatestRound` and the recap facts through the existing view-model. Nothing is typed by hand.

## Motion rules

- Calm and editorial. Ease-out moves of 300–600 ms:
  - text fades and slides up by 24–40 px;
  - bars grow from the baseline;
  - numbers count up.
- No bounces, spins, flashes or glitch effects.
- Stamps never animate (a brand rule). If the end card shows a stamp, it appears with a hard cut, with no tween.
- The guilloche paper background stays still.
- Keep the passport frame and the MRZ line (`P<AUSMIGRATELENS<<…`) as on the cards.

## Safe areas

Instagram's UI covers about:
- the top 220 px;
- the bottom 380 px;
- the right 140 px (the action buttons).

Keep all text and bars inside x 60–940 and y 250–1540.

Text size: at least 36 px for body and 80 px or more for the hook and headings, so it reads on a phone at a glance.

## How to render, deterministically, with no new downloads

ffmpeg is not installed. Don't install anything and don't download any binary.

1. **Template.** Make one HTML page, rendered the same way as the other templates (same fonts, tokens and CSS). Drive it by CSS animations or the Web Animations API, all paused. The page exposes `window.seek(ms)`, which sets every `document.getAnimations()` item's `currentTime` and updates the count-up numbers.
2. **Frames.** Use the existing Chrome renderer (puppeteer-core) to call `seek` and take a screenshot for every frame: 30 fps, 450 frames, written as PNGs to a temp folder.
3. **Encode.** Use a small Swift script, `scripts/social/encode-mp4.swift`, run with `/usr/bin/swift` on macOS. It uses AVFoundation's `AVAssetWriter` and `AVAssetWriterInputPixelBufferAdaptor`: H.264, 1080×1920, 30 fps, about 8–10 Mbps. Output is MP4 with `faststart`, or the AVFoundation equivalent, `shouldOptimizeForNetworkUse = true`.
4. **Command.** `npm run social:reel -- --reel enough --out <dir>`. It writes `<dir>/reel-is-65-enough.mp4`, a `cover.png` (a 1080×1920 frame to use as the reel cover, in the 4:5 grid crop safe band) and a `caption.md`. The caption has a hook, 2–3 sentences, a call to action and 5–8 hashtags, under the same copy rules and the `BANNED_COPY` sweep.
5. **Output folder.** `/Users/aveomac/aveo-projects/landfall/.superpowers/social/launch-2026-11/10-reel-is-65-enough/`. It is gitignored. Never write to `public/`.

## Definition of done

- **Checks:** `npm run check` and `npm run build` pass. Add a unit test for the reel view-model (the scenes and timings, and the figures from the round), and a copy sweep that covers it.
- **Verify the MP4:**
  - read it back with `mdls` or `afinfo`, or a tiny Swift `AVAsset` probe: duration about 15 s, 1080×1920, H.264, 30 fps;
  - check the file size, which should stay under 30 MB;
  - extract and look at frames at 1 s, 4 s, 8.5 s, 11.5 s and 14.5 s. Save them as PNGs beside the reel, then delete them, or keep them in a `frames-check/` subfolder.
- **Look at the frames yourself:** nothing overflowing, nothing outside the safe area, readable at phone size.
- **Docs:** update `scripts/README.md` and the "Instagram cards" paragraph in CLAUDE.md.
- **Report:** write `.superpowers/sdd/2026-11-27-instagram-launch/reel-report.md` and return its text.
- **Clean up:** kill any Chrome you start, and delete the temp frame folder.
