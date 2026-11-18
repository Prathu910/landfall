### Task 5: Curated 2026–27 rules for all eight jurisdictions

**Files:**

- Create: `src/data/state-rules/2026-27/{wa,nsw,qld,sa,vic,act,tas,nt}.ts`, plus `index.ts` exporting `stateRules: StateRules` (validated by `isStateRules` at module load)
- Test: `src/data/state-rules/2026-27/state-rules.test.ts`

**Content:** transcribe from `docs/research/state-nomination-2026-27.md` only, with no new browsing:

- every program, stream, cohort, status, restriction and requirement;
- each with its source URL and `checkedAt: "2026-11-17"` (the research date);
- `verification: "verified"` only for facts the research read directly (WA, NSW, QLD, SA, Home Affairs);
- every `[S]` fact as `"secondary"`;
- contradictions (WA ranking order, ACT 3 vs 6 months, SA priority sectors) as `"secondary"`, with both readings in `note`.

Occupation lists are referenced via `OccupationListRef`:

| Jurisdiction     | Reference                                                  |
| ---------------- | ---------------------------------------------------------- |
| WA, SA, QLD, NSW | their imported lists                                       |
| VIC              | `all-federally-eligible`, as `"secondary"`                 |
| ACT, TAS, NT     | `"secondary"` / `none-published`, as the research supports |

Programs the research shows as closed must be recorded with `status: "closed"`, using the research's `verification` for each:

- NSW 491;
- NT 190;
- NT offshore;
- VIC 491;
- TAS offshore 491.

- [ ] **Step 1: Write failing tests.**
  - Every state and visa pair exists (16).
  - Every rule passes the guards.
  - Every ACT/VIC/TAS/NT eligibility-deciding rule is `"secondary"`.
  - NSW 491 is closed.
  - Every `listId` resolves to an imported list or a documented `none-published`.
- [ ] **Step 2: Run** the test. Expect FAIL.
- [ ] **Step 3: Write the rule files.** Keep each under 250 lines, and comment any judgement with a pointer to the research doc section.
- [ ] **Step 4: Run** `npm run check && npm run build`. Expect PASS.
- [ ] **Step 5: Commit** `data: curate 2026–27 state nomination rules from the research`

