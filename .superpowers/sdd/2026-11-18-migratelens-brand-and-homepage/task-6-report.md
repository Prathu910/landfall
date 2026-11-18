# Task 6 report
Implemented TryIt (src/components/home/try-it.tsx + .module.css) and pure helper fullReportHref (try-it-href.ts, test try-it-href.test.ts; RED: module missing, GREEN: 2 tests).
Helper lives in its own file so vitest can import it without Mantine. Check: npm run check and npm run build pass (709 tests).
Browser check (Playwright + system Chrome against out/, temp page deleted) at 1440 and 390: "Loading published data…" shows while fetching (700ms throttled); occupation + points changes update numbers; URL unchanged; link /check/?occupation=254418 preselects "Registered Nurse (Medical) · 254418" in /check/; no console errors; no horizontal overflow. Screenshots: screenshots/task6-try-it-{1440,390}-{default,changed}.png.
Notes: the Claude-in-Chrome extension was not connected, hence Playwright. Observed (not Task 6): site header CTA "Check my points" is truncated at 390px.
Occupation Select needs select-all before typing a search (Mantine default behaviour, same as check flow).

## Fix report
I1: TRY_IT_LOAD_FAILED added (distinct from TRY_IT_NO_DATA; tested). Component: unavailable -> load-failed message; no view -> "Loading published data…" (idle branch dropped); none -> view message.
I2: view-model now has note and source; TRY_IT_ROW_LABELS exported; tests added. RED: 3 failing tests (missing exports/fields). GREEN: 712 tests pass, check clean, build passes.
Note: BANNED_COPY bans "people", so the tests strip the required "not people" disclaimer before the banned-copy check.
CSS: hard-coded colours replaced by tokens (--rule, --muted, --slate, --card, --surface, --serif); .link:focus-visible uses --focus-ring. Not re-run in browser (render unchanged apart from the error message).

## Fix report 2 (B7)
Note now starts with the report's caveat "Counts are EOIs (one person can hold several)." (constant in try-it.ts, copied from scorecard.ts source line). Tests run BANNED_COPY over every view string unmodified; the strip workaround is removed. RED: 2 failing tests after test change; GREEN: 712 pass, check clean, build passes.

## Fix report 3
Correction: the claim in fix report 2 that the strip workaround was removed was wrong; line 62 of try-it.test.ts still had `.replace("not people", "")`. Now actually fixed (grep for "not people" in src is empty). The trailing "." moved into `source` ("SkillSelect, as at Oct 2026."); the component composes no copy. RED: 1 failing test; GREEN: 712 pass, check clean, build passes.
