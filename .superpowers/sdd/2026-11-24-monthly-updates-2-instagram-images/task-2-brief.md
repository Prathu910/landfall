### Task 2: Captions, alt text and hashtags

**Files:**

- Create: `src/lib/updates/social-copy.ts`
- Test: `src/lib/updates/social-copy.test.ts`

**Interfaces:**

- Consumes: `CardView` (Task 1).
- Produces: `HASHTAGS = { always: ["#australiapr", "#skillselect"], "189": "#189visa", "190": "#190visa", "491": "#491visa" } as const`; `hashtagsFor(cards: CardView[]): string[]` (always, then each visa that any card's `visas` contains, in 189/190/491 order); `caption(kind: "round" | "month", cards: CardView[], facts: RecapFacts): string` (2–4 dated sentences, the recap URL `migratelens.com/updates/YYYY-MM/`, "General information, not migration advice.", then a blank line and the hashtags); `altText(card: CardView): string` (every figure the card shows, in reading order, ≤ 1,000 characters).

- [ ] **Step 1: Write the failing tests**

```ts
expect(hashtagsFor(roundSetCards(oct, "2026-10-15"))).toEqual(["#australiapr", "#skillselect", "#189visa"]);
expect(hashtagsFor(monthSetCards(oct))).toEqual(["#australiapr", "#skillselect", "#189visa", "#190visa", "#491visa"]);
expect(caption("month", monthSetCards(oct), oct).split("\n").at(-1)).toBe("#australiapr #skillselect #189visa #190visa #491visa");
expect(caption("round", roundSetCards(oct, "2026-10-15"), oct)).toContain("migratelens.com/updates/2026-10/");
it("passes BANNED_COPY and never names a next round date", ...) // every caption and alt text of every facts file
it("keeps each alt text within 1,000 characters", ...)
```

- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Commit** `feat(social): captions, alt text and hashtags`.

