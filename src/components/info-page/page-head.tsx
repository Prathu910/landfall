import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./info-page.module.css";

/** A supporting page's head: breadcrumb, eyebrow, the page's one h1 and intro. */
export function PageHead({
  crumb,
  eyebrow,
  icon: Icon,
  title,
  intro,
  meta = [],
}: {
  crumb: string;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  intro: ReactNode;
  meta?: string[];
}) {
  return (
    <>
      <nav className={styles.crumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronRight size={12} aria-hidden />
        <span aria-current="page">{crumb}</span>
      </nav>
      <header className={styles.head}>
        <p className={styles.eyebrow}>
          <Icon size={16} aria-hidden /> {eyebrow}
        </p>
        <h1>{title}</h1>
        <p className={styles.intro}>{intro}</p>
        {meta.length > 0 && (
          <ul className={styles.meta}>
            {meta.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </header>
    </>
  );
}
