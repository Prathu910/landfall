# Task 9 report: Sharpen my state outlook

Status: DONE (with notes below)

## Implemented
- `src/lib/state-outlook/questions.ts`: pure `questionsNeeded(outlooks: Outlook[]): Question[]`. Reads only the deciding stream's `needs-answer` checks that carry a `field`, de-duplicates by field, lists affected states (code order, "Affects: A, B"), fixed display order, never asks incomeBand. Not re-exported from view.ts (view.ts unchanged).
- Plumbing: `RuleCheck`/`Verdict` gained optional `related?: RelatedWork`, set only on a work-months needs-answer check (requirements.ts, judge.ts, context.ts), so the question can name the relatedness definition. Existing check text unchanged.
- `src/components/report/sharpen-form.tsx` + `.module.css`: `SharpenForm({questions, profile, onChange, readOnly})`. `<details open>` (open so it prints), title/intro/read-only note per ruling. Mantine NumberInput (months 0-600; years 0..window, step 0.5), Select (clearable) for state/job offer/study/regional, DateInput for visaExpiry. `onChange(patch)` gets a validated `Partial<Profile>`: numbers/states/booleans go through `normaliseStateAnswers`; clearing sends `{field: null}`; invalid input is ignored. A "Clear this answer" button appears when answered. Renders nothing when there are no questions. No animation.
- Not wired into report.tsx.

## TDD
RED: `npx vitest run src/lib/state-outlook/questions.test.ts` -> "Cannot find module './questions'". GREEN after implementation: 10 tests pass. Tests cover dedupe across states and both visas, affected-state list, 2/3-digit and same-occupation wording, months wording, per-window experience, needs-answer-only, no incomeBand, short questions, real ICT BA data, BANNED_COPY sweep.
`npm run check`: pass (53 files, 602 tests). `npm run build`: pass. CSS module proof: temporary client wrapper imported in sample/page.tsx, build compiled and rendered "Sharpen my state outlook" into out/sample; wrapper and page edit reverted (git diff shows no page.tsx change).

## Rendered questions, ICT Business Analyst sample (VIC, onshore, 95 points, 190+491)
1. "Which state or territory did you study in?" - Affects: Western Australia

(All other checks for this profile are already answered, fail, pass or unverified. Synthetic tests exercise the other wordings, e.g. "How many months in a row, up to now, have you worked in Western Australia in your nominated occupation or one Western Australia treats as related (same first 3 ANZSCO digits)?")

## Notes / concerns
- Only the deciding stream's checks produce questions (a non-deciding stream cannot be needs-answer if the state's best outcome is not).
- Months-in-state questions name the state of the outcome that asked (always the user's own state, per P2/P19).
- `state` (current state) is asked if a check needs it; no clear button for it as the cohort depends on it (Select is still clearable).
- Form is default-open so it prints; Task 11 should add live saving/opt-in persistence in the caller's onChange.

## Fix report (review I1, I2 and extras)
- I2: `questionsNeeded(outlooks, profile)`. Each field keeps the check per affected state; wording uses the user's state (and that state's `related`) when it is affected, else neutral wording naming no state's definition ("...worked in the state you live in, in your nominated occupation or a related one?"). New tests: WA 3-digit + SA 2-digit worded for SA and for WA; neutral for VIC. RED: 2 failed, GREEN: 12 pass.
- I1: new `NumberAnswer` keeps raw typed text in local state ("1." survives), commits only valid values via `normaliseStateAnswers`; out-of-range or invalid shows Mantine `error` ("Enter 0 to 3 years" / "Enter 0 to 600 months") and clears the stored answer rather than snapping back; external changes (Clear button) resync. Years help now "Between 0 and N. Decimals such as 1.5 are fine." (step 0.5).
- Read-only uses `readOnly` (not `disabled`); selects not clearable when read-only.
- Browser check (headless Chrome via CDP against built out/ with temporary page, now reverted): typing "1.5" gives field "1.5", profile 1.5; "7" in a 0-3 field shows the error and profile null; "700" months shows "Enter 0 to 600 months"; "14" commits 14.
- `npm run check` and `npm run build` pass; no page.tsx diff.
