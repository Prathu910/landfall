# MigrateLens brand and homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the site the MigrateLens "Data Desk" identity everywhere and rebuild the homepage around two doors, a Stageshow product demo and a live real-data try-it.

**Architecture:** Brand values live once as CSS tokens in `src/app/globals.css`, with a TypeScript mirror in `src/lib/brand/palette.ts` that tests check for contrast and sync. Homepage numbers come from pure, tested view-models in `src/lib/home/`, built from the same functions the report uses. Components only render them. The demo is a client-only Stageshow component fed plain strings by the server page.

**Tech Stack:** Next.js 16 static export (webpack), React 19, TypeScript strict, Mantine 9, Motion, Vitest, CSS modules, `@fontsource/newsreader` + `@fontsource/inter`, the Stageshow kit (copied from `.agents/skills/stageshow/kit`).

**Spec:** `docs/superpowers/specs/2026-11-18-migratelens-brand-and-homepage-design.md` (founder-approved). Read it before every task. Mockups are in `.superpowers/brainstorm/60615-1795008019/content/`.

## Global Constraints

- **Definition of done:** `npm run check` (0 warnings) and `npm run build` pass, then browser checks against `out/`, served with `python3 -m http.server 3017 --bind 127.0.0.1 --directory out`. Follow `docs/ENGINEERING.md`, `CLAUDE.md` and `AGENTS.md`. Read the Next 16 docs in `node_modules/next/dist/docs/` before touching pages or metadata.
- **Colours:**
  - Ink `#1B1A17`, Newsprint `#F3EEE3`, Card `#FBF8F2`.
  - Saffron `#D9731A` is for **marks, lines and highlights only, never text**. Saffron text is `#A04E0C`.
  - Slate `#2E4A7D` is for links and secondary actions. Muted is about `#4A463E` / `#6B6558`, and the rule colour is about `#DDD4C2`.
- **Status colours (each status keeps its label text):**
  - Strongest evidence: `#1F5136` on `#DDEBDF`.
  - Worth watching: `#2E4A7D` on `#E4E9F2`.
  - Needs your answers: muted on `#ECE7DC`, with a dashed border.
  - Not yet verified: muted on `#ECE7DC`.
  - Not open to you now: `#8A2E22` on `#F5DEDA`.
  - The "?" line tint stays warm and prominent but distinct from brand saffron.
  - Every text pairing passes WCAG AA: 4.5:1 for text, 3:1 for large text and UI.
- **Type:** Newsreader 600 for headlines and big numbers; Inter 400/500/600 for everything else. Numbers use `font-variant-numeric: tabular-nums`. No text under 12px, and body text at least 16px on mobile. DM Sans and Instrument Serif are removed. Fonts are self-hosted via `@fontsource`, with no Google Fonts requests.
- **Logo C1 (48-unit viewBox):** a ring at r=18 with a 3.5 stroke, holding three bars bottom-aligned at y=33:
  - x=15, width 4.5, height 8 (ink);
  - x=21.75, width 4.5, height 13 (ink);
  - x=28.5, width 4.5, height 18 (saffron).
  - All bars have rx=1. The wordmark is "MigrateLens" in Newsreader 600. The favicon variant has a 5 stroke and square bars (`data-desk-logo.html`, C1).
- **Copy:**
  - Say "points-test basics", never "eligibility".
  - Counts are of EOIs, never people.
  - A masked "<20" may be zero.
  - No percentages, testimonials, user counts or invented numbers.
  - `BANNED_COPY` (`src/lib/report/copy.ts`) applies to homepage copy.
  - No agency is named. Use "often", never "always".
- **Privacy:** profile data never goes in the URL. The only query parameter allowed is `?occupation=<code>`; the try-it's points total never goes in the URL.
- **Static export and data loading:** client components load only `occupation-index.json`, `rounds-meta.json` and the state rule data, plus one occupation at a time via `useOccupationCore`. While loading they show "Loading published data…".
- **Motion and print:** every animation respects reduced motion. Every section prints.
- **SEO:** `robots` stays `noindex, nofollow`, and `metadataBase` stays the preview URL until the founder launches.
- **Git:** never stage `.superpowers/`. End each commit with the `Co-Authored-By` line the harness gives.

## Review Focus

1. **An occupation with no published 189 pool.** `hasData: false`, or a core without 189, must say "No published 189 data for this occupation", never "0 EOIs". (Task 5 test `buildTryIt reports no data`.)
2. **A points total above every published score, or at a masked "<20" bucket.** "Higher score" must be an interval that can start at 0, shown as "under 20, so may be zero", never a bare number. (Task 5 test `buildTryIt keeps masked counts as intervals`.)
3. **Reduced motion, print and no JavaScript.** The hero must show the static poster with the sample's real numbers in the static HTML, and the demo script must not run under `prefers-reduced-motion: reduce`. (Task 7 test plus the browser check in Task 8.)
4. **A 390px phone.** No horizontal overflow from the doors, the demo stage, long occupation names in the try-it, or the FAQ. (Task 8 browser check, measured by `document.documentElement.scrollWidth <= 390`.)
5. **The sample's numbers change with a new snapshot.** The demo and the "three questions" visuals must still match `/sample/`, so they are computed from the shared sample constants, never typed in. (Task 5 test `demo content matches the sample report view`.)

---

### Task 1: Brand palette, fonts and Mantine theme

**Files:**

- Create: `src/lib/brand/palette.ts`, `src/lib/brand/contrast.ts`, `src/lib/brand/palette.test.ts`
- Modify: `src/app/globals.css` (the `:root` tokens and every hard-coded old palette colour), `src/app/layout.tsx` (font imports), `src/components/providers.tsx` (theme), the status-colour CSS in `src/components/report/*.module.css` (state tiles, panels, scorecard chips), `package.json` (add `@fontsource/newsreader` and `@fontsource/inter`; remove `@fontsource/dm-sans` and `@fontsource/instrument-serif`)

**Interfaces:**

- Produces:
  - `PALETTE: Record<"ink" | "newsprint" | "card" | "saffron" | "saffronText" | "slate" | "muted" | "mutedSoft" | "rule", string>`
  - `STATUS: Record<"strongest" | "watching" | "needsAnswers" | "unverified" | "notOpen", { fg: string; bg: string }>`
  - `TEXT_PAIRS: { name: string; fg: string; bg: string; large?: boolean }[]`
  - `contrastRatio(fg: string, bg: string): number`
  - CSS custom properties with the same names in kebab case (`--ink`, `--newsprint`, `--card`, `--saffron`, `--saffron-text`, `--slate`, `--muted`, `--muted-soft`, `--rule`, `--status-strongest-fg` and so on). `--serif` is Newsreader and `--sans` is Inter.
  - A Mantine theme with `primaryColor: "ink"`.

- [ ] **Step 1: Write the failing tests** in `src/lib/brand/palette.test.ts`:
  - `contrastRatio("#000000", "#FFFFFF")` is about 21 (within 0.01). `contrastRatio("#D9731A", "#F3EEE3") < 4.5`, which proves saffron can't be text.
  - `every text pair passes AA`: each `TEXT_PAIRS` entry is ≥ 4.5, or ≥ 3 when `large`. The pairs must include:
    - ink, saffronText, slate, muted and mutedSoft on both newsprint and card;
    - card text on ink (newsprint on ink);
    - every `STATUS` fg on its bg.
  - `globals.css mirrors the palette`: read `src/app/globals.css` with `fs` and assert each `PALETTE` and `STATUS` value appears, case-insensitive, as the value of its kebab-case custom property.
  - `no old palette left`: `globals.css` and every `src/**/*.module.css` contain none of `#127b61`, `#102e29`, `#c7f5d9`, `#edf4ee`, `#f7f9f5` or `"DM Sans"` / `Instrument Serif`.
- [ ] **Step 2: Run** `npx vitest run src/lib/brand/palette.test.ts`. **Expected:** FAIL (module missing).
- [ ] **Step 3: Implement `contrastRatio` and `palette.ts`** with the spec values. Choose `mutedSoft`, the "?" tint and the `rule` values so every pair passes, and record the ratios in the task report.
- [ ] **Step 4: Swap tokens and fonts.**
  - In `globals.css`, replace the `:root` tokens and remap old variables (`--forest`, `--lime`, `--pale` and so on) to new ones, deleting the old names once nothing uses them.
  - Swap the fonts in `layout.tsx`: Newsreader 600 and Inter 400/500/600.
  - Build the Mantine `ink` 10-shade palette from ink to newsprint and set `fontFamily` / `headings.fontFamily`.
  - Restyle the status colours in the report modules (state tiles, panels, chips, scorecard tones). Don't change any `Tone` or group id in `src/lib`.
- [ ] **Step 5: Run** `npm run check` and `npm run build`. **Expected:** pass.
- [ ] **Step 6: Commit** `feat(brand): Data Desk palette, Newsreader and Inter, and the new status colours`.

### Task 2: Readable type everywhere (the 12px floor)

**Files:**

- Create: `src/app/css-floor.test.ts`
- Modify: `src/app/globals.css` and any `src/**/*.module.css` with small text; small local layout fixes where needed

**Interfaces:**

- Consumes: Task 1 tokens.
- Produces: no new API.

- [ ] **Step 1: Write the failing test** `src/app/css-floor.test.ts`. It parses every `font-size` declaration in `globals.css` and `src/**/*.module.css`, including inside media queries, and asserts:
  - no `px` value under 12, and no `rem`/`em` value under `0.75`;
  - `clamp()`/`min()` minimums follow the same rule;
  - percentage and keyword values are skipped.

  The failure message lists `file:line value`.

- [ ] **Step 2: Run** `npx vitest run src/app/css-floor.test.ts`. **Expected:** FAIL, listing roughly 125 declarations.
- [ ] **Step 3: Raise every declaration to at least 12px.**
  - Make body copy at least 16px under `@media (max-width: 720px)`.
  - Allow small local layout fixes (padding, wrapping, a column becoming two rows at 390px).
  - Don't redesign report sections. Any section that can't hold 12px text without a redesign goes in the report under "needs the controller", left at 12px with an overflow-safe wrap.
- [ ] **Step 4: Run** `npm run check` and `npm run build`. Then, headless against `out/` at 1440 and 390, check `/`, `/check/`, `/sample/`, `/states/` and `/methodology/`: `scrollWidth <= viewport width`, and no text node with computed `font-size` under 12px. Save screenshots of `/sample/` at both widths to `.superpowers/sdd/<plan>/screenshots/`.
- [ ] **Step 5: Commit** `fix(type): no text under 12px and 16px body text on mobile`.

### Task 3: Logo, header, footer and the MigrateLens name

**Files:**

- Create: `src/components/brand/logo.tsx` (and `logo.module.css`), `src/components/brand/logo.test.tsx` (if `@testing-library/react` is absent, test the exported SVG geometry constants instead), `src/app/no-old-name.test.ts`
- Modify: `src/app/icon.svg`, `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/app/layout.tsx` (metadata), `src/app/not-found.tsx`, `src/app/methodology/page.tsx`, `src/components/report.tsx` (the disclaimer line), the comments in `src/data/state-rules/2026-27/{sourced,sa,nsw,qld,wa}.ts`

**Interfaces:**

- Produces:
  - `LogoMark({ size?: number, reversed?: boolean, title?: string })`: an SVG, `aria-hidden` unless `title` is set.
  - `Logo({ reversed?: boolean })`: the lockup, the mark plus a "MigrateLens" wordmark.
  - `MARK_BARS` (the geometry constants above).
  - Header nav: "Sample report" `/sample/`, "States" `/states/`, "Method" `/methodology/`, plus a primary button "Check my points" `/check/`.
  - Footer disclaimer, verbatim: "MigrateLens gives general information from published data. We are not registered migration agents and don't give migration advice."

- [ ] **Step 1: Write the failing tests.**
  - `no-old-name.test.ts`: no file under `src/` contains `Landfall` or `landfall` (case-insensitive), excluding `*.json` data files and test files.
  - The logo test asserts the three bars' x/height/fill values and the ring's r and stroke.
- [ ] **Step 2: Run** them. **Expected:** FAIL.
- [ ] **Step 3: Build the logo and rename everything.**
  - Implement `logo.tsx`.
  - Replace `icon.svg` with the favicon variant.
  - Set the metadata title default to `"MigrateLens: your points and where they'd put you"`, the template to `"%s · MigrateLens"`, and a matching description. Use "points-test basics", not "eligibility".
  - Update the header (keep the mobile drawer and `aria-current`), the footer (disclaimer, links, the "as at" month from the manifest), the 404, methodology and the report disclaimer.
  - Rename the product in comments.
- [ ] **Step 4: Run** `npm run check` and `npm run build`. **Expected:** pass, with no "Landfall" in `out/**/*.html` (`grep -ril landfall out` is empty).
- [ ] **Step 5: Commit** `feat(brand): MigrateLens logo, header, footer and name`.

### Task 4: Social share image

**Files:**

- Create: `scripts/og-image/template.html`, `scripts/og-image/render.ts`, `public/og.png`; a `og:image` package script
- Modify: `src/app/layout.tsx` (`openGraph` and `twitter` images)

**Interfaces:**

- Consumes: Task 3 `LogoMark` geometry (inline the same SVG in the template).
- Produces: `public/og.png` (1200×630), plus `npm run og:image` to regenerate it.

- [ ] **Step 1: Write the failing test** `scripts/og-image/og.test.ts`: `public/og.png` exists, its PNG header reads 1200×630 (bytes 16–23), and the layout metadata references `/og.png`.
- [ ] **Step 2: Run** it. **Expected:** FAIL.
- [ ] **Step 3: Implement the template and renderer.**
  - The template: ink background, the reversed logo, the headline "Know your points. See where they'd put you." in Newsreader, and a line "Official SkillSelect data · Free". Fonts load from `node_modules/@fontsource/*` by file URL.
  - `render.ts` runs local Chrome headless (`--screenshot --window-size=1200,630 --hide-scrollbars`, path from `CHROME_PATH` or the macOS default) and writes `public/og.png`. No top-level await (tsx CJS).
  - Add `openGraph: { images: ["/og.png"] }` and `twitter: { card: "summary_large_image", images: ["/og.png"] }`.
- [ ] **Step 4: Run** `npm run og:image`, then the test, `npm run check` and `npm run build`. **Expected:** pass. View `public/og.png`.
- [ ] **Step 5: Commit** `feat(brand): social share image`.

### Task 5: Sample constants, try-it and demo view-models

**Files:**

- Create: `src/lib/sample.ts`, `src/lib/home/try-it.ts`, `src/lib/home/try-it.test.ts`, `src/lib/home/demo-content.ts`, `src/lib/home/demo-content.test.ts`
- Modify: `src/app/sample/page.tsx` (use the shared constants; behaviour unchanged)

**Interfaces:**

- Consumes: `comparePool`, `formatInterval` (`src/lib/pool.ts`); `toPoolOccupation` (`src/lib/data/legacy.ts`); `summarise189Rounds` / `CHIP_LABEL` (`src/lib/report/round-status.ts`); `buildReportView` / `ReportView` (`src/lib/report/report-view.ts`); `skippedRounds` and `stateRuleData` (`src/components/data/*`); `loadOccupationCore` / `loadOccupationDetail` (`src/lib/data/load-server.ts`, Server Components only).
- Produces:
  - `SAMPLE_AS_OF = "2026-11-17"`, `SAMPLE_COMPARISON = "261313"` and `sampleReportProfile: Profile` (the `/sample/` profile, including onshore VIC, the visa expiry, assessment dates and the EOI date).
  - `TRY_IT_POINTS: number[]` (65 to 140 in steps of 5) and `TRY_IT_DEFAULT = 85`.
  - `buildTryIt(core: OccupationCore | null, total: number): TryItView`, where `TryItView = { kind: "data"; higher: string; same: string; poolTotal: string; latestRound: string; asAt: string } | { kind: "none"; message: string }`.
  - `buildDemoContent(view: ReportView, occupationName: string, points: number): DemoContent`, where `DemoContent = { occupation: string; points: string; profileLines: string[]; cards: { visa: string; ahead: string; atScore: string }[]; tiles: { state: string; group: string; label: string }[]; posterAlt: string }`.
  - `buildSampleView(): { view: ReportView; occupationName: string; points: number }`: server-only, in `src/lib/home/sample-view.ts`, which loads the sample occupation the same way `/sample/` does.

- [ ] **Step 1: Write the failing tests.**
  - `buildTryIt reports no data`: a `null` core, or one with no 189 pool, gives `{ kind: "none", message: "No published 189 data for this occupation" }`.
  - `buildTryIt keeps masked counts as intervals`: a fixture core whose higher buckets are all `"<20"` gives `higher === "under 20, so may be zero"`. Use the report's existing wording for masked intervals, and assert it equals what `formatInterval` / the panel-189 view uses.
  - `buildTryIt on real data`: load the real core for `261313`, use total 85, and assert `higher` and `same` equal `formatInterval` of `comparePool(toPoolOccupation(core), 85)`, and that `latestRound` is a `CHIP_LABEL` value. When the newest round's cutoff is `null`, it is "Not listed" (never "0").
  - `buildTryIt copy`: every string passes the `BANNED_COPY` check and contains no "%".
  - `demo content matches the sample report view`: the `buildSampleView()` view's scorecard `ahead` / `atScore` for each visa equal `DemoContent.cards`, and its 190 tiles map one-to-one onto `DemoContent.tiles`, in order and with the same group labels.
  - `sample page uses the shared profile`: `sampleReportProfile.occupation === sampleProfile.occupation`, and the `eoiDate` is `"2026-03-14"`.
- [ ] **Step 2: Run** `npx vitest run src/lib/home`. **Expected:** FAIL.
- [ ] **Step 3: Implement the modules.** Implement `sample.ts`, `try-it.ts`, `sample-view.ts` and `demo-content.ts`. `sample/page.tsx` imports the constants, and its output stays identical (build and compare `out/sample/index.html` before and after).
- [ ] **Step 4: Run** the tests, `npm run check` and `npm run build`. **Expected:** pass.
- [ ] **Step 5: Commit** `feat(home): sample constants and try-it and demo view-models`.

### Task 6: Live try-it component

**Files:**

- Create: `src/components/home/try-it.tsx`, `src/components/home/try-it.module.css`
- Modify: none outside these

**Interfaces:**

- Consumes: `buildTryIt`, `TRY_IT_POINTS` and `TRY_IT_DEFAULT` (Task 5); `useOccupationCore` with the module-level `occupationIndex`; Mantine `Select`.
- Produces: `TryIt({ defaultOccupation: string })`, a client component. The heading is "Try it with your occupation". The link reads "Get the full report" and points to `/check/?occupation=<code>`.

- [ ] **Step 1: Write the failing test.** If the repo has no component testing, cover the URL rule in a pure helper instead: export `fullReportHref(code: string): string` and test that it equals `/check/?occupation=${code}` and never contains the total.
- [ ] **Step 2: Run** it. **Expected:** FAIL.
- [ ] **Step 3: Build the component.**
  - A searchable occupation `Select` (index entries with `hasData`), a points `Select` and the three rows: "EOIs with a higher score (189)", "At your score" and "Latest 189 round".
  - A source line reads "SkillSelect, as at {Mon YYYY}".
  - While loading it shows "Loading published data…".
  - `kind: "none"` shows its message.
  - Long occupation names wrap.
  - Labels are tied to their inputs.
- [ ] **Step 4: Run** `npm run check` and `npm run build`. **Expected:** pass.
- [ ] **Step 5: Commit** `feat(home): live try-it with published 189 data`.

### Task 7: Stageshow hero demo

**Files:**

- Create: `src/components/stageshow-kit/` (copied from `.agents/skills/stageshow/kit`, only the parts used, plus `stageshow.css`), `src/components/home/hero-demo.tsx`, `src/components/home/hero-demo.module.css`, `src/components/home/hero-demo-poster.tsx`, `src/components/home/hero-demo-loader.tsx`, `src/components/home/REHEARSAL.md`
- Modify: `.prettierignore`/`eslint.config.mjs` only if a copied kit file needs a scoped exception (prefer fixing the file)

**Interfaces:**

- Consumes: `DemoContent` (Task 5); `Logo` tokens (Task 1).
- Produces:
  - `HeroDemoPoster({ content: DemoContent })`: a server-renderable static figure showing the scorecard and tiles, with real numbers in the HTML.
  - `HeroDemoLoader({ content: DemoContent })`: a client component that renders the poster, then swaps in `HeroDemo` through `next/dynamic` (`ssr: false`) only when `prefers-reduced-motion` is not `reduce` and the stage is in view.
  - `HeroDemo({ content: DemoContent })`.

- [ ] **Step 1: Read the Stageshow skill.** Read `.agents/skills/stageshow/SKILL.md`, `references/craft.md`, `references/framing.md`, `references/motion.md` and `references/rehearse.md`. Film the closest gold example (`hero-demo` or `payout-flow`) following the skill's step 4.
- [ ] **Step 2: Write the failing test.** Make `shouldAnimate(reducedMotion: boolean, inView: boolean): boolean` a pure, exported helper. It must be false whenever reduced motion is on.
- [ ] **Step 3: Run** it. **Expected:** FAIL.
- [ ] **Step 4: Build the demo** following the skill's workflow.
  - **Beats:**
    1. The cursor fills the sample profile lines, then the points.
    2. The scorecard counts in the three cards' "ahead" and "at your score".
    3. The 190 state tiles light up by group.
    4. The payoff holds. The loop resets with a visible cause.
  - **Length:** 12–16 seconds.
  - **Design size:** about 720×340 beside copy, with a `compact` 358-wide design for phones.
  - **Look:** the Data Desk look, using kit tokens mapped to Task 1's tokens.
  - **Content:** every string comes from `DemoContent`. Visible stage content is `aria-hidden`, with one visually hidden sentence from `posterAlt`. No focusable elements.
  - **Poster:** the poster frame is the payoff beat.
  - **Bundle:** keep the demo chunk at about 40 KB gzipped or less (measure it from `.next`/`out` chunks and report it).
  - **React 19:** adapt the kit minimally if needed.
- [ ] **Step 5: Rehearse.** Run the skill's rehearsal against the built page, `node .agents/skills/stageshow/scripts/film.mjs "<url>" --select '<stage selector>' --gate`, at the shown width and at 390, until it ends with `rehearsal passed`. Write `REHEARSAL.md` with the skill's hand-over template. If the gate can't pass with reasonable effort, ship the poster only (the loader never mounts the demo), say why in the report, and return DONE_WITH_CONCERNS.
- [ ] **Step 6: Run** `npm run check` and `npm run build`. **Expected:** pass.
- [ ] **Step 7: Commit** `feat(home): Stageshow hero demo from the sample report`.

### Task 8: Homepage rebuild

**Files:**

- Create: `src/components/home/doors.tsx`, `src/components/home/three-questions.tsx`, `src/components/home/home-faq.ts` (FAQ data), `src/app/home.module.css`, `src/lib/home/home-copy.test.ts`
- Modify: `src/app/page.tsx` (rewrite); `src/app/globals.css` (delete the old homepage classes)
- Delete: `src/components/home-experience.tsx`, `src/components/pool-explorer.tsx`, `src/components/pool-explorer.module.css`, `src/components/pool-chart.tsx` (each only if nothing else imports it)

**Interfaces:**

- Consumes: `buildSampleView` and `buildDemoContent` (Task 5); `TryIt` (Task 6); `HeroDemoLoader` and `HeroDemoPoster` (Task 7); `QueueBar`, `EoisLikeYours` and `StateTile` (existing report components, fed from the sample view); `Faq`, `Logo`; the manifest `asAt` for "as at" lines.
- Produces: the homepage.

- [ ] **Step 1: Write the failing test** `src/lib/home/home-copy.test.ts`. It imports the FAQ data and an exported `HOME_COPY` object (headline, lede, doors, story, rules, final call to action) and asserts:
  - The exact spec strings:
    - headline `"Know your points. See where they'd put you."`;
    - the lede;
    - both doors' tag, title, body and action;
    - the story title `"65 points is the pass mark, not a promise."` and its body, verbatim from the spec.
  - Nothing contains "eligib", "%", "always" or an agency name. Check against "Y-Axis", "VisaEnvoy" and "Abhinav" in a short deny-list.
  - Everything passes `BANNED_COPY`.
  - There are 5–7 FAQ entries, and each answer opens with a direct answer in 2–3 sentences.
- [ ] **Step 2: Run** it. **Expected:** FAIL.
- [ ] **Step 3: Rewrite `page.tsx`** in the spec's order:
  1. The hero: headline, lede, two doors (both to `/check/`) and the trust line "SkillSelect data, as at {Mon YYYY}", "No percentages", "Stays in your browser". The demo goes beside the headline at 1024px and wider, and below the doors on narrower screens.
  2. `TryIt`, defaulting to the sample comparison occupation.
  3. The three questions, each with a real visual from the sample view and a link to its `/sample/` section.
  4. "65 points is the pass mark, not a promise."
  5. Our rules, linking to `/methodology/`.
  6. The FAQ (answers in the static HTML; `<details>` or Mantine `Accordion` with content kept in the DOM and printed).
  7. The final call to action.

  Delete the old homepage components and CSS.

- [ ] **Step 4: Run** `npm run check` and `npm run build`. Then run headless checks against `out/`:
  - `/` at 1440 and 390 has no overflow.
  - Under reduced motion the poster shows and no demo chunk is requested.
  - The poster numbers equal `/sample/`'s scorecard numbers.
  - With JavaScript disabled, the doors, poster, story, rules and FAQ answers are in the HTML.
  - Print media shows every section, with FAQ answers visible.
  - The try-it changes occupation and points while the URL stays `/`. "Get the full report" goes to `/check/?occupation=<code>` and that page preselects the occupation.
  - No console errors.

  Save screenshots (home desktop top, home mobile, try-it, print PDF) to `.superpowers/sdd/<plan>/screenshots/`.

- [ ] **Step 5: Commit** `feat(home): two-door homepage with demo, try-it and answers`.

### Task 9: Docs and the site-wide check

**Files:**

- Modify: `CLAUDE.md` (name, the "Mantine 9 theme (custom `forest` palette…)" line, fonts, `src/components/home/` and `src/lib/home/` in Architecture, the brand tokens' home), `AGENTS.md` (name only if it appears), `docs/HANDOFF.md` (resume point), `docs/ENGINEERING.md` (the brand tokens and the 12px rule's test), `docs/STRATEGY.md` (no new decisions unless a ruling needs the founder)

**Interfaces:**

- Consumes: everything above.
- Produces: docs.

- [ ] **Step 1: Update the docs** listed above, keeping each change short and factual.
- [ ] **Step 2: Run the site-wide check.** Run `npm run check` and `npm run build`. Then, headless against `out/`, check every page (`/`, `/check/`, `/sample/`, `/states/`, `/methodology/`, a 404) at 1440 and 390:
  - no overflow;
  - no text under 12px;
  - every status chip and text pairing on `/sample/` reaches AA (computed colours, ratios listed);
  - `grep -ril landfall out` is empty;
  - no console errors.

  Save `/sample/` state-outlook screenshots in the new colours.

- [ ] **Step 3: Commit** `docs: record the MigrateLens brand and homepage`.
