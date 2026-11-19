import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    // The vendored Stageshow kit (ruling B1) keeps the latest value of props
    // and state in refs read during render, and resets its scene from effects
    // when playback, layout or reduced motion changes. That imperative design
    // is the kit's frame-accurate playback; the React Compiler rules below
    // reject it wholesale, so they are off for the kit folder only.
    files: ["src/components/stageshow-kit/**"],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "docs/original-references/**",
    // Third-party agent skills (installed with `npx skills add`), not app code.
    ".agents/**",
  ]),
]);
