import type { CSSProperties } from "react";
import { GUILLOCHE_ART, type GuillocheArt } from "./guilloche-art";

/**
 * Passport security linework. Each artwork is split into one SVG per line
 * colour, and each is a CSS mask over its guilloche token, in the drawing's
 * own order: by day the original colours, at night the UV gradient
 * (`.guill-layer` in globals.css). Masks, not an image, so decorative art is
 * never a page's Largest Contentful Paint (the homepage's was, at 4 s on a
 * phone, 24 Nov 2026), and with print-color-adjust it prints in both themes
 * with background graphics off. Every theme paints the same files, so each
 * downloads once and is ready before printing.
 */
export function Guilloche({
  art,
  className = "guill",
}: {
  art: GuillocheArt;
  className?: string;
}) {
  const { layers, fit } = GUILLOCHE_ART[art];
  return (
    <span className={className} aria-hidden="true">
      {layers.map(({ src, ink }) => (
        <span
          key={src}
          className="guill-layer"
          style={
            {
              "--guill-src": `url(${src})`,
              "--guill-ink": `var(${ink})`,
              "--guill-fit": fit,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
