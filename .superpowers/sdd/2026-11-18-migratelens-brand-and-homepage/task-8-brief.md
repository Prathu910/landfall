### Task 8: Homepage rebuild

**Files:**

- Create: `src/components/home/doors.tsx`, `src/components/home/three-questions.tsx`, `src/components/home/home-faq.ts` (FAQ data), `src/app/home.module.css`, `src/lib/home/home-copy.test.ts`
- Modify: `src/app/page.tsx` (rewrite); `src/app/globals.css` (delete the old homepage classes)
- Delete: `src/components/home-experience.tsx`, `src/components/pool-explorer.tsx`, `src/components/pool-explorer.module.css`, `src/components/pool-chart.tsx` (each only if nothing else imports it)

**Interfaces:**

- Consumes: `buildSampleView` and `buildDemoContent` (Task 5); `TryIt` (Task 6); `HeroDemoLoader` and `HeroDemoPoster` (Task 7); `QueueBar`, `EoisLikeYours` and `StateTile` (existing report components, fed from the sample view); `Faq`, `Logo`; the manifest `asAt` for "as at" lines.
- Produces: the homepage.

- [ ] **Step 1: Write the failing test** `src/lib/home/home-copy.test.ts`. It imports the FAQ data and an exported `HOME_COPY` object (headline, lede, doors, story, rules, final call to action) and asserts:
  - The exact spec strings:
    - headline `"Know your points. See where they'd put you."`;
    - the lede;
    - both doors' tag, title, body and action;
    - the story title `"65 points is the pass mark, not a promise."` and its body, verbatim from the spec.
  - Nothing contains "eligib", "%", "always" or an agency name. Check against "Y-Axis", "VisaEnvoy" and "Abhinav" in a short deny-list.
  - Everything passes `BANNED_COPY`.
  - There are 5–7 FAQ entries, and each answer opens with a direct answer in 2–3 sentences.
- [ ] **Step 2: Run** it. **Expected:** FAIL.
- [ ] **Step 3: Rewrite `page.tsx`** in the spec's order:
  1. The hero: headline, lede, two doors (both to `/check/`) and the trust line "SkillSelect data, as at {Mon YYYY}", "No percentages", "Stays in your browser". The demo goes beside the headline at 1024px and wider, and below the doors on narrower screens.
  2. `TryIt`, defaulting to the sample comparison occupation.
  3. The three questions, each with a real visual from the sample view and a link to its `/sample/` section.
  4. "65 points is the pass mark, not a promise."
  5. Our rules, linking to `/methodology/`.
  6. The FAQ (answers in the static HTML; `<details>` or Mantine `Accordion` with content kept in the DOM and printed).
  7. The final call to action.

  Delete the old homepage components and CSS.

- [ ] **Step 4: Run** `npm run check` and `npm run build`. Then run headless checks against `out/`:
  - `/` at 1440 and 390 has no overflow.
  - Under reduced motion the poster shows and no demo chunk is requested.
  - The poster numbers equal `/sample/`'s scorecard numbers.
  - With JavaScript disabled, the doors, poster, story, rules and FAQ answers are in the HTML.
  - Print media shows every section, with FAQ answers visible.
  - The try-it changes occupation and points while the URL stays `/`. "Get the full report" goes to `/check/?occupation=<code>` and that page preselects the occupation.
  - No console errors.

  Save screenshots (home desktop top, home mobile, try-it, print PDF) to `.superpowers/sdd/<plan>/screenshots/`.

- [ ] **Step 5: Commit** `feat(home): two-door homepage with demo, try-it and answers`.

