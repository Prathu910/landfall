// Issues the report for a paid Razorpay order, from report-confirm or the
// webhook (whichever comes first; paid_issue keeps the first token). Only a
// pending ('created') order issues: a paid one already has its report, and
// a failed or refunded one must never get one (paid_issue checks this again
// under the order row lock). The report is built from the data snapshot the
// order stored when it was quoted (ruling R10), so the live month can't fail
// an order that was paid: anything that stops the build throws, and the
// caller answers busy or 500 so it is retried.

import { parseProfile } from "../report-engine.js";
import { loadEngineData, rebuildEngineData } from "./data.ts";
import type { Rpc } from "./db.ts";
import { type Deps, setting } from "./endpoint.ts";
import { prepareReport } from "./issue.ts";

type PaidOrder = {
  email: string;
  currency: string;
  amount: number;
  profile: unknown;
  /** The {core, detail, checkedAt} snapshot from report-order; null on an order stored before it. */
  engine_data: unknown;
  as_of: string;
  status: "created" | "paid" | "refunded" | "failed";
};

type PaidIssue =
  | { status: "issued" | "existing"; report_no: string }
  | { status: "mismatch" | "unknown-order" | "refunded" | "failed" };

export type PaidOutcome =
  | { kind: "issued"; token: string }
  | { kind: "existing" }
  | { kind: "refused" }
  | { kind: "unknown" };

/**
 * `paid` is what was paid: the webhook passes the event's amount and
 * currency (a mismatch fails the order); report-confirm passes none, so the
 * order's own are used (the signature proves payment for that order).
 * Site data down, or a snapshot that can't be built, throws.
 */
export async function issuePaid(
  deps: Deps,
  rpc: Rpc,
  paid: {
    orderId: string;
    paymentId: string;
    paid?: { amount: number; currency: string };
  },
): Promise<PaidOutcome> {
  const order = await rpc<PaidOrder | null>("paid_order_get", {
    p_razorpay_order_id: paid.orderId,
  });
  if (!order) return { kind: "unknown" };
  if (order.status === "paid") return { kind: "existing" };
  if (order.status !== "created") return { kind: "refused" };
  const profile = parseProfile(order.profile);
  if (!profile) throw new Error("Stored order profile unreadable");
  const site = setting(deps, "REPORT_SITE_URL");
  // An order stored before snapshots falls back to the live month; if that
  // month is unusable now (a deploy in progress), retry rather than fail.
  const loaded = order.engine_data
    ? await rebuildEngineData(site, order.engine_data, deps.fetch)
    : await loadEngineData(site, profile.occupation, deps.fetch);
  if (!loaded) throw new Error("Paid order data not buildable yet");
  const { token, report } = await prepareReport(
    deps,
    loaded,
    profile,
    order.as_of,
  );
  const { amount, currency } = paid.paid ?? order;
  const result = await rpc<PaidIssue>("paid_issue", {
    p: {
      razorpay_order_id: paid.orderId,
      razorpay_payment_id: paid.paymentId,
      amount,
      currency,
      report,
    },
  });
  if (result.status === "issued") return { kind: "issued", token };
  if (result.status === "existing") return { kind: "existing" };
  return { kind: "refused" };
}
