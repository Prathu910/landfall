import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./button-link.module.css";

/** An internal link styled as the primary pill action. */
export function ButtonLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link className={styles.action} href={href}>
      {children}
    </Link>
  );
}
