import {
  confirmHandler,
  orderHandler,
  webhookHandler,
} from "../functions/_shared/report/handlers.ts";
import { sha256Hex } from "../functions/_shared/report/crypto.ts";
import { hmacHex } from "../functions/_shared/report/razorpay.ts";
import captured from "./fixtures/razorpay-payment-captured.json" with { type: "json" };
import orderPaid from "./fixtures/razorpay-order-paid.json" with { type: "json" };
import refunded from "./fixtures/razorpay-refund-processed.json" with { type: "json" };
import {
  AS_OF,
  browser,
  ENV,
  equal,
  PROFILE,
  SUPABASE,
  world,
  type World,
} from "./report_fake.ts";

const PAYMENT = "pay_BUYER1";

/** A pending paid order for the fixture profile: order_FAKE1 at ₹699. */
async function paidOrder(w: World): Promise<string> {
  w.db.settings.founding_enabled = false;
  const res = await orderHandler(w.deps)(
    browser("report-order", {
      profile: PROFILE,
      email: "buyer@example.com",
      currency: "INR",
      consent: true,
      asOf: AS_OF,
      turnstile_token: "ok",
    }),
  );
  const body = await res.json();
  if (body.kind !== "razorpay") throw new Error(JSON.stringify(body));
  return body.orderId;
}

async function confirm(
  w: World,
  orderId: string,
  paymentId = PAYMENT,
  secret = ENV.RAZORPAY_KEY_SECRET,
) {
  const signature = await hmacHex(secret, `${orderId}|${paymentId}`);
  const res = await confirmHandler(w.deps)(
    browser("report-confirm", { orderId, paymentId, signature }),
  );
  return { status: res.status, body: await res.json() };
}

type Fixture = typeof captured | typeof orderPaid | typeof refunded;

/** A fixture event re-pointed at our order and payment, as Razorpay would sign it. */
function event(
  fixture: Fixture,
  orderId: string,
  change: { amount?: number; currency?: string; name?: string } = {},
) {
  const copy = JSON.parse(JSON.stringify(fixture));
  if (change.name) copy.event = change.name;
  const payment = copy.payload.payment.entity;
  payment.id = PAYMENT;
  payment.order_id = orderId;
  if (change.amount !== undefined) payment.amount = change.amount;
  if (change.currency) payment.currency = change.currency;
  if (copy.payload.refund) copy.payload.refund.entity.payment_id = PAYMENT;
  if (copy.payload.order) copy.payload.order.entity.id = orderId;
  return JSON.stringify(copy);
}

async function webhook(w: World, raw: string, signature?: string | null) {
  const headers = new Headers({ "Content-Type": "application/json" });
  const sig =
    signature === undefined
      ? await hmacHex(ENV.RAZORPAY_WEBHOOK_SECRET, raw)
      : signature;
  if (sig !== null) headers.set("X-Razorpay-Signature", sig);
  const res = await webhookHandler(w.deps)(
    new Request(`${SUPABASE}/functions/v1/razorpay-webhook`, {
      method: "POST",
      headers,
      body: raw,
    }),
  );
  return { status: res.status, body: await res.json() };
}

Deno.test("confirm issues and returns the token", async () => {
  const w = world();
  const orderId = await paidOrder(w);
  const { status, body } = await confirm(w, orderId);
  equal(status, 200);
  equal(body.kind, "issued");
  equal(w.db.reports.length, 1);
  const report = w.db.reports[0];
  equal(report.token_hash, await sha256Hex(body.token));
  equal(report.kind, "paid");
  equal(report.email, "buyer@example.com");
  equal(w.db.orders[0].status, "paid");
  equal(w.db.orders[0].razorpay_payment_id, PAYMENT);
  const issue = w.rpcCalls.find((call) => call.name === "paid_issue")!;
  equal((issue.args.p as { amount: number }).amount, 69900);
  equal((issue.args.p as { currency: string }).currency, "INR");
});

Deno.test("webhook after confirm changes nothing", async () => {
  const w = world();
  const orderId = await paidOrder(w);
  const confirmed = await confirm(w, orderId);
  const before = JSON.stringify(w.db.reports);
  for (const fixture of [captured, orderPaid]) {
    const { status } = await webhook(w, event(fixture, orderId));
    equal(status, 200);
  }
  equal(JSON.stringify(w.db.reports), before);
  equal(w.db.reports[0].token_hash, await sha256Hex(confirmed.body.token));
  equal(w.rpcCalls.filter((c) => c.name === "paid_issue").length, 1);
});

Deno.test(
  "confirm after webhook returns pending, and the email is queued once",
  async () => {
    const w = world();
    const orderId = await paidOrder(w);
    equal((await webhook(w, event(captured, orderId))).status, 200);
    equal(w.db.reports.length, 1);
    equal(w.db.reports[0].email_status, "pending");
    const { status, body } = await confirm(w, orderId);
    equal(status, 200);
    equal(body, { kind: "error", code: "pending" });
    equal(w.db.reports.length, 1);
    equal(w.emails.length, 0);
  },
);

Deno.test(
  "confirm racing the webhook: one report, the loser gets pending",
  async () => {
    const w = world();
    const orderId = await paidOrder(w);
    // The webhook issues between confirm's order read and its issue call.
    const issue = w.db.rpc_paid_issue.bind(w.db);
    let raced = false;
    w.db.rpc_paid_issue = (args) => {
      if (!raced) {
        raced = true;
        const p = args.p as Record<string, unknown>;
        issue({
          p: {
            ...p,
            report: { ...(p.report as object), token_hash: "f".repeat(64) },
          },
        });
      }
      return issue(args);
    };
    equal((await confirm(w, orderId)).body, { kind: "error", code: "pending" });
    equal(w.db.reports.length, 1);
  },
);

Deno.test("bad signature: 400, nothing stored", async () => {
  const w = world();
  const orderId = await paidOrder(w);
  const calls = w.rpcCalls.length;
  const { status, body } = await confirm(w, orderId, PAYMENT, "wrong-secret");
  equal(status, 400);
  equal(body, { kind: "error", code: "signature" });
  equal(w.rpcCalls.length, calls);
  equal(w.db.reports.length, 0);
  equal(w.db.orders[0].status, "created");
  const malformed = await confirmHandler(w.deps)(
    browser("report-confirm", { orderId, paymentId: PAYMENT }),
  );
  equal(malformed.status, 400);
});

Deno.test("webhook amount mismatch: no report, order failed", async () => {
  const w = world();
  const orderId = await paidOrder(w);
  equal(
    (await webhook(w, event(captured, orderId, { amount: 100 }))).status,
    200,
  );
  equal(w.db.reports.length, 0);
  equal(w.db.orders[0].status, "failed");
  equal(w.db.orders[0].failure_reason, "amount-mismatch");
  // A later confirm for the same order can't issue either.
  equal((await confirm(w, orderId)).body, { kind: "error", code: "signature" });
  equal((await webhook(w, event(captured, orderId))).status, 200);
  equal(w.db.reports.length, 0);
  const usd = world();
  const usdOrder = await paidOrder(usd);
  await webhook(usd, event(captured, usdOrder, { currency: "USD" }));
  equal(usd.db.orders[0].failure_reason, "amount-mismatch");
});

Deno.test("refund revokes the report", async () => {
  const w = world();
  const orderId = await paidOrder(w);
  await confirm(w, orderId);
  equal((await webhook(w, event(refunded, orderId))).status, 200);
  equal(w.db.reports[0].status, "revoked");
  equal(w.db.reports[0].token_enc, null);
  equal(w.db.orders[0].status, "refunded");
});

Deno.test(
  "refund before issue: a later capture or confirm issues nothing",
  async () => {
    const w = world();
    const orderId = await paidOrder(w);
    equal((await webhook(w, event(refunded, orderId))).status, 200);
    equal(w.db.orders[0].status, "refunded");
    equal((await webhook(w, event(captured, orderId))).status, 200);
    equal((await confirm(w, orderId)).body, {
      kind: "error",
      code: "signature",
    });
    equal(w.db.reports.length, 0);
  },
);

Deno.test("unknown events: 200, ignored", async () => {
  const w = world();
  const orderId = await paidOrder(w);
  for (const name of ["payment.failed", "payment.authorized", "invoice.paid"]) {
    const { status } = await webhook(w, event(captured, orderId, { name }));
    equal(status, 200);
  }
  const foreign = await webhook(w, event(captured, "order_NOTOURS1"));
  equal(foreign.status, 200);
  equal(await webhook(w, JSON.stringify({ hello: "world" })), {
    status: 200,
    body: { ok: true },
  });
  equal(w.db.reports.length, 0);
  equal(
    w.rpcCalls.some((c) => c.name === "paid_issue"),
    false,
  );
});

Deno.test("unsigned webhook: 401", async () => {
  const w = world();
  const orderId = await paidOrder(w);
  const raw = event(captured, orderId);
  equal((await webhook(w, raw, null)).status, 401);
  equal((await webhook(w, raw, "0".repeat(64))).status, 401);
  const tampered = raw.replace("69900", "69901");
  equal(
    (
      await webhook(
        w,
        tampered,
        await hmacHex(ENV.RAZORPAY_WEBHOOK_SECRET, raw),
      )
    ).status,
    401,
  );
  equal(w.db.reports.length, 0);
  const get = await webhookHandler(w.deps)(
    new Request(`${SUPABASE}/functions/v1/razorpay-webhook`),
  );
  equal(get.status, 405);
});

Deno.test("webhook: site data down is 500 so Razorpay retries", async () => {
  const w = world();
  const orderId = await paidOrder(w);
  w.state.siteDown = true;
  equal((await webhook(w, event(captured, orderId))).status, 500);
  w.state.siteDown = false;
  equal((await webhook(w, event(captured, orderId))).status, 200);
  equal(w.db.reports.length, 1);
});

Deno.test(
  "paid but the occupation lost its data: order failed, founder alerted",
  async () => {
    const w = world();
    const orderId = await paidOrder(w);
    w.site.delete("/data/occupations/261313.json");
    equal((await webhook(w, event(captured, orderId))).status, 200);
    equal(w.db.orders[0].status, "failed");
    equal(w.db.orders[0].failure_reason, "no-data");
    equal(w.emails.length, 1);
    equal(w.emails[0].to, "hello@migratelens.com");
    equal(w.emails[0].text.includes(orderId), true);
    equal(w.emails[0].text.includes("buyer@example.com"), false);
    equal(w.emails[0].text.includes("Rahul"), false);
    equal((await confirm(w, orderId)).body, {
      kind: "error",
      code: "signature",
    });
  },
);
