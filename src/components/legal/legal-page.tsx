import type { LucideIcon } from "lucide-react";
import shell from "@/components/info-page/info-page.module.css";
import { PageHead } from "@/components/info-page/page-head";
import {
  legalNotices,
  NOT_ADVICE,
  SELLER_LINE,
  type LegalPage as Page,
} from "@/lib/legal/copy";
import { LegalText } from "./legal-text";
import styles from "./legal-page.module.css";

/** One legal or contact page: the head, its sections, and the seller line. */
export function LegalPage({ page, icon }: { page: Page; icon: LucideIcon }) {
  return (
    <main id="main" className={shell.page}>
      <div className={shell.inner}>
        <PageHead
          crumb={page.crumb}
          eyebrow="MigrateLens policies"
          icon={icon}
          title={page.title}
          intro={page.intro}
          meta={legalNotices()}
        />
        <div className={styles.body}>
          {page.sections.map((section) => (
            <section key={section.heading} className={styles.section}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph, i) => (
                <LegalText key={i} paragraph={paragraph} />
              ))}
            </section>
          ))}
          <footer className={styles.seller}>
            <p>{NOT_ADVICE}</p>
            <p>
              <LegalText paragraph={SELLER_LINE} bare />
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
