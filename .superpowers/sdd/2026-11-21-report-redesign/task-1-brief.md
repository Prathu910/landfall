### Task 1: Labels

**Files:**
- Create: `src/lib/outlook/labels.ts`
- Test: `src/lib/outlook/labels.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type OutlookLabel = "very-strong" | "strong" | "competitive" | "long-wait"
    | "not-eligible" | "not-open" | "not-invited" | "no-data";
  export const LABEL_RANK: readonly OutlookLabel[]; // best first
  export function labelName(label: OutlookLabel, tooFew?: boolean): string;
  export function stampName(label: OutlookLabel, tooFew?: boolean): string;
  export function bestLabel(labels: OutlookLabel[]): OutlookLabel; // "no-data" for []
  export function isAtLeast(label: OutlookLabel, floor: OutlookLabel): boolean;
  ```

- [ ] **Step 1: Write the failing tests**: `labelName` returns each Global Constraints name (`"not-invited"` → "Not currently invited", `("no-data", true)` → "Too few to count"); `stampName("not-invited")` → "Not invited", `stampName("very-strong")` → "Very strong"; `bestLabel(["not-invited","long-wait","no-data"])` → `"long-wait"`; `bestLabel(["not-eligible","not-open"])` → `"not-eligible"`; `isAtLeast("strong","competitive")` true, `isAtLeast("long-wait","competitive")` false.
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/labels.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `labels.ts` with `LABEL_RANK` in the Global Constraints order.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): outlook labels, names and rank`.

