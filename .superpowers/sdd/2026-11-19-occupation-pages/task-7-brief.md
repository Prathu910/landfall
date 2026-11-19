### Task 7: Browser check, links from the rest of the site, and docs

**Files:**

- Modify: `src/components/home/try-it.tsx` (a "See the {name} page" link to `occupationPath`), `CLAUDE.md` (architecture: the occupation pages, `site.ts`, the launch switch), `docs/HANDOFF.md`, `docs/STRATEGY.md` (decision log: round cards; alert box deferred until an email service is chosen; tier 1 shipped), `docs/DATA.md` (the pages read core and detail at build)

- [ ] **Step 1:** Add the try-it link (it shows only when the view has data). Run `npm run check`.
- [ ] **Step 2: Browser pass** against the built `out/` (`python3 -m http.server 3017 --bind 127.0.0.1 --directory out`) at 1440 and 390 (and 320 for the long name) for `/occupations/`, 261313, 254499, an all-"<20" occupation, an occupation without a 189 pool, and "Software and Applications Programmers nec" (261399): no console errors, no horizontal scroll, the tabs switch, the search filters, the `<head>` holds the title, description, canonical, `noindex` and three JSON-LD scripts, print media shows every section. Save screenshots under the plan's `.superpowers` workspace.
- [ ] **Step 3:** Update the docs listed above.
- [ ] **Step 4: Run** `npm run check` and `npm run build`; expect PASS.
- [ ] **Step 5: Commit** `docs(occupation-page): record the occupation pages and link them from the try-it`.
