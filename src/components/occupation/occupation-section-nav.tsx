import styles from "./occupation-section-nav.module.css";

export function OccupationSectionNav({
  hasRounds,
  hasCohorts,
}: {
  hasRounds: boolean;
  hasCohorts: boolean;
}) {
  return (
    <nav className={styles.sections} aria-label="On this page">
      <a href="#pool-heading">EOI pools</a>
      {hasRounds && <a href="#rounds-heading">189 rounds</a>}
      {hasCohorts && <a href="#cohort-heading">EOI outcomes</a>}
      <a href="#states-heading">State nomination</a>
      <a href="#faq-heading">Questions</a>
    </nav>
  );
}
