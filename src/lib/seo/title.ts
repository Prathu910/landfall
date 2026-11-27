import { SITE_NAME } from "../site";

/** Google shows about 60 characters of a title before cutting it. */
export const TITLE_MAX = 60;
/** The layout's title template suffix. */
export const BRAND_SUFFIX = ` · ${SITE_NAME}`;

/** The first candidate that fits 60 characters, else the last one. */
export function fitTitle(candidates: string[]): string {
  return (
    candidates.find((title) => title.length <= TITLE_MAX) ??
    candidates[candidates.length - 1]
  );
}
