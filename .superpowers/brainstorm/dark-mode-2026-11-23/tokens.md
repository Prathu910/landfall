# MigrateLens dark tokens

Status: proposal for founder approval, 23 Nov 2026. Preview: `index.html` in this folder. Source of truth for these numbers: a script that also generated the preview CSS, so the table and the page cannot drift.

Every colour token in the `:root` blocks of `src/app/globals.css` is listed (all 116 colour tokens; the size, font, radius and layout tokens do not change). `src/lib/brand/palette.ts` mirrors a subset: `PALETTE` = the Data Desk rows, `CHECK_PALETTE` = `--check-*`, `SHELL_PALETTE` = `--brand-*`, `STATUS`, `LABEL_PAIRS`, `QUESTION_LINE`, `FOCUS_RING`; each gets a `dark` twin with the values below.

## Palette in one line

Night desk `#0E1820`, night card `#14212B`, report page `#11191F` / sheet `#172028`, recessed `#0C141A`, deep footer `#08121A`, ivory text `#ECE6D8`, muted `#A5B3B9` (shell) / `#C6BEAE` (report), UV sage `#93C8AA`, saffron mark `#E58A3A`, guilloche `#7FB89A` + violet `#A99AD8` at 30%.

## Existing tokens

### Data Desk (report) family

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--ink` | `#1b1a17` | `#ECE6D8` | Report text; also the cut-off column fill and queue "ahead" squares, so charts invert by themselves. |
| `--newsprint` | `#f3eee3` | `#11191F` | Report page. Warmer night than the shell. |
| `--card` | `#fbf8f2` | `#172028` | Raised report sheet, Our read box. Lighter than page: elevation by lightness. |
| `--surface` | `#ece7dc` | `#0C141A` | Recessed band (occupation page body). Darker than page in dark, as it is in light. |
| `--saffron` | `#d9731a` | `#E58A3A` | Marks and lines only. Never text, in either theme. |
| `--saffron-text` | `#a04e0c` | `#F0A35E` | Same value as --saffron-on-dark. |
| `--slate` | `#2e4a7d` | `#A3BDEB` |  |
| `--muted` | `#4a463e` | `#C6BEAE` |  |
| `--muted-soft` | `#6b6558` | `#A69E8F` |  |
| `--rule` | `#ddd4c2` | `#2E3A43` | Hairlines. |
| `--status-strongest-fg` | `#1f5136` | `#A3DAB9` |  |
| `--status-strongest-bg` | `#ddebdf` | `#16342A` |  |
| `--status-watching-fg` | `#2e4a7d` | `#ADC4EE` |  |
| `--status-watching-bg` | `#e4e9f2` | `#1A2840` |  |
| `--status-needs-answers-fg` | `#4a463e` | `#C6BEAE` |  |
| `--status-needs-answers-bg` | `#fbf8f2` | `#172028` |  |
| `--status-unverified-fg` | `#2e4a7d` | `#ADC4EE` |  |
| `--status-unverified-bg` | `#fbf8f2` | `#172028` |  |
| `--status-not-open-fg` | `#8a2e22` | `#F4A79B` |  |
| `--status-not-open-bg` | `#f5deda` | `#3A1C19` |  |
| `--question-fg` | `#1b1a17` | `#ECE6D8` |  |
| `--question-bg` | `#f6ddb5` | `#3B2D17` |  |
| `--label-very-strong-ink` | `#0f6b3c` | `#6FD49C` |  |
| `--label-very-strong-bg` | `#d6efe0` | `#0F2D20` |  |
| `--label-strong-ink` | `#1e7a4c` | `#A6D9BB` |  |
| `--label-strong-bg` | `#e5f3ea` | `#152B22` |  |
| `--label-competitive-ink` | `#996000` | `#EBB959` |  |
| `--label-competitive-bg` | `#fbefd6` | `#2F2412` |  |
| `--label-long-wait-ink` | `#be3f0b` | `#F5965F` |  |
| `--label-long-wait-bg` | `#fde8db` | `#361D11` |  |
| `--label-not-invited-ink` | `#b42318` | `#F68D80` |  |
| `--label-not-invited-bg` | `#fce5e3` | `#381916` |  |
| `--label-not-eligible-ink` | `#5b3f9e` | `#BEABF3` |  |
| `--label-not-eligible-bg` | `#ece6f8` | `#251E3E` |  |
| `--label-not-open-ink` | `#b42318` | `#F68D80` | Shares not-invited, as in light. |
| `--label-not-open-bg` | `#fce5e3` | `#381916` | Shares not-invited, as in light. |
| `--label-no-data-ink` | `#586470` | `#B0BCC7` |  |
| `--label-no-data-bg` | `#e8ecef` | `#1F2931` |  |
| `--focus-ring` | `#2e4a7d` | `#A3BDEB` | Same as --slate; 3:1+ on every surface. |
| `--focus-ring-on-dark` | `#f3eee3` | `#F3EEE3` | Unchanged: already for dark panels. |
| `--muted-on-dark` | `#d6cfbf` | `#CBC4B4` | Text on the always-dark footer. |
| `--saffron-on-dark` | `#f0a35e` | `#F0A35E` |  |

### Shell (`--brand-*`)

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--brand-ink` | `#12202c` | `#ECE6D8` | Ivory text. Do not use as a background any more: see --brand-deep / --brand-ink-fill. |
| `--brand-paper` | `#ffffff` | `#14212B` | Header, cards, drawer. |
| `--brand-sage` | `#eef2f0` | `#0E1820` | Page desk. |
| `--brand-muted` | `#52616a` | `#A5B3B9` |  |
| `--brand-line` | `#d5ded8` | `#2A3A44` |  |
| `--brand-green` | `#3b6551` | `#93C8AA` | Accent text, active radio, progress. |
| `--brand-on-dark` | `#c4d0d0` | `#B9C7C7` |  |
| `--brand-dark-line` | `#41525b` | `#22323C` |  |
| `--brand-focus` | `#315c87` | `#98BCE6` |  |

### Homepage (`--homepage-*`)

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--homepage-paper` | `#fff` | `#14212B` | Card and also text-on-ink-button; both become night, which is correct because the button inverts to ivory. |
| `--homepage-color-1f3446` | `#1f3446` | `#D3CCBC` | Ink-button hover fill -> ivory hover. |
| `--homepage-color-2a3946` | `#2a3946` | `#DCD6C8` |  |
| `--homepage-color-c7d1cb` | `#c7d1cb` | `#2C3D47` |  |
| `--homepage-color-12202c55` | `#12202c55` | `#00000088` | Alpha shadows: dark uses black alpha, not ink alpha. |
| `--homepage-color-b9c4be` | `#b9c4be` | `#3A4D57` |  |
| `--homepage-color-12202c66` | `#12202c66` | `#00000099` | Alpha shadow. |
| `--homepage-color-dce3df` | `#dce3df` | `#1B2A33` |  |
| `--homepage-color-34424e` | `#34424e` | `#CFD7D9` |  |
| `--homepage-color-cbd3da` | `#cbd3da` | `#3A4A54` |  |
| `--homepage-muted` | `#52606b` | `#A5B3B9` |  |
| `--homepage-color-61776b` | `#61776b` | `#9DB7A8` |  |
| `--homepage-color-12202c44` | `#12202c44` | `#00000077` | Alpha shadow. |
| `--homepage-color-d0d9d3` | `#d0d9d3` | `#2B3B45` |  |
| `--homepage-rule` | `#d8dfdb` | `#26363F` |  |
| `--homepage-color-ffffff88` | `#ffffff88` | `#14212B88` | Glass overlay -> night glass. |
| `--homepage-ink` | `#12202c` | `#ECE6D8` | Ivory text and ivory button/selected chip fill. |
| `--homepage-color-c8d2cb` | `#c8d2cb` | `#2E3F49` |  |
| `--homepage-color-e8eeea` | `#e8eeea` | `#192731` |  |
| `--homepage-color-f8fbf8` | `#f8fbf8` | `#16242E` |  |
| `--homepage-color-fff9` | `#fff9` | `#14212B99` | Glass overlay. |
| `--homepage-color-ccd6ce` | `#ccd6ce` | `#2E3F48` |  |
| `--homepage-color-12202c22` | `#12202c22` | `#00000055` | Alpha shadow. |
| `--homepage-color-adbbb2` | `#adbbb2` | `#3E5560` | State borders. |
| `--homepage-color-dbe6de` | `#dbe6de` | `#1F3139` | State hover fill. |
| `--homepage-color-5b7365` | `#5b7365` | `#7FA593` |  |
| `--homepage-color-c8dacf` | `#c8dacf` | `#1D3A2F` | Selected state fill. |
| `--homepage-color-466553` | `#466553` | `#93C8AA` | Selected state stroke. |
| `--homepage-focus` | `#2446d6` | `#93AAFF` | Homepage focus outline (cobalt) -> pale cobalt. |
| `--homepage-color-5b6c63` | `#5b6c63` | `#9FB4A9` | Map state labels. |
| `--homepage-desk` | `#eef2f0` | `#0E1820` |  |
| `--homepage-color-7a8d80` | `#7a8d80` | `#93A89B` |  |
| `--homepage-color-52665b` | `#52665b` | `#A8C0B2` |  |
| `--homepage-color-fff8` | `#fff8` | `#14212B88` | Glass overlay. |
| `--homepage-color-cbd5cd` | `#cbd5cd` | `#2E3E47` |  |
| `--homepage-color-728778` | `#728778` | `#97AD9F` |  |
| `--homepage-color-bdcbbf` | `#bdcbbf` | `#35494F` |  |
| `--homepage-color-f8faf8` | `#f8faf8` | `#16242E` |  |
| `--homepage-color-8fa99a` | `#8fa99a` | `#5E7D6D` | Mini bar fill. |
| `--homepage-color-9ab2a1` | `#9ab2a1` | `#55705F` |  |
| `--homepage-color-e1e9e3` | `#e1e9e3` | `#1C2B33` |  |
| `--homepage-color-a3b8aa` | `#a3b8aa` | `#47604F` |  |
| `--homepage-cobalt` | `var(--homepage-focus)` | `var(--homepage-focus)` |  |
| `--homepage-co` | `#996000` | `#EBB959` | = competitive ink. |
| `--homepage-competitive` | `#996000` | `#EBB959` | = competitive ink. |
| `--homepage-strong` | `#0f6b3c` | `#6FD49C` | = very-strong ink. |
| `--homepage-color-815c32` | `#815c32` | `#E2B57A` | Illustration ink (brown) -> warm sand. |
| `--homepage-color-a23b39` | `#a23b39` | `#F3958C` | Illustration ink (red) -> coral. |
| `--homepage-color-eef3ee` | `#eef3ee` | `#17252E` | Map face gradient end (start is --homepage-paper). |
| `--homepage-color-607a68` | `#607a68` | `#000000` | Map drop shadow (opacity .18) -> black. |
| `--homepage-color-a9b9ac` | `#a9b9ac` | `#081016` | Map extrusion, deepest layer. |
| `--homepage-color-c0cec3` | `#c0cec3` | `#0C161D` | Map extrusion, middle layer. |
| `--homepage-color-d3dfd5` | `#d3dfd5` | `#122029` | Map extrusion, top layer. |
| `--homepage-color-92a396` | `#92a396` | `#58707A` |  |

### Points check (`--check-*`)

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--check-ink` | `#12202c` | `#ECE6D8` |  |
| `--check-muted` | `#52616a` | `#A5B3B9` |  |
| `--check-sage` | `#eef2f0` | `#0E1820` |  |
| `--check-paper` | `#ffffff` | `#14212B` |  |
| `--check-line` | `#d5ded8` | `#2A3A44` |  |
| `--check-soft` | `#f7f9f7` | `#112029` |  |
| `--check-green` | `#3b6551` | `#93C8AA` |  |
| `--check-green-soft` | `#e6eee8` | `#18302A` |  |
| `--check-focus` | `#315c87` | `#98BCE6` |  |
| `--check-error` | `#b42318` | `#F68D80` | = not-invited ink. |
| `--check-shadow` | `0 1.5rem 4rem -2.5rem #12202c35` | `0 1.5rem 4rem -2.5rem #000000c0, inset 0 1px 0 #ECE6D80d` | Shadow + 1px ivory top edge (elevation cue on dark). |

### Outlook label pairs (the seven distinct pairs; `not-open` shares `not-invited`)

| Label | Light ink / bg | Dark ink / bg | Dark: ink on bg | Dark: stamp ink on sheet `--card` | Dark: stamp ink on `--brand-paper` |
|---|---|---|---|---|---|
| very-strong | `#0f6b3c` / `#d6efe0` | `#6FD49C` / `#0F2D20` | 8.17 | 9.09 | 9.03 |
| strong | `#1e7a4c` / `#e5f3ea` | `#A6D9BB` / `#152B22` | 9.47 | 10.41 | 10.35 |
| competitive | `#996000` / `#fbefd6` | `#EBB959` / `#2F2412` | 8.41 | 9.12 | 9.06 |
| long-wait | `#be3f0b` / `#fde8db` | `#F5965F` / `#361D11` | 7.02 | 7.39 | 7.34 |
| not-invited | `#b42318` / `#fce5e3` | `#F68D80` / `#381916` | 6.85 | 7.10 | 7.05 |
| not-eligible | `#5b3f9e` / `#ece6f8` | `#BEABF3` / `#251E3E` | 7.73 | 8.09 | 8.04 |
| not-open | `#b42318` / `#fce5e3` | `#F68D80` / `#381916` | 6.85 | 7.10 | 7.05 |
| no-data | `#586470` / `#e8ecef` | `#B0BCC7` / `#1F2931` | 7.65 | 8.53 | 8.47 |

Dark inks are the same hue family as light, lifted in lightness and slightly desaturated so they read as pigment, not LEDs. Very strong is the more saturated green and strong the paler mint, so the rank still reads as "more ink = stronger" in both themes.

## New role tokens (needed because some light tokens do two jobs)

| Token | Light | Dark | Why |
|---|---|---|---|
| `--brand-deep` | `#12202c` | `#08121A` | Footer and other always-dark panels. Today they use --brand-ink as a background; in dark --brand-ink becomes ivory, so they need their own role. |
| `--brand-ink-fill` | `#12202c` | `#ECE6D8` | Primary button fill (ink in light, ivory in dark). |
| `--brand-on-fill` | `#ffffff` | `#0E1820` | Text on the primary button. |
| `--brand-ink-fill-hover` | `#1f3446` | `#D3CCBC` | Primary button hover. |
| `--guilloche-a` | `#BCD0C4` | `#7FB89A` | Guilloche main strand; dark drawn at 30% opacity (see --guilloche-opacity). |
| `--guilloche-b` | `#D6E1DA` | `#A99AD8` | Guilloche second strand: the 'UV' violet, same layer opacity. |
| `--guilloche-opacity` | `1` | `0.30` | Mask layer opacity. |
| `--stamp-glow` | `none` | `drop-shadow(0 0 6px color-mix(in oklab, currentColor 22%, transparent))` | CSS filter on .stamp, after the SVG ink filter. |
| `--headline-wght` | `750 (as today)` | `720` | Archivo headline weight; ivory on night blooms (irradiation), so dark sheds 30 units on the variable axis. |
| `--elevate-edge` | `transparent` | `#ECE6D814` | 1px top inner highlight on raised cards (replaces shadow as the elevation cue). |

The charts need no new tokens: cut-off columns already fill with `--ink` and print their numbers in `--card`, and the queue "behind" squares mix `--muted-soft` into `--newsprint`, so they invert on their own. The map gradient already uses `--homepage-paper` and `--homepage-color-eef3ee`.

## Contrast (WCAG 2.x, computed)

Text needs 4.5:1; UI parts, focus rings and chart marks need 3:1. Alpha colours are blended over their background first. Light-theme ratios are shown for comparison.

| Pair | Dark fg | Dark bg | Dark ratio | Light ratio | Need | Pass |
|---|---|---|---|---|---|---|
| --ink on --newsprint | `#ECE6D8` | `#11191F` | 14.27 | 15.04 | 4.5 | yes |
| --ink on --card | `#ECE6D8` | `#172028` | 13.25 | 16.42 | 4.5 | yes |
| --ink on --surface | `#ECE6D8` | `#0C141A` | 14.93 | 14.11 | 4.5 | yes |
| --muted on --newsprint | `#C6BEAE` | `#11191F` | 9.62 | 8.11 | 4.5 | yes |
| --muted on --card | `#C6BEAE` | `#172028` | 8.93 | 8.86 | 4.5 | yes |
| --muted on --surface | `#C6BEAE` | `#0C141A` | 10.06 | 7.61 | 4.5 | yes |
| --muted-soft on --newsprint | `#A69E8F` | `#11191F` | 6.69 | 5.00 | 4.5 | yes |
| --muted-soft on --card | `#A69E8F` | `#172028` | 6.21 | 5.46 | 4.5 | yes |
| --muted-soft on --surface | `#A69E8F` | `#0C141A` | 7.00 | 4.69 | 4.5 | yes |
| --saffron-text on --newsprint | `#F0A35E` | `#11191F` | 8.54 | 5.06 | 4.5 | yes |
| --saffron-text on --card | `#F0A35E` | `#172028` | 7.93 | 5.52 | 4.5 | yes |
| --saffron-text on --surface | `#F0A35E` | `#0C141A` | 8.94 | 4.74 | 4.5 | yes |
| --slate on --newsprint | `#A3BDEB` | `#11191F` | 9.33 | 7.59 | 4.5 | yes |
| --slate on --card | `#A3BDEB` | `#172028` | 8.66 | 8.28 | 4.5 | yes |
| --slate on --surface | `#A3BDEB` | `#0C141A` | 9.76 | 7.12 | 4.5 | yes |
| --muted-on-dark on --brand-deep | `#CBC4B4` | `#08121A` | 10.88 | 11.22 | 4.5 | yes |
| status strongest | `#A3DAB9` | `#16342A` | 8.52 | 7.44 | 4.5 | yes |
| status watching | `#ADC4EE` | `#1A2840` | 8.38 | 7.21 | 4.5 | yes |
| status needs-answers | `#C6BEAE` | `#172028` | 8.93 | 8.86 | 4.5 | yes |
| status unverified | `#ADC4EE` | `#172028` | 9.35 | 8.28 | 4.5 | yes |
| status not-open | `#F4A79B` | `#3A1C19` | 7.98 | 6.55 | 4.5 | yes |
| question line | `#ECE6D8` | `#3B2D17` | 10.72 | 13.20 | 4.5 | yes |
| label very-strong: ink on its bg | `#6FD49C` | `#0F2D20` | 8.17 | 5.42 | 4.5 | yes |
| label very-strong: ink (stamp) on --card | `#6FD49C` | `#172028` | 9.09 | 6.21 | 4.5 | yes |
| label very-strong: ink (stamp) on --brand-paper | `#6FD49C` | `#14212B` | 9.03 | 6.59 | 4.5 | yes |
| label strong: ink on its bg | `#A6D9BB` | `#152B22` | 9.47 | 4.65 | 4.5 | yes |
| label strong: ink (stamp) on --card | `#A6D9BB` | `#172028` | 10.41 | 5.02 | 4.5 | yes |
| label strong: ink (stamp) on --brand-paper | `#A6D9BB` | `#14212B` | 10.35 | 5.33 | 4.5 | yes |
| label competitive: ink on its bg | `#EBB959` | `#2F2412` | 8.41 | 4.57 | 4.5 | yes |
| label competitive: ink (stamp) on --card | `#EBB959` | `#172028` | 9.12 | 4.92 | 4.5 | yes |
| label competitive: ink (stamp) on --brand-paper | `#EBB959` | `#14212B` | 9.06 | 5.21 | 4.5 | yes |
| label long-wait: ink on its bg | `#F5965F` | `#361D11` | 7.02 | 4.54 | 4.5 | yes |
| label long-wait: ink (stamp) on --card | `#F5965F` | `#172028` | 7.39 | 5.07 | 4.5 | yes |
| label long-wait: ink (stamp) on --brand-paper | `#F5965F` | `#14212B` | 7.34 | 5.38 | 4.5 | yes |
| label not-invited: ink on its bg | `#F68D80` | `#381916` | 6.85 | 5.46 | 4.5 | yes |
| label not-invited: ink (stamp) on --card | `#F68D80` | `#172028` | 7.10 | 6.20 | 4.5 | yes |
| label not-invited: ink (stamp) on --brand-paper | `#F68D80` | `#14212B` | 7.05 | 6.57 | 4.5 | yes |
| label not-eligible: ink on its bg | `#BEABF3` | `#251E3E` | 7.73 | 6.51 | 4.5 | yes |
| label not-eligible: ink (stamp) on --card | `#BEABF3` | `#172028` | 8.09 | 7.48 | 4.5 | yes |
| label not-eligible: ink (stamp) on --brand-paper | `#BEABF3` | `#14212B` | 8.04 | 7.93 | 4.5 | yes |
| label not-open: ink on its bg | `#F68D80` | `#381916` | 6.85 | 5.46 | 4.5 | yes |
| label not-open: ink (stamp) on --card | `#F68D80` | `#172028` | 7.10 | 6.20 | 4.5 | yes |
| label not-open: ink (stamp) on --brand-paper | `#F68D80` | `#14212B` | 7.05 | 6.57 | 4.5 | yes |
| label no-data: ink on its bg | `#B0BCC7` | `#1F2931` | 7.65 | 5.09 | 4.5 | yes |
| label no-data: ink (stamp) on --card | `#B0BCC7` | `#172028` | 8.53 | 5.71 | 4.5 | yes |
| label no-data: ink (stamp) on --brand-paper | `#B0BCC7` | `#14212B` | 8.47 | 6.05 | 4.5 | yes |
| --brand-ink on --brand-paper | `#ECE6D8` | `#14212B` | 13.16 | 16.55 | 4.5 | yes |
| --brand-ink on --brand-sage | `#ECE6D8` | `#0E1820` | 14.42 | 14.66 | 4.5 | yes |
| --brand-muted on --brand-paper | `#A5B3B9` | `#14212B` | 7.60 | 6.41 | 4.5 | yes |
| --brand-muted on --brand-sage | `#A5B3B9` | `#0E1820` | 8.33 | 5.67 | 4.5 | yes |
| --brand-green on --brand-paper | `#93C8AA` | `#14212B` | 8.64 | 6.63 | 4.5 | yes |
| --brand-green on --brand-sage | `#93C8AA` | `#0E1820` | 9.47 | 5.87 | 4.5 | yes |
| --brand-on-dark on --brand-deep (footer) | `#B9C7C7` | `#08121A` | 10.84 | 10.47 | 4.5 | yes |
| ivory on --brand-deep (footer) | `#ECE6D8` | `#08121A` | 15.18 | 16.55 | 4.5 | yes |
| --brand-on-fill on --brand-ink-fill (button) | `#0E1820` | `#ECE6D8` | 14.42 | 16.55 | 4.5 | yes |
| --brand-on-fill on button hover | `#0E1820` | `#D3CCBC` | 11.22 | 12.82 | 4.5 | yes |
| --check-ink on --check-paper | `#ECE6D8` | `#14212B` | 13.16 | 16.55 | 4.5 | yes |
| --check-ink on --check-sage | `#ECE6D8` | `#0E1820` | 14.42 | 14.66 | 4.5 | yes |
| --check-ink on --check-soft | `#ECE6D8` | `#112029` | 13.37 | 15.64 | 4.5 | yes |
| --check-ink on --check-green-soft | `#ECE6D8` | `#18302A` | 11.29 | 14.00 | 4.5 | yes |
| --check-muted on --check-paper | `#A5B3B9` | `#14212B` | 7.60 | 6.41 | 4.5 | yes |
| --check-muted on --check-sage | `#A5B3B9` | `#0E1820` | 8.33 | 5.67 | 4.5 | yes |
| --check-muted on --check-soft | `#A5B3B9` | `#112029` | 7.72 | 6.06 | 4.5 | yes |
| --check-muted on --check-green-soft | `#A5B3B9` | `#18302A` | 6.52 | 5.42 | 4.5 | yes |
| --check-green on --check-paper | `#93C8AA` | `#14212B` | 8.64 | 6.63 | 4.5 | yes |
| --check-green on --check-sage | `#93C8AA` | `#0E1820` | 9.47 | 5.87 | 4.5 | yes |
| --check-green on --check-soft | `#93C8AA` | `#112029` | 8.78 | 6.27 | 4.5 | yes |
| --check-green on --check-green-soft | `#93C8AA` | `#18302A` | 7.41 | 5.61 | 4.5 | yes |
| --check-error on --check-paper | `#F68D80` | `#14212B` | 7.05 | 6.57 | 4.5 | yes |
| --check-error on --check-sage | `#F68D80` | `#0E1820` | 7.73 | 5.82 | 4.5 | yes |
| --check-error on --check-soft | `#F68D80` | `#112029` | 7.16 | 6.21 | 4.5 | yes |
| --check-error on --check-green-soft | `#F68D80` | `#18302A` | 6.05 | 5.56 | 4.5 | yes |
| --homepage-ink on --homepage-paper | `#ECE6D8` | `#14212B` | 13.16 | 16.55 | 4.5 | yes |
| --homepage-ink on --homepage-desk | `#ECE6D8` | `#0E1820` | 14.42 | 14.66 | 4.5 | yes |
| --homepage-muted on --homepage-paper | `#A5B3B9` | `#14212B` | 7.60 | 6.47 | 4.5 | yes |
| --homepage-muted on --homepage-desk | `#A5B3B9` | `#0E1820` | 8.33 | 5.73 | 4.5 | yes |
| --homepage-color-5b6c63 on --homepage-paper | `#9FB4A9` | `#14212B` | 7.47 | 5.57 | 4.5 | yes |
| --homepage-color-5b6c63 on --homepage-desk | `#9FB4A9` | `#0E1820` | 8.18 | 4.93 | 4.5 | yes |
| --homepage-color-61776b on --homepage-paper | `#9DB7A8` | `#14212B` | 7.62 | 4.82 | 4.5 | yes |
| --homepage-color-61776b on --homepage-desk | `#9DB7A8` | `#0E1820` | 8.35 | 4.27 | 4.5 | yes |
| --homepage-color-7a8d80 on --homepage-paper | `#93A89B` | `#14212B` | 6.49 | 3.53 | 4.5 | yes |
| --homepage-color-7a8d80 on --homepage-desk | `#93A89B` | `#0E1820` | 7.11 | 3.13 | 4.5 | yes |
| --homepage-color-52665b on --homepage-paper | `#A8C0B2` | `#14212B` | 8.46 | 6.16 | 4.5 | yes |
| --homepage-color-52665b on --homepage-desk | `#A8C0B2` | `#0E1820` | 9.27 | 5.45 | 4.5 | yes |
| --homepage-color-728778 on --homepage-paper | `#97AD9F` | `#14212B` | 6.86 | 3.85 | 4.5 | yes |
| --homepage-color-728778 on --homepage-desk | `#97AD9F` | `#0E1820` | 7.52 | 3.41 | 4.5 | yes |
| --homepage-color-34424e on --homepage-paper | `#CFD7D9` | `#14212B` | 11.21 | 10.32 | 4.5 | yes |
| --homepage-color-34424e on --homepage-desk | `#CFD7D9` | `#0E1820` | 12.28 | 9.14 | 4.5 | yes |
| --homepage-cobalt on --homepage-paper | `#93AAFF` | `#14212B` | 7.36 | 7.19 | 4.5 | yes |
| --homepage-cobalt on --homepage-desk | `#93AAFF` | `#0E1820` | 8.06 | 6.36 | 4.5 | yes |
| --homepage-competitive on --homepage-paper | `#EBB959` | `#14212B` | 9.06 | 5.21 | 4.5 | yes |
| --homepage-competitive on --homepage-desk | `#EBB959` | `#0E1820` | 9.93 | 4.62 | 4.5 | yes |
| --homepage-strong on --homepage-paper | `#6FD49C` | `#14212B` | 9.03 | 6.59 | 4.5 | yes |
| --homepage-strong on --homepage-desk | `#6FD49C` | `#0E1820` | 9.89 | 5.83 | 4.5 | yes |
| --homepage-color-815c32 on --homepage-paper | `#E2B57A` | `#14212B` | 8.68 | 5.98 | 4.5 | yes |
| --homepage-color-815c32 on --homepage-desk | `#E2B57A` | `#0E1820` | 9.51 | 5.30 | 4.5 | yes |
| --homepage-color-a23b39 on --homepage-paper | `#F3958C` | `#14212B` | 7.40 | 6.52 | 4.5 | yes |
| --homepage-color-a23b39 on --homepage-desk | `#F3958C` | `#0E1820` | 8.11 | 5.77 | 4.5 | yes |
| map state label on selected face | `#ECE6D8` | `#1D3A2F` | 9.94 | 11.34 | 4.5 | yes |
| map state label on face | `#9FB4A9` | `#17252E` | 7.14 | 4.96 | 4.5 | yes |
| chart: column numeral (--card on --ink) | `#172028` | `#ECE6D8` | 13.25 | 16.42 | 4.5 | yes |
| focus ring on --newsprint | `#A3BDEB` | `#11191F` | 9.33 | 7.59 | 3.0 | yes |
| focus ring on --brand-paper | `#98BCE6` | `#14212B` | 8.32 | 6.97 | 3.0 | yes |
| homepage focus on --homepage-desk | `#93AAFF` | `#0E1820` | 8.06 | 6.36 | 3.0 | yes |
| focus ring on-dark on --brand-deep | `#F3EEE3` | `#08121A` | 16.33 | 14.31 | 3.0 | yes |
| chart column (--ink fill) vs --card | `#ECE6D8` | `#172028` | 13.25 | 16.42 | 3.0 | yes |
| queue behind square (muted-soft 40% mix) vs --newsprint | `#4C5051` | `#11191F` | 2.18 | 1.76 | decorative | yes |
| saffron mark (You line) vs --card | `#E58A3A` | `#172028` | 6.30 | 3.09 | 3.0 | yes |
| selected map stroke vs face | `#93C8AA` | `#1D3A2F` | 6.52 | 4.43 | 3.0 | yes |
| check input border (--check-line) vs paper | `#62757F` | `#14212B` | 3.41 | 1.38 | 3.0 | yes |

110 pairs checked, 0 dark failures.

### Pairs that needed adjusting while designing

- `--surface` started at `#1E2932` (lighter than the sheet). Contrast passed, but it inverted elevation: the occupation verdict card sat darker than the band behind it. Moved to `#0C141A` so recessed stays below page and cards stay above, as in light.
- Input borders: `--check-line` on its own (`#2A3A44`) is 1.5:1 on the card, below the 3:1 UI minimum. Input borders use a separate `#62757F` (3.41:1). Light mode has the same gap today (`#d5ded8` on white is 1.38:1); worth fixing in both themes.
- Stamp glow was first tried at 32% / 7px; it read as neon on competitive yellow. Settled on 22% / 6px.

### Existing light-mode findings (not dark-mode work, flagged for later)

- `--homepage-color-7a8d80` and `--homepage-color-728778` are used as text colour once each and measure 3.13 to 3.85:1 on the homepage surfaces in light; below 4.5:1 if that text is under 18.66px bold / 24px.
- The light input border gap above.

## What stays light no matter what

- **Print and PDF.** `@media print { :root { color-scheme: light } }` makes every `light-dark()` token resolve to its light value, so the print tree, the 5-page sample PDFs and Download PDF are byte-for-byte the same colours as today. Verified in the preview: with Dark saved, print media renders the sheet `#FBF8F2`.
- **OG image** (`public/og.png`, `npm run og:image`) and the favicon (`src/app/icon.svg`, sage tile + ink mark). Social cards are seen on other sites; one light card is the brand. The favicon tile already reads on dark browser chrome.
- **Downloadable marks** `public/brand/mark-ink.svg` and `mark-reversed.svg` stay as they are; the site logo is already inline SVG and switches via `currentColor`.
- **Emails** (none yet) should stay light.

## How assets adapt without duplicate artwork

- **Guilloche** (`public/home/passport-*.svg`, `public/report-passport.svg`, ~39 KB each, strokes hard-coded `#BCD0C4`, `#D6E1DA`, `#C7C0E0`, `#B5CABF`, `#D3DED7`). Today they are `<img>` (homepage `Guilloche`, report `PassportBackground`) or `background: url()` (occupation shell), which cannot be recoloured. Change the element to an empty `<span class="guill">` with `mask: url(/home/passport-left.svg)` and `background-color: var(--guilloche-a)`, opacity `var(--guilloche-opacity)`. Same file, one request, recoloured by token. For the two-strand look, split each SVG into two files by stroke colour (a and b), or keep one file and accept a single strand. Keep the lazy loading the homepage has now (set the mask only when near the viewport, or accept the CSS fetch). Masks are same-origin on the real site, so the CORS rule for `mask-image` is met.
- **Stamp ink filter** (`report/ink-filter.tsx`): unchanged. It only displaces and thresholds alpha, so it works on any colour. Stamps already draw in `currentColor` from `.very-strong` etc. Dark adds `filter: var(--stamp-glow)` and `mix-blend-mode: var(--stamp-blend)` (`multiply` light, `screen` dark) on `.stamp`, so the ink sits into the paper and the guilloche shows through in both themes.
- **Map** (`home/atlas-map.tsx`): already fully tokenised (`fill="var(--homepage-color-…)"`). Dark is only the token values above: black drop shadow, three near-black extrusion layers, night face gradient, sage selected state with ivory label.
- **Logo**: `LogoMark` takes `MARK_COLOURS.ink`. Change the stroke to `currentColor` and let the header set `color: var(--brand-ink)`; `reversed` stays for the footer.
- **Hero demo (Stageshow kit)**: `src/components/stageshow-kit/*.css` has ~100 hard-coded hexes. Treat the demo as a light "product screenshot" island (`color-scheme: light` on its root) for the first release; recolour later if wanted.
- **Images**: there are no raster images in page bodies today. Any future photo gets `filter: brightness(.92)` in dark, nothing more.
