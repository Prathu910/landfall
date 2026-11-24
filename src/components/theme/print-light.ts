const ATTRIBUTE = "data-mantine-color-scheme";

type SchemeRoot = Pick<Element, "getAttribute" | "setAttribute">;

/**
 * Print is always the light design. The tokens switch through
 * `color-scheme: light` in globals.css, but Mantine's own dark rules key off
 * `[data-mantine-color-scheme="dark"]`, so while printing the root says
 * light. `leave` restores the reader's scheme. Both are idempotent, because
 * `beforeprint` and the print media query can each fire.
 */
export function printLight(root: SchemeRoot) {
  let saved: string | null = null;
  return {
    enter() {
      if (saved !== null || root.getAttribute(ATTRIBUTE) !== "dark") return;
      saved = "dark";
      root.setAttribute(ATTRIBUTE, "light");
    },
    leave() {
      if (saved === null) return;
      root.setAttribute(ATTRIBUTE, saved);
      saved = null;
    },
  };
}
