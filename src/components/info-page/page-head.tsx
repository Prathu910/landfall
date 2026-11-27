import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import styles from "./info-page.module.css";

/** A supporting page's head: breadcrumb, eyebrow, the page's one h1 and intro. */
export function PageHead({
  crumb,
  eyebrow,
  icon: Icon,
  title,
  intro,
  meta = [],
  trail = [],
}: {
  crumb: string;
  /** Pages between Home and this one, e.g. the guide above a visa page. */
  trail?: { href: string; label: string }[];
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  intro: ReactNode;
  /** Short facts under the intro; dates inside are <time> elements. */
  meta?: ReactNode[];
}) {
  return (
    <>
      <nav className={styles.crumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronRight size={12} aria-hidden />
        {trail.map((step) => (
          <Fragment key={step.href}>
            <Link href={step.href}>{step.label}</Link>
            <ChevronRight size={12} aria-hidden />
          </Fragment>
        ))}
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
            {meta.map((item, index) => (
              // One flex item, so text and a <time> keep a normal space.
              <li key={index}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </header>
    </>
  );
}
