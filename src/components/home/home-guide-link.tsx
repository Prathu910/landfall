import Link from "next/link";
import styles from "./home-guide-link.module.css";

/** The homepage's one entry point into the PR guide. */
export function HomeGuideLink() {
  return (
    <section className="band" aria-labelledby="guide-link-h">
      <div className="wrap">
        <Link className={styles.link} href="/guide/">
          <span className={styles.kicker} id="guide-link-h">
            New to Australian skilled PR?
          </span>
          <span className={styles.text}>
            The step-by-step guide to the 189, 190 and 491: occupation to visa
            decision, with the official rules and fees.
          </span>
          <span className={styles.cta}>
            Read the guide <span aria-hidden="true">→</span>
          </span>
        </Link>
      </div>
    </section>
  );
}
