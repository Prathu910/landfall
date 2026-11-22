### Task 17: `write-read` Edge Function

**Files:**

- Create: `supabase/functions/write-read/index.ts`, `supabase/functions/_shared/read.ts`, `supabase/tests/write_read_test.ts`
- Modify: `supabase/functions/_shared/handler.ts` (calculation success returns `read_token`), `supabase/functions/deno.json` (check and test tasks include the new files), `supabase/tests/submissions_test.ts` (token present on success), `docs/OPERATIONS-BACKEND.md`

**Interfaces:**

- Consumes: `checkRead`, `ReportFacts` from `../../../src/lib/outlook/read-contract.ts`.
- Produces:

  ```ts
  // _shared/read.ts
  export const READ_MODELS: readonly string[]; // ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5", "claude-fable-5-2"]
  export type ReadConfig =
    | {
        enabled: true;
        apiKey: string;
        model: string;
        maxTokens: number;
        tokenSecret: string;
      }
    | { enabled: false; reason: string };
  export function readConfig(
    env: (name: string) => string | undefined,
  ): ReadConfig;
  export function signReadToken(
    submissionId: string,
    expiresAt: number,
    secret: string,
  ): Promise<string>;
  export function verifyReadToken(
    token: string,
    now: number,
    secret: string,
  ): Promise<{ ok: true; submissionId: string } | { ok: false }>;
  export type Complete = (
    system: string,
    facts: ReportFacts,
    config: Extract<ReadConfig, { enabled: true }>,
  ) => Promise<string | null>;
  export function createReadHandler(deps: {
    env: (n: string) => string | undefined;
    complete: Complete;
    now: () => number;
  }): (req: Request) => Promise<Response>;
  ```

  Responses: `200 { read: string }`, `200 { read: null, reason: "disabled" | "check-failed" | "timeout" | "refused" }`, `403` bad origin or token, `400` invalid facts, `429` rate limit (per-IP, in-memory window). Token: HMAC-SHA256 over `{submissionId}.{expiresAt}`, 10-minute expiry, up to 3 uses per token (in-memory counter). `readConfig`: disabled unless `READ_ENABLED === "true"`, `ANTHROPIC_API_KEY` set, `READ_TOKEN_SECRET` set and `READ_MODEL` (default `claude-opus-5-5`) in `READ_MODELS`; `READ_MAX_OUTPUT_TOKENS` default `2000` (thinking cannot be disabled on Opus 5.5; it counts toward the cap). The production `complete` uses `npm:@anthropic-ai/sdk@1.12.0`: `client.beta.messages.create({ model, max_tokens, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default", output_config: { effort: "low" }, system, messages: [{ role: "user", content: JSON.stringify(facts) }] })` with an 8-second timeout; returns the text block, or null on `stop_reason: "refusal"`. Nothing about facts or text is logged; configuration errors log only the reason. The system prompt (exact text in `read.ts`) states: write 60–90 words in plain, second-person sentences; use only numbers present in the facts; no greeting or name; never promise an outcome; follow the stamp and wait; mention the 189 position when a state route is stamped.

- [ ] **Step 1: Write the failing tests** (`write_read_test.ts`, with a fake `complete`): disabled when `READ_ENABLED` unset; disabled when `READ_MODEL="claude-opus-55"` (misspelt) and `complete` never called; valid token → `{ read }`; expired token → 403; fourth use → 403; text with a number not in the facts → `{ read: null, reason: "check-failed" }`; `complete` returning null → `reason: "refused"`; invalid facts body → 400; other origin → 403. In `submissions_test.ts`: calculation success includes a `read_token` that `verifyReadToken` accepts.
- [ ] **Step 2: Run** `npm run backend:test`. Expected: FAIL.
- [ ] **Step 3: Implement**, then document the five variables, defaults and how to set them (`supabase secrets set ...`) in `docs/OPERATIONS-BACKEND.md`.
- [ ] **Step 4: Run** `npm run backend:check && npm run backend:test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(backend): write-read function with model allowlist and read tokens`.

