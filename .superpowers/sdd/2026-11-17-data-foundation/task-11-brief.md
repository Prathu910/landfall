### Task 11: Loaders, static assets and the client hook

**Files:**

- Create:
  - `src/lib/data/load-server.ts`: Node `fs` reads, only imported from Server Components and `generateStaticParams`.
  - `src/lib/data/occupation-url.ts`
  - `src/components/data/use-occupation-core.ts`
  - `scripts/copy-public-data.ts`
- Test: `src/lib/data/occupation-url.test.ts`
- Modify: `package.json`. Add `"predev"` and `"prebuild"`, both `tsx scripts/copy-public-data.ts`, which copies `src/data/occupations/*.json` to `public/data/occupations/`.

**Interfaces:**

```ts
// load-server.ts
export function loadManifest(): Manifest;
export function loadOccupationCore(code: string): OccupationCore | null; // validates with isOccupationCore
export function loadOccupationDetail(code: string): OccupationDetail | null;
// occupation-url.ts
export function occupationDataUrl(
  code: string,
  index: OccupationIndexEntry[],
  kind: "core" | "detail",
): string | null; // null unless code is in index; "/data/occupations/<code>.json" or "<code>.detail.json"
// use-occupation-core.ts ("use client")
export type OccupationLoad =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; core: OccupationCore }
  | { status: "unavailable" };
export function useOccupationCore(
  code: string | null,
  index: OccupationIndexEntry[],
): OccupationLoad;
```

- [ ] **Step 1: Failing tests.**
  - **Review Focus 5:** `occupationDataUrl("../etc", index, "core")` is `null`, and so is `occupationDataUrl("999999", index, "core")`.
  - A known code returns `"/data/occupations/261313.json"`.
- [ ] **Step 2: Run** `npx vitest run src/lib/data/occupation-url.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement** all four files. The hook fetches only through `occupationDataUrl`, validates with `isOccupationCore`, and maps any failure to `"unavailable"`. Read `node_modules/next/dist/docs/` on static exports and the `public` folder first.
- [ ] **Step 4: Run** `npm run check && npm run build`. Expect PASS, and `out/data/occupations/261313.json` to exist.
- [ ] **Step 5: Commit** `feat(data): add server loaders, static data assets and client hook`

