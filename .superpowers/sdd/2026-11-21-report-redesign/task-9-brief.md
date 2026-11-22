### Task 9: Facts, template read and read check

**Files:**

- Create: `src/lib/outlook/read-contract.ts` (no imports at all), `src/lib/outlook/facts.ts`, `src/lib/outlook/read-template.ts`, `src/lib/outlook/headline.ts`
- Modify: `src/lib/report/copy.ts` (add `REPORT_BANNED_COPY`; keep `BANNED_COPY` for old modules)
- Test: `src/lib/outlook/read-contract.test.ts`, `src/lib/outlook/read-template.test.ts`, `src/lib/outlook/headline.test.ts`

**Interfaces:**

- Produces:

  ```ts
  // read-contract.ts (dependency-free; imported by Deno as ../../../src/lib/outlook/read-contract.ts)
  export type ReportFacts = {
    occupation: string;
    dataMonth: string;
    stamp: { visa: string; state: string | null; label: string };
    visas: {
      visa: string;
      label: string;
      state: string | null;
      points: number;
      caption: string;
    }[];
    counts: { name: string; text: string; numbers: number[] }[]; // e.g. { name: "tied", text: "1,841", numbers: [1841] }
    route: string[];
    wait: string;
    changes: {
      title: string;
      fromPoints: number;
      toPoints: number;
      toLabel: string;
      month: string | null;
    }[];
    extraNumbers: number[]; // rounds, months counts, days waiting, years
  };
  export const READ_BANNED: RegExp; // guarantee(d), definitely, will be invited, %, chance(s) of, likely to be invited, some invitations, a few
  export function allowedNumbers(facts: ReportFacts): Set<number>;
  export function checkRead(
    text: string,
    facts: ReportFacts,
  ): { ok: true } | { ok: false; reason: "number" | "banned" | "length" };
  // facts.ts
  export function buildFacts(
    input: OutlookInput,
    o: ProfileOutlook,
    wait: string,
    improve: Improve,
    route: Route,
  ): ReportFacts;
  // read-template.ts
  export function readTemplate(facts: ReportFacts): string;
  // headline.ts
  export type Headline = {
    who: string;
    h1: string;
    fact: string;
    best: string;
    why: string;
  };
  export function buildHeadline(
    input: OutlookInput,
    o: ProfileOutlook,
    improve: Improve,
  ): Headline;
  ```

  `checkRead`: numbers are every `\d[\d,]*(\.\d+)?` token with commas removed; years 2000–2100 and month numbers inside facts' month strings are allowed when present in `allowedNumbers`; length 40–110 words. `READ_BANNED` is case-insensitive. `REPORT_BANNED_COPY` in `copy.ts` re-exports `READ_BANNED`. Headlines and facts follow the mockup copy for the eight scenarios (h1 exact): "You're at the front of the queue." / "You're on the edge for 189." / "Your best chance is Tasmania, not 189." / "Your way in is state nomination, not 189." / "190 in Tasmania is open to you now. 189 isn't, yet." / "There isn't enough published data to judge your occupation." / "None of the three visas is inviting {occupation} right now." / "You're in the queue, right at the cut-off." Templates use the ANZSCO name from the core or index (no hand plurals). Who line: "{Name}'s report." or "Your report." when the name is empty.

- [ ] **Step 1: Write the failing tests**: `checkRead` rejects a number not in the facts (reason `number`), a banned phrase (`banned`), 30 words (`length`); accepts the mockup's Priya read when the facts contain 10, 80, 6, 190, 85, 168. For every scenario fixture: `readTemplate(buildFacts(...))` passes `checkRead` and contains no `REPORT_BANNED_COPY` match; `buildHeadline(...).h1` equals the strings above; the who line for an empty name is "Your report.".
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/read-contract.test.ts src/lib/outlook/read-template.test.ts src/lib/outlook/headline.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): report facts, template read and read check`.

