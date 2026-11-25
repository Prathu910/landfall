# Task 9 report

Status: DONE (rehearsal deferred until the founder merges to main, as instructed).

Implemented: docs/OPERATIONS.md new "Monthly data pipeline" section (workflows table, one-time setup, rehearsal steps, closing PR hold/no-hold, spotlight swap, failure issue titles, page-watcher issues and standing issue, request rules, dry runs). docs/DATA.md (--probe, --report-file, after-an-import now in the workflow). scripts/README.md (flags, roundsCheckedAt, Scheduled jobs). CLAUDE.md (Scheduled jobs line). docs/STRATEGY.md decision log entry 25 Nov 2026 (request rules). docs/HANDOFF.md founder checklist at top.

Verified against code: titles (failure-issue.ts, watch.ts, issue-text.ts), UNREACHABLE_AFTER = 3, hold wording (summary-view.ts), retention-days 7, spotlight cannot change a month on main (monthly.sh), page-watch needs --state.

Tests: npm run check passed (195 files, 1977 tests); npm run build passed.

Concerns: workflows run on ubuntu-latest (Ubuntu 24.04), not a pinned ubuntu-24.04; docs say so. cli.ts header comment says --probe takes no --report-file, but the code accepts it (stale comment, not changed). DATA.md describes probe writing the next month to the report; confirm against next-month.ts if wording matters.

## Fix round 1
Fixed: OPERATIONS quotes the real "Held: ..." message and notes a held month is not added to other open data PRs (isHeld); DATA.md --probe now says it records newestAsAt and next-month.ts picks the month; HANDOFF says ubuntu-latest (currently Ubuntu 24.04); stale cli.ts line-5 comment corrected. `npm run check` run (see commit).
