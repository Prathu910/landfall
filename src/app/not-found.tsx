import { HomeAction } from "@/components/home/controls/home-action";
import shell from "@/components/info-page/info-page.module.css";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={shell.page} id="main">
      <div className={`${shell.inner} ${styles.wrap}`}>
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
          <HomeAction href="/">Back to MigrateLens</HomeAction>
        </div>
      </div>
    </main>
  );
}
