import styles from "./report-footer.module.css";

const LEAD = "This is our best reading of the data, not a guarantee.";

/** The not-a-guarantee footer; the view writes the full sentence (spec 5.9). */
export function ReportFooter({ text }: { text: string }) {
  const rest = text.startsWith(LEAD) ? text.slice(LEAD.length) : ` ${text}`;
  return (
    <footer className={styles.footer}>
      <b>{LEAD}</b>
      {rest}
    </footer>
  );
}
