// POST razorpay-webhook. No browser origin: Razorpay authenticates with
// X-Razorpay-Signature over the raw body, and anything unsigned gets 401.
// payment.captured and order.paid issue (idempotently), refund.processed
// revokes; every other event answers 200 and is ignored. A failure answers
// 500 so Razorpay retries; the body never carries detail.

import { readText, RequestError, response } from "../http.ts";
import { database } from "./db.ts";
import { type Deps, setting } from "./endpoint.ts";
import { issuePaid } from "./paid.ts";
import {
  parseRazorpayEvent,
  type RazorpayEvent,
  validWebhookSignature,
} from "./razorpay.ts";

/** Razorpay's event bodies are a few KB; this leaves room for notes. */
const WEBHOOK_LIMIT = 64 * 1024;

async function handle(deps: Deps, event: RazorpayEvent): Promise<void> {
  const rpc = database(deps);
  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payment;
    if (!payment || payment.status !== "captured") return;
    await issuePaid(deps, rpc, {
      orderId: payment.order_id,
      paymentId: payment.id,
      paid: { amount: payment.amount, currency: payment.currency },
    });
    return;
  }
  if (event.event === "refund.processed" && event.refund) {
    await rpc("report_refund", {
      p_payment_id: event.refund.payment_id,
      p_razorpay_order_id: event.payment?.order_id ?? null,
    });
  }
}

export function webhookHandler(deps: Deps) {
  return async (request: Request): Promise<Response> => {
    try {
      if (request.method !== "POST")
        return response(405, { error: "Use POST." });
      const secret = setting(deps, "RAZORPAY_WEBHOOK_SECRET");
      const raw = await readText(request, WEBHOOK_LIMIT);
      const signature = request.headers.get("X-Razorpay-Signature") ?? "";
      if (!(await validWebhookSignature(raw, signature, secret)))
        return response(401, { error: "Signature required." });
      let event: RazorpayEvent | null = null;
      try {
        event = parseRazorpayEvent(JSON.parse(raw));
      } catch {
        event = null;
      }
      if (event) await handle(deps, event);
      return response(200, { ok: true });
    } catch (error) {
      if (error instanceof RequestError)
        return response(error.status, { error: "Bad request." });
      return response(500, { error: "Try again." });
    }
  };
}
