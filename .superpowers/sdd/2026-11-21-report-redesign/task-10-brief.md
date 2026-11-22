### Task 10: Outlook view-model

**Files:**

- Create: `src/lib/outlook/view.ts`
- Test: `src/lib/outlook/view.test.ts`

**Interfaces:**

- Consumes: Tasks 1–9.
- Produces:

  ```ts
  export type OccupationState =
    | { status: "loading" }
    | { status: "ready"; core: OccupationCore; detail: OccupationDetail | null }
    | { status: "unavailable" }; // report.tsx converts ReportOccupation to this
  export type VisaCard = {
    visa: Visa;
    shape: "rect" | "hex" | "oval";
    top: string;
    stampWord: string;
    points: number;
    label: OutlookLabel;
    title: string;
    caption: string;
    flagText: string | null;
  };
  export type OutlookView =
    | { kind: "loading" }
    | { kind: "points-only"; points: PointsResult; line: string }
    | {
        kind: "report";
        headline: Headline;
        stamp: Stamp;
        stampRing: string;
        stampBottom: string;
        wait: string;
        visas: VisaCard[];
        cutoffs: CutoffColumns | null;
        cutoffsEmpty: string | null;
        queue: QueueView | null;
        queueEmpty: string | null;
        route: Route;
        improve: Improve;
        facts: ReportFacts;
        templateRead: string;
        points: PointsResult;
        methodLines: string[];
        footer: string;
        dataMonth: string;
      };
  export function buildOutlookView(
    input: Omit<OutlookInput, "core" | "detail"> & {
      occupation: OccupationState;
    },
  ): OutlookView;
  ```

  Stamp ring: "SUBCLASS 189", "SUBCLASS 190 TAS", or "189 • 190 • 491" for combined; bottom "{MON YYYY} • {points} POINTS". Method lines are the eight bullets of the mockup's "How we label your outlook". Footer is the Global Constraints sentence with the data month.

- [ ] **Step 1: Write the failing tests**: a table over the eight scenario fixtures asserting stamp (kind, visa, state, label), the three visa card labels, `wait` (from Task 5) and the best move id (from Task 6); `loading` → `{ kind: "loading" }`; `unavailable` → `report` with combined `no-data` (Review Focus 1); empty occupation → `points-only` with line "Choose an occupation to see how your points compare." (Review Focus 2); every string in the view (headline, captions, route, improve, method, footer) has no `REPORT_BANNED_COPY` match except the footer's "guarantee".
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/view.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the whole outlook folder: `npx vitest run src/lib/outlook`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): one view-model for the redesigned report`.

