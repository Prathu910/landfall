import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { loadManifest } from "@/lib/data/load-server";
import { formatMonth } from "@/lib/report/copy";
import { Brand } from "./brand/brand";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  const asAt = formatMonth(loadManifest().asAt);
  return (
    <footer className={`site-footer ${styles.footer}`}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.identity}>
            <Brand reversed />
            <p>
              Australian skilled migration,
              <br />
              seen through the data.
            </p>
            <div className={styles.snapshot}>
              <span>Published SkillSelect snapshot</span>
              <strong>{asAt}</strong>
            </div>
          </div>
          <nav className={styles.links} aria-label="Footer navigation">
            <div>
              <h2>Explore</h2>
              <Link href="/check/">Check my points</Link>
              <Link href="/guide/">PR guide: 189, 190, 491</Link>
              <Link href="/sample/">Sample report</Link>
              <Link href="/occupations/">Occupations</Link>
              <Link href="/states/">States</Link>
              <Link href="/updates/">Monthly updates</Link>
            </div>
            <div>
              <h2>About the data</h2>
              <Link href="/methodology/">Method and sources</Link>
              <Link href="/feedback/">Feedback</Link>
              <Link href="/methodology/#privacy">Privacy</Link>
              <a
                href="https://www.mara.gov.au/"
                target="_blank"
                rel="noreferrer"
              >
                Find a registered agent <ArrowUpRight size={14} aria-hidden />
              </a>
            </div>
          </nav>
        </div>
        <div className={styles.bottom}>
          <p>
            MigrateLens gives general information from published data. We are
            not registered migration agents and don&apos;t give migration
            advice.
          </p>
          <span>© {new Date().getFullYear()} MigrateLens</span>
        </div>
      </div>
    </footer>
  );
}
