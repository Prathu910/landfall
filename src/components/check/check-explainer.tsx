import Link from "next/link";
import type { PointsInBrief } from "@/lib/guide/points-table";
import styles from "./check-explainer.module.css";

/**
 * What the check does, server-rendered under the form (audit A-P1-5), so
 * crawlers that don't run JavaScript see more than an empty form.
 */
export function CheckExplainer({
  passMark,
  dataDate,
  dataDateTime,
  factors,
}: {
  passMark: number;
  /** "31 Oct 2026". */
  dataDate: string;
  dataDateTime: string;
  factors: PointsInBrief[];
}) {
  return (
    <section className={styles.explainer} aria-labelledby="how-check-h">
      <div className={styles.copy}>
        <h2 id="how-check-h">How the points test works</h2>
        <p>
          The Australian points test pass mark is {passMark}. This free check
          adds up your points for the 189, 190 (with 5 nomination points) and
          491 (with 15) in your browser, and shows where they sit in SkillSelect
          data as at <time dateTime={dataDateTime}>{dataDate}</time>.
        </p>
        <p>
          Your points and a result for each visa are free, with no account or
          email. Nothing you enter leaves your browser unless you ask for the
          full personal report.
        </p>
        <p>
          <Link href="/guide/points-table/">See the full points table</Link> or{" "}
          <Link href="/guide/">read the step-by-step PR guide</Link>.
        </p>
      </div>
      <table className={styles.table}>
        <caption>Points by factor, in brief</caption>
        <tbody>
          {factors.map((row) => (
            <tr key={row.factor}>
              <th scope="row">{row.factor}</th>
              <td>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
