import { LIGHT_DARK_PROBE } from "./theme";

/**
 * The inline head script that sets `data-mantine-color-scheme` on <html>
 * before first paint. It does what Mantine's `ColorSchemeScript` does with
 * `defaultColorScheme="auto"` (importing that component pulled the whole
 * Mantine barrel onto every route), and also keeps browsers without
 * `light-dark()` on light. If storage throws, it sets nothing and the CSS
 * follows the device. A fixed string: the only input is our storage key.
 */
export function themeScript(storageKey: string): string {
  const key = JSON.stringify(storageKey).replace(/</g, "\\u003c");
  const probe = JSON.stringify(LIGHT_DARK_PROBE);
  return [
    "(function(){try{",
    `var saved=window.localStorage.getItem(${key});`,
    'var choice=saved==="light"||saved==="dark"?saved:"auto";',
    `if(!(window.CSS&&window.CSS.supports("color",${probe})))choice="light";`,
    'else if(choice==="auto")choice=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";',
    'document.documentElement.setAttribute("data-mantine-color-scheme",choice)',
    "}catch(e){}})()",
  ].join("");
}
