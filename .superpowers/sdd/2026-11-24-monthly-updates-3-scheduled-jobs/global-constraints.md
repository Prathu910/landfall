## Global Constraints

- The repository is public: branches, PRs, summaries, images, issues, logs and artifacts are public. They hold only published government data and our drafts; never a secret, token or personal detail.
- No secrets added. Only the built-in `GITHUB_TOKEN`. No Cloudflare or Supabase credentials, no auto-merge, no deploy step.
- Triggers: `schedule` and `workflow_dispatch` only; never `pull_request_target` or forked PRs. (The throwaway spike in Task 1 also uses `push` to its own branch; it is deleted afterwards.)
- `permissions:` minimal per workflow: monthly and round jobs `contents: write`, `pull-requests: write`, `issues: write`; page watcher `contents: read`, `issues: write`; spike `contents: read`.
- Third-party actions pinned by full commit SHA (with the version in a comment). `actions/setup-node` with `node-version: 22` and `cache: npm`. `timeout-minutes: 120` on import jobs.
- Commits as `github-actions[bot]` (`41898273+github-actions[bot]@users.noreply.github.com`).
- `concurrency: { group: data-update, cancel-in-progress: false }` on the monthly and round jobs.
- At most one open PR labelled `data-update`; a job that finds one works on its branch and appends.
- Importer guardrails (`docs/DATA.md`) are unchanged: page-read budget 250 for a monthly import, ≥ 250 ms between calls, never work around a block. The summary warns above 90% (225 reads).
- Any failed step fails the job: no PR is opened or updated with bad data; a failure issue is opened or commented on.
- Each section of a facts file is frozen once merged: a job never changes a section that exists on `main`.
- Founder's login for reviews and assignment: `Prathu910` (write it without `@` in any text the tooling posts).
- `npm run check` and `npm run build` pass after every task.

