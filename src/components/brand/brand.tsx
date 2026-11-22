import Link from "next/link";
import { Logo } from "./logo";
import styles from "./logo.module.css";

/** The SVG is decorative within this explicitly named home link. */
export function Brand({
  reversed = false,
  onClick,
}: {
  reversed?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      className={`${styles.link} ${reversed ? styles.linkReversed : ""}`}
      href="/"
      aria-label="MigrateLens home"
      onClick={onClick}
    >
      <Logo reversed={reversed} />
    </Link>
  );
}
