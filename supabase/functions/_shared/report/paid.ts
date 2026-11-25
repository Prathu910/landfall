// Issues the report for a paid Razorpay order, from report-confirm or the
// webhook (whichever comes first; paid_issue keeps the first token). Only a
// pending ('created') order issues: a paid one already has its report, and
// a failed or refunded one must never get one.

import { parseProfile } from "../report-engine.js";
import { sendAlert } from "./alert.ts";
import { loadEngineData } from "./data.ts";
import type { Rpc } from "./db.ts";
import { type Deps, setting } from "./endpoint.ts";
import { prepareReport } from "./issue.ts";

type PaidOrder = {
  email: string;
  currency: string;
  amount: number;
  profile: unknown;
  as_of: string;
  status: "created" | "paid" | "refunded" | "failed";
};

type PaidIssue =
  | { status: "issued" | "existing"; report_no: string }
  | { status: "mismatch" | "unknown-order" | "refunded" };

export type PaidOutcome =
  | { kind: "issued"; token: string }
  | { kind: "existing" }
  | { kind: "refused" }
  | { kind: "unknown" };

/**
 * `paid` is what was paid: the webhook passes the event's amount and
 * currency (a mismatch fails the order); report-confirm passes none, so the
 * order's own are used (the signature proves payment for that order).
 * Site data down throws.
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
  const loaded = profile
    ? await loadEngineData(
        setting(deps, "REPORT_SITE_URL"),
        profile.occupation,
        deps.fetch,
      )
    : null;
  if (!profile || !loaded) {
    // Paid, but nothing can be built (the occupation lost its data since
    // the order): fail the order and tell the founder, who refunds it.
    await rpc("paid_order_fail", {
      p_razorpay_order_id: paid.orderId,
      p_reason: "no-data",
    });
    await sendAlert(
      deps,
      `Paid order ${paid.orderId} could not be issued`,
      `Payment ${paid.paymentId} for order ${paid.orderId} was received, but its occupation has no published data now, so no report was issued. The order is marked failed (no-data). Refund it in the Razorpay Dashboard.`,
      `fail-${paid.orderId}`,
    );
    return { kind: "refused" };
  }
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
