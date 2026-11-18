# SDD ledger — plan: docs/superpowers/plans/2026-11-18-migratelens-brand-and-homepage.md
Spec: docs/superpowers/specs/2026-11-18-migratelens-brand-and-homepage-design.md (founder-approved 18 Nov 2026). Branch brand/migratelens, base 682bcd7.

## Pre-flight scan
| Tasks | Shared file / interface | Finding |
|---|---|---|
| T1–T2 | globals.css, *.module.css | T1 colours/fonts, T2 font sizes; sequential, no conflict |
| T1–T7 | T1 "no old palette" test scans src/**/*.module.css | kit CSS copied in T7 has its own colours, none of the old palette; OK |
| T2–T7 | T2 css-floor test scans src/**/*.module.css | CONFLICT: the vendored Stageshow kit CSS (copied to src/components/stageshow-kit/) may have sub-12px sizes → Ruling B1 |
| T3–T4 | logo geometry | T4 inlines the same SVG; OK |
| T3–T7/T8 | Logo | consumed as declared; OK |
| T5 | buildSampleView in src/lib/home imports src/components/data/* and load-server (fs) | CONFLICT with layering (src/lib is pure; components/data are adapters) → Ruling B2 |
| T5–T7 | DemoContent | consumed as declared; OK |
| T5–T8 | buildSampleView, buildDemoContent | location per B2 |
| T6–T8 | TryIt({defaultOccupation}) | OK |
| T3 | no-old-name test over src | state-rules .ts comments contain "Landfall" and T3 renames them; OK |
| T3, T6 | component tests | no @testing-library in the repo; plan already falls back to pure helpers/constants; OK |
| T8 | deletes pool-chart, pool-explorer, home-experience | only page.tsx/globals use them (grep); OK |
| each task self-consistency | | T1–T9 tests match the code they specify; files created/modified consistent |

Ruling B1: the T2 floor test excludes `src/components/stageshow-kit/**` (vendored kit); the project's own demo CSS (`src/components/home/hero-demo.module.css`) and everything else must comply, and the demo's compact (phone) design keeps readable text — why: the kit is third-party scaffolding, the visible demo is ours — cost if wrong: one tiny label in kit chrome.
Ruling B2: `buildSampleView` lives in `src/components/home/sample-view.ts` (adapter layer, like src/components/report/report-view.ts), and the "demo content matches the sample report view" test lives in `src/components/home/sample-view.test.ts`; `src/lib/home/` stays pure (try-it.ts, demo-content.ts take plain inputs). T8 imports it from there — why: src/lib must not import components or fs — cost if wrong: a file move.

## Tasks
Task 1: dispatched (base 682bcd7, sonnet)
Task 1 notes: QUESTION_LINE tint #F6DDB5 + saffron rule; old vars removed (no aliases); .button-lime→.button-accent (saffron fill, ink text); hex remap by lightness (concern: check roles in check-flow/dark sections).
Task 1: fix round 1/5 dispatched — open: (I1) slate focus ring 1.98:1 on ink sections; (I2) #b9af9a numeral on light bg 2.05:1. Also: links slate per brief + visible hover; Mantine palette order light→dark with primaryShade on ink. Minor deferred: pool-chart band (file deleted in T8).
Task 1: fix round 1/5 (I1, I2, links, Mantine, ring test addressed; commits 0d2bf59..746dc25)
Task 1: complete (commits 682bcd7..746dc25, review clean after 1 fix round)
Task 1: minor (deferred): nothing enforces the on-dark focus ring for future dark containers — carry to T8 (homepage dark sections must use --focus-ring-on-dark); pool-chart band (deleted in T8).
Task 2: dispatched (base 746dc25, sonnet)
Task 2 notes: 146 decls + 2 SVG fontSize raised; badge --badge-fz 12px; no layout fixes. CARRY to T9: browser-check /check/ steps 2–4 and a loaded /check/ report at 390.
Task 2: fix round 1/5 dispatched — open: (I1) floor-test parser gaps (font: shorthand, font-size= attr, .ts files, multiple decls per line, TSX units) + parser fixture tests. Also: .details summary and .checked prose to 16px on mobile. Minor deferred: merge duplicate mobile media blocks; hierarchy flattening at 12px — carry to final visual review.
Task 2: fix round 1/5 (I1 parser + mobile prose addressed; commits 1c055d7..4b580e8)
Task 2: complete (commits 746dc25..4b580e8, review clean after 1 fix round)
Task 2: minor (deferred): TSX string values starting with a function (clamp) and TSX `font:` shorthand not caught (none exist); merge duplicate mobile media blocks; hierarchy flattening at 12px → final visual review.
Task 3: dispatched (base 4b580e8, sonnet)
Task 3 notes: storage key renamed landfall-profile-v1 → migratelens-profile-v1; footer restyled as ink band (beyond brief); "Overview" nav link dropped (logo links home); metadataBase preview host allowlisted in no-old-name test.
Ruling B3 (T3): renaming the storage key would strand saved personal data under the old key that "Clear" no longer removes — a privacy defect. On load, if `landfall-profile-v1` exists: move it to the new key (only if the new key is absent) and delete the old key; Clear removes both. The legacy key string lives in one exported constant, allowlisted in the no-old-name test — cost if wrong: a few lines.
Task 3: fix round 1/5 dispatched — open: (I1) B3 legacy storage key migration/cleanup. Also minor: Brand reversed prop reuse in footer; dead aria-current branch; format:check on wa.ts comment. Minor carry to T8: report.tsx 'THE MIGRATELENS PERSPECTIVE' eyebrow — judge at final review.
Ruling B4: the 'no Landfall in out/' check means rendered HTML only (out/**/*.html); the legacy storage key string in the /check/ JS chunk is expected (B3) — applies to T9's site-wide check.
Task 3: fix round 1/5 (B3 migration + minors addressed; commits 2ecbda1..4d8db86)
Task 3: complete (commits 4b580e8..4d8db86, review clean after 1 fix round)
Task 3: minor (deferred): invalid legacy value copied then rejected at load (harmless); footer imports Brand from a client module (bundle scope) — consider moving Brand to src/components/brand/ in T8.
Task 4: dispatched (base 4d8db86, sonnet)
Task 4: fix round 1/5 dispatched — open: (I1) temp dir leak; (I2) PNG written/dimensions not verified after Chrome. Also: OG image alt + width/height; CHROME_PATH hint. (og:title/description already emitted — verified in out/index.html.)
Task 4: fix round 1/5 (I1/I2 + alt/size + CHROME_PATH addressed; commits 55f0c7a..35ed835)
Task 4: complete (commits 4d8db86..35ed835, review clean after 1 fix round)
Task 4: minor (deferred): verifyPng doesn't check length/signature; status null on signal kill.
Ruling B5 (T5 plan self-conflict): the plan's test says `latestRound` "is a CHIP_LABEL value" AND "Not listed" when the newest cutoff is null — CHIP_LABEL has no "Not listed". Resolution: TryItView carries `roundStatus` (CHIP_LABEL from summarise189Rounds, as the report's 189 card) AND `latestRound` (the newest round in the report's own rounds wording, e.g. the rounds-tiles/panel-189 buildRounds text: listed cut-off or "Not listed"), never "0" for a null cutoff — why: the spec asks for the round status with "Not listed" ≠ zero; both come from existing report wording — cost if wrong: one extra field.
Task 5: dispatched (base 35ed835, sonnet)
Task 5 notes: sample 261111 at 90 base (190 95, 491 105); try-it 261313@85 = higher 2,004–2,023, same 1,213, pool 9,444–9,539, "No recent invitations", latest "Not listed, 15 Oct 2026"; 190 tiles: ACT/NT/TAS/VIC/WA Not yet verified, NSW/QLD/SA Not open. report-view.ts imports made relative.
Ruling B6 (T5): the demo's beat 1 "fills a short profile" needs real profile lines — `buildDemoContent` gains the profile's points categories (from calculatePoints(profile, asOf).categories, which the sample view already computes) and `profileLines` become "{category label} · {points} pts" for the non-zero categories in report order, then the total; no age or personal details beyond what the points audit already shows — why: honest, derived, no new claims — cost if wrong: one parameter.
Task 5: fix round 1/5 dispatched — open: (I1) B6 profileLines from points categories; (I2) poolTotal must use the published total as the report does. Also minors: typed masked check instead of string match; posterAlt looks cards up by visa; sturdier one-sentence test.
Task 5: fix round 1/5 (B6 profileLines, published pool total, minors addressed; commits ca84312..0b2c15a)
Task 5: complete (commits 35ed835..0b2c15a, review clean after 1 fix round)
Task 5: minor (deferred): try-it real-data test compares against poolPosition rather than buildWhereYouStand.
Task 6: dispatched (base 0b2c15a, sonnet)
Task 6 notes: fullReportHref in try-it-href.ts (vitest without Mantine). CARRY to T8: site-header CTA 'Check my points' truncated at 390px (T3 area) — fix in T8.
Task 6: fix round 1/5 dispatched — open: (I1) failed load shows 'No published 189 data' (false); (I2) note/source wording composed in component, move to buildTryIt with tests. Also: tokens instead of hard-coded colours; drop dead idle branch.
Ruling B7 (T6): the try-it note uses the report's existing wording 'Counts are EOIs (one person can hold several).' (scorecard source line) instead of 'Counts of EOIs, not people.'; tests run BANNED_COPY over every string unmodified (no stripping) — why: one wording site-wide and no weakened test — cost if wrong: a copy tweak. Same applies to the homepage (T8) and the mockup phrase.
Task 6 note: EOI_CAVEAT duplicated from scorecard's inline string (minor: could be shared later).
Task 6: fix round 1 re-review — I1/I2/minors addressed; B7 test strip remains at try-it.test.ts:62 (report claimed removed). Fix round 2/5 dispatched.
Task 6: fix round 2/5 (B7 strip removed, full stop into source; commits 2c0db27..c06bf19)
Task 6: complete (commits 0b2c15a..c06bf19, review clean after 2 fix rounds)
Task 6: minor (deferred): doubled full stop in a doc comment; EOI_CAVEAT duplicated from scorecard inline string.
Task 7: dispatched (base c06bf19, opus)
Task 7 notes: gate passed (1440, 390, --states, 566px); gold hero-demo + payout-flow motion; loop ~12.2s; chunk 16.5 KB gz; poster adds ~10 KB gz kit CSS; design 720×356, compact 358×560 (compact drops the 6 points lines); kit eslint override scoped (react-hooks/refs, set-state-in-effect); DemoContent gained cards[].points/aheadLabel, tiles[].tone, labels; AT_SCORE_LABEL exported from scorecard view-model. CARRY to T8: give the demo column ≥ ~612px (labels shrink below 12px under that). Not checked: Safari/Firefox (poster scales with tan(atan2())), touch.
Ruling B8: `.claude/settings.local.json` (created by the founder's /permissions; untracked, git-ignored) breaks `format:check`; add `.claude/settings.local.json` to .prettierignore — never edit the file itself — cost: none.
Ruling B9 (T7 I1): rendered demo text must stay ≥12px at every width down to 320: the smallest design text becomes 15px in both designs (12/15 = 0.8 scale), the wide design is used only when the column is ≥ 576px (else compact), and the floor is verified by measuring computed rendered size × scale at 320, 360, 375, 390, 768 and 1440 — why: B1 requires our demo readable; a design-size fix doesn't depend on Task 8 layout — cost if wrong: denser stage.
Task 7: fix round 1/5 dispatched — open: (I1) sub-12px rendered text when scaled (B9). Also: minors 1 (--ss-accent → slate), 2 (grey lights), 3 (overflow clip fallback), 4 (compact button gutter), 5 (card points gated with answers), 6 (shared labels from existing constants), 7 (typed visa key), 8 (dashed needs-answers chip); B8 .prettierignore.
Task 7 fix: two-view window (check ↔ report), 720×436 / 358×660, loop 13.2s, demo-layout.ts 576px switch, min rendered 12.07px at 320; B8 committed e6bf2b6.
Task 7: fix round 1/5 (B9 + minors 1–8 + B8 addressed; commits 83a4304..9d70e15)
Task 7: complete (commits c06bf19..9d70e15, review clean after 1 fix round)
Task 7: minor (deferred): poster CSS repeats 576/720/436/358/660 literals (no test pins them to demo-layout.ts); fixed frame height could overflow with more profile categories; check-view fields show points not answers (stylised).
Task 8: dispatched (base 9d70e15, opus). Carries: header CTA truncated at 390 (T3); hero demo column ≥576 for the wide design; dark sections use --focus-ring-on-dark; B7 wording; move Brand out of the client header module if cheap.
Task 8 notes: hero two columns from 1100px; doors' arrows as icons; FAQ heading "Common questions" (spec's "Questions people ask" is BANNED_COPY) — Ruling B10: accepted; Brand moved to src/components/brand/brand.tsx; header CTA fits ≥371px, drawer holds it below; old homepage components + 248 selectors removed; StateTile optional onOpen/href; OutcomeBar extracted. Left: 5 dead non-home classes; docs → T9.
Task 8: complete (commits 9d70e15..9dab50a, review clean — approved first pass)
Task 8: minor (deferred → T9 if cheap): next/link for internal links in three-questions/home-faq-list; 5 dead globals classes; toPoolOccupation now test-only; OutcomeBar double label.
Task 9: dispatched (base 9dab50a, sonnet). Carries: /check/ steps 2–4 + loaded report at 390 (T2); B4 (no Landfall in out/**/*.html only); T8 cheap minors.
Ruling B4 amended: rendered HTML may contain "landfall" only inside the preview hostname (landfall-migration-report…) in og:image / metadataBase until launch; no brand text.
Task 9 notes: docs updated (CLAUDE, AGENTS heading, ENGINEERING, HANDOFF, REPORT-COVERAGE); next/link sweep; 5 dead classes removed; Mantine Badge 10px bug on /check/ step 3 fixed with !important 12px (6d10ca6); AA on /sample/ all pass (6.55–8.9); /check/ walk at 390 clean.
Task 9: complete (commits 9dab50a..6d10ca6, review clean — approved first pass)
Task 9: minor (deferred): HANDOFF "shipped" wording → "done on branch"; badge comment wording.
Final review: dispatched (base 2cf9a619e773138375d20f379b4d020bec7be4d0, opus)
Final review: WITH FIXES — I1 homepage outcome counts omit On hold + statusNote (sum ≠ sentence); I2 spec goal "drop Short line. Italic line." not done outside homepage, and em renders as synthesized italic (only Newsreader 600 normal loaded). Minors 1–10.
Ruling B11 (I2): do the spec goal now, site-wide: rewrite every em-split "Short line. Italic line." heading into one plain, specific heading (same meaning, BANNED_COPY-clean, no new claims; list old → new in the report for the founder), drop purely decorative eyebrows ("THE MIGRATELENS PERSPECTIVE", "A small detour" and similar) while keeping functional section labels, and make `em` never synthesize: no italic serif unless a real italic face is loaded (prefer normal style + emphasis by weight/colour) — why: spec Goals + the founder's premium bar; synthesized italics look cheap — cost if wrong: copy the founder may want to tweak.
Ruling B12 (judgement call from the final review): the demo's count-in must never show intermediate numbers (an odometer passing through "352–820" is a number the data never said); replace with a settle/fade of the final values; re-run the Stageshow gate — why: strict "no invented numbers" — cost if wrong: a less lively beat.
Ruling B13: saffron as the fill of the accent CTA (ink text 5.32:1) stays — within "highlights" in the spec.
Final fix wave: dispatched (opus): I1, B11, B12, minors 1,2,3,5,8,9,10 + T6 EOI_CAVEAT export + T7 poster-literals test. Not in wave (can wait): minor 4 hex sweep, 6 font fallback metrics, 7 CSS split, other deferred minors.
Final fix wave: done (6d10ca6..59f7a30, 8 commits); B9 bug found+fixed (320 column 278px → compact 346×660, min 12.05px); concern: long occupation at 314px not re-filmed. Final re-review: dispatched (opus).
Final re-review: READY TO MERGE (all findings addressed; optional cosmetics: report h1 wraps a lone word at 1440 → text-wrap: balance; On hold row has no swatch; "Our months question" wording; long occupation at 314px not re-filmed).
Plan COMPLETE (2cf9a61..59f7a30). Workspace committed to git per the founder's wish (not deleted).
