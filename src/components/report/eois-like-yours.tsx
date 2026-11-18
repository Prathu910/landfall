import type { Interval } from "../../lib/data/types";
import type { EoisLikeYours as View } from "../../lib/report/eois-like-yours";
import { LoadingData } from "./loading-data";
import { segmentWidth } from "./queue-bar";
import styles from "./panel-189.module.css";

type Ready = Extract<View, { kind: "ready" }>;

const OUTCOMES = [
  { key: "invited", label: "Invited" },
  { key: "lodged", label: "Lodged a visa" },
  { key: "waiting", label: "Still waiting" },
  { key: "closed", label: "Closed" },
] as const;

function Ready({ view }: { view: Ready }) {
  const { bar } = view;
  const total: Interval = [
    bar.invited,
    bar.lodged,
    bar.waiting,
    bar.closed,
  ].reduce((a, b) => ({ min: a.min + b.min, max: a.max + b.max }), {
    min: 0,
    max: 0,
  });
  const aria = OUTCOMES.map((o) => `${o.label}: ${view.numbers[o.key]}`).join(
    "; ",
  );
  return (
    <>
      <p className={styles.lead}>{view.sentence}</p>
      {view.basisNote ? <p className={styles.note}>{view.basisNote}</p> : null}
      <dl className={styles.stats}>
        {OUTCOMES.map((o) => (
          <div key={o.key}>
            <dt>{o.label}</dt>
            <dd>{view.numbers[o.key]}</dd>
          </div>
        ))}
        {view.numbers.hold ? (
          <div>
            <dt>On hold</dt>
            <dd>{view.numbers.hold}</dd>
          </div>
        ) : null}
      </dl>
      <div className={styles.stack} role="img" aria-label={aria}>
        {OUTCOMES.map((o) => (
          <span
            key={o.key}
            className={styles[o.key]}
            style={{ width: segmentWidth(bar[o.key], total) }}
          />
        ))}
      </div>
      <ul className={styles.legend}>
        {OUTCOMES.map((o) => (
          <li key={o.key}>
            <i className={styles[o.key]} aria-hidden="true" />
            {o.label}
          </li>
        ))}
      </ul>
      <p className={styles.note}>{view.closedNote}</p>
      <details className={styles.details} open>
        <summary>Compare with nearby months</summary>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Submitted</th>
                <th scope="col">Invited</th>
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
