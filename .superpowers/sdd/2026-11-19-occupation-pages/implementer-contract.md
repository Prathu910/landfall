# Implementer contract (every task)

Repo: /Users/aveomac/aveo-projects/landfall, branch roadmap/occupation-pages. Read CLAUDE.md, docs/ENGINEERING.md and the binding constraints in .superpowers/sdd/2026-11-19-occupation-pages/global-constraints.md before coding. The spec is docs/superpowers/specs/2026-11-19-occupation-pages-design.md (read the parts your task touches, including "Settled after the builder check").

- Ask before guessing: if something in the brief is unclear, report NEEDS_CONTEXT with the question instead of inventing behaviour.
- Do all the work yourself. Never spawn subagents, never spawn a reviewer. Review comes from the controller after your report.
- TDD where the brief says so: write the failing test, run it (RED), implement, run it (GREEN). While iterating run focused tests; run `npm run check` (format, lint, typecheck, all tests) before committing; run `npm run build` when your task touches routes, pages or components.
- Commit with the message the brief names, ending with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Stage only your task's files: never stage `.superpowers/`, never touch `.claude/settings.local.json`, never edit `docs/original-references/`. Do not push.
- Follow the file structure in the brief; keep files focused (under about 300 lines). If a file grows past the brief's intent, report DONE_WITH_CONCERNS rather than restructuring on your own.
- Self-review your diff before reporting (completeness, names, YAGNI, tests that pin behaviour, pristine test output).
- If resumed with review findings: fix them, re-run the covering tests, append a fix report (what changed, command, output) to your report file, and reply with the same short contract.

## Report
Write the full report to the report file named in your dispatch: what you implemented, tests and results, TDD evidence (RED command + failing output and why expected; GREEN command + passing output), files changed, self-review findings, concerns.
Then reply with ONLY (under 15 lines): Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits (short SHA + subject), a one-line test summary, concerns, the report file path. If BLOCKED or NEEDS_CONTEXT, put the specifics in the reply itself.
