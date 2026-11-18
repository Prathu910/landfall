### Task 1: Brand palette, fonts and Mantine theme

**Files:**

- Create: `src/lib/brand/palette.ts`, `src/lib/brand/contrast.ts`, `src/lib/brand/palette.test.ts`
- Modify: `src/app/globals.css` (the `:root` tokens and every hard-coded old palette colour), `src/app/layout.tsx` (font imports), `src/components/providers.tsx` (theme), the status-colour CSS in `src/components/report/*.module.css` (state tiles, panels, scorecard chips), `package.json` (add `@fontsource/newsreader` and `@fontsource/inter`; remove `@fontsource/dm-sans` and `@fontsource/instrument-serif`)

**Interfaces:**

- Produces:
  - `PALETTE: Record<"ink" | "newsprint" | "card" | "saffron" | "saffronText" | "slate" | "muted" | "mutedSoft" | "rule", string>`
  - `STATUS: Record<"strongest" | "watching" | "needsAnswers" | "unverified" | "notOpen", { fg: string; bg: string }>`
  - `TEXT_PAIRS: { name: string; fg: string; bg: string; large?: boolean }[]`
  - `contrastRatio(fg: string, bg: string): number`
  - CSS custom properties with the same names in kebab case (`--ink`, `--newsprint`, `--card`, `--saffron`, `--saffron-text`, `--slate`, `--muted`, `--muted-soft`, `--rule`, `--status-strongest-fg` and so on). `--serif` is Newsreader and `--sans` is Inter.
  - A Mantine theme with `primaryColor: "ink"`.

- [ ] **Step 1: Write the failing tests** in `src/lib/brand/palette.test.ts`:
  - `contrastRatio("#000000", "#FFFFFF")` is about 21 (within 0.01). `contrastRatio("#D9731A", "#F3EEE3") < 4.5`, which proves saffron can't be text.
  - `every text pair passes AA`: each `TEXT_PAIRS` entry is ≥ 4.5, or ≥ 3 when `large`. The pairs must include:
    - ink, saffronText, slate, muted and mutedSoft on both newsprint and card;
    - card text on ink (newsprint on ink);
    - every `STATUS` fg on its bg.
  - `globals.css mirrors the palette`: read `src/app/globals.css` with `fs` and assert each `PALETTE` and `STATUS` value appears, case-insensitive, as the value of its kebab-case custom property.
  - `no old palette left`: `globals.css` and every `src/**/*.module.css` contain none of `#127b61`, `#102e29`, `#c7f5d9`, `#edf4ee`, `#f7f9f5` or `"DM Sans"` / `Instrument Serif`.
- [ ] **Step 2: Run** `npx vitest run src/lib/brand/palette.test.ts`. **Expected:** FAIL (module missing).
- [ ] **Step 3: Implement `contrastRatio` and `palette.ts`** with the spec values. Choose `mutedSoft`, the "?" tint and the `rule` values so every pair passes, and record the ratios in the task report.
- [ ] **Step 4: Swap tokens and fonts.**
  - In `globals.css`, replace the `:root` tokens and remap old variables (`--forest`, `--lime`, `--pale` and so on) to new ones, deleting the old names once nothing uses them.
  - Swap the fonts in `layout.tsx`: Newsreader 600 and Inter 400/500/600.
  - Build the Mantine `ink` 10-shade palette from ink to newsprint and set `fontFamily` / `headings.fontFamily`.
  - Restyle the status colours in the report modules (state tiles, panels, chips, scorecard tones). Don't change any `Tone` or group id in `src/lib`.
- [ ] **Step 5: Run** `npm run check` and `npm run build`. **Expected:** pass.
- [ ] **Step 6: Commit** `feat(brand): Data Desk palette, Newsreader and Inter, and the new status colours`.

