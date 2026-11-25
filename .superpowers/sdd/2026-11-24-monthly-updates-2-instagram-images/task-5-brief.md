### Task 5: Compression, limits, set manifest and retention

**Files:**

- Create: `scripts/social/compress.ts`, `scripts/updates/retention.ts`
- Modify: `scripts/social/render.ts` (compress each PNG, write `set.json`, enforce limits, prune), `package.json` (`"updates:retention": "tsx scripts/updates/retention.ts"`)
- Test: `scripts/social/compress.test.ts`, `scripts/updates/retention.test.ts`

**Interfaces:**

- Produces: `quantise(png: Buffer): Promise<Buffer>` (sharp `png({ palette: true, colours: 256, effort: 10 })`, then re-read: same width and height or throw); `checkLimits(files: { path: string; bytes: number }[]): string[]` (each over `IMAGE_LIMIT_BYTES`, and the set total over `SET_LIMIT_BYTES`); `SetManifest = { kind: "round" | "month"; month; round: string | null; images: { card: CardId; format; theme; file: string; alt: string }[]; reused: string[]; caption: string }` written as `set.json`; `retentionPlan(socialDirs: string[], files: string[], latestMonth: MonthKey): string[]` (paths to delete: every file of months older than the latest `RETENTION_MONTHS`, except each month's `og.png`).
- The month set's `reused` lists the newest round set's `round-light.png` and `round-dark.png` paths; rendering a month set never writes into a `round-*` folder.

- [ ] **Step 1: Write the failing tests**

```ts
expect(checkLimits([{ path: "a.png", bytes: 300 * 1024 + 1 }])).toEqual(["a.png is 300.0 KB, over the 300 KB limit"]);
expect(checkLimits(thirteenFilesOf(200 * 1024))).toEqual(["set is 2.5 MB, over the 2.5 MB limit"]);
expect(retentionPlan(["2026-07", "2026-08", "2026-09", "2026-10"], files, "2026-10")).toEqual(["public/social/2026-07/month/cover-light.png", /* … every 2026-07 file but og.png */]);
expect(retentionPlan(["2026-10"], files, "2026-10")).toEqual([]);
it("never deletes a month's og.png", ...)
it("leaves round folders untouched when re-rendering the month set", ...)
```

- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Commit** `feat(social): compression, size limits, set manifest and retention`.

