import { LegalText } from "@/components/legal/legal-text";
import styles from "@/components/legal/legal-page.module.css";
import type { AboutSection } from "@/lib/about/copy";

/** The About page's sections, each with its anchor, on the legal pages' cards. */
export function AboutSections({ sections }: { sections: AboutSection[] }) {
  return (
    <div className={styles.body}>
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className={styles.section}
          aria-labelledby={`${section.id}-h`}
        >
          <h2 id={`${section.id}-h`}>{section.heading}</h2>
          {section.paragraphs.map((paragraph, i) => (
            <LegalText key={i} paragraph={paragraph} />
          ))}
        </section>
      ))}
    </div>
  );
}
