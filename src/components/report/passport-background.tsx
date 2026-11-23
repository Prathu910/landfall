import Image from "next/image";
import type { CSSProperties } from "react";
import styles from "./passport-background.module.css";

const SRC = "/report-passport.svg";

/**
 * The approved mockup's security lines, shared by the screen and PDF heroes.
 * At night the same file glows as a mask in the guilloche tokens; print
 * always uses the daylight image. The image is fetched with CORS, like the
 * mask, so the browser downloads the file once.
 */
export function PassportBackground({ print = false }: { print?: boolean }) {
  const artwork = `${styles.artwork}${print ? ` ${styles.print}` : ""}`;
  return (
    <>
      <Image
        src={SRC}
        alt=""
        aria-hidden="true"
        width={900}
        height={520}
        loading="eager"
        crossOrigin="anonymous"
        unoptimized
        className={`${artwork} ${styles.day}`}
      />
      {print ? null : (
        <span
          aria-hidden="true"
          className={`${artwork} guill-uv ${styles.uv}`}
          style={{ "--guill-src": `url(${SRC})` } as CSSProperties}
        />
      )}
    </>
  );
}
