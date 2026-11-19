import type { Interval } from "../../lib/data/types";
import type { EoisLikeYours } from "../../lib/report/eois-like-yours";
import { segmentWidth } from "./queue-bar";
import styles from "./panel-189.module.css";

export type OutcomeView = Extract<EoisLikeYours, { kind: "ready" }>;

const BAR_KEYS = ["invited", "lodged", "waiting", "closed"] as const;

/**
 * What happened to EOIs from one submission month, as one bar and its key.
 * The report lists the counts beside it; `withCounts` puts every counted
 * outcome (on hold included) in the key, so the bar itself is then hidden
 * from assistive technology to avoid reading the counts twice.
 */
export function OutcomeBar({
  view,
  withCounts = false,
}: {
  view: OutcomeView;
  withCounts?: boolean;
}) {
  const { bar } = view;
  const total: Interval = BAR_KEYS.map((key) => bar[key]).reduce(
    (a, b) => ({ min: a.min + b.min, max: a.max + b.max }),
    { min: 0, max: 0 },
  );
  const barRows = view.outcomes.filter((o) => o.key !== "hold");
  const aria = barRows.map((o) => `${o.label}: ${o.count}`).join("; ");
  const keyRows = withCounts ? view.outcomes : barRows;
  return (
    <>
      <div
        className={styles.stack}
        {...(withCounts
          ? { "aria-hidden": true }
          : { role: "img", "aria-label": aria })}
      >
        {BAR_KEYS.map((key) => (
          <span
            key={key}
            className={styles[key]}
            style={{ width: segmentWidth(bar[key], total) }}
          />
        ))}
      </div>
      <ul className={styles.legend}>
        {keyRows.map((o) => (
          <li key={o.key}>
            {/* On hold is counted but not drawn, so it has no swatch. */}
            {o.key === "hold" ? null : (
              <i className={styles[o.key]} aria-hidden="true" />
            )}
            {o.label}
            {withCounts ? (
              <>
                : <b>{o.count}</b>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
