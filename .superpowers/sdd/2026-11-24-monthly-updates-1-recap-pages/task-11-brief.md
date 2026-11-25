### Task 11: Recap view-model, FAQ and metadata

**Files:**

- Create: `src/lib/updates/recap-view.ts`, `src/lib/updates/round-view.ts`, `src/lib/updates/state-view.ts`, `src/lib/updates/faq.ts`, `src/lib/updates/meta.ts`, `src/lib/updates/copy-sweep.test.ts`
- Modify: `src/lib/seo/json-ld.ts` (add `datasetLd`, `collectionPageLd`, `articleLd` gains `datePublished` and `image`), `src/lib/occupation-page/meta.ts` (use `datasetLd`)
- Test: one `*.test.ts` per new module; fixtures: the real `2026-10.json` plus three small facts fixtures in `src/lib/updates/__fixtures__/` (round-only, data-only, two rounds)

**Interfaces:**

- Produces: `buildRecapView(facts: RecapFacts, ctx: { recapMonths: MonthKey[] }): RecapView` with `kind: "round-only" | "data-only" | "full"`, `hero` (`eyebrow`, `h1`, `answer`, `dateline`, `pendingDataNote: string | null`), `passport`, `rounds: RoundView[]` (newest first), `noRound: { text; href: string | null } | null`, `pool`, `notable`, `notListed`, `states: Record<StateVisa, StateSectionView> | null`, `movers`, `compare`, `method`, `faq: FaqEntry[]`. Every count is already a string from `format.ts`.
- Produces: `shadeBand(floor: number): 1 | 2 | 3 | 4` in `state-view.ts` (700+ → 4, 200+ → 3, 20+ → 2, else 1; the mockup's bands, used by the page map and Plan 2's cards).
- Produces: `recapFaq(facts): FaqEntry[]` (3–5 entries, spec 6.4 item 10); `recapTitle(facts)`, `recapDescription(view)` (direct answer cut to ≤ 155 characters at a word boundary, the occupation pages' `pageDescription` approach), `recapJsonLd(facts, view, ogImage): object[]` (`Article` with `datePublished = firstGeneratedAt`, `dateModified = updatedAt`, `image`; `Dataset` only when `data` exists, `temporalCoverage` = the month, creator Department of Home Affairs, licence CC BY 3.0 AU; `FAQPage`; `BreadcrumbList` Home › Updates › {Month YYYY}); `datasetLd(page: { name; description; url; temporalCoverage; dateModified }): object`.
- Copy (spec 6.4): H1 "SkillSelect {Month YYYY}: {total} EOIs invited in the 189 round" or "SkillSelect {Month YYYY}: 190 and 491 invitations by state"; title "SkillSelect {Month YYYY} update: 189 round, 190 and 491 by state | MigrateLens" or "… update: 190 and 491 invitations by state | MigrateLens"; pending note "SkillSelect's {Month} figures for pools and state invitations will be added here when they are published"; passport stamp "SUBCLASS 189 ROUND · {total} INVITED · {D MON YYYY}", or with no round the data stamp "SKILLSELECT · {MON YYYY} · AS AT {D MON YYYY}"; a "most" claim only when one floor is strictly above every other state's interval maximum, otherwise "the highest published minimum of any state"; `method` names only the sources of the sections shown (a round-only page cites the Home Affairs round page alone).

- [ ] **Step 1: Write the failing tests**

```ts
const view = buildRecapView(oct, { recapMonths: ["2026-10"] });
expect(view.kind).toBe("full");
expect(view.hero.h1).toBe("SkillSelect October 2026: 20,000 EOIs invited in the 189 round");
expect(view.hero.answer).toMatch(/^As at 31 October 2026:/);
expect(recapTitle(oct)).toBe("SkillSelect October 2026 update: 189 round, 190 and 491 by state | MigrateLens");
expect(recapDescription(view).length).toBeLessThanOrEqual(155);
expect(recapFaq(oct).map((f) => f.question)).not.toContain("Which state gave the most 190 invitations in October 2026?");
expect(view.states!["491"].tiles.find((t) => t.state === "TAS")!.figure).toBe("under 20 for each occupation");
expect(view.passport.figures).toContainEqual(expect.objectContaining({ value: "about 167,000" }));
// fixtures
expect(buildRecapView(roundOnly, ctx)).toMatchObject({ kind: "round-only", pool: null, states: null, hero: { pendingDataNote: expect.stringContaining("will be added here when they are published") } });
expect(recapJsonLd(roundOnly, ...).map((o) => o["@type"])).toEqual(["Article", "FAQPage", "BreadcrumbList"]);
expect(buildRecapView(dataOnly, { recapMonths: ["2026-12"] }).noRound).toEqual({ text: "No 189 round in December 2026; the last was on 15 Oct 2026", href: null });
expect(buildRecapView(twoRounds, ctx).rounds.map((r) => r.date)).toEqual(["2027-03-25", "2027-03-04"]);
expect(buildRecapView(roundOnly, ctx).method.sources.map((s) => s.label)).toEqual(["Home Affairs SkillSelect invitation rounds"]);
// copy-sweep.test.ts: every string in the view, FAQ and metadata of every facts file in src/data/updates/ and the fixtures passes BANNED_COPY, has no "NaN", "undefined" or a "0–" range
```

- [ ] **Step 2–4:** fail, implement, pass; the occupation-page JSON-LD tests still pass after the `datasetLd` move.
- [ ] **Step 5: Commit** `feat(updates): recap view-model, FAQ and JSON-LD`.

