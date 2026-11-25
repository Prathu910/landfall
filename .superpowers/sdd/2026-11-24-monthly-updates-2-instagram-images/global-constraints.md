## Global Constraints

- Every number, rule and copy constraint of Plan 1's Global Constraints applies to every card, caption and alt text (number rules 6.13, `BANNED_COPY`, "EOIs").
- Sizes: feed 1080×1350, story 1080×1920, OG 1200×630 (light only); device scale 1. Story: no text or stamp in the top 250 px or bottom 340 px. Feed cover: essential text inside the central 1012 px.
- Colours: card CSS and templates hold no colour literals; tokens come from `src/lib/brand/palette.ts` and `palette-dark.ts`.
- Fonts: Archivo (`@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2`) and Big Shoulders Stencil Display 900 (`@fontsource/big-shoulders-stencil-display/files/big-shoulders-stencil-display-latin-900-normal.woff2`), loaded by `file://` URL. Card copy uses only characters in those subsets' `unicode-range`; marks outside them (the mockup's "→") are SVG.
- Limits: each PNG at most 300 KB, a set at most 2.5 MB; above either the command exits 1.
- Retention: `public/social/` keeps the latest 3 data months' sets; older months keep only `og.png`.
- Closing card: "Check your points free · migratelens.com", `@migratelens`, "General information, not migration advice". Captions end with a few hashtags from one constant; no `#189visa` on a set without 189 content.
- Committed sets are rendered in CI only (spec 6.7); local renders are for development. Task 6 renders 2026-10 locally to verify and does not commit the PNGs unless the founder approves a one-time local set (see Spec decision 6); otherwise Plan 3's rehearsal commits the CI-rendered 2026-10 sets.
- `npm run check` and `npm run build` pass after every task; `npm run lighthouse` still passes after Task 6.

