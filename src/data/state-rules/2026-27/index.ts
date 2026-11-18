import { invalidRulePath } from "../../../lib/state-outlook/rules-guards";
import type { StateRules } from "../../../lib/state-outlook/rules-types";
import { actRules } from "./act";
import { nswRules } from "./nsw";
import { ntRules } from "./nt";
import { qldRules } from "./qld";
import { saRules } from "./sa";
import { tasRules } from "./tas";
import { vicRules } from "./vic";
import { waRules } from "./wa";

const curated: StateRules = {
  programYear: "2026-27",
  rules: [
    ...actRules,
    ...nswRules,
    ...ntRules,
    ...qldRules,
    ...saRules,
    ...tasRules,
    ...vicRules,
    ...waRules,
  ],
};

// The TypeScript types already shape this data; the guard also catches values
// the types allow but the rules forbid (e.g. an impossible checkedAt date).
const invalid = invalidRulePath(curated);
if (invalid !== null) {
  throw new Error(`2026–27 state rules failed validation at ${invalid}`);
}

/** Hand-curated 2026–27 state and territory nomination rules (190 and 491). */
export const stateRules: StateRules = curated;
