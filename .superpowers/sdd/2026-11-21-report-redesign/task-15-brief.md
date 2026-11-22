### Task 15: Print layout and Download PDF

**Files:**

- Create: `src/components/report/print-report.tsx`, `print-report.module.css`
- Modify: `src/components/report.tsx` (render `<PrintReport view />` after the screen layout), `src/app/globals.css` (`@page` rule only), `CLAUDE.md` and `docs/ENGINEERING.md` (printing rule reworded to the spec 11 sentence)

**Interfaces:**

- Consumes: the view (Task 10), Tasks 12–13 (`narrow` charts, `RouteLine width={700}`).
- Produces: a print-only tree: brand line; page 1 outlook (tiles, Our read, why) + stamp + three visas; forced break; charts two columns + route + improve; points + method + guarantee box (kept together); forced break; appendix (rounds, pool, 190/491 state tables side by side with a one-line rules note per state, sources). `@page { size: A4; margin: 14mm 14mm 18mm; }` and per-report margin boxes (`@bottom-left` name + not-a-guarantee, `@bottom-right` "Page x of y") injected as a `<style>` element. Screen chips, buttons and the feedback prompt are hidden in print.

- [ ] **Step 1: Implement** from the mockup's `renderPrint`, `appendix` and print CSS; all phone/tablet media queries in report CSS modules are `screen and (...)`.
- [ ] **Step 2: Run** `npm run check && npm run build`. Expected: PASS.
- [ ] **Step 3: Verify PDFs** from the built site for the four `/sample/` examples once Task 16 lands, or for `/check/` reports now, with headless Chrome: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --no-pdf-header-footer --print-to-pdf=/tmp/r.pdf "<url>"` at two window sizes (`--window-size=390,844` and `--window-size=1280,900`). Expected: ≤ 5 pages each, page 1 holds the stamp, headline, best route, wait and three visas (`pdftotext -f 1 -l 1`), and the two sizes give the same page count and text.
- [ ] **Step 4: Commit** `feat(report): A4 print layout and Download PDF`.

