### Task 10: `npm run updates:generate` and the 2026-10 facts file

**Files:**

- Create: `scripts/updates/generate.ts`, `scripts/updates/generate.test.ts`, `src/lib/updates/load-server.ts`, `src/data/updates/2026-10.json` (generated)
- Modify: `package.json` (`"updates:generate": "tsx scripts/updates/generate.ts"`), `.prettierignore` (if not done in Task 2)

**Interfaces:**

- Consumes: Tasks 6–9.
- CLI: `--month YYYY-MM --section round --round YYYY-MM-DD` or `--section data [--spotlight <code>] [--previous-manifest <file>]`, optional `--today YYYY-MM-DD` (default `sydneyDate(new Date())`). Exits 1 with a message if the round isn't in `rounds.json`, the round's Sydney month isn't `--month`, `--section data` is asked for a month other than `manifest.asAt`, or the merged file fails `isRecapFacts`.
- Produces: `parseGenerateArgs(argv): GenerateArgs`; `listRecapMonths(): MonthKey[]` (newest first, from `src/data/updates/*.json`); `loadRecap(month): RecapFacts` (throws on an invalid file).

- [ ] **Step 1: Write the failing tests** for `parseGenerateArgs` (each rejection above) and `listRecapMonths` ordering on a tmp folder.
- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Generate** `npm run updates:generate -- --month 2026-10 --section round --round 2026-10-15 --today 2026-11-24` then `-- --month 2026-10 --section data --today 2026-11-24`. Check: `firstGeneratedAt` and `updatedAt` are `2026-11-24`; file size 20–60 KB; `npm run check`.
- [ ] **Step 6: Commit** `feat(updates): updates:generate` and `data: 2026-10 recap facts`.

