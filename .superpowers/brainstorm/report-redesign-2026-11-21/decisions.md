# Report redesign: founder decisions (21 November 2026)

Mockups in this folder:

- `report-e-final.html`: **locked design (Option E)** with every scenario. Open it in a browser and use the tabs. `?s=<id>` opens one scenario; `?embed=1` hides the tabs.
- `device-preview.html`: the same report in a phone frame (390 px) and a tablet frame (820 px). It loads `report-e-final.html` from this folder.
- `report-directions-a-to-d.html`: the four looks that led to E (A Signal, B current brand, C Departures, D Passport).
- `report-first-mockup.html`: the first restructured report (Priya, looks A and B).

All figures come from the real SkillSelect snapshot `skillselect-2026-10-31`. The people are fictional.

## Why

Friends found the site text-heavy. The sample report printed to 34 A4 pages and never gave a clear signal. The founder retired the 17 Nov 2026 "no chances or forecasts" rule in favour of strong, clear views (decision log in `docs/STRATEGY.md`, 21 Nov 2026).

## Decisions

1. **Approach A: code decides, AI explains.** Code computes labels, waits, best route and improvements. Claude writes "Our read" from those facts only. Every number it writes is checked against the facts; on failure a template sentence is shown.
2. **Report order:** outlook (stamp, headline, fact, best route, estimated wait, Our read) → your three visas → last 6 cut-offs and the queue → your best route (timeline with dated losses) → how to improve (each change shows the label it leads to) → see the evidence (folded) → your points in full (whole profile, shareable) → how we label your outlook → not-a-guarantee footer.
3. **Look E** combines A's clean white layout and Archivo type, D's ink stamps and passport-style points page, and C's charts (cut-off columns, queue squares, route line). Desktop is final.
4. **The stamp shows the best visa available**, preferring 189, then 190, then 491 on ties. If no visa is Competitive or better, one combined stamp ("189 • 190 • 491") shows the best of their labels.
5. **Label rules** (in the report's "How we label your outlook"):
   - Very strong: above every cut-off in the occupation's last 3 listed 189 rounds, and fewer than 20 EOIs ahead.
   - Strong: meets every cut-off in those 3 rounds.
   - Competitive: meets the lowest of those 3 cut-offs, not all.
   - Long wait: still listed, but below all 3.
   - Not currently invited: not listed in any of the last 4 rounds.
   - Not eligible yet: under 65 points or a basic requirement fails.
   - Not enough data: nothing published (or "Too few to count" when every count is "under 20").
   - 190/491 per state, from invitations at or below the user's nominated points over 3–6 months plus state rules; the visa takes its best state. See the "Label rules" tab for the state thresholds.
   The founder accepted these "for now"; revisit after real use.
6. **Estimated wait** sits in the outlook section, under the headline (a line on desktop, a tile beside "Best route" on phones).
7. **Points in full** at the end: every category including zeros, totals for 189/190/491, date of birth, skills assessment, English test expiry, location, EOI date if lodged.
8. **Footer** on every report: "This is our best reading of the data, not a guarantee…"
9. **Mobile first** (about 80% of the audience is on phones). Below 720 px: stamp first, best route and wait as tiles, sticky section chips, visa stamps as rows, larger-text charts, a vertical route timeline, and the points table stacked. Tablets (up to 1023 px) get the section chips and single-column charts.

## Scenarios the build must cover (one tab each)

1. Strong (Aarav, nurse 90): "Protect your points" instead of "How to improve".
2. In the middle (Priya, nurse 70).
3. Long wait for 189 but a state is better (Meera, early childhood teacher 80): stamp shows 190 TAS.
4. 189 closed, state route open (Rahul, software engineer 85): stamp shows 190 NT; the report says more points won't help 189.
5. Below 65 (Arjun, nurse 60): 189 not eligible yet, stamp shows 190 TAS.
6. No data (Sana, greenkeeper 362311, 75): combined "No data" stamp; falls back on the federal and WA lists. (Corrected 21 Nov: the first mockup used Endocrinologist, which rounds do list.)
7. Nothing suits (Dev, internal auditor 75): combined "Not invited" stamp.
8. Already lodged (Kavya, nurse 70, EOI 12 Mar 2026): place at her score, estimated wait, EOI expiry.
9. Evidence opened (Priya): everything behind the verdict.

## Open for the design document

- The "Rules" column of the state table is illustrative in the mockup; the build runs the real state rules.
- The stamp font (Big Shoulders Stencil) must be self-hosted through `@fontsource` like the other fonts; the mockup loads it from Google Fonts.
- The homepage and occupation pages are not redesigned yet; they come after the report.

## PDF download (approved 21 Nov 2026, samples in `pdf/`)

- One A4 portrait print layout for every device. Phone, tablet and desktop produce the same PDF (verified page by page).
- About 4 pages: page 1 the answer (stamp, headline, best route, estimated wait, Our read, three visas); page 2 what to do (cut-offs, queue, route, how to improve); page 3 the profile (points in full, how we label, not-a-guarantee box); page 4 the evidence appendix (every round, pool by points, 190 and 491 by state, sources).
- Every page footer: "MigrateLens report for <name>. Our best reading of SkillSelect data to Oct 2026, not a guarantee." plus "Page x of y" (Chrome-based browsers; Safari omits the page footer, the guarantee box stays).
- "Download PDF" button on the report uses the browser's save-as-PDF now; a one-tap server-generated PDF from the same layout comes with the paid report.

## After the builder check (21 Nov 2026)

- Corrections: the no-data example is now Greenkeeper 362311 (Endocrinologist is listed in rounds); an expiring English test or skills assessment makes the reader Not eligible yet (not a points loss); dated losses apply cumulatively in date order.
- Founder: keep the ~4-page PDF (detailed evidence views are screen only; the printing rule is reworded). `/sample/` shows four example tabs: Strong, In the middle, 189 closed, Nothing suits.
