# Implementer contract (applies to every task)

Project: Landfall, a Next.js 16 static-export app (Australian skilled-migration info tool). Repo: /Users/aveomac/aveo-projects/landfall, branch roadmap/foundation. Do not switch branches, push, or touch docs/original-references/.

Read before coding: docs/ENGINEERING.md (coding standards) and .superpowers/sdd/2026-11-17-data-foundation/global-constraints.md (binding data rules). Read the spec section relevant to your task: docs/superpowers/specs/2026-11-17-data-foundation-design.md. Next.js APIs: read node_modules/next/dist/docs/ first.

Conventions: files in src/lib/data and scripts/import use relative imports (no `@/` alias) because they run under tsx and vitest. Strict TypeScript, no `any`. Prettier-format files you touch (`npx prettier --write <files>`).

Process:
1. If the brief is unclear, ask first (status NEEDS_CONTEXT).
2. TDD is mandatory: write the test FIRST, run it and capture the failing output (RED) before writing any implementation, then implement and run (GREEN). Writing tests and implementation together is a contract violation.
3. Run the focused tests while iterating; run `npm run check` once before committing (it must pass).
4. Commit with the brief's message, ending with the Co-Authored-By attribution line your own harness instructions give you (it names the model you are running on).
5. Self-review your diff: completeness, clear names, YAGNI, real-behavior tests, pristine output. Fix before reporting.

Never dispatch subagents or reviewers; the controller schedules review. If a file grows beyond the brief's intent or you are unsure of the approach, stop and report DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT with specifics.

Report: write the full report to the report path given in your dispatch (implemented items; tests and results; TDD evidence RED/GREEN with commands and output; files changed; self-review findings; concerns). Then reply with ONLY (under 15 lines): Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits (short SHA + subject), one-line test summary, concerns, report path.

If resumed with review findings: fix them, re-run covering tests, append a fix report (changes, commands, output) to your report file, and reply with the same short contract.
