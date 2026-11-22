### Task 18: Client "Our read", gate copy and privacy

**Files:**

- Create: `src/components/report/use-our-read.ts`
- Modify: `src/components/report/our-read.tsx`, `src/components/submissions/transport.ts` (return `read_token`), `src/components/submissions/use-submission.ts` (expose the token), `src/components/submissions/calculation-email.tsx` (gate sentence when enabled), `src/components/submissions/config.ts` (`readEnabled` from `NEXT_PUBLIC_READ_ENABLED === "true"`), privacy section (wherever the current privacy text lives; search for "Cloudflare Web Analytics"), `src/lib/submissions/contract.ts` (`PRIVACY_VERSION`), `src/components/submissions/transport.test.ts`
- Test: `src/components/submissions/transport.test.ts`

**Interfaces:**

- Consumes: `ReportFacts`, `checkRead`, `readTemplate`; the token from Task 17.
- Produces: `useOurRead(facts: ReportFacts, template: string, token: string | null, enabled: boolean): { text: string; source: "ai" | "template"; pending: boolean }`. Behaviour: when disabled or no token → template immediately; else show "Writing our read…" up to 6 s, accept the reply only if `checkRead` passes, otherwise template; refetch when the facts' JSON changes, at most 3 calls per token. The gate adds "Your summary is written by AI from your results (not your answers)." only when `readEnabled`. Privacy text adds one sentence: computed results (not your answers, name, email or date of birth) are sent to Anthropic to write your summary and are not stored by MigrateLens. Bump `PRIVACY_VERSION` to the release date and note in `docs/HANDOFF.md` that frontend and functions must deploy together.

- [ ] **Step 1: Write the failing tests**: transport parses `read_token` from a success body and tolerates its absence; `useOurRead`'s pure decision helper (export `decideRead(reply, facts, template)` from the hook file) returns the template for a failing reply and the reply for a passing one.
- [ ] **Step 2: Run** `npx vitest run src/components/submissions/transport.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check && npm run build && npm run backend:test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(report): AI-written Our read behind two switches`.

