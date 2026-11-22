# Task 17 report: `write-read` Edge Function

Status: DONE_WITH_CONCERNS (minor; see Concerns)
Commit: 6233ad9 feat(backend): write-read function with model allowlist and read tokens

## What was implemented

- `supabase/functions/_shared/read.ts`: `READ_MODELS` (opus-5-5, sonnet-5-5, haiku-5-5, fable-5-2), `READ_SYSTEM_PROMPT` (exact text), `ReadConfig`, `readConfig(env)`, `ReadTimeoutError`, `Complete`, `createReadHandler({ env, complete, now })`; re-exports `signReadToken`, `verifyReadToken`, `READ_TOKEN_TTL_MS`.
  - Flow: origin allowlist (403, no CORS header) → OPTIONS preflight → POST only (405) → per-IP fixed one-minute window, 10 requests (429; `X-Forwarded-For` first entry) → `readJson` (shared 16 KiB streaming cap, 415/413/400) → envelope keys only `token`/`facts` (400) → `readConfig` (disabled → `200 {read:null, reason:"disabled"}`) → token verify (403) → facts validation (400) → per-token use counter, 3 uses (403) → `complete` → `null` = `refused`, `ReadTimeoutError` = `timeout`, other throw = 503 without detail → `checkRead` on the trimmed text (`check-failed`) → `200 {read}`.
  - Invalid facts don't use up a token read (counted only after validation).
  - Logging: only `write-read disabled: <reason>` when `READ_ENABLED === "true"` but something else is wrong. Nothing about facts, text, key or token. `READ_ENABLED` being off is not logged (it's the normal state, and logging it would add a line to every request).
  - `readConfig`: disabled unless `READ_ENABLED === "true"` exactly, `ANTHROPIC_API_KEY` and `READ_TOKEN_SECRET` are non-blank, `READ_MODEL` (default `claude-opus-5-5`; blank means default) is in the allowlist, and `READ_MAX_OUTPUT_TOKENS` (default 2000) is a whole number from 1 to 16000.
- `_shared/read-token.ts`: the token is `{submissionId}.{expiresAt}.{base64url HMAC-SHA256}` (Web Crypto). Verification checks the shape (lowercase UUID, digits, 43-character signature), rejects expired tokens and any expiry more than the 10-minute TTL ahead, and compares in constant time.
- `_shared/read-facts.ts`: `validFacts` checks the exact `ReportFacts` shape key by key, so unknown keys such as name, email or dob are rejected. It also checks the enums for `situation`, that `lodged` is a boolean, that numbers are finite, that strings are 400 characters or fewer, and that arrays have 24 items or fewer.
- `_shared/anthropic-complete.ts`: the production `Complete`, using `npm:@anthropic-ai/sdk@1.12.0`, `new Anthropic({ apiKey, timeout: 8000, maxRetries: 0 })` and `client.beta.messages.create({ model, max_tokens, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default", output_config: { effort: "low" }, system, messages: [{ role: "user", content: JSON.stringify(facts) }] })`. It returns null on `stop_reason === "refusal"`. It returns `""` when `stop_reason !== "end_turn"` (a reply cut off by max_tokens fails the check and doesn't pass mid-sentence) and otherwise returns the first text block. `Anthropic.APIConnectionTimeoutError` is mapped to `ReadTimeoutError`. The 1.12.0 types already include `fallbacks` and `output_config`, so no cast was needed.
- `write-read/index.ts`: `Deno.serve(createReadHandler(...))`.
- `handler.ts`: now exports `RequestError`, `allowedOrigins`, `response`, `readJson` and `preflight` (preflight was extracted unchanged) so write-read shares the same CORS, origin and body handling. It gains an optional `now` dependency. Calculation receipts add `read_token` only when `READ_TOKEN_SECRET` is set (corrected in fix round 1: only the Turnstile-verified 201 path; see below); signing is wrapped in try/catch so it can never fail a submission (R4). Feedback never gets a token.
- `deno.json`: the check and test tasks include write-read and its test. I also added `"nodeModulesDir": "none"`. This is required because the repository's root `package.json` otherwise puts Deno in "manual" node_modules mode, and the `npm:` import fails with "Could not find a matching package … in the node_modules directory".
- `supabase/config.toml`: added `[functions.write-read]` with `verify_jwt = false` and an entrypoint, matching the other two functions (the browser calls it without a JWT). This wasn't in the brief's file list, but deployment needs it.
- `docs/OPERATIONS-BACKEND.md`: a new "AI "Our read" (write-read)" section covering the two switches, authorization, a table of the five variables with defaults, the `supabase secrets set` commands (also `--env-file`, the kill switch and `secrets list`), the request/response table, the model call, and no storage or content logs with best-effort in-memory limits. I also updated the prerequisites note (one pinned third-party package, why `nodeModulesDir` is set), the local check and bundle commands, the deploy command (`functions deploy write-read --use-api`) and "three Functions" for `verify_jwt`.

## Tests

`supabase/tests/write_read_test.ts` has 20 tests and uses a fake `complete`, so no network call is made. They cover:
- the fixture read passes checkRead
- the allowlist contents
- config defaults and overrides
- 12 disabled variants: unset, "TRUE" or "false" enable flag; missing or blank key; missing secret; misspelt or foreign model; and 0, 12.5, "lots" or 64000 max tokens
- disabled when `READ_ENABLED` is unset (complete not called)
- a misspelt `READ_MODEL` gives disabled, complete is never called, and exactly one log line names READ_MODEL and contains no facts or secret
- a valid token returns `{read}`, with the exact system prompt, facts and default model passed and CORS/no-store headers set
- expired token → 403
- three uses → 200, the fourth → 403 (complete called 3 times)
- 9 bad tokens → 403: missing, empty, malformed, two-part, tampered expiry, tampered id, short signature, foreign secret, expiry past the TTL
- `verifyReadToken` returns the id and fails at exactly the expiry
- a number not in the facts → check-failed
- null → refused
- `ReadTimeoutError` → timeout
- another throw → 503 with no private detail
- 14 invalid facts bodies → 400 with complete not called (including extra `name`/`email`/`dob` keys, a bad enum, wrong types, NaN, an over-long string), plus an extra envelope key → 400
- invalid facts don't consume token uses
- another origin or an empty origin → 403 with no ACAO
- preflight 204 and GET 405
- rate limit: 10 × 200, the 11th → 429, another IP → 200, and 200 again after the window

`supabase/tests/submissions_test.ts` has one new test. With `READ_TOKEN_SECRET` set, the created receipt includes a `read_token` (fix round 1: the existing receipt no longer does) that `verifyReadToken` accepts for the same id, and feedback returns `{ id }` only. The existing first test still asserts `{ id }` exactly when no secret is configured, which covers R4.

### TDD evidence

RED: `npm run backend:test`
```
TS2307 [ERROR]: Cannot find module 'file:///Users/aveomac/aveo-projects/landfall/supabase/functions/_shared/read.ts'.
… Found 9 errors.
error: Type checking failed.
```
GREEN: `npm run backend:check && npm run backend:test`
```
Check write-read/index.ts
Check ../tests/submissions_test.ts
Check ../tests/write_read_test.ts
ok | 32 passed | 0 failed (40ms)
```
`npm run check`: format, lint (0 problems), typecheck, vitest 108 files / 1228 tests passed.
`npx deno bundle … supabase/functions/write-read/index.ts`: bundled 321 modules (1.41 MB), so the SDK import resolves for deploy-style bundling. Nothing was deployed and no secrets were set.

## Files changed

- Created: `supabase/functions/write-read/index.ts`, `supabase/functions/_shared/read.ts` (239 lines), `read-token.ts`, `read-facts.ts`, `anthropic-complete.ts`, `supabase/tests/write_read_test.ts`
- Modified: `supabase/functions/_shared/handler.ts`, `supabase/functions/deno.json`, `supabase/config.toml`, `supabase/tests/submissions_test.ts`, `docs/OPERATIONS-BACKEND.md`

## Self-review

- The interfaces match the brief (`readConfig`, `signReadToken`, `verifyReadToken`, `Complete`, `createReadHandler`, `READ_MODELS`). `ReadTimeoutError`, `READ_SYSTEM_PROMPT` and `READ_TOKEN_TTL_MS` are extra exports, used by the tests and by handler.ts.
- No circular import: read.ts → handler.ts → read-token.ts.
- The tests never touch the network. Only `anthropic-complete.ts` imports the SDK, and the tests don't import it.
- I fixed one lint warning in the test (an unused destructured variable).

## Concerns

1. (Resolved by R28 in fix round 1.) `handler.ts` was 327 lines (it was 291). ENGINEERING's 300-line limit is written for `src/lib` modules, so this file isn't strictly covered. If the controller wants it under 300, the shared HTTP helpers could move to `_shared/http.ts`. I did not split it on my own.
2. The rate limit and the token use counts are in memory per isolate, as the brief says. A cold start or a second instance resets them, and this is documented as best effort. The IP comes from the first `X-Forwarded-For` entry. Whether Supabase's gateway lets a client spoof that first entry isn't verified, so the 3-reads-per-token cap (tokens are minted only after Turnstile) is the real cost guard.
3. (Superseded by R29 in fix round 1.) The Claude API skill says not to send `fallbacks` for `claude-haiku-5-5`, because it has no server-side fallback. With `"default"`, though, a decline simply stays declined (only the array form 400s). The brief's uniform call shape therefore works for every allowlisted model, and I kept it.
4. `deno.json` now sets `"nodeModulesDir": "none"`, which wasn't in the brief, because the import fails without it. The first `backend:check` on a machine needs network access to fetch the SDK into Deno's cache, and there is no lockfile (`"lock": false` is unchanged).
5. A spec/brief nuance: the brief's prompt says "follow the stamp and wait". I wrote it as "lead with the visa and label it gives, then say what the wait is".

No differences between the data and the brief (this task uses no snapshot data).

## Fix round 1

Review findings: one Critical, plus R28, R29 and hardening.

### Changes

- **Critical (retry replay minted tokens).** `persisted()` takes a `verified` flag, and a token is issued only when `kind === "calculation" && verified && status === "created"`. That is only the write path after `verify()` (Turnstile) passes. A 200 `existing` retry receipt returns `{ id }` with no token, so the reader gets the template read. Correction to my earlier report: the first version issued tokens on the 200 retry receipt too. That was a hole, because a retry skips Turnstile. Only the 201 path issues one now.
- **R28.** `RequestError`, `allowedOrigins`, `response`, `readJson`, `preflight` and `BODY_LIMIT` moved unchanged into `supabase/functions/_shared/http.ts`. `handler.ts` and `read.ts` import them from there. `handler.ts` is now 234 lines.
- **R29.** `anthropic-complete.ts` exports a pure `requestParams(system, facts, config)`. It adds `betas: ["server-side-fallback-2026-07-01"]` and `fallbacks: "default"` only for `claude-opus-5-5`, `claude-sonnet-5-5` and `claude-fable-5-2`. Haiku 5.5 gets neither. The params are typed as the SDK's `Anthropic.Beta.Messages.MessageCreateParamsNonStreaming`, with no cast.
- **Hardening.**
  - Rate-limit map: after pruning expired windows, a new address evicts the oldest entries (Map insertion order) so the map never holds more than `PRUNE_AT` (1000, now exported) addresses. The token-use map still prunes only on expiry, because evicting a live entry would reset its 3-use count.
  - The SDK timeout is now 6 s, matching the client wait.
  - A comment explains why `disabled` is answered before the token check: with no secret there is nothing to verify against, and no model call can follow.
- **Docs.** In `OPERATIONS-BACKEND.md`, the Authorization paragraph now says the 201 path only and explains why. The model-call paragraph now says 6 s and per-model fallback, the storage paragraph mentions the 1000-address cap, and the code list includes `http.ts`.

### Tests

- `submissions_test.ts`: the token test now asserts on the 201 path only. The new test "never mints a read token for a retry receipt, which skips Turnstile" checks that an `existing` receipt replayed with any turnstile string gives 200 `{ id }` exactly, with 1 upstream call.
- `write_read_test.ts`:
  - "the rate-limit map is capped, dropping the oldest addresses first": one IP is rate-limited (429), then `PRUNE_AT` new IPs arrive in the same window, then that IP gets 200 again.
  - "requests server-side fallback only for models that support it": checks the exact params for the three fallback models and that Haiku has no `betas` or `fallbacks`.

### Commands and output

RED (new tests against the previous source): `npm run backend:test`
```
TS2305 [ERROR]: Module '".../_shared/anthropic-complete.ts"' has no exported member 'requestParams'.
TS2459 [ERROR]: Module '".../_shared/read.ts"' declares 'PRUNE_AT' locally, but it is not exported.
error: Type checking failed.
```
RED (behaviour; old handler.ts): `cd supabase/functions && npx deno test ../tests/submissions_test.ts`
```
never mints a read token for a retry receipt, which skips Turnstile ... FAILED
error: Error: Expected {"id":"c5fa65d5-…"}, received {"id":"c5fa65d5-…","read_token":"c5fa65d5-….1795297739984.2Osy…"}
FAILED | 12 passed | 1 failed
```
GREEN:
```
npm run backend:check   -> all 5 entrypoints/tests checked, 0 errors
npm run backend:test    -> ok | 35 passed | 0 failed
npm run check           -> format ok, lint 0 problems, tsc ok, vitest 1228 passed (108 files)
deno bundle write-read  -> Bundled 319 modules; submit-calculation -> Bundled 7 modules
```

Commit: b606449 fix(backend): read tokens only after Turnstile, shared http module, fallback per model

Remaining concerns: the in-memory limits are best effort per isolate, and the `X-Forwarded-For` first entry may be spoofable. Because of that, evicting the oldest address also means a client that sprays 1000 addresses can reset its own window. That is accepted under the ruling, and the token cap stays the real cost guard.
