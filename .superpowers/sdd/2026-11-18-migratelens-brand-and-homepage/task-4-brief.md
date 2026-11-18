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

