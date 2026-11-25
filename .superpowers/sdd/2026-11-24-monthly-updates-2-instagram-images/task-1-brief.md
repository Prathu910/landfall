### Task 1: Card view-models

**Files:**

- Create: `src/lib/updates/social-spec.ts`, `src/lib/updates/cards.ts`, `src/lib/updates/cards-state.ts`, `src/lib/updates/glyphs.ts`
- Test: `src/lib/updates/cards.test.ts`, `src/lib/updates/cards-numbers.test.ts`, `src/lib/updates/glyphs.test.ts`

**Interfaces:**

- Consumes: `RecapFacts`, `format.ts` helpers, `buildRecapView` (Plan 1).
- Produces (social-spec.ts): `FEED = { width: 1080, height: 1350 }`, `STORY = { width: 1080, height: 1920, safeTop: 250, safeBottom: 340 }`, `OG = { width: 1200, height: 630 }`, `FEED_GRID_WIDTH = 1012`, `IMAGE_LIMIT_BYTES = 300 * 1024`, `SET_LIMIT_BYTES = 2.5 * 1024 * 1024`, `RETENTION_MONTHS = 3`, `HANDLE = "@migratelens"`.
- Produces (cards.ts): `CardId = "cover" | "round-cover" | "round" | "state-190" | "state-491" | "spotlight" | "closing"`; `CardView` = a union on `id` with `tag: string` ("Oct 2026"), `position: { index: number; of: number } | null` (null only for `round`), `source: string`, `visas: Visa[]` (the visas the card shows figures for) and the card's body fields; `roundSetCards(facts, roundDate): CardView[]` (round-cover, round, closing); `monthSetCards(facts): CardView[]` (cover, [round of the newest round], state-190, state-491, spotlight, closing); `cardStrings(card): string[]` (every visible string).
- Produces (glyphs.ts): `parseUnicodeRange(css: string): [number, number][]`; `charsOutside(text: string, ranges): string[]`.

- [ ] **Step 1: Write the failing tests**

```ts
const month = monthSetCards(oct);
expect(month.map((c) => c.id)).toEqual([
  "cover",
  "round",
  "state-190",
  "state-491",
  "spotlight",
  "closing",
]);
expect(
  month.map((c) => c.position && `${c.position.index}/${c.position.of}`),
).toEqual(["1/6", null, "3/6", "4/6", "5/6", "6/6"]);
expect(roundSetCards(oct, "2026-10-15").map((c) => c.id)).toEqual([
  "round-cover",
  "round",
  "closing",
]);
const round = month[1] as Extract<CardView, { id: "round" }>;
expect(round.total).toBe("20,000");
expect(round.picks.map((p) => p.name)).toEqual([
  "Welfare Centre Manager",
  "Airconditioning and Refrigeration Mechanic",
  "Clinical Psychologist",
]);
const tas = (month[3] as Extract<CardView, { id: "state-491" }>).map.TAS;
expect(tas).toEqual({ big: "<20", small: "each occupation", shade: 1 });
expect((month[2] as Extract<CardView, { id: "state-190" }>).notRecorded).toBe(
  "State not recorded: at least 243",
);
expect(cardStrings(month[5])).toEqual(
  expect.arrayContaining([
    "Check your points free",
    "migratelens.com",
    "@migratelens",
    "General information, not migration advice.",
  ]),
);
expect(monthSetCards(dataOnlyFixture).map((c) => c.id)).toEqual([
  "cover",
  "state-190",
  "state-491",
  "spotlight",
  "closing",
]);
// cards-numbers.test.ts: for every facts file in src/data/updates/ and Plan 1's fixtures,
// every number token (/\d[\d,–.]*/) in cardStrings of every card appears in the recap view's strings for the same month
// glyphs.test.ts: every card string of every facts file has no charsOutside the Archivo latin wdth and Big Shoulders latin ranges read from node_modules
```

Map shades come from Plan 1's `shadeBand(floor)` (`src/lib/updates/state-view.ts`); `cards-state.ts` imports it rather than defining its own.

- [ ] **Step 2–4:** Run `npx vitest run src/lib/updates/cards src/lib/updates/glyphs`, expect FAIL; implement; expect PASS.
- [ ] **Step 5: Commit** `feat(social): Instagram card view-models`.

