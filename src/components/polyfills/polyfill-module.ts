/**
 * Replaces Next.js's own client polyfill module (next.config.ts). Next adds
 * it to every page, and Lighthouse reports it as legacy JavaScript: it
 * patches String trimStart/trimEnd, Symbol description, Array flat, flatMap
 * and at, Promise finally, Object fromEntries and hasOwn, which every browser
 * in package.json's browserslist (Next's own floor: Chrome and Edge 111,
 * Firefox 111, Safari 16.4) already has. Only URL.canParse is newer (Chrome
 * 120, Firefox 115, Safari 17), and Next's runtime can call it, so it stays.
 */
type CanParse = (url: string | URL, base?: string | URL) => boolean;

const urlStatics = URL as unknown as { canParse?: CanParse };

if (typeof urlStatics.canParse !== "function") {
  urlStatics.canParse = (url, base) => {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}

export {};
