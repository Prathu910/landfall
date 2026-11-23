import styles from "./methodology.module.css";

// Other pages link to #sources, #pool, #limitations and #privacy: keep the ids.
const SECTIONS = [
  ["sources", "Our sources"],
  ["pool", "Reading the pool"],
  ["points", "Points & dates"],
  ["limitations", "Limitations"],
  ["definitions", "Useful definitions"],
  ["privacy", "Your privacy"],
  ["questions", "Common questions"],
] as const;

export function MethodContents() {
  return (
    <nav className={styles.contents} aria-labelledby="method-contents">
      <p id="method-contents" className={styles.contentsTitle}>
        On this page
      </p>
      <ol>
        {SECTIONS.map(([id, label], index) => (
          <li key={id}>
            <a href={`#${id}`}>
              <span aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
