### Task 5: Qlik client

**Files:**

- Create: `scripts/import/qlik-client.ts`, `scripts/import/qlik-constants.ts` (the dashboard identifiers and visa names from Global Constraints)
- Test: `scripts/import/qlik-client.test.ts`, using a fake transport
- Modify: `package.json`. Add the exact-pinned dev dependency `tsx@4.23.15`.

**Interfaces:**

```ts
export type Transport = {
  send(message: string): void;
  onMessage(handler: (message: string) => void): void;
  close(): void;
};
export type QlikSessionOptions = {
  throttleMs: number;
  transport?: Transport;
  maxPageReads: number;
};
export class GuardrailError extends Error {}
export class BudgetExceededError extends Error {}
export type QlikSession = {
  applyBookmark(id: string): Promise<void>;
  setToggle(name: `vShow${string}`, on: boolean): Promise<void>; // rejects any name not starting with "vShow"
  select(
    field: string,
    values: { text?: string; number?: number }[],
  ): Promise<void>;
  clear(field: string): Promise<void>;
  readTable(objectId: string): Promise<{ header: string[]; rows: string[][] }>;
  pageReads(): number;
  close(): void;
};
export async function openQlikSession(
  options: QlikSessionOptions,
): Promise<QlikSession>;
export function asAtSerial(month: MonthKey): number; // Excel serial of the month-end date, as used by the current importer
```

Without an injected transport, `openQlikSession` GETs the dashboard page and collects the `Set-Cookie` values. It then opens `new WebSocket(wsUrl, { headers: { cookie, origin } })` (Node ≥24), calls `OpenDoc` and applies the bookmark. `readTable` pages with `qHeight = floor(10000 / qcx)` until `qcy`. It throws `GuardrailError` when the layout has `qError.qErrorCode === 7005`, and `BudgetExceededError` when page reads exceed `maxPageReads`. Every call waits `throttleMs` after the previous one.

- [ ] **Step 1: Failing tests** using a scripted fake transport that answers JSON-RPC by method name:
  - Paging a 3-column, 7,000-row table makes 3 page reads (height 3,333) and returns 7,000 rows.
  - Layout error 7005 rejects with `GuardrailError`.
  - `setToggle("vSelectionsLimit" as never, true)` rejects.
  - Exceeding `maxPageReads: 2` rejects with `BudgetExceededError`.
  - `asAtSerial("2026-10")` equals the serial of 2026-10-31.
- [ ] **Step 2: Run** `npx vitest run scripts/import/qlik-client.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(import): add throttled, guardrail-aware Qlik client`

