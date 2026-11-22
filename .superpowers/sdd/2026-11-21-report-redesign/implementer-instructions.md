# Implementer instructions (read fully before starting)

- Repo /Users/aveomac/aveo-projects/landfall, branch `roadmap/report-redesign` (checked out; never switch branches, never push).
- Your brief is your requirements, with exact values to use verbatim. Also read global-constraints.md in this folder. Read only the spec sections your dispatch names; never read the whole plan.
- Follow docs/ENGINEERING.md: `src/lib` is pure (no React/DOM/fetch); relative imports in src/lib/outlook and src/lib/data; one statement per line; intent-revealing names; comments explain why; no `any`; ≤300 lines per src/lib module, ≤250 per component (if a file grows past that, report DONE_WITH_CONCERNS rather than splitting on your own).
- Masked "<20" counts are intervals {min:0,max:19}; a missing month key is "not fetched", never zero (docs/DATA.md).
- If a hand-derived number in the brief disagrees with the real snapshot, assert the data-derived value and note the difference in your report (ruling R2).
- If anything is unclear, ask before starting (status NEEDS_CONTEXT with specifics).
- Work test-first: failing test → run (RED) → implement → run (GREEN). While iterating run focused tests; run `npm run check` once before committing (run `npm run format` only on files you changed if formatting fails). UI tasks also run `npm run build`.
- Commit with a Conventional Commit message ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Self-review your diff (completeness, quality, YAGNI, tests verify behaviour, pristine output).
- Never spawn subagents or reviewers; review is the controller's job.
- Write the full report to the report path in your dispatch: what you implemented, tests and results, TDD evidence (RED and GREEN commands with output), files changed, self-review findings, concerns, data-vs-brief differences.
- Reply with ONLY (under 15 lines): Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits (short SHA + subject), one-line test summary, concerns, report path. If BLOCKED/NEEDS_CONTEXT, put specifics in the reply.
- If resumed with review findings: fix them, re-run the covering tests, append a fix report (changes, tests, command, output) to the same report file, reply with the same short contract.
