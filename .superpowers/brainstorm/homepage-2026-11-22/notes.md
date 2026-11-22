# Homepage direction: A clearer picture

22 November 2026. Design preview for founder review on `roadmap/report-redesign`. The four earlier directions were rejected. The app's homepage is unchanged.

## Brief

Explain immediately that MigrateLens helps people understand Australian permanent residency through skilled migration. Feel premium, attractive and clear through graphics and interaction, with restrained copy. Retain the accepted report direction. AI summary only in the first release; other AI features are recorded in `docs/AI-ROADMAP.md`.

## Design plan

- Palette: porcelain `#F5F8FC`, paper `#FFFFFF`, maritime ink `#172E3F`, blue `#3159D9`, eucalyptus `#37695A`, mist `#DCE8F3`. Retain the saffron accent in the existing logo only.
- Type: locally served Archivo Variable. Headlines use a deliberate narrow measure, tight spacing and substantial scale; body and controls stay simple and readable.
- Layout: asymmetric opening with an unambiguous Australian PR headline on the left, a sculpted geographical illustration and sample report on the right. One large interactive specimen below shows the change from points to an outlook. A short report preview and restrained trust/FAQ close the page.

```
Logo                 What you get  Explore an example     Start free
Australian PR.                  [Australia relief illustration]
Know where you stand.          [score] --> [outlook specimen]
One sentence + two actions     [189 / 190 / 491 controls]
-----------------------------------------------------------------
One number. A different outlook. [occupation + points] [live result]
-----------------------------------------------------------------
Your whole picture, in one report. [actual report excerpt + index]
Questions / source / final action
```

The map is the memorable element. Quiet typography and spacious, mostly unboxed sections keep the rest disciplined. This differs from the previous stamp desk, departures board, editorial charts and full-screen colour story. Geographic relief makes the country clear; a working example makes the product clear. No generic photograph, fake testimonial, invented customer count or busy data dashboard.

## Data and semantics

The live example is generated from the repository's real 31 October 2026 occupation snapshot and the existing `label189` and `buildTryIt` functions. It assumes points-test basics are met; it is not an eligibility assessment. Masked figures remain intervals. The map is geographical illustration, not an eligibility map. The three pathway controls explain 189 independent, 190 state nomination and 491 provisional regional migration. The 491 wording distinguishes the provisional pathway from permanent visas.

Coastline: Natural Earth, public domain, `nvkelso/natural-earth-vector`, `ne_110m_admin_0_countries.geojson`. The mark follows the existing MigrateLens logo geometry. Fonts are copied from the installed `@fontsource-variable/archivo` package. Passport artwork is the approved report's existing decoration. No personal data, API calls or AI calls are made by the demo.

Anthropic frontend design skill used from `anthropics/skills/skills/frontend-design/SKILL.md`. Review before implementation: first-screen context, visual distinctiveness, mobile typography, understandable interaction, real data and source labels.

## Preview verification

Checked in a real browser at 1440, 1280, 1024, 820, 760, 600, 390 and 360px, with reduced motion. No horizontal overflow or JavaScript page errors. All 18 occupation/points combinations, three pathway controls and three report-preview controls work. Values and labels are generated from the existing data/label code. Local scripts pass syntax checks and project documentation passes formatting checks.
