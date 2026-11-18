### Task 9: "Sharpen my state outlook" form

**Files:**

- Create: `src/components/report/sharpen-form.tsx` and `sharpen-form.module.css`
- Modify: wherever the report receives `onEdit`/profile updates, so the form can update the profile (follow the existing check-flow update pattern and opt-in saving)

**Behaviour:**

- An optional, collapsible form under the state outlook titled "Sharpen my state outlook".
- It asks only the questions whose answers would change at least one tile for the current occupation and visa. Each question names the states it affects ("Answers WA and SA questions").
- It uses Mantine inputs with labels and helper text, and every field can be cleared.
- Answers update the outlook live.
- It must never put answers in the URL.
- On `/sample/` it is read-only: shown with the sample's answers and a note.

**Interface:** `SharpenForm({ questions, profile, onChange })`. `questions` comes from a pure `questionsNeeded(outlook): Question[]` in `src/lib/state-outlook/view.ts`, which needs a unit test.

- [ ] **Step 1: Write a failing unit test** for `questionsNeeded`: questions are de-duplicated across states and list the states each affects.
- [ ] **Steps 2–4:** implement the function and the component; run `npm run check && npm run build`.
- [ ] **Step 5: Commit** `feat(state): add the optional sharpen-my-outlook questions`

