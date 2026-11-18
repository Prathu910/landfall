### Task 4: State occupation list importers (QLD, NSW)

**Files:** as in Task 3, for `qld.ts` and `nsw.ts`.

**Sources:**

- **QLD:** the onshore list `https://www.migration.qld.gov.au/occupation-lists/queensland-onshore-skilled-occupation-list` and the offshore list `https://www.migration.qld.gov.au/occupation-lists/offshore-queensland-skilled-occupation-lists-(qsol)`.
- **NSW:** the Skills List `https://www.nsw.gov.au/visas-and-migration/skilled-visas/nsw-skills-lists`. NSW lists 4-digit ANZSCO unit groups.

Mapping rules:

- Map NSW unit groups to 6-digit codes by prefix, using `src/data/occupation-index.json`, and mark each entry `viaUnitGroup: "<4-digit>"`.
- NSW 491 is closed. Record that in the rules (Task 5), not in the list.

- [ ] **Step 1: Capture fixtures.**
- [ ] **Step 2: Write failing tests:**
  - QLD 233211 Civil Engineer: 190 and 491, onshore and offshore;
  - NSW 261313 is present via unit group 2613.
- [ ] **Steps 3–5:** as in Task 3.

