# Paid report, plan 1 of 3: report engine split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate _building_ a report from _showing_ one, so a report can be built on the server and every page only renders a view that was built elsewhere. Nothing changes for readers in this plan.

**Architecture:** A pure `buildReportPayload` (in `src/lib/report-issue/`) wraps the existing `buildOutlookView` and `buildStateOutlookView` and produces one serialisable `ReportPayload`. The report UI becomes a renderer of that payload. `/sample/` builds its four payloads at build time. A small `buildFreeResult` gives the stamps without the rest of the builder. esbuild bundles the builder into one Deno module for the Supabase functions (plan 2), with the month's data injected at runtime.

**Tech Stack:** Next.js 16 static export (webpack), React 19, TypeScript, vitest, esbuild (already installed through tsx), Deno 2.9 for the function test.

**Spec:** `docs/superpowers/specs/2026-11-25-paid-report-design.md` (decisions 9, 15; "Report engine on the server"). Plans 2 (`…-2-backend.md`) and 3 (`…-3-checkout.md`) build on this one.

## Global Constraints

- `npm run check` and `npm run build` pass after every task (`docs/ENGINEERING.md`). Use `--maxWorkers=4` if vitest times out under load.
- `src/lib/**` uses relative imports, never `@/` (it runs under tsx, vitest and, bundled, Deno).
- Copy follows `BANNED_COPY` (`src/lib/report/copy.ts`): no percentage chances; "<20" is never a number; pool counts are "EOIs", not people.
- The report's look and print layout must not change in this plan. Final browser checks use the built `out/` (`python3 -m http.server 3017 --bind 127.0.0.1 --directory out`), never the dev server.
- Lighthouse stays at 100 for `/sample/` (`npm run lighthouse`).
- Commit message trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Branch `roadmap/paid-report`. Commit after each task; no push until the founder asks.

## Review Focus

- **A profile whose occupation has no core** (no data, dropped, load failed): `buildReportPayload` must refuse it with a typed error, never produce a half-report. The test lives in Task 2.
- **The data month moving under a bundle:** the server bundle must read the month it is given, not the month it was built with. Task 5's test injects a different manifest month and expects it in `view.dataMonth`.
- **Free stamps disagreeing with the report's stamps** for off-list 189 occupations, combined stamps and closed states. Task 1's parity test covers every scenario fixture.
- **A payload that doesn't survive JSON** (Dates, `undefined`, functions, Map). Task 2 round-trips through `JSON.stringify`/`parse` and expects deep equality.
- **`/sample/` drifting visually** after the renderer split. Task 3 compares the text of `out/sample/index.html` before and after, and screenshots both themes.

---

### Task 1: Free stamps without the full builder

**Files:**

- Create: `src/lib/outlook/stamp-face.ts`, `src/lib/outlook/free-result.ts`, `src/lib/outlook/free-result.test.ts`
- Modify: `src/lib/outlook/visa-cards.ts` (use `stampFace` for the stamp fields)

**Interfaces:**

- Produces:
  - `type FreeStamp = Pick<VisaCard, "visa" | "shape" | "top" | "stampWord" | "points" | "label" | "ink">`
  - `function stampFace(input: OutlookInput, o: ProfileOutlook, visa: Visa): FreeStamp` (in `stamp-face.ts`, which must not import `wait`, `route`, `improve`, `facts`, `view` or `evidence`)
  - `type FreeResult = { kind: "stamps"; points: PointsResult; stamps: FreeStamp[]; dataMonth: string } | { kind: "points-only"; points: PointsResult; reason: "no-occupation" | "unavailable" | "dropped" | "load-failed"; note: string | null }`
  - `function buildFreeResult(input: OutlookViewInput): FreeResult` (`OutlookViewInput` from `view.ts`, imported as a type only)

- [ ] **Step 1: Write the failing tests** in `free-result.test.ts`:
  - `"matches the report's visa cards for every scenario"`: for each profile in `__fixtures__/scenarios`, `buildFreeResult(input).stamps` deep-equals `buildOutlookView(input).visas.map(pick7)`, where `pick7` picks the seven `FreeStamp` keys.
  - `"is points-only without an occupation core"`: `occupation: { status: "unavailable" }` gives `kind: "points-only"`, `reason: "unavailable"`. `"dropped"` keeps its `note`.
  - `"never carries captions"`: no stamp has a `caption`, `title` or `flagText` key.
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/free-result.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement.** Move the stamp-field logic of `card189` and `stateCard` into `stampFace`, and have `visaCards` spread `stampFace(...)` into each card. Then `buildFreeResult` calls `evaluateProfile` and `stampFace` for 189, 190 and 491.
- [ ] **Step 4: Run** `npx vitest run src/lib/outlook`. Expected: PASS, including the unchanged `visa-cards` and `view` tests.
- [ ] **Step 5: Commit** `feat(outlook): free stamps without the full report builder`.

### Task 2: The report payload

**Files:**

- Create: `src/lib/report-issue/payload.ts`, `src/lib/report-issue/build.ts`, `src/lib/report-issue/build.test.ts`, `src/lib/profile-guard.ts`, `src/lib/profile-guard.test.ts`
- Modify: `src/components/check-flow.tsx` (use `parseProfile` instead of its private `isProfile`)

`parseProfile` is the strict check the server relies on. The browser's saved profile uses it too.

- Every key of `emptyProfile` is present with the same type.
- Enums are as the `Profile` type.
- Dates are `""` or `YYYY-MM-DD`.
- `occupation` matches `^([1-9][0-9]{5})?$`; `name` is at most 60 characters; `state` is `""` or a `StateCode`.
- Year counts are integers from 0 to 50.
- Optional Sharpen fields are absent, null or the documented type and range: months 0–600, the `yearsExperienceLast*` ranges as in their comments.
- Unknown keys are dropped.

It returns a new object, never the input.

**Interfaces:**

- Consumes: `buildOutlookView`, `ReportOutlookView` (`view.ts`); `buildStateOutlookView`, `StateRuleData`, `StateOutlookView` (`src/lib/report/state-outlook-view.ts`); `ReportSource`.
- Produces:
  - `type ReportMeta = { reportNo: string; version: number; issuedAt: string /* ISO */; correctableUntil: string /* ISO */; revisionsLeft: number }`
  - `type ReportPayload = { schema: 1; view: ReportOutlookView; stateOutlook: StateOutlookView | null; profile: Profile; asOf: string; source: ReportSource; meta: ReportMeta | null /* null on /sample/ */ }`
  - `class ReportBuildError extends Error { reason: "no-core" | "invalid-profile" }`
  - `function buildReportPayload(input: { profile: Profile; asOf: string; core: OccupationCore | null; detail: OccupationDetail | null; rules: StateRuleData; source: ReportSource; meta: ReportMeta | null }): ReportPayload`

- [ ] **Step 1: Write the failing tests** in `build.test.ts`, using `src/lib/data/__fixtures__/frozen-2026-10` cores:
  - `"builds the same view as buildOutlookView"`: `payload.view` deep-equals the existing builder's `kind: "report"` view for the same input.
  - `"includes the state outlook the evidence section shows"`: `payload.stateOutlook` deep-equals `buildStateOutlookView({ core, profile, asOf, points: view.points, data: rules })`.
  - `"refuses an occupation without a core"`: throws `ReportBuildError` with `reason: "no-core"`.
  - `"survives JSON"`: `JSON.parse(JSON.stringify(payload))` deep-equals `payload`.
  - In `profile-guard.test.ts`:
    - `"accepts every scenario profile"`: every scenario profile parses to an equal object.
    - `"rejects bad dates, enums, codes and ranges"`: one case each.
    - `"drops unknown keys"`.
    - `"accepts an old saved profile without Sharpen fields"`.
- [ ] **Step 2: Run** `npx vitest run src/lib/report-issue`. Expected: FAIL.
- [ ] **Step 3: Implement** `buildReportPayload`. It throws when `core` is null or the view isn't `kind: "report"`.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(report-issue): serialisable report payload`.

### Task 3: The renderer shows a payload; `/sample/` is built ahead

**Files:**

- Modify:
  - `src/components/report.tsx`: export `ReportView`, and keep `Report` as a thin client wrapper for `/check/` until plan 3;
  - `src/components/report/evidence-section.tsx`: take `stateOutlook: StateOutlookView | null` as a prop, and drop the `buildStateOutlookView` import;
  - `src/components/report/sample-tabs.tsx` and `src/app/sample/page.tsx`: build payloads at build time.
- Test: `src/components/report/report-payload.test.ts` (pure parts); browser check on `out/`.

**Interfaces:**

- Consumes: `ReportPayload`, `buildReportPayload` (Task 2).
- Produces:
  - `function ReportView(props: { payload: ReportPayload; occupation: ReportOccupation; mode: "sample" | "issued"; comparisonIndex: OccupationIndexEntry[]; initialComparison?: OccupationEvidence; fixedComparisons?: OccupationEvidence[]; onEdit?: () => void; onAnswer?: (patch: Partial<Profile>) => void; toolbarNote?: string }): JSX.Element`. It must not import `buildOutlookView`, `buildStateOutlookView` or `evaluateProfile`.
  - `SampleExample` gains `payload: ReportPayload`.

- [ ] **Step 1: Record a baseline.** Run `npm run build`, then save the visible text of `out/sample/index.html`. Use a one-off script in the scratchpad that strips tags and whitespace runs.
- [ ] **Step 2: Refactor.**
  - `ReportBody` and `PrintReport` read `payload.view`, `payload.profile`, `payload.asOf` and `payload.source`.
  - `EvidenceSection` reads `stateOutlook` from props.
  - `Report` (still used by `/check/`) builds the payload with `buildReportPayload` in a `useMemo`, then renders `ReportView`. Plan 3 removes this wrapper.
  - `/sample/` calls `buildReportPayload` per example on the server, with `SAMPLE_AS_OF` and `stateRuleData`, and `SampleTabs` renders `ReportView` with `mode: "sample"`.
- [ ] **Step 3: Run** `npm run check && npm run build`. Expected: PASS.
- [ ] **Step 4: Compare** the new `out/sample/index.html` visible text with the baseline. Expected: identical. Then screenshot `/sample/` at 1280 and 390, light and dark, every tab, with headless Chrome (the pattern in `scripts/og-image/`), and compare by eye with `main`'s build.
- [ ] **Step 5: Commit** `refactor(report): render a built payload; /sample/ builds its reports ahead`.

### Task 4: Guard: no locked page ships the builder

**Files:**

- Create:
  - `src/lib/report-issue/sentinels.ts`: `export const BUILDER_SENTINELS: readonly string[]`, holding three literal strings that exist only in builder modules. They are exported from those modules and imported here, not copied: the start of `footerText` in `view.ts` ("This is our best reading of the data"), `NO_PACE_TEXT` in `wait.ts`, and one fixed sentence from `improve.ts`.
  - `scripts/check-bundle-lock.ts`, with `scripts/check-bundle-lock.test.ts`.
- Modify: `package.json` (`"postbuild": "tsx scripts/check-bundle-lock.ts"`).

**Interfaces:**

- Produces:
  - `const LOCKED_PAGES: string[] = ["sample/index.html"]` (plan 3 adds `check/index.html` and `report/index.html`);
  - `function chunksForPage(html: string): string[]` (every `/_next/static/...js` src in the page);
  - `function findSentinels(js: string): string[]`.

- [ ] **Step 1: Write the failing tests.**
  - `"lists the page's script chunks"`: on a small HTML fixture.
  - `"finds a sentinel in minified code"`: on a string containing one.
  - `"passes clean code"`: on code containing none.
- [ ] **Step 2: Run** `npx vitest run scripts/check-bundle-lock.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The script reads each locked page in `out/`, loads its chunks and exits 1 naming the page, chunk and sentinel on any hit.
- [ ] **Step 4: Run** `npm run build`. Expected: postbuild prints `bundle lock: 1 page clean`. Prove it bites: temporarily import `buildOutlookView` into `sample-tabs.tsx`, build, expect a failure naming the sentinel, then revert.
- [ ] **Step 5: Commit** `test(build): fail the build if a locked page ships the report builder`.

### Task 5: The server engine bundle

**Files:**

- Create:
  - `src/lib/report-issue/server-entry.ts`: the bundle's only entry;
  - `src/lib/report-issue/live-json.ts`: the runtime data holders;
  - `scripts/report-engine/bundle.ts`, with `bundle.test.ts`;
  - `supabase/functions/_shared/report-engine.js` (generated, committed) and `report-engine.d.ts` (hand-written types that re-export from `src/lib/report-issue/payload.ts` and `src/lib/migration.ts`).
- Modify:
  - `scripts/copy-public-data.ts`: also write `public/data/manifest.json`, `public/data/occupation-index.json` and `public/data/state-rules.json` (the serialised `stateRuleData`);
  - `package.json` (`"engine:bundle": "tsx scripts/report-engine/bundle.ts"`);
  - `supabase/functions/deno.json` (add the new test to `test` and `check`).
- Test: `supabase/tests/report_engine_test.ts` (Deno).

**Interfaces:**

- Produces (the plan 2 functions import these from `_shared/report-engine.js`):
  - `type EngineData = { manifest: Manifest; index: OccupationIndexEntry[]; rules: StateRuleData; core: OccupationCore; detail: OccupationDetail | null }`
  - `function issuePayload(data: EngineData, profile: Profile, asOf: string, meta: ReportMeta): ReportPayload`, which calls `setLiveData(data.manifest, data.index)` then `buildReportPayload`;
  - `function freeResult(data: EngineData, profile: Profile, asOf: string): FreeResult`
  - `function parseProfile(value: unknown): Profile | null` (re-exported from `src/lib/profile-guard.ts`, Task 2);
  - `function parseEngineData(raw: { manifest: unknown; index: unknown; rules: unknown; core: unknown; detail: unknown }): EngineData | null`, using the guards in `src/lib/data/guards.ts` and `rules-guards.ts`;
  - `function setLiveData(manifest: Manifest, index: OccupationIndexEntry[]): void` (in `live-json.ts`).
- Bundle rule: an esbuild `onResolve` plugin maps `**/data/manifest.json` and `**/data/occupation-index.json` to `live-json.ts`, whose default exports are an object and an array that `setLiveData` fills **in place** (so `phrases.ts` reads the current month). The bundle is ESM, `platform: "neutral"`, not minified, with no `@/` imports. The output starts with a "generated by npm run engine:bundle; do not edit" banner.

- [ ] **Step 1: Write the failing tests.**
  - vitest `bundle.test.ts`, `"the committed bundle is current"`: bundle into a temp dir and compare byte-for-byte with `supabase/functions/_shared/report-engine.js`.
  - Deno `report_engine_test.ts`, `"issues the same payload as the site code"`: load the fixture `src/lib/report-issue/__fixtures__/payload-261313.json`, written by a vitest test in Task 2's file from `buildReportPayload` for a fixed profile and a fixed `meta`. The bundle's `issuePayload` must deep-equal it.
  - Deno `"reads the month it is given"`: inject a manifest with `asAt: "2026-11"` and a core with `asAt: "2026-11"`, and expect `payload.view.dataMonth` to name November 2026.
- [ ] **Step 2: Run** `npx vitest run scripts/report-engine && npm run backend:test`. Expected: FAIL.
- [ ] **Step 3: Implement** the entry, the holders, the bundle script and the `copy-public-data` additions. Then run `npm run engine:bundle`.
- [ ] **Step 4: Run** `npm run check && npm run backend:check && npm run backend:test && npm run build`. Expected: PASS. `out/data/state-rules.json` exists and parses.
- [ ] **Step 5: Docs.**
  - `scripts/README.md`: `engine:bundle`, and re-run it whenever `src/lib/outlook`, `src/lib/report`, `src/lib/state-outlook`, `src/lib/report-issue` or `src/lib/migration.ts` change (the bundle test fails until you do).
  - `CLAUDE.md` architecture: a short "Report engine" paragraph.
- [ ] **Step 6: Commit** `feat(report-issue): Deno bundle of the report builder with live data`.
