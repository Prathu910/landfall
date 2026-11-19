### Task 7: Stageshow hero demo

**Files:**

- Create: `src/components/stageshow-kit/` (copied from `.agents/skills/stageshow/kit`, only the parts used, plus `stageshow.css`), `src/components/home/hero-demo.tsx`, `src/components/home/hero-demo.module.css`, `src/components/home/hero-demo-poster.tsx`, `src/components/home/hero-demo-loader.tsx`, `src/components/home/REHEARSAL.md`
- Modify: `.prettierignore`/`eslint.config.mjs` only if a copied kit file needs a scoped exception (prefer fixing the file)

**Interfaces:**

- Consumes: `DemoContent` (Task 5); `Logo` tokens (Task 1).
- Produces:
  - `HeroDemoPoster({ content: DemoContent })`: a server-renderable static figure showing the scorecard and tiles, with real numbers in the HTML.
  - `HeroDemoLoader({ content: DemoContent })`: a client component that renders the poster, then swaps in `HeroDemo` through `next/dynamic` (`ssr: false`) only when `prefers-reduced-motion` is not `reduce` and the stage is in view.
  - `HeroDemo({ content: DemoContent })`.

- [ ] **Step 1: Read the Stageshow skill.** Read `.agents/skills/stageshow/SKILL.md`, `references/craft.md`, `references/framing.md`, `references/motion.md` and `references/rehearse.md`. Film the closest gold example (`hero-demo` or `payout-flow`) following the skill's step 4.
- [ ] **Step 2: Write the failing test.** Make `shouldAnimate(reducedMotion: boolean, inView: boolean): boolean` a pure, exported helper. It must be false whenever reduced motion is on.
- [ ] **Step 3: Run** it. **Expected:** FAIL.
- [ ] **Step 4: Build the demo** following the skill's workflow.
  - **Beats:**
    1. The cursor fills the sample profile lines, then the points.
    2. The scorecard counts in the three cards' "ahead" and "at your score".
    3. The 190 state tiles light up by group.
    4. The payoff holds. The loop resets with a visible cause.
  - **Length:** 12–16 seconds.
  - **Design size:** about 720×340 beside copy, with a `compact` 358-wide design for phones.
  - **Look:** the Data Desk look, using kit tokens mapped to Task 1's tokens.
  - **Content:** every string comes from `DemoContent`. Visible stage content is `aria-hidden`, with one visually hidden sentence from `posterAlt`. No focusable elements.
  - **Poster:** the poster frame is the payoff beat.
  - **Bundle:** keep the demo chunk at about 40 KB gzipped or less (measure it from `.next`/`out` chunks and report it).
  - **React 19:** adapt the kit minimally if needed.
- [ ] **Step 5: Rehearse.** Run the skill's rehearsal against the built page, `node .agents/skills/stageshow/scripts/film.mjs "<url>" --select '<stage selector>' --gate`, at the shown width and at 390, until it ends with `rehearsal passed`. Write `REHEARSAL.md` with the skill's hand-over template. If the gate can't pass with reasonable effort, ship the poster only (the loader never mounts the demo), say why in the report, and return DONE_WITH_CONCERNS.
- [ ] **Step 6: Run** `npm run check` and `npm run build`. **Expected:** pass.
- [ ] **Step 7: Commit** `feat(home): Stageshow hero demo from the sample report`.

