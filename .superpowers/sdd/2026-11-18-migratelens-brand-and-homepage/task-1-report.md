# Task 1 report

Status: DONE (commit see git log, "feat(brand): Data Desk palette...").

Implemented: src/lib/brand/{contrast,palette,palette.test}.ts; :root tokens in globals.css (palette, status, --question-*, --surface); Newsreader 600 + Inter 400/500/600 (latin subsets, @fontsource); Mantine `ink` theme (primaryShade 0); old `--forest/--lime/--pale/--paper/--white/--line/--amber/--danger` names removed entirely (usages replaced, no aliases kept); every hard-coded green hex in globals.css, check-flow, panel-189, queue-bar, charts remapped by lightness to warm neutrals/ink/saffron; report status CSS (state tiles, panels, scorecard chips) use `--status-*`. "?" line (`.open` in state-panel, "you" row in panel-189) uses `--question-bg #F6DDB5` with saffron left rule. `.button-lime` renamed `.button-accent` (saffron fill). Headings: h1/h2 Newsreader 600, letter-spacing -0.02em. Body font sizes untouched.

TDD: RED = palette.test.ts failed "module ./contrast missing"; GREEN after implementation (one extra fix: check-flow.module.css still named "Instrument Serif").
Results: npm run check passes (664 tests), npm run build passes.

Contrast (TEXT_PAIRS): ink/newsprint 15.04, ink/card 16.42, saffronText/newsprint 5.06, /card 5.52, slate 7.59/8.28, muted 8.11/8.86, mutedSoft 5.00/5.46, newsprint on ink 15.04, card on ink 16.42, strongest 7.44, watching 7.21, needsAnswers 7.61, unverified 7.61, notOpen 6.55, question line 13.20. Saffron on newsprint < 4.5 (asserted).

Concerns: the bulk hex remap was by lightness, not by role; mid-tone `#B9AF9A` is used as text on dark panels (fine, ~8:1 on ink) but later tasks should eyeball check-flow and the homepage (dark sections, lime-era accents now saffron/newsprint). The logo/wordmark and "landfall." brand text are untouched (later task). Screenshot: .superpowers/sdd/.../screenshots/task1-sample.png (state outlook, cropped from a tall headless capture).

## Fix report (review I1, I2)
- Focus ring: `--focus-ring` (slate) and `--focus-ring-on-dark` (#F3EEE3, 15.04:1 on ink) tokens; dark containers (.timeline-feature, .final-cta, .report-heading, check-flow .aside, scorecard .strip) set `--focus-ring` to the on-dark token. Tests: onLight >= 3 on newsprint/card, onDark >= 3 on ink, light ring < 3 on ink, tokens mirrored in globals.css (`FOCUS_RING` in palette.ts).
- I2: `.value-top > span:last-child` now `--muted-soft` (5.46 on card). Sweep of every light hex used as text (#b9af9a, #ddd4c2, #ece7dc, #f3eee3, #fbf8f2): all others sit on ink containers (.timeline-feature and its preview, .final-cta, .report-heading, check-flow .aside; #b9af9a on ink 8.0:1, #ddd4c2 ~11:1, #ece7dc 13.5:1); #fbf8f2 is .skip-link and .button text on ink. No other light-on-light uses.
- Links: .text-link/.quiet-link slate, hover to ink with underline; .button hover now #2e2c27 (was same ink); .button-accent hover also changes border.
- Mantine: ink palette ordered light to dark, primaryShade 9. Also found Mantine props still using removed names: `color="forest.9"` (header CTA and report, was invisible) and `color="teal"` in check-flow, now `ink.9` / `ink`. `.key-dot.lime` renamed `.accent`. Headless screenshot of /check/ (screenshots/task1-check.png) shows Select, Button, SegmentedControl correct.
- check and build pass (667 tests).
