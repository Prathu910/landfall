import federalJson from "../../data/state-rules/federal-occupations.json";
import { isFederalList } from "../../lib/state-outlook/rules-guards";
import type { FederalList } from "../../lib/state-outlook/rules-types";

/**
 * The Home Affairs occupation list on its own (about 2.4 KB gzipped), for
 * client components that need only the federal flags, such as the guide's
 * quick check. Null when it fails validation.
 */
export const federalList: FederalList | null = isFederalList(federalJson)
  ? federalJson
  : null;
