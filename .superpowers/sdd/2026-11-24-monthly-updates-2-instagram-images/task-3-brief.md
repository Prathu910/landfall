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

