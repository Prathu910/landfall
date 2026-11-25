# Engineering standards

Every agent and contributor follows these rules. `docs/STRATEGY.md` says _what_ we build; this file says _how_ we build it. The site will grow from 11 occupations to about 470 occupation pages, a reality-check engine and a state outlook. The code has to stay readable and fast at that scale.

## Definition of done

A change is done only when all of these hold:

1. `npm run check` passes. It runs Prettier (check), ESLint, TypeScript and Vitest.
2. `npm run build` passes (static export to `out/`).
3. Any UI change is verified in a browser against the built `out/` folder, at desktop width and at 390px, and with reduced motion on.
4. A change to pages, CSS or client JavaScript keeps `npm run lighthouse` at 100 (see "Performance budget").
5. Docs are updated when behaviour changes:
   - `docs/STRATEGY.md` decision log, for any product decision;
   - `docs/REPORT-COVERAGE.md`, for report sections;
   - `docs/HANDOFF.md`, for the resume point.

## Tooling

- **Prettier** (default config) formats everything except `docs/original-references/`, `src/data/*.json` and the lockfile. Do not hand-format; run `npm run format`.
- **ESLint** uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. An `eslint-disable` comment needs a `-- reason`, and is only allowed when the rule is wrong for that line. Never use one to silence a real problem.
- **TypeScript** is `strict`. No `any`. Prefer `unknown` plus a type guard at trust boundaries: `localStorage`, URL parameters, imported JSON.
- `npm ci` must work on a fresh clone. Commit `package-lock.json` with every dependency change. Pin exact versions for tooling.

## Architecture

```
src/app/         Routes: compose components, export metadata. No business logic.
src/components/  UI. Grouped by feature folder once a feature has more than one file.
src/lib/         Pure domain logic: no React, no DOM, no fetch. Fully unit-tested.
src/data/        Generated data (JSON from scripts/) plus hand-sourced typed data.
scripts/         Reproducible importers. The only writers of generated data.
```

### Rules that keep it scalable

- **Server Components by default.** Add `"use client"` only to the smallest interactive leaf: a form, a chart with hover, a toggle. Page copy, tables, occupation pages and methodology must render as static HTML. This is required for SEO and performance.
- **Keep large datasets out of client bundles.** Occupation pages load their own slice at build time, using `generateStaticParams` plus a per-occupation accessor in `src/lib`. Pass a client component only the fields it renders. Never import the full multi-occupation JSON into a `"use client"` file.
- **Separate domain logic from presentation.** Calculations (points, pools, cohorts, state fit) live in `src/lib` as pure functions with an explicit `asOf` date. Components format and display; they never compute rules.
- **Only importers write generated data.** Never hand-edit `src/data/*.json`. Every importer validates its output against a schema and has tests for consistency. A validation failure stops the import.
- **One source per fact.** Constants such as visa codes, nomination points and state codes are defined once and imported everywhere.

## Readability

- **File size.** Aim for 250 lines or fewer per component file, and 300 or fewer for a `src/lib` module.
  - `report.tsx` (1,000+ lines), `check-flow.tsx` and `globals.css` are over the limit.
  - **Boy scout rule:** when you change a section of an oversized file, extract that section into its own file first, for example `src/components/report/pool-section.tsx`.
  - Don't do big-bang rewrites unrelated to the task.
- **One exported component per file.** The file name matches the component in kebab-case: `pool-section.tsx` exports `PoolSection`.
- **Names describe intent.** Use `higherScoreCount`, not `n`. Single letters are fine only for indexes, coordinates and very short callbacks.
- **One statement per line.** No comma-chained `const a = …, b = …` declarations, and no several statements on one line.
- **Functions do one thing.** Extract a named helper once a function needs a comment to explain its parts.
- **Comments explain why, not what.** Good examples: a policy rule, a data caveat, a non-obvious edge case. Link the official source for any rule taken from legislation or a government page.
- **Types first.** Model domain states with discriminated unions, e.g. `{ kind: "masked"; min: 0; max: 19 } | { kind: "count"; value: number }`. Avoid boolean flags whose meaning depends on other fields.

## Data honesty (enforced in code, not just copy)

- A masked count (`<20`) is an interval. A missing row is `null`, which means "not published", never zero.
- Every displayed number traces to a snapshot ID, a source URL and a checked-at date. Components receive that provenance alongside the value.
- EOIs are not people. Pools overlap across visas and states, so never sum them as unique applicants.
- No percentage chances. Estimates (a typical wait, a pace, a "best route") are allowed only when code computes them from published history and the report labels them as estimates (founder decision, 21 Nov 2026; see `docs/STRATEGY.md`).
- AI never decides a label or a number. Code chooses labels, waits and improvements; the AI only words facts that code computed, and its reply is accepted only if `checkRead` passes, otherwise the template read is shown.

## Styling

- **Tokens first.**
  - Colours, spacing, radii, shadows and the type scale are CSS custom properties on `:root` in `globals.css`.
  - New code uses tokens, never raw hex or pixel sizes.
- **Type scale.**
  - Body text is at least 16px on mobile.
  - No readable text below 12px, including labels, captions and legal notes.
  - Contrast meets WCAG 2.2 AA (4.5:1 for normal text).
- **CSS Modules for new components**, kept next to the component (`pool-section.module.css`). `globals.css` holds only tokens, resets, typography primitives and layout primitives. Move feature styles out of it when you touch them.
- **Brand tokens.** Colours come from the tokens in `globals.css`, which `src/lib/brand/palette.ts` mirrors; its test checks contrast (AA) and the mirror, so change both together. Saffron is never text. A new dark container must use `--focus-ring-on-dark`, because the default slate ring fails on ink. Every colour token has a light and a dark value (`light-dark()`); give a new one both, mirror the light value in `palette.ts` and the dark one in `palette-dark.ts` (add a text pair in `text-pairs.ts` if it is text), and check the page in both themes.
- **Browser support.** The full design (light and dark) needs `light-dark()`: Safari 17.5, Chrome and Edge 123, Firefox 120 or later. Older browsers get the complete light design and no appearance control: globals.css ends with an `@supports not (color: light-dark(#000, #fff))` block that restates every colour token with its light value, the head script and Mantine stay on light, and the dark-only switches sit inside `@supports (color: light-dark(…))`. The block is derived by `lightFallback()` (`src/lib/brand/light-fallback.ts`) and `palette.test.ts` fails if it drifts, so a new or changed token means regenerating it. Don't use other colour features newer than that floor without the same kind of fallback.
- **12px floor.** `src/app/css-floor.test.ts` (with `font-floor.ts`) fails on any font size under 12px in CSS, CSS modules, TSX and TS.
- **Mantine** provides form controls and overlays. Don't add another component library.

## UI quality bar

The site must feel modern, premium, trustworthy and engaging.

- **Copy is specific.** Say the real thing ("189 hasn't listed Software Engineer since Nov 2024"), not slogans. Avoid repeated taglines.
- **Lead with the user's own number,** then the context. Every section answers "what does this mean for me?" in its first sentence.
- **Empty states never look broken.** If data is masked or missing, say so in a plain sentence and point to what _is_ known.
- **Motion has a purpose:** orientation, feedback or progression. Every animation respects `prefers-reduced-motion`.
- **Printing works.** Every report section prints in the PDF; interactive controls and the detailed views inside "See the evidence" are screen only.

## Accessibility

- Every form control has a label. Errors are announced and linked to their field.
- Everything works with a keyboard and has a visible focus state.
- Charts have a text alternative: an accessible table, or a summary sentence plus `aria-label`.
- Target sizes are at least 24×24px, and 44px for primary mobile actions.

## SEO, AEO and GEO conventions

- Every route exports `metadata` with a unique `title`, a unique `description` and a canonical URL. Internal links end in `/` (`trailingSlash: true`).
- Structured data (JSON-LD) is built by one typed helper module, never hand-written per page.
- Every data page opens with a 2–3 sentence direct answer that states the date and the source, and shows a visible "last updated" date.
- Use semantic HTML: one `h1` per page, ordered headings, real `<table>` elements for tabular data.

## Performance budget

Founder requirement (24 Nov 2026, `docs/STRATEGY.md`): Lighthouse **100 in Performance, Accessibility, Best Practices and SEO, on mobile and desktop**, for every page type that should get search traffic, and 100 in Accessibility and Best Practices for `/feedback/` and the 404.

- **Check it.** After `npm run build`, run `npm run lighthouse`. It serves `out/` on 127.0.0.1:3020 the way Cloudflare Pages does (brotli or gzip, `public/_headers` caching, 404.html), runs Lighthouse three times per page on mobile and desktop (medians), then accessibility once per page in dark, prints a table and exits 1 if any gated score is under 100. The pages are listed in `scripts/lighthouse/pages.ts`; add a new page type there. The monthly updates rows are `/updates/` and the newest recap, computed from `listRecapMonths()` when the audit runs, so a new month is audited without editing the list. `--only <path>`, `--form mobile|desktop`, `--runs N` and `--no-dark` narrow a run; `--cpu-slowdown 10` approximates PageSpeed Insights' slower CPU; `--base-url https://migratelens.com` audits the live site.
- **Never use python's `http.server` for performance numbers:** it doesn't compress, which skews every score.
- **Decorative art is never the Largest Contentful Paint.** Background linework, guilloche and textures are CSS masks or backgrounds, never an above-the-fold `<img>` (the homepage's eager guilloche image was its LCP at 4 s on a phone). The hero text should be the LCP.
- **Budget** (gzipped, everything a page's HTML references, 24 Nov 2026): CSS 28–40 KB per page (was 49–60 KB before Mantine was cut down), JavaScript 182–392 KB without the legacy `polyfills` chunk (`/states/` 182, a guide 184, `/check/` 392). The monthly updates pages (25 Nov 2026) are Server Components with no client leaves: `/updates/` 30 KB CSS and 182 KB JS, `/updates/2026-10/` 32 KB CSS and 183 KB JS; the recap's HTML is 84 KB gzipped, most of it the full round table. A change that adds more than a few KB to every page needs a reason in its commit.
- **Render-blocking CSS stays small.** Mantine's CSS comes only through `src/components/mantine-styles.ts`, which lists the per-component stylesheets the site uses (its test walks Mantine's imports and fails if one is missing or unused). Never import `@mantine/core/styles.css`. Feature styles go in CSS Modules so they load only on their routes; the root `not-found.tsx` loads everywhere, so it imports nothing from other routes.
- **JavaScript.** Server Components by default (see Architecture); interactive leaves load what they render. Next's client polyfills are replaced by `src/components/polyfills/polyfill-module.ts` (only `URL.canParse`, which the browserslist floor lacks), and `package.json` pins Next's own browserslist floor (Chrome and Edge 111, Firefox 111, Safari 16.4); don't lower it without restoring the polyfills.
- **No layout reads during load that interleave with writes.** Read every size first, then write (`use-fit-stamp-text.ts`), and don't measure in a mount effect what CSS can lay out. Mantine dropdowns mount only when open (the `Combobox` default in `providers.tsx`); don't set `keepMounted` on a select. Mantine's `SegmentedControl` still measures its indicator on mount, so keep them few per page.
- **Fonts.** Web fonts swap in over metric-matched local fallbacks (`"Archivo Fallback"`, `"Inter Fallback"` in `globals.css`); a new web font needs its own fallback face, or the swap shifts text (CLS).
- **Links in running text are underlined** (globals.css), so colour is never the only sign of a link. A visible label inside a control is part of its accessible name (`aria-label="Western Australia (WA)"`).
- **No third-party scripts in the code.** Cloudflare injects its Web Analytics beacon at the edge; its console errors are a dashboard setting (`docs/OPERATIONS.md`, "Cloudflare Web Analytics").
- **Caching.** `public/_headers` gives hashed `/_next/static/` files a year (immutable) and the stable-named artwork a day; pages and `/data/` keep the Pages default so a deploy shows at once.

## Testing

- **TDD for `src/lib` and importers.** Write the failing test first.
  - Cover boundaries: birthdays, expiry dates, caps, masked intervals, and missing versus zero.
- Tests sit next to their source as `*.test.ts`. Test names describe behaviour ("treats a missing round row as not listed, not zero").
- Test fixtures are small and explicit. Don't snapshot whole datasets.

## Git

- Work on a branch per roadmap step, e.g. `roadmap/foundation`. Never commit straight to `main`.
- Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`). Each commit is small and focused.
- Formatting-only changes go in their own commit, separate from behaviour changes.
- Never commit `out/`, `.next/`, secrets or personal data.
