import Image from "next/image";
import type { CSSProperties } from "react";

/**
 * The passport security linework behind a homepage panel. A lazy image, so
 * panels below the fold fetch their artwork only when a phone scrolls near.
 * At night the image hides and the same file, as a mask, glows in the
 * guilloche tokens (`.guill-uv` in globals.css).
 */
export function Guilloche({ src }: { src: string }) {
  const uv = { "--guill-src": `url(${src})` } as CSSProperties;
  return (
    <>
      <Image
        className="guill"
        src={src}
        alt=""
        aria-hidden="true"
        width={600}
        height={520}
        loading="lazy"
        unoptimized
        style={{ display: "var(--theme-day-display)" } as CSSProperties}
      />
      <span className="guill guill-uv" aria-hidden="true" style={uv} />
    </>
  );
}
