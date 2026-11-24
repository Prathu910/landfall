# Dark mode: design notes

Status: proposal for founder approval, 23 Nov 2026. Nothing in `src/` has changed. Open `index.html` in this folder (it works straight from disk) and use the round button in the header. On a phone, or in a narrow window, the control is inside the menu. Screenshots are in `screens/` (the full-page ones as downscaled JPEGs to keep the repo small; it loads the fonts from `node_modules`, so run `npm ci` first). Every value is in `tokens.md`.

## The idea: the passport under the inspection lamp

The brief suggested "passport at night". I took it one step further: **the passport under a border officer's UV lamp.** Real passports carry security print that you can barely see in daylight and that glows under ultraviolet light. In dark mode MigrateLens behaves the same way:

- The paper goes to a deep blue-ink night (`#0E1820` desk, `#14212B` cards). It is not black and not flat grey, and it comes from the same family as the brand ink `#12202c`.
- The guilloche security lines stop being pale sage on white. They become a faint luminous engraving in UV sage (`#7FB89A`), with a second violet strand (`#A99AD8`) that you only see in dark. The report artwork already has a lilac strand (`#C7C0E0`), so this extends it rather than inventing one.
- Stamps keep their label inks, lifted for dark. A 6px halo at 22% of the ink colour makes them read as pigment on the page, not as neon.
- Text is warm ivory (`#ECE6D8`, a darker take on newsprint), never pure white. Muted text keeps the cool shell grey (`#A5B3B9`) on homepage and check pages, and the warm grey (`#C6BEAE`) on the report, so each part of the site keeps its character.

**The one memorable element is the security print waking up.** On a switch to dark the colours ease over 200ms, and then the guilloche fades in about 80ms later over 450ms, like UV ink catching the lamp. It is the only motion in the feature, it happens only in response to the reader's choice, and it is switched off under reduced motion. Everything else stays quiet: no gradients, no glow on UI, no new accents.

## How the brand stays the same brand

- **Same hues, same jobs.** Each light token maps to a dark token with the same role. Ink becomes ivory, paper becomes night, and sage becomes a brighter sage. The seven label pairs keep their hue families, and the rank still reads as "more saturated ink means a stronger outlook". Saffron stays a mark colour and is never used for text.
- **Elevation by lightness, not shadow.** Raised surfaces are lighter than the page; recessed bands (`--surface`) are darker; raised cards get a 1px ivory top edge (`--elevate-edge`). On dark, shadows deepen but carry no information. This avoids the "flat grey cards with the same shadow" look.
- **Buttons invert.** The ink pill becomes an ivory pill with night text. It is still the darkest-to-lightest jump on the page, so "Check my points" keeps its weight.
- **Charts invert by themselves.** Cut-off columns already fill with `--ink` and print their numbers in `--card`, so they become ivory columns with night numbers. The "You, 90" line keeps its label ink, and the queue squares keep ahead/tied/you/behind.
- **Type is optically corrected.** Ivory on night spreads slightly (irradiation), so Archivo headlines drop from 750 to 720 on the variable weight axis (`--headline-wght`). Nobody will notice the change; the absence of it would read as "bolder in dark".

## Risks

1. **Hard-coded colours.** About 120 hex literals sit in CSS modules (106 of them in the vendored Stageshow kit) and 10 in `providers.tsx` (the Mantine `ink` ramp). `globals.css` itself has around 30 literals outside `:root` (`.data-caption`, the Mantine input and accordion overrides, `.report-empty`, `.rounds-table`, `.compare-card`, `.trend-chart`, print). Each one stays light in dark mode. A sweep is the bulk of the work.
2. **Ink used as a background.** 41 declarations set `background: var(--ink | --brand-ink | --homepage-ink | --check-ink)`. Most are buttons, selected chips and tabs, which invert correctly. Some are deliberately dark panels (the site footer, possibly `conversion-block`, `doors` primary, `report-footer`, `occupation-evidence-footer`), and these would turn ivory. Each needs `--brand-deep` instead. Audit them one by one.
3. **Guilloche artwork is in `<img>` or `url()` backgrounds.** It cannot be recoloured until it moves to CSS masks (see `tokens.md`). Until then dark pages would show bright sage lines on night, which is the biggest visual risk.
4. **Hero demo (Stageshow).** Its ~100 literals would show a light product window inside a dark page. That is acceptable as a "screenshot" for release 1; making it theme-aware is a separate job.
5. **Mantine internals.** Dropdowns, the date picker, the drawer overlay and Accordion read Mantine's own dark palette once the colour scheme is no longer forced. They need `--mantine-color-body`, `--mantine-color-text` and `--mantine-color-default-border` mapped to our tokens, or they come out Mantine grey.
6. **Print must never go dark.** `color-scheme: light` under `@media print` handles every `light-dark()` token. Any non-colour dark switch (glow, blend, guilloche opacity) also needs an explicit print reset, and the PDF page-count tests should run with Dark saved.
7. **Stamp glow cost.** `drop-shadow` on SVGs with turbulence filters is fine for the 3 to 12 stamps per page, but avoid it on anything that animates (the hero demo).
8. **Labels converge in dark.** Long wait (orange) and not invited (coral) are closer in dark than in light. The stamp always prints its name, and the chips print the label, so colour is never the only signal. Keep it that way.

## Implementation outline

**1. Token strategy: `light-dark()` plus `color-scheme`.** This is what the preview uses.

```css
:root { color-scheme: light dark; --ink: light-dark(#1b1a17, #ECE6D8); /* …one line per token */ }
:root[data-mantine-color-scheme="light"] { color-scheme: light; }
:root[data-mantine-color-scheme="dark"]  { color-scheme: dark; }
@media print { :root, :root[data-mantine-color-scheme] { color-scheme: light; } }
```

- One declaration per colour token, so nothing is duplicated and there is no second block to drift. "System" falls out of `color-scheme: light dark` for free. Supported by Chrome 123+, Safari 17.5+ and Firefox 120+ (baseline since 2024).
- A few non-colour switches (`--guilloche-opacity`, `--stamp-glow`, `--stamp-blend`, `--headline-wght`, `--elevate-edge`, the shadow) cannot use `light-dark()`. They go in one block keyed on `[data-mantine-color-scheme="dark"]`, plus a `@media (prefers-color-scheme: dark) :root:not([data-mantine-color-scheme="light"])` copy for no-JS visitors. Generate both from one list.
- `color-scheme: dark` on an element makes its subtree resolve dark. Use this for islands such as the always-dark footer, or force `color-scheme: light` on the Stageshow demo.
- Add the role tokens from `tokens.md` (`--brand-deep`, `--brand-ink-fill`, `--brand-on-fill`, `--brand-ink-fill-hover`, `--guilloche-a/-b`), then sweep the hard-coded literals into tokens.

**2. Mantine.** In `src/components/providers.tsx`, replace `forceColorScheme="light"` with `defaultColorScheme="auto"` and `colorSchemeManager={localStorageColorSchemeManager({ key: "migratelens-theme" })}`. In `src/app/layout.tsx`, add `<ColorSchemeScript defaultColorScheme="auto" localStorageKey="migratelens-theme" />` to `<head>` and spread `mantineHtmlProps` on `<html>` (it adds `suppressHydrationWarning`). Mantine's attribute then becomes the single source of truth, so we write no second script. Give the `ink` ramp in the theme a dark counterpart via `virtualColor` or CSS variables, and map Mantine's body, text and border variables to our tokens.

**3. No flash on a static export.** `ColorSchemeScript` is an inline, blocking `<script>` in `<head>`. It reads localStorage and sets `data-mantine-color-scheme` before first paint, which works with `output: "export"` because it runs in the browser, not the server. Our CSS keys only on that attribute and on `color-scheme`, so the first paint is already correct. If we ever need our own script instead, the preview's head script shows the shape: try/catch around localStorage, fall back to `matchMedia`, and set the attribute and `theme-color` synchronously. Check `node_modules/next/dist/docs/` (Next 16) for inline head scripts in the root layout before writing it.

**4. Viewport and meta.** In `src/lib/brand/viewport.ts`, change `colorScheme: "only light"` to `"light dark"`. Change `themeColor` to the media array `[{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#14212B" }]`; the Next viewport docs support this. A manual choice that differs from the device also updates `<meta name="theme-color">` from the toggle handler. Change `color-scheme: only light` in `globals.css` to the block above. Update `viewport.test.ts`, which asserts "only light" today.

**5. The control.** Add a 44px icon button to `site-header.tsx` between the navigation and the main button. It opens a three-choice radio group (Light, Dark, System), and System shows what the device uses now. In the Mantine `Drawer`, add the three-part segmented control above "Check my points". Use Mantine's `useMantineColorScheme()` for `setColorScheme("light" | "dark" | "auto")`. The manager stores the choice in localStorage (Mantine already wraps it in try/catch; any own code must too). Leave System as the default. Add "Appearance" copy to the site navigation module if strings live there.

**6. Smooth switch.** On change, add `theme-switching` to `<html>` for about 600ms. That class carries the 200ms colour transitions and the delayed guilloche fade. Do not leave permanent transitions on every element: it costs paint and fights the existing hover transitions. Skip adding the class when `prefers-reduced-motion: reduce` matches. The global reduced-motion rule in `globals.css` also kills transitions.

**7. Print always light.** Use `@media print { :root { color-scheme: light } }` and reset the non-colour switches. `print-color-adjust: exact` on stamps stays. Run the existing sample PDF checks with `localStorage["migratelens-theme"] = "dark"`.

**8. Assets.** Move guilloche to CSS masks coloured by `--guilloche-a/-b`. Make `LogoMark` stroke `currentColor`. Add `.stamp { filter: var(--stamp-glow); mix-blend-mode: var(--stamp-blend) }` to `report/stamp.module.css` and the homepage stamp module. Map tokens only follow the values. Leave the OG image and favicon alone.

**9. Tests.**

- `palette.ts`: give `PALETTE`, `CHECK_PALETTE`, `SHELL_PALETTE`, `STATUS`, `LABEL_PAIRS`, `QUESTION_LINE` and `FOCUS_RING` `{ light, dark }` values, or add `*_DARK` twins. Build `TEXT_PAIRS` for both themes and run the existing contrast test over both: 4.5:1 text, 3:1 UI and focus. Add label ink on its bg, label ink on `--card` and on `--brand-paper`, and button text on fill and hover.
- Mirror sync: extend the existing test so every `light-dark(L, D)` in `globals.css` matches the light and dark values in `palette.ts`, and every colour custom property in `:root` is either `light-dark()` or an explicit allowlisted constant.
- `viewport.test.ts`: `colorScheme` is `"light dark"`, and `themeColor` has both media entries.
- No-flash smoke check against the built `out/`: load with `colorScheme: "dark"` emulated and with localStorage set. Assert `data-mantine-color-scheme` is set and the body background is night before any client JS beyond the head script runs, by disabling JS after the head script or reading the first frame.
- Print: with Dark saved, the print tree's computed background is `#FBF8F2` and each sample tab stays within 5 pages.
- Lint-style test: no new hex literals in CSS modules outside an allowlist (Stageshow kit, print-only files).

**10. Order of work.** (1) Tokens, `light-dark()` and role tokens, with tests. (2) Sweep the hard-coded literals and audit ink-as-background. (3) Guilloche masks and the stamp glow. (4) Mantine wiring, header control and drawer. (5) Viewport, meta and no-flash. (6) Browser pass on `out/` in both themes at 1280 and 390, plus PDFs. Record the founder decision in `docs/STRATEGY.md` once approved.

## Verified in this preview

- The theme follows the system by default. Light, Dark and System choices persist across reload, and System tracks live device changes.
- The colour change eases over about 200ms (body background still mid-transition right after the click). Under reduced motion it is instant, with no `theme-switching` class.
- With Dark saved, print media resolves the report sheet to `#FBF8F2`.
- At 390px wide there is no horizontal scroll in light or dark, and no rendered HTML text is under 12px. Stamp lettering inside SVGs scales with the stamp, as on the live site.
- 110 contrast pairs were computed for dark, with 0 failures (see `tokens.md`).
