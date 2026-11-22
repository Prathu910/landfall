### Task 7: Route

**Files:**

- Create: `src/lib/outlook/route.ts`
- Test: `src/lib/outlook/route.test.ts`

**Interfaces:**

- Consumes: Tasks 4–6.
- Produces:

  ```ts
  export type RouteStep = {
    title: string;
    sub: string;
    points: number | null;
    label: OutlookLabel | null;
  };
  export type RouteDeadline = {
    date: string;
    title: string;
    sub: string;
    afterStep: number;
  }; // index of the step it follows
  export type Route = { steps: RouteStep[]; deadlines: RouteDeadline[] };
  export function buildRoute(
    input: OutlookInput,
    o: ProfileOutlook,
    improve: Improve,
  ): Route;
  ```

  Patterns are the six in spec 6.8; step titles and subs as in the mockup (e.g. "Submit EOI" / "189 + NSW 190, now"). Deadlines are `improve.losses` (title "Turns 33: −5", "English test expires", "EOI expires"), placed after the last step dated before them; undated steps count as "now".

- [ ] **Step 1: Write the failing tests**: Aarav → 4 steps (Today 90 VS, Submit EOI, Gather documents, Invitation "60 days to lodge"), deadlines 2027-08-09 and 2028-02-02 both after step index 2; Priya → steps Today 70, Submit EOI, Superior English 80 VS, Update your EOI; deadline after index 2; Rahul → Today, Check state rules ("NT and Tasmania"), Submit EOI, Keep 189 ticked; Kavya → EOI submitted (12 Mar 2026, 70), Today ("254 days waiting"), Superior English (80), Invitation; deadline EOI expiry after index 2; Dev → Today, Keep your EOI in, Check other occupations, Watch SA and WA; Arjun → Today, Submit EOI ("190 + 491, Tasmania"), English retake (80), Update your EOI.
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/route.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): best route steps and deadlines`.

