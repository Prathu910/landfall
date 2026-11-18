import type { Interval } from "../../lib/data/types";
import type { EoisLikeYours } from "../../lib/report/eois-like-yours";
import { segmentWidth } from "./queue-bar";
import styles from "./panel-189.module.css";

export type OutcomeView = Extract<EoisLikeYours, { kind: "ready" }>;

export const OUTCOMES = [
  { key: "invited", label: "Invited, not yet lodged" },
  { key: "lodged", label: "Lodged a visa" },
  { key: "waiting", label: "Still waiting" },
  { key: "closed", label: "Closed" },
] as const;

/**
 * What happened to EOIs from one submission month, as one bar and its key.
 * The report lists the counts beside it; `withCounts` puts them in the key.
 */
export function OutcomeBar({
  view,
  withCounts = false,
}: {
  view: OutcomeView;
  withCounts?: boolean;
}) {
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
            {withCounts ? (
              <>
                : <b>{view.numbers[o.key]}</b>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
