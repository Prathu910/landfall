import type { PointsPage as Page } from "@/lib/outlook/points-page";
import section from "./section.module.css";
import styles from "./points-page.module.css";

function Photo() {
  return (
    <div className={styles.photo} aria-hidden="true">
      <svg viewBox="0 0 130 164">
        <circle className={styles.silhouette} cx="65" cy="66" r="29" />
        <path
          className={styles.silhouette}
          d="M12 164 C 18 112, 112 112, 118 164 Z"
        />
      </svg>
    </div>
  );
}

/** "Your points, in full": the whole profile, so anyone it's shared with sees the inputs. */
export function PointsPage({
  page,
  warnings,
}: {
  page: Page;
  /** The points calculation's assumptions, for the reader to check. */
  warnings: string[];
}) {
  return (
    <section id="points" className={section.band}>
      <h2 className={section.h2}>Your points, in full</h2>
      <p className={section.sub}>
        Your whole profile, so anyone you share this with sees exactly what you
        told us.
      </p>
      <div className={styles.page}>
        <Photo />
        <div>
          <dl className={styles.fields}>
            {page.fields.map((field) => (
              <div key={field.label}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
          <table className={styles.table}>
            <caption className="sr-only">Points by category</caption>
            <tbody>
              {page.rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td className={styles.detail}>{row.detail}</td>
                  <td className={styles.number}>{row.points}</td>
                </tr>
              ))}
              {page.zero && (
                <tr className={styles.zero}>
                  <th scope="row">{page.zero}</th>
                  <td className={styles.detail}>None</td>
                  <td className={styles.number}>0</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className={styles.totals}>
            {page.totals.map((total) => (
              <div key={total.label} className={styles.total}>
                <b>{total.points}</b>
                {total.label}
              </div>
            ))}
          </div>
          {warnings.length > 0 && (
            <ul
              className={styles.warnings}
              aria-label="Assumptions behind your points"
            >
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className={styles.mrz} aria-hidden="true">
        {page.mrz.join("\n")}
      </div>
    </section>
  );
}
