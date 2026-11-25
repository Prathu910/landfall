### Task 8: Page watcher

**Files:**

- Create: `scripts/page-watch/sources.ts`, `scripts/page-watch/normalise.ts`, `scripts/page-watch/watch.ts`, `scripts/page-watch/cli.ts`, `.github/workflows/page-watch.yml`
- Modify: `package.json` (`"page-watch": "tsx scripts/page-watch/cli.ts"`)
- Test: `scripts/page-watch/{sources,normalise,watch}.test.ts` (fixtures: two saved pages under `scripts/page-watch/__fixtures__/`, added to `.prettierignore`)

**Interfaces:**

- Produces: `WatchedSource = { url: string; citedBy: { file: string; item: string; checkedAt: string | null }[] }`; `collectSources(): WatchedSource[]` from `src/data/states.ts`, `src/data/state-rules/2026-27/` (every `source`), the list URLs exported by `scripts/state-lists/*.ts`, and `src/data/guide/` (`SOURCES` and every `source` in fees, steps, visas, points changes), found by `findCitations(value: unknown, file: string): …` (walks objects for string `source`/`url` values starting `https://`, keeping a sibling `checkedAt`); unique by URL, sorted.
- Produces: `normalisePage(html: string, url: string): { title: string; text: string; hash: string }` (drop `script`, `style`, `nav`, `header`, `footer` and elements whose id or class contains `cookie`; prefer `<main>` or `[role=main]`; `decodeEntities` from `scripts/import/rounds.ts`; collapse whitespace to one line per block; drop lines matching `VOLATILE_LINES[host]` (start with `/page last updated/i`, `/last updated:/i`, `/^\d+ (views|visits)$/i`); `hash` = SHA-256 of `text`).
- Produces: `WatchState = Record<string, { hash: string; text: string; firstSeen: string; failures: number }>`; `planWatch(input: { sources: WatchedSource[]; results: Record<string, { ok: true; page: ReturnType<typeof normalisePage> } | { ok: false; reason: string }>; state: WatchState | null; openIssues: { number: number; title: string; body: string }[]; today: string }): { state: WatchState; actions: ({ kind: "create"; title: string; body: string; label: "source-watch" } | { kind: "comment"; number: number; body: string })[]; summary: string }`. Issue titles `Source changed: {title or host}` and `Source unreachable: {host}`; bodies carry `<!-- watch-url: {url} -->` so a later change comments on the open issue for that URL; a change body lists the citing items with their `checkedAt`, the date first seen and up to 40 changed lines as a before/after excerpt (`diffLines(before, after, 40)`).
- Fetching (cli.ts): sequential, ≥ 1 s apart, 30 s timeout, the importer's `User-Agent`, one retry; HTTP ≥ 400, a timeout or a login page (a password field in the normalised page) is a failure. Never works around a block.
- `page-watch.yml`: `schedule: - cron: "0 22 * * *"`, `workflow_dispatch`; `permissions: contents: read, issues: write`; restore `actions/cache` with `restore-keys: page-watch-`, run, save key `page-watch-${{ github.run_id }}`; actions via `gh issue create --label source-watch --assignee Prathu910` / `gh issue comment`; summary to `$GITHUB_STEP_SUMMARY`.

- [ ] **Step 1: Write the failing tests**

```ts
const sources = collectSources();
expect(sources.length).toBeGreaterThanOrEqual(40);
expect(sources.map((s) => s.url)).toContain("https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list");
expect(new Set(sources.map((s) => s.url)).size).toBe(sources.length);
expect(normalisePage(withNavAndCookie, url).text).not.toMatch(/cookie|Skip to content/i);
expect(normalisePage(page("Page last updated: 3 Dec 2026"), url).hash).toBe(normalisePage(page("Page last updated: 4 Dec 2026"), url).hash);
expect(planWatch({ ..., state: null }).actions).toEqual([]);                       // baseline only
expect(planWatch({ ..., state: changedState }).actions[0]).toMatchObject({ kind: "create", title: "Source changed: Skilled occupation list" });
expect(planWatch({ ..., openIssues: [issueFor(url)] }).actions[0]).toMatchObject({ kind: "comment" });
expect(failingDays(2).then(recovers).state[url].failures).toBe(0);
expect(planWatch({ ..., state: failedTwice, results: { [url]: { ok: false, reason: "HTTP 403" } } }).actions[0].title).toBe("Source unreachable: immi.homeaffairs.gov.au");
```

- [ ] **Step 2–4:** fail, implement, pass. Run `npm run page-watch -- --dry-run` locally: it fetches every source, prints the summary and the actions it would take, and writes the state to a temp file.
- [ ] **Step 5: Commit** `feat(automation): daily page watcher for cited state and fee pages`.

