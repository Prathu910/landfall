import { useEffect, type RefObject } from "react";
const FITTED = "text[data-fit], textPath[data-fit]";

/** Null when the text can't be measured: hidden (length 0) or not laid out. */
function measure(text: SVGTextContentElement): number | null {
  try {
    const width = text.getComputedTextLength();
    return width > 0 ? width : null;
  } catch {
    return null;
  }
}

function clearFit(text: SVGTextContentElement): void {
  text.removeAttribute("textLength");
  text.removeAttribute("lengthAdjust");
}

/**
 * The stencil face has no width axis, so a line still too wide at its
 * fitted size is squeezed with textLength. Unmeasurable text (hidden, or
 * not laid out) keeps the size the server rendered. Every write is cleared
 * first and every width read before any new write, so the browser lays the
 * stamp out once instead of once per line (a forced reflow per text).
 */
function fitTexts(svg: SVGSVGElement): void {
  const texts = [...svg.querySelectorAll<SVGTextContentElement>(FITTED)];
  texts.forEach(clearFit);
  const widths = texts.map(measure);
  texts.forEach((text, index) => {
    const maxWidth = Number(text.dataset.fit);
    const width = widths[index];
    if (width !== null && width > maxWidth) {
      text.setAttribute("textLength", String(maxWidth));
      text.setAttribute("lengthAdjust", "spacingAndGlyphs");
    }
  });
}

/**
 * Fits every `data-fit` text (width in user units) once fonts are ready.
 * Stamp sizes are estimates, so a wide glyph or a font that loads late could
 * otherwise run past the frame (spec 8). No dependency list: the text can
 * change on any render, and the work is a handful of measurements.
 */
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
    // ready can settle before the stamp face is first requested.
    fonts.addEventListener("loadingdone", refit);
    return () => {
      active = false;
      fonts.removeEventListener("loadingdone", refit);
    };
  });
}
