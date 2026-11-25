# Monthly updates 2: Instagram images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One command, `npm run social:render -- --month 2026-10 --set round|month`, renders the 2026-10 Instagram carousel in Look A ("Passport page"), light and dark, from the recap facts, with captions, alt text, size limits and retention.

**Architecture:** Pure card view-models in `src/lib/updates/cards.ts` read the same frozen facts file as the recap page and format numbers with the same helpers. A tsx script renders each card to static HTML with React `renderToStaticMarkup`, opens it in headless Chrome through puppeteer-core, refuses to screenshot if a font didn't load or text overflows, then quantises the PNG with sharp and checks the limits.

**Tech Stack:** TypeScript, React 19 `react-dom/server`, puppeteer-core 25.18.1 and sharp 0.35.5 (both already in `node_modules`; pin them as exact devDependencies), Vitest, tsx.

**Spec:** `docs/superpowers/specs/2026-11-24-monthly-updates-design.md` (6.6 OG image, 6.7, 6.8 card content, 6.13, risks 10, 11, 19). Visual target: `/Users/aveomac/aveo-projects/landfall/.superpowers/brainstorm/round-recap-2026-11-24/instagram/` (`card.html`, `card.css`, the `feed-*-a-*`, `feed-190-*`, `feed-491-*`, `feed-spot-*`, `feed-close-*` and `story-cover-a-*` PNGs; Look B files are rejected). The folder is untracked; read it from that absolute path.

**Depends on:** Plan 1 merged (`src/data/updates/2026-10.json`, `src/lib/updates/` types and `format.ts`, `round-stamp.tsx`, `rect-stamp.tsx`, `buildRecapView`). **Branch:** `roadmap/monthly-updates-social`, from `main` after Plan 1 merges.

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

## Spec decisions made in this plan

1. **Card 2 has no "n/N" tag.** The spec reuses the round set's card 2 file in the month set (never re-rendered) and also numbers cards by carousel position; one file can't say both "2/3" and "2/6". Card 2 shows only the month tag; every other card shows its position.
2. **Two rounds in a month:** the month set reuses the newest round's card 2.
3. **The round set has 9 files**, not 8: its `og.png` (6.7 retention) is in addition to the 3 × 2 + 2 PNGs.
4. **MRZ line** uses Archivo (uppercase, tabular, tracked) instead of the mockup's Menlo, which a Linux runner doesn't have.
5. Each set writes `set.json` beside its images (card ids, files, alt text, caption) for the PR summary (Plan 3). The repo is public, so this exposes nothing the PR doesn't.
6. **The first 2026-10 sets.** The spec wants a first Instagram post soon after `/updates/2026-10/` ships, and also CI-only committed sets. Ask the founder in this plan's PR: commit the locally rendered 2026-10 sets now (Mac rasterisation, reviewed as committed), or wait for Plan 3's rehearsal. Until a set is committed the recap keeps `/og.png`.

## Review Focus

- **A month with no round:** the month set has 5 feed cards (positions "1/5"…"5/5"), the cover has no round stamp and reads "190 and 491 by state", and the caption has no `#189visa` unless the spotlight card shows 189 figures. Test in Tasks 1 and 2.
- **A long occupation name** on card 2 or the spotlight (for example "Natural and Physical Science Professionals nec"): the render fails on overflow rather than clipping; the template wraps to two lines first. Test in Task 4 with a fixture facts file.
- **An all-masked state** (TAS 491 on 2026-10): the map label reads "<20" / "each occupation" and the card note never shows 0. Test in Task 1.
- **A dark render that silently falls back to light** (theme emulation ignored): the render checks the computed paper colour matches the dark token. Test in Task 4.
- **A rerun on an existing set** (the spotlight swap in Plan 3): only the month set's own files are replaced; the round set's card 2 is never re-rendered. Test in Task 5.

---

### Task 1: Card view-models

**Files:**

- Create: `src/lib/updates/social-spec.ts`, `src/lib/updates/cards.ts`, `src/lib/updates/cards-state.ts`, `src/lib/updates/glyphs.ts`
- Test: `src/lib/updates/cards.test.ts`, `src/lib/updates/cards-numbers.test.ts`, `src/lib/updates/glyphs.test.ts`

**Interfaces:**

- Consumes: `RecapFacts`, `format.ts` helpers, `buildRecapView` (Plan 1).
- Produces (social-spec.ts): `FEED = { width: 1080, height: 1350 }`, `STORY = { width: 1080, height: 1920, safeTop: 250, safeBottom: 340 }`, `OG = { width: 1200, height: 630 }`, `FEED_GRID_WIDTH = 1012`, `IMAGE_LIMIT_BYTES = 300 * 1024`, `SET_LIMIT_BYTES = 2.5 * 1024 * 1024`, `RETENTION_MONTHS = 3`, `HANDLE = "@migratelens"`.
- Produces (cards.ts): `CardId = "cover" | "round-cover" | "round" | "state-190" | "state-491" | "spotlight" | "closing"`; `CardView` = a union on `id` with `tag: string` ("Oct 2026"), `position: { index: number; of: number } | null` (null only for `round`), `source: string`, `visas: Visa[]` (the visas the card shows figures for) and the card's body fields; `roundSetCards(facts, roundDate): CardView[]` (round-cover, round, closing); `monthSetCards(facts): CardView[]` (cover, [round of the newest round], state-190, state-491, spotlight, closing); `cardStrings(card): string[]` (every visible string).
- Produces (glyphs.ts): `parseUnicodeRange(css: string): [number, number][]`; `charsOutside(text: string, ranges): string[]`.

- [ ] **Step 1: Write the failing tests**

```ts
const month = monthSetCards(oct);
expect(month.map((c) => c.id)).toEqual([
  "cover",
  "round",
  "state-190",
  "state-491",
  "spotlight",
  "closing",
]);
expect(
  month.map((c) => c.position && `${c.position.index}/${c.position.of}`),
).toEqual(["1/6", null, "3/6", "4/6", "5/6", "6/6"]);
expect(roundSetCards(oct, "2026-10-15").map((c) => c.id)).toEqual([
  "round-cover",
  "round",
  "closing",
]);
const round = month[1] as Extract<CardView, { id: "round" }>;
expect(round.total).toBe("20,000");
expect(round.picks.map((p) => p.name)).toEqual([
  "Welfare Centre Manager",
  "Airconditioning and Refrigeration Mechanic",
  "Clinical Psychologist",
]);
const tas = (month[3] as Extract<CardView, { id: "state-491" }>).map.TAS;
expect(tas).toEqual({ big: "<20", small: "each occupation", shade: 1 });
expect((month[2] as Extract<CardView, { id: "state-190" }>).notRecorded).toBe(
  "State not recorded: at least 243",
);
expect(cardStrings(month[5])).toEqual(
  expect.arrayContaining([
    "Check your points free",
    "migratelens.com",
    "@migratelens",
    "General information, not migration advice.",
  ]),
);
expect(monthSetCards(dataOnlyFixture).map((c) => c.id)).toEqual([
  "cover",
  "state-190",
  "state-491",
  "spotlight",
  "closing",
]);
// cards-numbers.test.ts: for every facts file in src/data/updates/ and Plan 1's fixtures,
// every number token (/\d[\d,–.]*/) in cardStrings of every card appears in the recap view's strings for the same month
// glyphs.test.ts: every card string of every facts file has no charsOutside the Archivo latin wdth and Big Shoulders latin ranges read from node_modules
```

Map shades come from Plan 1's `shadeBand(floor)` (`src/lib/updates/state-view.ts`); `cards-state.ts` imports it rather than defining its own.

- [ ] **Step 2–4:** Run `npx vitest run src/lib/updates/cards src/lib/updates/glyphs`, expect FAIL; implement; expect PASS.
- [ ] **Step 5: Commit** `feat(social): Instagram card view-models`.

### Task 2: Captions, alt text and hashtags

**Files:**

- Create: `src/lib/updates/social-copy.ts`
- Test: `src/lib/updates/social-copy.test.ts`

**Interfaces:**

- Consumes: `CardView` (Task 1).
- Produces: `HASHTAGS = { always: ["#australiapr", "#skillselect"], "189": "#189visa", "190": "#190visa", "491": "#491visa" } as const`; `hashtagsFor(cards: CardView[]): string[]` (always, then each visa that any card's `visas` contains, in 189/190/491 order); `caption(kind: "round" | "month", cards: CardView[], facts: RecapFacts): string` (2–4 dated sentences, the recap URL `migratelens.com/updates/YYYY-MM/`, "General information, not migration advice.", then a blank line and the hashtags); `altText(card: CardView): string` (every figure the card shows, in reading order, ≤ 1,000 characters).

- [ ] **Step 1: Write the failing tests**

```ts
expect(hashtagsFor(roundSetCards(oct, "2026-10-15"))).toEqual(["#australiapr", "#skillselect", "#189visa"]);
expect(hashtagsFor(monthSetCards(oct))).toEqual(["#australiapr", "#skillselect", "#189visa", "#190visa", "#491visa"]);
expect(caption("month", monthSetCards(oct), oct).split("\n").at(-1)).toBe("#australiapr #skillselect #189visa #190visa #491visa");
expect(caption("round", roundSetCards(oct, "2026-10-15"), oct)).toContain("migratelens.com/updates/2026-10/");
it("passes BANNED_COPY and never names a next round date", ...) // every caption and alt text of every facts file
it("keeps each alt text within 1,000 characters", ...)
```

- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Commit** `feat(social): captions, alt text and hashtags`.

### Task 3: Card templates and preview

**Files:**

- Create: `scripts/social/templates/` (`card-page.tsx` (frame, guilloche paper, top bar, source line, MRZ), `cover-card.tsx`, `round-card.tsx`, `state-card.tsx`, `spotlight-card.tsx`, `closing-card.tsx`, `card-map.tsx`, `swipe-cue.tsx` (SVG arrow)), `scripts/social/card.css`, `scripts/social/tokens.ts`, `scripts/social/html.ts`
- Modify: `src/app/colour-literals.test.ts` (also scan `scripts/social/`)
- Test: `scripts/social/tokens.test.ts`, `scripts/social/html.test.ts`

**Interfaces:**

- Consumes: `CardView` (Task 1); `RoundStamp`, `RectStamp` (`src/components/updates/`, Plan 1); `src/components/home/atlas-map-geometry.json`; `markSvg` geometry from `src/components/brand/mark-geometry.ts`; guilloche `public/report-passport-a.svg`.
- Produces: `cardTokenCss(theme: "light" | "dark"): string` (`:root{color-scheme:…;--paper:…}` from named palette entries); `cardHtml(card: CardView, format: "feed" | "story" | "og", theme): string` (a full document: fonts as `@font-face` with `file://` URLs, `card.css` inlined, tokens, the template's static markup).
- CLI preview: `npm run social:render -- --month 2026-10 --set month --html-only <dir>` writes the HTML files without Chrome (wired in Task 4; `html.ts` exports the function it calls).

- [ ] **Step 1: Write the failing tests**

```ts
it("defines every var() card.css uses, in both themes", () => {
  const used = [...readFileSync("scripts/social/card.css", "utf8").matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]);
  for (const theme of ["light", "dark"] as const) for (const name of used) expect(cardTokenCss(theme)).toContain(`${name}:`);
});
it("loads both faces by file URL", () => expect(cardHtml(card, "feed", "light")).toMatch(/file:\/\/.*archivo-latin-wdth-normal\.woff2/));
it("escapes occupation names", ...) // a fixture name with "&" renders as &amp;
it("marks story content as safe-zone content", ...) // story documents wrap content in [data-safe]
```

- [ ] **Step 2–3:** fail, then implement from the mockup's `card.html`/`card.css` Look A rules (`.page`, `.inner`, `cover-a`, `a189`, `astate`, `spot`, `closing`), replacing every literal colour with a token and every `→` with `swipe-cue.tsx`. The story layout pads the inner page to 290 px top and 380 px bottom as the mockup does.
- [ ] **Step 4: Run** the tests and `npm run check`; open the `--html-only` output in a browser at 1080 wide and compare with the mockup PNGs, light and dark.
- [ ] **Step 5: Commit** `feat(social): Look A card templates`.

### Task 4: Render script

**Files:**

- Create: `scripts/social/render.ts`, `scripts/social/jobs.ts`, `scripts/social/browser-checks.ts`
- Modify: `package.json` (`"social:render": "tsx scripts/social/render.ts"`; devDependencies `"puppeteer-core": "25.18.1"`, `"sharp": "0.35.5"`; `npm install` updates the lockfile)
- Test: `scripts/social/jobs.test.ts`, `scripts/social/render.test.ts` (skipped unless `CHROME_PATH` is set or the macOS default Chrome exists)

**Interfaces:**

- Consumes: `cardHtml` (Task 3), `roundSetCards`/`monthSetCards` (Task 1), `loadRecap` (Plan 1).
- Produces: `RenderJob = { card: CardView; format: "feed" | "story" | "og"; theme: "light" | "dark"; out: string }`; `roundSetJobs(facts, roundDate): RenderJob[]` (9: three feed cards × two themes, story cover × two (from `round-cover`), `og.png` light from `round-cover`) under `public/social/YYYY-MM/round-YYYY-MM-DD/`; `monthSetJobs(facts): RenderJob[]` (13 when the month has a round: cover, state-190, state-491, spotlight, closing × two themes, story cover × two, and `public/social/YYYY-MM/og.png`; card 2 is not a job) under `public/social/YYYY-MM/month/`; `parseRenderArgs(argv)` (`--month`, `--set round|month`, `--round` (default: the newest round in the month), `--html-only <dir>`).
- Browser checks (in `browser-checks.ts`, run in the page): every `document.fonts.check` for `900 40px "Big Shoulders Stencil Display"`, `400 40px "Archivo"`, `700 40px "Archivo"`, `800 40px "Archivo"` is true; no `.fit, .inner` element has `scrollHeight > clientHeight` or `scrollWidth > clientWidth`; on a story every `[data-safe]` box lies within y 250…1580; on a feed cover every `[data-essential]` box lies within x 34…1046; the computed `--paper` matches the theme's token. Any failure throws with the job's `out` path and exits 1.

- [ ] **Step 1: Write the failing tests**

```ts
expect(roundSetJobs(oct, "2026-10-15").map((j) => j.out)).toEqual(expect.arrayContaining([
  "public/social/2026-10/round-2026-10-15/round-light.png", "public/social/2026-10/round-2026-10-15/story-cover-dark.png", "public/social/2026-10/round-2026-10-15/og.png"]));
expect(roundSetJobs(oct, "2026-10-15")).toHaveLength(9);
expect(monthSetJobs(oct)).toHaveLength(13);
expect(monthSetJobs(oct).some((j) => j.card.id === "round")).toBe(false);
expect(monthSetJobs(oct).find((j) => j.format === "og")).toMatchObject({ out: "public/social/2026-10/og.png", theme: "light" });
it("rejects --set month for a month without a data section", ...)
// render.test.ts (Chrome only): renders a long-name fixture card and expects the overflow error; renders a dark card and reads back a 1080×1350 PNG
```

- [ ] **Step 2–3:** fail, then implement: launch `puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? DEFAULT_CHROME, headless: true, args: ["--hide-scrollbars", "--force-color-profile=srgb"] })`, `setViewport` at device scale 1, `emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }])`, `setContent(html, { waitUntil: "load" })`, await `document.fonts.ready`, run the checks, `screenshot({ clip })`.
- [ ] **Step 4: Run** `npx vitest run scripts/social` (with Chrome) and `npm run check`.
- [ ] **Step 5: Commit** `feat(social): render cards with puppeteer-core`.

### Task 5: Compression, limits, set manifest and retention

**Files:**

- Create: `scripts/social/compress.ts`, `scripts/updates/retention.ts`
- Modify: `scripts/social/render.ts` (compress each PNG, write `set.json`, enforce limits, prune), `package.json` (`"updates:retention": "tsx scripts/updates/retention.ts"`)
- Test: `scripts/social/compress.test.ts`, `scripts/updates/retention.test.ts`

**Interfaces:**

- Produces: `quantise(png: Buffer): Promise<Buffer>` (sharp `png({ palette: true, colours: 256, effort: 10 })`, then re-read: same width and height or throw); `checkLimits(files: { path: string; bytes: number }[]): string[]` (each over `IMAGE_LIMIT_BYTES`, and the set total over `SET_LIMIT_BYTES`); `SetManifest = { kind: "round" | "month"; month; round: string | null; images: { card: CardId; format; theme; file: string; alt: string }[]; reused: string[]; caption: string }` written as `set.json`; `retentionPlan(socialDirs: string[], files: string[], latestMonth: MonthKey): string[]` (paths to delete: every file of months older than the latest `RETENTION_MONTHS`, except each month's `og.png`).
- The month set's `reused` lists the newest round set's `round-light.png` and `round-dark.png` paths; rendering a month set never writes into a `round-*` folder.

- [ ] **Step 1: Write the failing tests**

```ts
expect(checkLimits([{ path: "a.png", bytes: 300 * 1024 + 1 }])).toEqual(["a.png is 300.0 KB, over the 300 KB limit"]);
expect(checkLimits(thirteenFilesOf(200 * 1024))).toEqual(["set is 2.5 MB, over the 2.5 MB limit"]);
expect(retentionPlan(["2026-07", "2026-08", "2026-09", "2026-10"], files, "2026-10")).toEqual(["public/social/2026-07/month/cover-light.png", /* … every 2026-07 file but og.png */]);
expect(retentionPlan(["2026-10"], files, "2026-10")).toEqual([]);
it("never deletes a month's og.png", ...)
it("leaves round folders untouched when re-rendering the month set", ...)
```

- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Commit** `feat(social): compression, size limits, set manifest and retention`.

### Task 6: The 2026-10 sets and the recap OG image

**Files:**

- Create (rendered; committed only per Spec decision 6): `public/social/2026-10/` (`round-2026-10-15/` 9 files plus `set.json`, `month/` 12 files plus `set.json`, `og.png`)
- Modify: `src/lib/updates/meta.ts` (`ogImageFor`), `src/app/updates/[month]/page.tsx`, `docs/HANDOFF.md`, `scripts/README.md` (social commands), `CLAUDE.md` (a `scripts/social/` line)
- Test: `src/lib/updates/meta.test.ts`

**Interfaces:**

- Produces: `ogImageFor(month: MonthKey, publicFiles: ReadonlySet<string>): string` = `/social/<month>/og.png` if present, else the newest `/social/<month>/round-<date>/og.png`, else `/og.png`. The page passes it to `openGraph.images` and `recapJsonLd`.

- [ ] **Step 1: Write the failing test** for the three `ogImageFor` cases.
- [ ] **Step 2–3:** fail, implement, pass.
- [ ] **Step 4: Render** `npm run social:render -- --month 2026-10 --set round --round 2026-10-15` then `-- --month 2026-10 --set month`. Expected: exit 0, 22 PNGs, every PNG ≤ 300 KB, each set ≤ 2.5 MB (`du -k public/social/2026-10/*`). Compare each PNG with its mockup PNG; record the Instagram safe-zone and grid-crop guidance checked on the day in the ledger (spec risk 19), and adjust `social-spec.ts` if it changed.
- [ ] **Step 5: Verify** `npm run check`, `npm run build`, `grep -c "/social/2026-10/og.png" out/updates/2026-10/index.html` ≥ 1 while the rendered files are present, `npm run lighthouse -- --only /updates/2026-10/`.
- [ ] **Step 6: Commit** `feat(updates): recap OG image from the card set`. Commit `public/social/2026-10/` as `data: 2026-10 Instagram card sets` only with the founder's go-ahead; otherwise delete the local renders before committing. The PR description shows the renders (or describes how to produce them) and the two captions.
