import Link from "next/link";
import styles from "./related-occupations.module.css";

export function RelatedOccupations({
  items,
  unitGroup,
}: {
  items: { code: string; name: string; path: string }[];
  unitGroup: string;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="related-occupations">
      <h2 id="related-occupations" className={styles.heading}>
        Related occupations (ANZSCO unit group {unitGroup})
      </h2>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.code}>
            <Link href={item.path} className={styles.link}>
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
