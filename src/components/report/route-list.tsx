import type { CSSProperties } from "react";
import { labelName } from "@/lib/outlook/labels";
import { routeAria } from "@/lib/outlook/route-geometry";
import type { Route } from "@/lib/outlook/route";
import { labelInk } from "./label-ink";
import styles from "./route-list.module.css";

/** The narrow-screen route: one vertical list, deadlines between steps. */
export function RouteList({ route }: { route: Route }) {
  return (
    <ol className={styles.list} aria-label={routeAria(route)}>
      {route.steps.flatMap((step, i) => {
        const items = [
          <li
            key={`step-${i}`}
            className={styles.step}
            style={{ "--step-ink": labelInk(step.label) } as CSSProperties}
          >
            <span
              className={step.points === null ? styles.hollow : styles.dot}
              aria-hidden="true"
            >
              {step.points}
            </span>
            <div>
              <b className={styles.title}>{step.title}</b>
              {step.points !== null && (
                <span className={styles.hidden}>{step.points} points. </span>
              )}
              {step.label && (
                <span className={styles.chip}>{labelName(step.label)}</span>
              )}
              <span className={styles.sub}>{step.sub}</span>
            </div>
          </li>,
        ];
        for (const deadline of route.deadlines) {
          if (deadline.afterStep !== i) continue;
          items.push(
            <li
              key={`deadline-${i}-${deadline.title}`}
              className={styles.deadline}
            >
              <span className={styles.pin} aria-hidden="true" />
              <div className={styles.flag}>
                <b>{deadline.title}</b>
              </div>
            </li>,
          );
        }
        return items;
      })}
    </ol>
  );
}
