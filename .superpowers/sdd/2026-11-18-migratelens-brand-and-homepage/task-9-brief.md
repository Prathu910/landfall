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
