### Task 5: Occupation page components

**Files:**

- Create in `src/components/occupation/`: `occupation-summary.tsx`, `pool-tabs.tsx` (client), `round-cards.tsx`, `cohort-bars.tsx`, `state-table.tsx`, `occupation-faq.tsx`, `related-occupations.tsx`, with CSS modules beside them
- Test: `src/components/occupation/round-cards.test.tsx` only if the repo already renders components in tests; otherwise the view-model tests stand and the visual check is Task 7

**Interfaces:**

- Consumes: the view-model outputs of Tasks 2–4. Components take those outputs as props and compute nothing.
- Produces: `OccupationSummary({ chips, sentences, sourceLine })`, `PoolTabs({ pools: Record<Visa, PoolBar[] | null>, totals: Record<Visa, string | null> })`, `RoundCards({ cards, note })`, `CohortBars({ rows, note })`, `StateTable({ rows, asAt })`, `OccupationFaq({ items })`, `RelatedOccupations({ items, unitGroup })`.

- [ ] **Step 1: Build each component to the mockup** (round cards as option A: listed card on `--status-watching-bg` with a slate border, cut-off in Newsreader; unlisted card dashed with "Not listed" in `--status-not-open-fg`; eight columns, four at phone width). `PoolTabs` renders all three visas in the HTML and shows one at a time (Mantine `Tabs` with `keepMounted`, or equivalent), all visible in print. Masked bars and segments are striped and labelled "under 20". `StateTable` links each state name to `href` (new tab, `rel="noreferrer"`).
- [ ] **Step 2: Run** `npm run check`; expect PASS, including the 12px floor test.
- [ ] **Step 3: Commit** `feat(occupation-page): page components`.

