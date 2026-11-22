# Approved homepage implementation handoff

22 November 2026. Implemented on the existing `roadmap/report-redesign` branch; no commit, push, merge or deployment.

## Result and ownership

The production homepage now follows the founder-approved Direction A+ reference in `.superpowers/brainstorm/homepage-2026-11-22/direction-a-plus.html`, its CSS/JS and notes: ink `#12202C`, sage `#EEF2F0`, white passport paper, locally served Archivo and stencil type, guilloche linework, passport preview, interactive illustrated Australia map, report examples, conditions, FAQ and final CTA.

The existing shared header/footer remain in their earlier design, as agreed with the coordinating agent. They, other pages, logo, favicon, providers and the shared brand palette were outside this assignment. Existing report/PDF edits and the concurrent `/check/` work were preserved. The homepage adds only a clearly named `--homepage-*` token block to shared `globals.css`.

## Implementation files

- `src/app/page.tsx`: server-rendered composition, route metadata/canonical, snapshot provenance and the initial nurse example.
- `src/app/home.module.css`: scoped approved composition and responsive rules; SVG labels remain readable after viewBox scaling, including the 901px breakpoint boundary.
- `src/components/home/controls/`: Mantine action buttons, searchable occupation Select and points/visa segmented controls, with scoped interaction/focus states.
- `src/components/home/home-passport.tsx`, `home-stamp.tsx`/CSS and `home-shift.tsx`/CSS: approved stencil passport and compact before/after stamps.
- `src/components/home/home-atlas.tsx`, `atlas-map.tsx`/CSS, `atlas-map-geometry.json`, `atlas-evidence.tsx`: occupation loading, eight state selections plus ACT inset, keyboard arrows/Enter/Space, equivalent state buttons, zoom/reset and monthly evidence alternatives.
- `src/components/home/home-report-example.tsx`, `home-conditions.tsx`, `home-questions.tsx`, `home-final.tsx`: static lower sections.
- `src/lib/home/atlas.ts`/tests: real national/state evidence, nomination once, six-month missing/masked intervals and source provenance.
- `src/lib/home/example.ts`/tests: route, wait, report outlook and English improvement computed through the production report domain functions.
- `public/home/`: local fonts and three guilloche SVGs. SVGs reproduce the approved prototype's deterministic guilloche formula; geographic paths were ported from its local map, whose source notes attribute rowanhogan/australian-states (`https://github.com/rowanhogan/australian-states`). Prototype data/global scripts are not shipped.

The initial client receives one occupation core and only manifest provenance fields. Other occupations use `useOccupationCore` and the existing stable occupation index. No full occupation collection is imported into the client. Known occupations without published data, a fetch failure and an in-progress load have separate UI states. Personal-report links carry only the allowed occupation query parameter.

## Check: data and interactions

- Ten new homepage domain tests cover nomination exactly once, national 189 semantics, missing versus zero, masked intervals, production route/wait/stamp decisions, the real English improvement and no-data examples.
- Real browser against the static export at `http://127.0.0.1:3017/`: all **288** combinations of 3 occupations × 6 base scores × 2 state visas × 8 states passed, plus **18** national 189 occupation/score combinations. Checked rendered state names, nomination totals, national selection behavior and all six chart alternatives. Exercised 849 masked cells and 862 confirmed zero cells.
- Keyboard selected all eight shapes using Space/Enter, wrapped focus with ArrowRight and exposed the 3px visible focus stroke. Equivalent buttons work. Zoom stops at 1×/2× and reset restores its disabled minimum state.
- Controlled browser network fixtures verified loading text, a missing month remaining “Not published”, fetch-failure recovery, and known-empty occupation data. Search no-match and native FAQ keyboard expansion passed. A separate touch-enabled browser context selected Tasmania by tap.
- No unexpected page/runtime/hydration errors. The deliberately aborted fetch produced its expected network console entry during the failure test. Normal browsing produced only Next.js CSS prefetch/preload warnings; no application console errors.

## Check: responsive visual verification

Compared screenshots directly with the approved hero/map references. Verified desktop, tablet, 390/360/320px and reduced motion. Actual SVG text sizes were measured with `getScreenCTM()`, rather than checking declared SVG font units alone. The map's tablet/phone label sizes, national round stamp and narrow desktop hero stamps were corrected after that audit. No horizontal document overflow at the tested widths.

Final artifacts live in `output/playwright/`:

- `homepage-production-1440-final.png`: full desktop page.
- `homepage-production-390-final.png`: full phone page.
- `homepage-production-901-final.png`: narrow desktop hero breakpoint.
- `homepage-production-320-full.png`, `homepage-production-360-full.png`, `homepage-production-820-full.png`, `homepage-production-1024-full.png`: responsive full pages.
- `homepage-production-390-national-reduced.png`: reduced-motion national evidence.
- `homepage-production-touch.png`: touch selection proof.

The original 21 November prototype remains byte-for-byte unchanged: SHA-256 `3a7fc4db5da392997cabe935e0a426f4e56a788f82239ee7a92475a2a5975f80`.

## Check: repository verification and reviews

- Baseline `npm run check`: formatting/lint passed, TypeScript initially failed on an empty duplicate `node_modules/@types/node 2` directory. After confirming it was empty and receiving coordinating-agent authorization, removed only that directory with `rmdir`.
- Final `npm run check`: **passed**, Prettier + ESLint + TypeScript + **119 test files / 1,286 tests**.
- Final `npm run build`: **passed**, webpack production compile + TypeScript + **491 static pages** exported to `out/`.
- Independent specification review passed after fixes for Mantine's mobile inner-label wrapper, distinct empty data, compact improvement stamps, national stamp sizing and accurate interval narration.
- Subsequent code-quality review passed after the narrow desktop hero SVG font-floor fix. No outstanding material findings.

## Follow-up for coordinating agent

Fold this result into the main HANDOFF/STRATEGY when appropriate; those documents were intentionally left to their concurrent owner. The homepage is ready for the founder's review. Shared shell/logo/favicon and other-page styling remain the founder's next design work. AI summary remains the only current-release AI feature. No backend or AI behavior changed.
