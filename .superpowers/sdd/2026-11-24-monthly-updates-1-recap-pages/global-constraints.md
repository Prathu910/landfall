## Global Constraints

- Node 22.12+. `npm run check` and `npm run build` pass after every task; `npm run lighthouse` passes at the end (`/updates/` and the latest recap score 100 on every category, mobile and desktop).
- Static export only; recap pages are statically generated Server Components reading files at build. No route handlers, server actions or dynamic rendering.
- Only scripts write `data/raw/` and `src/data/`, including `src/data/updates/` and `src/data/sample/`. Nothing there is hand-edited.
- Files in `src/lib/data/`, `src/lib/updates/` and `scripts/` use relative imports, not `@/` (they run under tsx and vitest).
- Number rules (spec 6.13), binding on every string: "<20" is the interval 0–19 and is never collapsed; INVITED is never summed across months or visas; visas and states are never added together; `ANY` is "State not recorded", never a state; a state figure is shown as "at least {floor}" with "+ N hidden small counts", and an all-masked state reads "under 20 for each occupation", never 0; the nominations table is copied as published (including "<5"), labelled "A different measure"; "about N" (midpoint rounded to the nearest 1,000) only when the range width is at most 2% of its midpoint, always with the range beside it; movers use exact counts only; a `null` cut-off is "Not listed"; a skipped round is absent; no next-round date; no causal claims.
- Copy: every string passes `BANNED_COPY` (`src/lib/report/copy.ts`); say "EOIs", never "people" or "applicants"; occupation names link to `occupationPath` pages; internal links end in `/`.
- Styling: CSS Modules, tokens only (`src/app/colour-literals.test.ts`), every new colour token is `light-dark()` with its light value in `palette.ts`, dark in `palette-dark.ts` and the `@supports not` fallback regenerated with `lightFallback`; 12 px floor; both themes; stamps never animate; the recap page is not a print target.
- JSON-LD only through `src/lib/seo/json-ld.ts`. Indexing follows `SITE_INDEXABLE`.
- Dates are `YYYY-MM-DD`; "Sydney date" means the Australia/Sydney calendar date; month names are fixed strings, never ICU.

