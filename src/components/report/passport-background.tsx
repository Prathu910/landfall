import Image from "next/image";
import styles from "./passport-background.module.css";

/** The approved mockup's security lines, shared by the screen and PDF heroes. */
export function PassportBackground({ print = false }: { print?: boolean }) {
  return (
    <Image
      src="/report-passport.svg"
      alt=""
      aria-hidden="true"
      width={900}
      height={520}
      loading="eager"
      unoptimized
      className={`${styles.artwork}${print ? ` ${styles.print}` : ""}`}
    />
  );
}
