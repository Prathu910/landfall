import { useEffect } from "react";
import type { RefObject } from "react";

/** The element a same-page hash names, or null ("#" alone names nothing). */
function hashTarget(hash: string): HTMLElement | null {
  const id = decodeURIComponent(hash.slice(1));
  return id ? document.getElementById(id) : null;
}

/**
 * Opens a closed <details> when the URL hash names its section or anything
 * inside it, then scrolls there: a browser won't scroll to a target hidden in
 * a closed fold. Covers page load, hash changes and a repeat click on a link
 * whose hash is already current (which fires no hashchange).
 */
export function useOpenOnHash(
  section: RefObject<HTMLElement | null>,
  details: RefObject<HTMLDetailsElement | null>,
) {
  useEffect(() => {
    let frame = 0;
    const open = (hash: string) => {
      const target = hashTarget(hash);
      const fold = details.current;
      if (!target || !fold || !section.current?.contains(target)) return;
      if (!fold.open) fold.open = true;
      // Wait a frame so the opened fold has laid out before scrolling.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        target.scrollIntoView({ block: "start" }),
      );
    };
    const onHash = () => open(location.hash);
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href^='#']");
      const href = link?.getAttribute("href");
      if (href && href === location.hash) open(href);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(frame);
    };
  }, [section, details]);
}
