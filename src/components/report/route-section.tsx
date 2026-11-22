import type { Route } from "@/lib/outlook/route";
import { RouteLine } from "./route-line";
import { RouteList } from "./route-list";
import section from "./section.module.css";
import styles from "./route-section.module.css";

/** "Your best route": the steps in order, with dated risks between them. */
export function RouteSection({ route }: { route: Route }) {
  return (
    <section id="route" className={section.band}>
      <h2 className={section.h2}>Your best route</h2>
      <p className={section.sub}>
        What we&apos;d do with your profile, in order, and the dates that work
        against you.
      </p>
      <div className={styles.line}>
        <RouteLine route={route} />
      </div>
      <div className={styles.list}>
        <RouteList route={route} />
      </div>
    </section>
  );
}
