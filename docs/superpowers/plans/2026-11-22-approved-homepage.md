# Approved Direction A+ homepage implementation

22 November 2026. The founder approved Direction A+ and requested development, without further brainstorming, delegated to an implementation subagent.

## Visual contract

Match `.superpowers/brainstorm/homepage-2026-11-22/direction-a-plus.html` and its adjacent CSS, JS and assets. Preserve the ink/sage/paper palette, Archivo typography, stencil stamps, passport security lines, spacious composition and illustrated interactive Australia map. This is an implementation of the approved design, not another redesign. Original prototypes remain unchanged.

## Scope and ownership

Work on `roadmap/report-redesign` in the existing workspace. Preserve all pre-existing report and PDF changes. Own `src/app/page.tsx`, `src/app/home.module.css`, dedicated new homepage components and homepage view-model modules/tests, and required local homepage assets. Add reusable Mantine-based controls under a dedicated component folder. Coordinate before changing shared header/footer, global styles, Providers, or brand palette. Other pages, logo and favicon are reserved for the founder's next design pass. No commits, merge, push, deploy, backend changes or AI calls in this assignment.

## Implementation sequence

- [x] Read AGENTS.md, STRATEGY.md, ENGINEERING.md, CLAUDE.md, relevant Next.js local documentation, existing homepage logic and the prototype/research notes.
- [x] Record the baseline checks and existing unrelated working-tree changes.
- [x] Replace the homepage composition with modular server-rendered hero, report preview, explanatory sections, FAQ and CTA matching the prototype. Preserve metadata, semantic headings, internal trailing-slash links, sources and required disclosures. Use the existing shell initially; coordinate any shell changes.
- [x] Implement polished controls using the existing Mantine library: searchable occupation Select, buttons, segmented visa/points chips, state buttons, tooltips where useful. Style every state, including hover, pressed, selected, disabled, keyboard focus, loading, empty and error. Use scoped tokens, CSS Modules, at least 12px labels and 44px primary touch targets. Do not introduce another component library.
- [x] Port the interactive SVG map to a small React client component with eight state selections, ACT inset, equivalent buttons, keyboard operation and zoom/reset. Connect occupation, base points and 189/190/491 selection to genuine repository evidence. Reuse existing pure domain functions; add a typed homepage view-model adapter if required, with meaningful domain boundary tests first.
- [x] Preserve masked intervals and missing months; 189 is national, state counts are historical evidence rather than eligibility. Apply nomination points exactly once; identify 491 as provisional. Keep provenance and chart text alternatives. Do not ship prototype global scripts, hardcoded stale example datasets or full multi-occupation data in the client bundle.
- [x] Verify the built static export at desktop, tablet and 390/360/320px, reduced motion, touch and keyboard. Compare screenshots directly with Direction A+. Test all eight states, all example occupation/points/visa combinations, zoom limits/reset, missing/masked data and CTA links. No clipping, horizontal scrolling, hydration or console errors.
- [x] Run `npm run check` and `npm run build`; update the handoff with exact changed files, screenshots, command results and remaining concerns. Obtain independent specification review followed by code quality review; fix findings before reporting completion.

## Acceptance

The actual homepage matches the approved visual reference, uses premium styled accessible controls, works with honest live repository evidence, and passes the repository checks. The rest of the site's design remains outside this assignment. AI summary is still the only approved AI feature.

Implementation and verification evidence: `docs/HOMEPAGE-IMPLEMENTATION-HANDOFF.md`. Shared shell styling remains outside this assignment, as agreed.
