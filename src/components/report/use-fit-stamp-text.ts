import { useEffect, type RefObject } from "react";

/**
 * Squeezes any `text[data-fit]` wider than its `data-fit` width (user units)
 * with textLength. Stamp sizes are estimates, so a wide glyph or a font that
 * loads late could otherwise run past the frame (spec 8).
 */
function fitTexts(svg: SVGSVGElement): void {
  for (const text of svg.querySelectorAll<SVGTextElement>("text[data-fit]")) {
    text.removeAttribute("textLength");
    text.removeAttribute("lengthAdjust");
    const maxWidth = Number(text.dataset.fit);
    if (text.getComputedTextLength() > maxWidth) {
      text.setAttribute("textLength", String(maxWidth));
      text.setAttribute("lengthAdjust", "spacingAndGlyphs");
    }
  }
}

// No dependency list: the text can change on any render, and the work is a
// handful of measurements.
export function useFitStampText(ref: RefObject<SVGSVGElement | null>): void {
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    let active = true;
    const refit = () => {
      if (active) fitTexts(svg);
    };
    refit();
    const fonts = document.fonts;
    if (!fonts) return;
    fonts.ready.then(refit);
    // ready can settle before the stencil face is first requested.
    fonts.addEventListener("loadingdone", refit);
    return () => {
      active = false;
      fonts.removeEventListener("loadingdone", refit);
    };
  });
}
