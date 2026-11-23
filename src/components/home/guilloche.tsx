import Image from "next/image";

/**
 * The passport security linework behind a homepage panel. A lazy image, so
 * panels below the fold fetch their artwork only when a phone scrolls near.
 */
export function Guilloche({ src }: { src: string }) {
  return (
    <Image
      className="guill"
      src={src}
      alt=""
      aria-hidden="true"
      width={600}
      height={520}
      loading="lazy"
      unoptimized
    />
  );
}
