# Task 3 report: sort the live-data tests

Status: DONE.

## Implemented
- `src/lib/data/live-data-tests.test.ts` (guard). Reads every `*.test.ts(x)` under `src/lib/`. It fails if a file outside `LIVE_INVARIANT_TESTS` imports `loadOccupationCore`/`loadOccupationDetail`/`loadManifest` from `load-server`, an `occupation-index` module, or the `sweep` fixture (R8: the sample loaders and facts readers are not flagged, so `sample-data.test.ts` passes). It also fails on a stale allowlist entry, and checks that `scenario-input` and `review-profiles` no longer reach live data.
- First group moved to `frozenCore`/`frozenDetail`/`frozenIndex()` (from `data/__fixtures__/frozen-2026-10`): the two fixtures `scenario-input.ts` and `review-profiles.ts`, plus the direct readers (home example/try-it; occupation-page charts/faq/states/summary/meta; outlook charts/evaluate-profile/label-189/label-state/losses/queue-view/route/wait; report/state-outlook-view; state-outlook questions/view/outlook.real-data; guide/picker-view; data/coverage). The other tests in the brief's list (evidence, examples, headline, points-page, read-template, view, visa-cards, improve, review-repros) are frozen through the two fixtures. Only imports and loader names changed; no assertion value changed.
- Kept live: `sweep.ts` and `sweep-{60,70,80,90}`, `copy-sweep`, `slug`, and the `report-evidence` "every generated occupation" case. The `report-evidence` `LEGACY_CODES` cases and the `not-imported` check use `frozenCore`. Hard counts replaced: `toBe(493)` becomes `toBe(OCCUPATION_COUNT)` (new export in `sweep.ts`, the live index length) plus `toBeGreaterThan(400)`; `copy-sweep`'s `toBe(479)` becomes `toBeGreaterThan(400)` plus equality with the live index's `hasData` count. `slug.test.ts` already had no hard count.
- `coverage.test.ts` keeps its 493/479 figures, now on `frozenIndex()`.

## Ledger notes
- `scenarios.ts`'s `asOf = "2026-11-17"` and `check-flow.tsx`'s initial state are placeholders replaced by `localToday()` at run time (spec 6.14); left untouched.
- Guard deviation: the brief said the guard flags `scenario-input`/`review-profiles`. Those now read frozen data, so flagging them would fail the sweep tests (which import `AS_OF`). The guard instead asserts the two fixtures contain no live reads.
- Components-side tests (`src/components/...`) are outside `src/lib/`, so the guard doesn't scan them; they don't read live data (only URL/href strings).

## Tests
- RED: `npx vitest run src/lib/data/live-data-tests.test.ts` listed 30 offending files before the swaps.
- GREEN: `npm run check`: prettier, eslint, tsc, vitest: 138 files, 1455 tests passed.

## Files
New: `src/lib/data/live-data-tests.test.ts`. Modified: the 22 listed test/fixture files above plus `outlook/__fixtures__/sweep.ts` (adds `OCCUPATION_COUNT`), `sweep-{60,70,80,90}.test.ts`, `copy-sweep.test.ts`, `report-evidence.test.ts`.
