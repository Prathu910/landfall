import section from "./section.module.css";
import styles from "./method-note.module.css";

/** "Very strong: your points are…" becomes a bold term and its rule. */
function split(line: string): [string, string] {
  const colon = line.indexOf(":");
  if (colon < 0) return ["", line];
  return [line.slice(0, colon + 1), line.slice(colon + 1)];
}

/**
 * "How we label your outlook": the label rules in plain sentences. The
 * printed copy sets `anchor` false so the page keeps one #method.
 */
export function MethodNote({
  lines,
  anchor = true,
}: {
  lines: string[];
  anchor?: boolean;
}) {
  return (
    <section
      id={anchor ? "method" : undefined}
      className={`${section.band} ${styles.method}`}
    >
      <h2 className={section.h2}>How we label your outlook</h2>
      <ul className={styles.list}>
        {lines.map((line) => {
          const [term, rule] = split(line);
          return (
            <li key={line}>
              {term && <b>{term}</b>}
              {rule}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
