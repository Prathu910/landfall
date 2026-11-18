# Engineering standards

Every agent and contributor follows these rules. `docs/STRATEGY.md` says _what_ we build; this file says _how_ we build it. The site will grow from 11 occupations to about 470 occupation pages, a reality-check engine and a state outlook. The code has to stay readable and fast at that scale.

## Definition of done

A change is done only when all of these hold:

1. `npm run check` passes. It runs Prettier (check), ESLint, TypeScript and Vitest.
2. `npm run build` passes (static export to `out/`).
3. Any UI change is verified in a browser against the built `out/` folder, at desktop width and at 390px, and with reduced motion on.
4. Docs are updated when behaviour changes:
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
- No percentage chances and no forecasts. History-based counts only (see `docs/STRATEGY.md`).
- Copy presents data, not advice. Never write "you should apply" or "choose state X".

## Styling

- **Tokens first.**
  - Colours, spacing, radii, shadows and the type scale are CSS custom properties on `:root` in `globals.css`.
  - New code uses tokens, never raw hex or pixel sizes.
- **Type scale.**
  - Body text is at least 16px on mobile.
  - No readable text below 12px, including labels, captions and legal notes.
  - Contrast meets WCAG 2.2 AA (4.5:1 for normal text).
- **CSS Modules for new components**, kept next to the component (`pool-section.module.css`). `globals.css` holds only tokens, resets, typography primitives and layout primitives. Move feature styles out of it when you touch them.
- **Brand tokens.** Colours come from the tokens in `globals.css`, which `src/lib/brand/palette.ts` mirrors; its test checks contrast (AA) and the mirror, so change both together. Saffron is never text. A new dark container must use `--focus-ring-on-dark`, because the default slate ring fails on ink.
- **12px floor.** `src/app/css-floor.test.ts` (with `font-floor.ts`) fails on any font size under 12px in CSS, CSS modules, TSX and TS. The vendored `src/components/stageshow-kit/` is excluded (ruling B1); our own demo CSS is not.
- **Mantine** provides form controls and overlays. Don't add another component library.

## UI quality bar

The site must feel modern, premium, trustworthy and engaging.

- **Copy is specific.** Say the real thing ("189 hasn't listed Software Engineer since Nov 2024"), not slogans. Avoid repeated taglines.
- **Lead with the user's own number,** then the context. Every section answers "what does this mean for me?" in its first sentence.
- **Empty states never look broken.** If data is masked or missing, say so in a plain sentence and point to what _is_ known.
- **Motion has a purpose:** orientation, feedback or progression. Every animation respects `prefers-reduced-motion`.
- **Printing works.** Every report section, including collapsed content, is visible when printed.

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

## Testing

- **TDD for `src/lib` and importers.** Write the failing test first.
  - Cover boundaries: birthdays, expiry dates, caps, masked intervals, and missing versus zero.
- Tests sit next to their source as `*.test.ts`. Test names describe behaviour ("treats a missing round row as not listed, not zero").
- Changes to the homepage hero demo must pass the rehearsal gate in `src/components/home/REHEARSAL.md` (1440, 390, reduced motion, and rendered text at least 12px down to 320px).
- Test fixtures are small and explicit. Don't snapshot whole datasets.

## Git

- Work on a branch per roadmap step, e.g. `roadmap/foundation`. Never commit straight to `main`.
- Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`). Each commit is small and focused.
- Formatting-only changes go in their own commit, separate from behaviour changes.
- Never commit `out/`, `.next/`, secrets or personal data.
