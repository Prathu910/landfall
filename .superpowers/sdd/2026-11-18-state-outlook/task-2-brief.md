### Task 2: Federal occupation eligibility importer

**Files:**

- Create: `scripts/state-lists/federal.ts`, `scripts/state-lists/__fixtures__/federal.*`, `scripts/state-lists/federal.test.ts`
- Data: `src/data/state-rules/federal-occupations.json` (FederalList)
- Modify: `package.json`, adding the script `"data:state-lists": "tsx scripts/state-lists/cli.ts"` (create a minimal `cli.ts` that runs the available importers; later tasks extend it)

**Source:** the official list of eligible skilled occupations for 190 and 491. That is the Home Affairs skilled occupation list, or the current legislative instrument on legislation.gov.au. Find the official machine-readable or HTML source and record its URL.

- [ ] **Step 1: Capture a fixture once** from the official source. If it is blocked (403, login, or JS-only with no reachable data endpoint), stop and report BLOCKED with the URLs tried and the responses.
- [ ] **Step 2: Write failing parser tests** against the fixture:
  - 261313 Software Engineer is eligible for 190 and 491;
  - every entry has both booleans;
  - an unknown code is absent.
- [ ] **Step 3: Implement** the parser and writer: atomic write, guard-validated (`isFederalList`).
- [ ] **Step 4: Run the import.** Check that the entry count is plausible (hundreds) and that all 11 original occupations are present.
- [ ] **Step 5: Run** `npm run check && npm run build`, then **commit** the code and data separately:
  - `feat(state): import federal 190/491 occupation eligibility`
  - `data: add federal occupation eligibility`

