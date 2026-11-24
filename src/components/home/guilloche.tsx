import Image from "next/image";
import type { CSSProperties } from "react";

/**
 * The passport security linework behind a homepage panel. At night the image
 * hides and the same file, as a mask, glows in the guilloche tokens
 * (`.guill-uv` in globals.css). The image loads eagerly, because a hidden
 * lazy image is never fetched and would print blank at night; it is fetched
 * with CORS, like the mask, so the browser downloads the file once.
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
        loading="eager"
        crossOrigin="anonymous"
        unoptimized
        style={{ display: "var(--theme-day-display)" } as CSSProperties}
      />
      <span className="guill guill-uv" aria-hidden="true" style={uv} />
    </>
  );
}
