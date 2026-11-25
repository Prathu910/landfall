### Task 4: PR summary

**Files:**

- Create: `src/lib/updates/summary-view.ts`, `scripts/updates/summary.ts`
- Modify: `package.json` (`"updates:summary": "tsx scripts/updates/summary.ts"`)
- Test: `src/lib/updates/summary-view.test.ts`

**Interfaces:**

- Consumes: `RecapFacts`, `format.ts`, `SetManifest` (Plan 2), `ImportReport` (Task 2), `Manifest`.
- Produces: `buildSummary(input: { kind: "data" | "round"; month: MonthKey; round: string | null; facts: RecapFacts; manifest: Manifest; previousManifest: Manifest | null; report: ImportReport; buildWarnings: string[]; publishedDataMonths: MonthKey[]; sets: SetManifest[]; branch: string; previewBase: string | null; today: string }): string` (Markdown, items 1–10 of spec 6.12 in order; for `kind: "round"` the round items only); `appendSection(existingBody: string, section: string, heading: string): string` (heading "Added {d Mon}: 189 round of {d Mon YYYY}" or "Added {d Mon}: SkillSelect data as at {d Mon YYYY}").
- "Needs your decision" lists: revisions in `report.revisions` (with rows before and after, and "published recap affected" when the revised month is in `publishedDataMonths`); new unmatched round names (`manifest.roundsUnmatched` minus the previous manifest's); page reads above 225; each build `WARNING`; and the coverage-window figure for Software Engineer (`261313`): the 189 all-status sum this month and last as ranges, and their difference.
- Images: a table per set, light and dark side by side, each `![alt](https://github.com/Prathu910/landfall/blob/<branch>/<file>?raw=true)`, then the draft caption in a code block.
- CLI: `--month --kind [--round] --previous-manifest --import-report --build-log --branch [--append-to <body.md>]`; reads `CF_PAGES_PROJECT` from the environment for `previewBase`.

- [ ] **Step 1: Write the failing tests** (2026-10 facts, a fixture report)

```ts
const md = buildSummary({ kind: "data", month: "2026-10", ... });
expect(md.split("\n")[0]).toBe("SkillSelect data as at 31 Oct 2026 (snapshot skillselect-2026-10-31), checked 17 Nov 2026. Validation passed; `npm run check` and `npm run build` passed.");
expect(md).toContain("189 pool: 181,076–182,254 → 166,555–167,904");
expect(md).toContain("Spotlight: Registered Nurses nec (254499)");
expect(md).toContain("To publish: merge this pull request. Cloudflare deploys it in a few minutes. To skip this month, close it.");
expect(buildSummary({ ..., report: { ...r, pageReads: 231 } })).toMatch(/Page reads: 231 of 250/);
expect(buildSummary({ ..., report: withRevision("data/raw/2026-10/status-history.rev-2026-12-14.json", 1200, 1203), publishedDataMonths: ["2026-10"] })).toMatch(/published recap affected/);
expect(buildSummary({ ..., previewBase: null })).not.toMatch(/pages\.dev/);
expect(appendSection(body, roundMd, "Added 12 Dec: 189 round of 10 Dec 2026")).toMatch(/## Added 12 Dec: 189 round of 10 Dec 2026/);
it("passes BANNED_COPY outside quoted occupation names", ...)
```

- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Commit** `feat(updates): plain-English PR summary`.

