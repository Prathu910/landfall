import Link from "next/link";
import type { Visa } from "@/lib/data/types";
import styles from "./occupation-how-to-apply.module.css";

/** "How to apply": the PR guide for each visa this occupation can use. */
export function OccupationHowToApply({
  links,
}: {
  links: { visa: Visa; href: string }[];
}) {
  return (
    <nav className={styles.strip} aria-labelledby="how-to-apply-h">
      <h2 id="how-to-apply-h" className={styles.heading}>
        How to apply
      </h2>
      <ul className={styles.links}>
        {links.map((link) => (
          <li key={link.visa}>
            <Link href={link.href}>
              The {link.visa} guide <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
        <li>
          <Link href="/guide/">
            Every step to skilled PR <span aria-hidden="true">→</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
