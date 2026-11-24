import styles from "./guide-contents.module.css";

/** "On this page": jump links to the guide's sections. */
export function GuideContents({
  items,
}: {
  items: { id: string; label: string }[];
}) {
  return (
    <nav className={styles.contents} aria-label="On this page">
      <p className={styles.title}>On this page</p>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>{item.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
