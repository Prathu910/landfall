# Task 18 report

Implemented the client AI "Our read" behind two switches (NEXT_PUBLIC_READ_ENABLED and a read token), per ruling R31 (PRIVACY_VERSION NOT bumped).

- `use-our-read.ts`: `useOurRead(facts|null, template, token, enabled)` and pure `decideRead`. Disabled or no token: template, not pending. Otherwise pending (template text) up to 6 s (abort), accepts reply only if `checkRead` passes; refetches on facts JSON change; max 3 calls per token (then template). Relative imports so it runs under vitest.
- `transport.ts` returns `{ id, readToken }`; `use-submission.ts` exposes in-memory `readToken` (cleared on reset); `check-flow.tsx` passes it to `Report` (null for sample). Token never stored or put in a URL.
- `Report` calls the hook once and passes the result to `OutlookHero` and `PrintReport` (print shows the template while pending, otherwise the shown text). `OurRead` shows "Writing our read…" and an AI/template note.
- `config.ts`: `readEnabled`. Gate sentence and methodology privacy sentence render only when `readEnabled`. Docs: HANDOFF.md and OPERATIONS-BACKEND.md enablement checklist.

TDD: RED `npx vitest run src/components/submissions/transport.test.ts src/components/report/use-our-read.test.ts` (3 failed + suite import fail); GREEN after implementation. Final: `npm run check` (1232 tests pass), `npm run build`, `npm run backend:test` (35 pass).

Concerns: Collection notice date on methodology page left unchanged (bumped at rollout, documented). Hook's effect has an eslint-disable for exhaustive-deps (key covers values). No component test for the hook's timing (only decideRead tested).
