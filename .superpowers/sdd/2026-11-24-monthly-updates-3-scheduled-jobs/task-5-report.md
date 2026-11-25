# Task 5 report

Implemented `src/lib/updates/frozen.ts` (changedFrozenSections with key-order-independent compare, hasPublishedData, hasPublishedRound), `scripts/automation/base-branch.ts` (chooseBase, listOpenDataUpdates, outputLines; CLI `--fresh`), `failure-issue.ts` (titles, failureIssueAction, failureBody with last 50 lines, reportFailure/resolveFailure; create uses `--assignee Prathu910`), `frozen-check.ts` (BASE_REF default origin/main, `--base`, `--allow month:section`), and `updates:frozen-check` in package.json.
Extra file: `scripts/automation/gh.ts`, a shared runner; with DRY_RUN=1 reads return "[]" and writes are no-ops (R15). Tests inject stubs; real gh is never called.
Tests: 27 new/related passing; `npm run check` passes (183 files, 1866 tests). Dry runs: frozen-check against HEAD passes; base-branch DRY_RUN prints branch/pr lines.
Concern: the failure-issue `report` CLI is untested end to end (needs gh). Issue lookup matches exact open-issue titles without a label.

## Fix round 1

- frozen-check: `verifyBase` (rev-parse --verify) up front; `readBaseFile` uses `git cat-file -e` and returns null only when the file is absent; `listBaseFiles` via `git ls-tree` so a deleted facts file is reported as `<month>:file`; pure `checkFrozen`; main wrapped in try/catch. Tests in `frozen-check.test.ts` (bogus ref, absent = new, deleted = change, allow).
- base-branch: requests `isCrossRepository`; rejects forks and branch names not matching `^data/[a-z0-9-]+$` (fresh names `data/skillselect-…`, `data/round-…` fit).
- failure-issue: `--author app/github-actions` on lookup; CLIs take `--month` or `--round` (the raw `--title` was dropped; titles built only by `monthlyFailureTitle`/`roundFailureTitle`, which validate); body trims before taking the last 50 lines, fences longer than any backtick run, capped at 60,000 chars; bodies and comments go via `--body-file -` stdin (`Gh` now takes `input`). resolve posts the comment then closes.
- Commands: `npx vitest run scripts/automation src/lib/updates` -> 30 files, 244 tests passed. `npm run check` -> 184 files, 1875 tests passed. `frozen-check --base origin/mian` -> "Base ref origin/mian is not a commit", exit 1.
