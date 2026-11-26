// Issues the report for a paid Razorpay order, from report-confirm or the
// webhook (whichever comes first; paid_issue keeps the first token). Only a
// pending ('created') order issues: a paid one already has its report, and
// a failed or refunded one must never get one (paid_issue checks this again
// under the order row lock). The report is built from the data snapshot the
// order stored when it was quoted (ruling R10), so the live month can't fail
// an order that was paid: anything that stops the build throws, and the
// caller answers busy or 500 so it is retried. So that a paid order that
// never builds is still found and refunded (ruling R12), the payment id is
// recorded on the order before the build, and the first failed build
// alerts the founder, once per order. An order that already has its report
// (ruling R13, R14): a capture of another payment alerts the founder to
// refund it, and report-confirm for the issuing payment gets the report's
// token back, so a buyer whose webhook won the race still sees the report.

import { parseProfile } from "../report-engine.js";
import { sendAlert } from "./alert.ts";
import { decryptToken } from "./crypto.ts";
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
  /** The founder was already alerted that this order couldn't be built. */
  alerted: boolean;
  /** The payment that issued the report, or the one recorded before the build. */
  payment_id: string | null;
};

type PaidIssue =
  | { status: "issued" | "existing"; report_no: string }
  | { status: "mismatch" | "unknown-order" | "refunded" | "failed" };

export type PaidOutcome =
  | { kind: "issued"; token: string }
  | { kind: "existing" }
  | { kind: "refused" }
  | { kind: "unknown" };

type Paid = {
  orderId: string;
  paymentId: string;
  paid?: { amount: number; currency: string };
  /** report-confirm shows the report, so it wants the token even when the webhook issued first. */
  wantsToken?: boolean;
};

/** The report for a pending order, from its snapshot; throws when it can't be built yet. */
async function buildPaid(deps: Deps, order: PaidOrder) {
  const profile = parseProfile(order.profile);
  if (!profile) throw new Error("Stored order profile unreadable");
  const site = setting(deps, "REPORT_SITE_URL");
  // An order stored before snapshots falls back to the live month; if that
  // month is unusable now (a deploy in progress), retry rather than fail.
  const loaded = order.engine_data
    ? await rebuildEngineData(site, order.engine_data, deps.fetch)
    : await loadEngineData(site, profile.occupation, deps.fetch);
  if (!loaded) throw new Error("Paid order data not buildable yet");
  return prepareReport(deps, loaded, profile, order.as_of);
}

/**
 * Tells the founder, once per order, that a captured payment has no report
 * yet. Marked only after the email went out, so a failed alert is tried
 * again on the next retry; a race between two retries sends the same
 * idempotency key, which Resend sends once.
 */
async function alertUnbuilt(deps: Deps, rpc: Rpc, paid: Paid): Promise<void> {
  const sent = await sendAlert(
    deps,
    `Paid order not issued yet: ${paid.orderId}`,
    `Payment ${paid.paymentId} for order ${paid.orderId} was captured, but its report couldn't be built. ` +
      "It is retried with every Razorpay webhook delivery (for about 24 hours) and every confirm. " +
      "If it isn't issued within 15 minutes, check the founder query for paid orders and refund it in Razorpay.",
    `unbuilt-${paid.orderId}`,
  );
  if (!sent) return;
  try {
    await rpc("paid_order_alerted", { p_razorpay_order_id: paid.orderId });
  } catch {
    // Unmarked, the next retry alerts again with the same idempotency key.
  }
}

/** A second payment captured on an order whose report another payment issued. */
async function alertDuplicate(deps: Deps, paid: Paid, issuing: string) {
  await sendAlert(
    deps,
    `Duplicate payment, refund it: ${paid.paymentId}`,
    `Payment ${paid.paymentId} was captured on order ${paid.orderId}, whose report was already issued for payment ${issuing}. ` +
      `Refund ${paid.paymentId} in Razorpay; that refund leaves the report in place.`,
    `duplicate-${paid.paymentId}`,
  );
}

/**
 * An order that already has its report. The issuing payment gets its token
 * back when the caller wants it (null once delivery cleared it); any other
 * payment is a duplicate.
 */
async function settled(
  deps: Deps,
  rpc: Rpc,
  paid: Paid,
  issuing: string | null,
): Promise<PaidOutcome> {
  if (issuing !== paid.paymentId) {
    if (issuing) await alertDuplicate(deps, paid, issuing);
    return { kind: "existing" };
  }
  if (!paid.wantsToken) return { kind: "existing" };
  const sealed = await rpc<string | null>("paid_order_token", {
    p_razorpay_order_id: paid.orderId,
    p_payment_id: paid.paymentId,
  });
  if (!sealed) return { kind: "existing" };
  const key = setting(deps, "REPORT_TOKEN_KEY");
  return { kind: "issued", token: await decryptToken(sealed, key) };
}

/**
 * `paid` is what was paid: the webhook passes the event's amount and
 * currency (a mismatch fails the order); report-confirm passes none, so the
 * order's own are used (the signature proves payment for that order).
 * Site data down, or a snapshot that can't be built, throws.
 */
export async function issuePaid(
  deps: Deps,
  rpc: Rpc,
  paid: Paid,
): Promise<PaidOutcome> {
  const order = await rpc<PaidOrder | null>("paid_order_get", {
    p_razorpay_order_id: paid.orderId,
  });
  if (!order) return { kind: "unknown" };
  if (order.status === "paid")
    return settled(deps, rpc, paid, order.payment_id);
  if (order.status !== "created") return { kind: "refused" };
  // Before the build, so a paid order that can't be built yet shows in the
  // founder query; the order stays 'created' and still issues on a retry.
  await rpc("paid_order_payment", {
    p_razorpay_order_id: paid.orderId,
    p_payment_id: paid.paymentId,
  });
  let built;
  try {
    built = await buildPaid(deps, order);
  } catch (error) {
    if (!order.alerted) await alertUnbuilt(deps, rpc, paid);
    throw error;
  }
  const { token, report } = built;
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
  if (result.status === "existing") {
    // Another call issued it meanwhile: read whose payment it was.
    const now = await rpc<PaidOrder | null>("paid_order_get", {
      p_razorpay_order_id: paid.orderId,
    });
    return settled(deps, rpc, paid, now?.payment_id ?? null);
  }
  return { kind: "refused" };
}
