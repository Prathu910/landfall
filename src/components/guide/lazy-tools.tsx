"use client";
import dynamic from "next/dynamic";
import styles from "./lazy-tools.module.css";

/**
 * The quick check and the cost estimator load as their own chunks after the
 * page, client only: their controls aren't indexable text, and the sections'
 * explanations stay server-rendered. Each placeholder reserves about the
 * height its tool first renders at (lazy-tools.module.css), so the page
 * below doesn't jump.
 */
type Tool = "quick" | "quickHub" | "costs" | "costsState";

function placeholder(tool: Tool, text: string) {
  function ToolPlaceholder() {
    return (
      <div className={styles.placeholder} data-tool={tool} aria-busy="true">
        <p className={styles.text}>{text}</p>
      </div>
    );
  }
  return ToolPlaceholder;
}

const QUICK = "Loading the points calculator…";

export const LazyQuickCheck = dynamic(
  () => import("./quick-check").then((m) => m.QuickCheck),
  { ssr: false, loading: placeholder("quick", QUICK) },
);

/** The hub's quick check also shows the per-visa table, so it starts taller. */
export const LazyHubQuickCheck = dynamic(
  () => import("./quick-check").then((m) => m.QuickCheck),
  { ssr: false, loading: placeholder("quickHub", QUICK) },
);

const COSTS = "Loading the cost estimator…";

/** The 189's estimator (also the hub's): no nominating state picker. */
export const LazyCostEstimator = dynamic(
  () => import("./cost-estimator").then((m) => m.CostEstimator),
  { ssr: false, loading: placeholder("costs", COSTS) },
);

/** The 190 and 491 estimators add the nominating state picker. */
export const LazyStateCostEstimator = dynamic(
  () => import("./cost-estimator").then((m) => m.CostEstimator),
  { ssr: false, loading: placeholder("costsState", COSTS) },
);
