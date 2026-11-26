import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";
import { NOT_FOUND_PAGE } from "@/lib/seo/site-pages";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: NOT_FOUND_PAGE.title,
  description: NOT_FOUND_PAGE.description,
  // Restated: the layout's "index, follow" would sit beside Next's noindex.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className={styles.page} id="main">
      <div className={styles.wrap}>
        <svg className={styles.stamp} viewBox="0 0 220 220" aria-hidden="true">
          <g transform="rotate(-8 110 110)">
            <circle cx="110" cy="110" r="100" className={styles.ring} />
            <circle cx="110" cy="110" r="86" className={styles.inner} />
            <text x="110" y="112" className={styles.big}>
              404
            </text>
            <text x="110" y="150" className={styles.small}>
              NOT FOUND
            </text>
          </g>
        </svg>
        <div>
          <h1>Page not found</h1>
          <p>
            That page isn’t here. Check the address, or go back to the homepage.
          </p>
          <ButtonLink href="/">Back to MigrateLens</ButtonLink>
        </div>
      </div>
    </main>
  );
}
