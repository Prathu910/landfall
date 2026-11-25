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

