import type { EoisLikeYours as View } from "../../lib/report/eois-like-yours";
import { LoadingData } from "./loading-data";
import { OutcomeBar, type OutcomeView } from "./outcome-bar";
import styles from "./panel-189.module.css";

function Ready({ view }: { view: OutcomeView }) {
  return (
    <>
      <p className={styles.lead}>{view.sentence}</p>
      {view.basisNote ? <p className={styles.note}>{view.basisNote}</p> : null}
      <p className={styles.note}>{view.statusNote}</p>
      <dl className={styles.stats}>
        {view.outcomes.map((o) => (
          <div key={o.key}>
            <dt>{o.label}</dt>
            <dd>{o.count}</dd>
          </div>
        ))}
      </dl>
      <OutcomeBar view={view} />
      <p className={styles.note}>{view.closedNote}</p>
      <details className={styles.details} open>
        <summary>Compare with nearby months</summary>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="sr-only">
              EOIs submitted in nearby months, by outcome
            </caption>
            <thead>
              <tr>
                <th scope="col">Submitted</th>
                <th scope="col">Invited, not yet lodged</th>
                <th scope="col">Lodged</th>
                <th scope="col">Waiting</th>
                <th scope="col">Closed</th>
              </tr>
            </thead>
            <tbody>
              {view.nearby.map((row) => (
                <tr
                  key={row.month}
                  className={row.isYours ? styles.you : undefined}
                >
                  <th scope="row">
                    {row.label}
                    {row.isYours ? " (you)" : ""}
                  </th>
                  <td>{row.invited}</td>
                  <td>{row.lodged}</td>
                  <td>{row.waiting}</td>
                  <td>{row.closed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

export function EoisLikeYours({ view }: { view: View }) {
  switch (view.kind) {
    case "loading":
      return <LoadingData />;
    case "ready":
      return <Ready view={view} />;
    default:
      return <p className={styles.note}>{view.text}</p>;
  }
}
