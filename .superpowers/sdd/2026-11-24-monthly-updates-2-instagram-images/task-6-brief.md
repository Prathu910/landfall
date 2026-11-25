### Task 6: The 2026-10 sets and the recap OG image

**Files:**

- Create (rendered; committed only per Spec decision 6): `public/social/2026-10/` (`round-2026-10-15/` 9 files plus `set.json`, `month/` 12 files plus `set.json`, `og.png`)
- Modify: `src/lib/updates/meta.ts` (`ogImageFor`), `src/app/updates/[month]/page.tsx`, `docs/HANDOFF.md`, `scripts/README.md` (social commands), `CLAUDE.md` (a `scripts/social/` line)
- Test: `src/lib/updates/meta.test.ts`

**Interfaces:**

- Produces: `ogImageFor(month: MonthKey, publicFiles: ReadonlySet<string>): string` = `/social/<month>/og.png` if present, else the newest `/social/<month>/round-<date>/og.png`, else `/og.png`. The page passes it to `openGraph.images` and `recapJsonLd`.

- [ ] **Step 1: Write the failing test** for the three `ogImageFor` cases.
- [ ] **Step 2–3:** fail, implement, pass.
- [ ] **Step 4: Render** `npm run social:render -- --month 2026-10 --set round --round 2026-10-15` then `-- --month 2026-10 --set month`. Expected: exit 0, 22 PNGs, every PNG ≤ 300 KB, each set ≤ 2.5 MB (`du -k public/social/2026-10/*`). Compare each PNG with its mockup PNG; record the Instagram safe-zone and grid-crop guidance checked on the day in the ledger (spec risk 19), and adjust `social-spec.ts` if it changed.
- [ ] **Step 5: Verify** `npm run check`, `npm run build`, `grep -c "/social/2026-10/og.png" out/updates/2026-10/index.html` ≥ 1 while the rendered files are present, `npm run lighthouse -- --only /updates/2026-10/`.
- [ ] **Step 6: Commit** `feat(updates): recap OG image from the card set`. Commit `public/social/2026-10/` as `data: 2026-10 Instagram card sets` only with the founder's go-ahead; otherwise delete the local renders before committing. The PR description shows the renders (or describes how to produce them) and the two captions.
