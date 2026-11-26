import {
  confirmHandler,
  getHandler,
  orderHandler,
  webhookHandler,
} from "../functions/_shared/report/handlers.ts";
import {
  encryptToken,
  newToken,
  sha256Hex,
} from "../functions/_shared/report/crypto.ts";
import { hmacHex } from "../functions/_shared/report/razorpay.ts";
import captured from "./fixtures/razorpay-payment-captured.json" with { type: "json" };
import orderPaid from "./fixtures/razorpay-order-paid.json" with { type: "json" };
import refunded from "./fixtures/razorpay-refund-processed.json" with { type: "json" };
import input from "../../src/lib/report-issue/__fixtures__/engine-input-261313.json" with { type: "json" };
import {
  AS_OF,
  browser,
  ENV,
  equal,
  PROFILE,
  SUPABASE,
  TOKEN_KEY,
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
  change: {
    amount?: number;
    currency?: string;
    name?: string;
    payment?: string;
  } = {},
) {
  const copy = JSON.parse(JSON.stringify(fixture));
  if (change.name) copy.event = change.name;
  const payment = copy.payload.payment.entity;
  const paymentId = change.payment ?? PAYMENT;
  payment.id = paymentId;
  payment.order_id = orderId;
  if (change.amount !== undefined) payment.amount = change.amount;
  if (change.currency) payment.currency = change.currency;
  if (copy.payload.refund) copy.payload.refund.entity.payment_id = paymentId;
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

async function getReport(w: World, token: string) {
  const res = await getHandler(w.deps)(browser("report-get", { token }));
  return (await res.json()) as { kind: string };
}

Deno.test(
  "confirm after webhook returns the webhook's token, which report-get opens (R14)",
  async () => {
    const w = world();
    const orderId = await paidOrder(w);
    equal((await webhook(w, event(captured, orderId))).status, 200);
    equal(w.db.reports.length, 1);
    equal(w.db.reports[0].email_status, "pending");
    const { status, body } = await confirm(w, orderId);
    equal(status, 200);
    equal(body.kind, "issued");
    equal(await sha256Hex(body.token), w.db.reports[0].token_hash);
    equal((await getReport(w, body.token)).kind, "report");
    equal(w.db.reports.length, 1);
    equal(w.emails.length, 0);
    equal(w.rpcCalls.filter((c) => c.name === "paid_issue").length, 1);
  },
);

Deno.test(
  "confirm after webhook: pending once delivery cleared the token, or after a refund",
  async () => {
    const w = world();
    const orderId = await paidOrder(w);
    await webhook(w, event(captured, orderId));
    w.db.reports[0].token_enc = null;
    equal((await confirm(w, orderId)).body, { kind: "error", code: "pending" });
    const r = world();
    const refundedOrder = await paidOrder(r);
    await webhook(r, event(captured, refundedOrder));
    await webhook(r, event(refunded, refundedOrder));
    equal((await confirm(r, refundedOrder)).body, {
      kind: "error",
      code: "signature",
    });
  },
);

Deno.test(
  "confirm racing the webhook: one report, the loser gets the winner's token",
  async () => {
    const w = world();
    const orderId = await paidOrder(w);
    // The webhook issues, with its own token, between confirm's order read
    // and its issue call.
    const winner = await newToken((n) => new Uint8Array(n).fill(7));
    const sealed = await encryptToken(winner.token, TOKEN_KEY);
    const issue = w.db.rpc_paid_issue.bind(w.db);
    let raced = false;
    w.db.rpc_paid_issue = (args) => {
      if (!raced) {
        raced = true;
        const p = args.p as Record<string, unknown>;
        issue({
          p: {
            ...p,
            report: {
              ...(p.report as object),
              token_hash: winner.hash,
              token_enc: sealed,
            },
          },
        });
      }
      return issue(args);
    };
    equal((await confirm(w, orderId)).body, {
      kind: "issued",
      token: winner.token,
    });
    equal(w.db.reports.length, 1);
    equal(w.db.reports[0].token_hash, winner.hash);
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

const SNAPSHOT = {
  core: input.data.core,
  detail: input.data.detail,
  checkedAt: input.data.manifest.checkedAt,
};

/** The site mid-deploy: next month's manifest, and this occupation's core gone. */
function mixedMonth(w: World) {
  w.site.set("/data/manifest.json", {
    ...input.data.manifest,
    asAt: "2026-11",
    checkedAt: "2026-11-30",
  });
  w.site.delete("/data/occupations/261313.json");
  w.site.delete("/data/occupations/261313.detail.json");
}

Deno.test(
  "report-order stores the quoted data on the order (R10)",
  async () => {
    const w = world();
    await paidOrder(w);
    equal(w.db.orders[0].engine_data, SNAPSHOT);
  },
);

for (const via of ["webhook", "confirm"] as const) {
  Deno.test(
    `${via} on a mixed-month site still issues, from the order's snapshot`,
    async () => {
      const w = world();
      const orderId = await paidOrder(w);
      mixedMonth(w);
      if (via === "webhook")
        equal((await webhook(w, event(captured, orderId))).status, 200);
      else equal((await confirm(w, orderId)).body.kind, "issued");
      equal(w.db.reports.length, 1);
      const report = w.db.reports[0];
      equal(report.data_as_at, "2026-10");
      equal(report.engine_data, SNAPSHOT);
      equal(
        (report.payload as { view: { dataMonth: string } }).view.dataMonth,
        "October 2026",
      );
      equal(w.db.orders[0].status, "paid");
      equal(w.db.orders[0].engine_data, null);
      equal(w.emails.length, 0);
    },
  );
}

Deno.test(
  "an order without a snapshot on a mixed-month site: 500 or busy, then a retry issues",
  async () => {
    const w = world();
    const orderId = await paidOrder(w);
    w.db.orders[0].engine_data = null;
    mixedMonth(w);
    equal((await webhook(w, event(captured, orderId))).status, 500);
    const busy = await confirm(w, orderId);
    equal(busy.status, 503);
    equal(busy.body, { kind: "error", code: "busy" });
    equal(w.db.orders[0].status, "created");
    equal(w.db.reports.length, 0);
    // The founder hears once (R12); the buyer gets nothing yet.
    equal(w.emails.length, 1);
    equal(w.emails[0].to, "hello@migratelens.com");
    w.site.set("/data/manifest.json", input.data.manifest);
    w.site.set("/data/occupations/261313.json", input.data.core);
    equal((await webhook(w, event(captured, orderId))).status, 200);
    equal(w.db.reports.length, 1);
    equal(w.db.orders[0].status, "paid");
  },
);

Deno.test(
  "confirm racing a wrong-amount webhook: the failed order never issues",
  async () => {
    const w = world();
    const orderId = await paidOrder(w);
    // The webhook fails the order between confirm's order read and its issue.
    const issue = w.db.rpc_paid_issue.bind(w.db);
    let raced = false;
    w.db.rpc_paid_issue = (args) => {
      if (!raced) {
        raced = true;
        const p = args.p as Record<string, unknown>;
        issue({ p: { ...p, amount: 100 } });
      }
      return issue(args);
    };
    equal((await confirm(w, orderId)).body, {
      kind: "error",
      code: "signature",
    });
    equal(w.db.reports.length, 0);
    equal(w.db.orders[0].status, "failed");
    equal(w.db.orders[0].failure_reason, "amount-mismatch");
  },
);

/** The founder alerts sent so far (hello@, never the buyer). */
function alerts(w: World) {
  return w.emails.filter((e) => e.to === "hello@migratelens.com");
}

Deno.test(
  "a paid order that can't be built: payment id recorded, the founder alerted once across retries, then a retry issues (R12)",
  async () => {
    const w = world();
    const orderId = await paidOrder(w);
    w.state.siteDown = true;
    equal((await webhook(w, event(captured, orderId))).status, 500);
    const order = w.db.orders[0];
    equal(order.status, "created");
    equal(order.razorpay_payment_id, PAYMENT);
    equal(order.paid_at, w.clock.now);
    equal(order.alerted_at, w.clock.now);
    w.clock.now += 60_000;
    equal((await confirm(w, orderId)).body, { kind: "error", code: "busy" });
    equal((await webhook(w, event(orderPaid, orderId))).status, 500);
    equal((await webhook(w, event(captured, orderId))).status, 500);
    const sent = alerts(w);
    equal(sent.length, 1);
    equal(w.emails.length, 1);
    equal(sent[0].key, `unbuilt-${orderId}`);
    equal(sent[0].subject.includes(orderId), true);
    equal(sent[0].text.includes(PAYMENT), true);
    equal(JSON.stringify(sent[0]).includes("buyer@example.com"), false);
    equal(order.alerted_at, w.clock.now - 60_000);
    // The site comes back: the next retry issues as usual.
    w.state.siteDown = false;
    equal((await webhook(w, event(captured, orderId))).status, 200);
    equal(w.db.reports.length, 1);
    equal(order.status, "paid");
    equal(order.razorpay_payment_id, PAYMENT);
    equal((await confirm(w, orderId)).body.kind, "issued");
    equal(alerts(w).length, 1);
  },
);

Deno.test(
  "an alert that fails to send is tried again on the next retry, then never again",
  async () => {
    const w = world();
    const orderId = await paidOrder(w);
    w.state.siteDown = true;
    w.state.emailReplies.push(500);
    equal((await webhook(w, event(captured, orderId))).status, 500);
    equal(alerts(w).length, 0);
    equal(w.db.orders[0].alerted_at, null);
    equal((await confirm(w, orderId)).status, 503);
    equal(alerts(w).length, 1);
    equal((await webhook(w, event(captured, orderId))).status, 500);
    equal(alerts(w).length, 1);
    equal(w.db.orders[0].alerted_at === null, false);
  },
);

Deno.test(
  "storage down before the build: no alert, nothing recorded, retried",
  async () => {
    const w = world();
    const orderId = await paidOrder(w);
    w.state.rpcDown = true;
    equal((await webhook(w, event(captured, orderId))).status, 500);
    w.state.rpcDown = false;
    equal(alerts(w).length, 0);
    equal(w.db.orders[0].razorpay_payment_id, null);
    equal((await webhook(w, event(captured, orderId))).status, 200);
    equal(w.db.reports.length, 1);
  },
);

Deno.test(
  "a second captured payment alerts the founder once and gets no token (R13)",
  async () => {
    const w = world();
    const orderId = await paidOrder(w);
    const first = await confirm(w, orderId);
    equal(first.body.kind, "issued");
    // The same payment's order.paid event is no duplicate.
    equal((await webhook(w, event(orderPaid, orderId))).status, 200);
    equal(alerts(w).length, 0);
    const late = { payment: "pay_LATEUPI2" };
    equal((await webhook(w, event(captured, orderId, late))).status, 200);
    equal((await webhook(w, event(orderPaid, orderId, late))).status, 200);
    equal((await confirm(w, orderId, "pay_LATEUPI2")).body, {
      kind: "error",
      code: "pending",
    });
    const sent = alerts(w);
    equal(sent.length > 0, true);
    equal([...new Set(sent.map((e) => e.key))], ["duplicate-pay_LATEUPI2"]);
    equal(sent[0].subject.includes("pay_LATEUPI2"), true);
    equal(sent[0].text.includes(PAYMENT), true);
    equal(JSON.stringify(sent).includes("buyer@example.com"), false);
    equal(JSON.stringify(sent).includes(first.body.token), false);
    equal(w.db.reports.length, 1);
    equal(w.db.orders[0].razorpay_payment_id, PAYMENT);
  },
);

Deno.test(
  "refunding the duplicate keeps the report; refunding the issuing payment revokes it (R13)",
  async () => {
    const w = world();
    const orderId = await paidOrder(w);
    const { body } = await confirm(w, orderId);
    const late = { payment: "pay_LATEUPI2" };
    await webhook(w, event(captured, orderId, late));
    equal((await webhook(w, event(refunded, orderId, late))).status, 200);
    equal(w.db.reports[0].status, "issued");
    equal(w.db.orders[0].status, "paid");
    equal(w.db.orders[0].other_refunds, ["pay_LATEUPI2"]);
    equal((await getReport(w, body.token)).kind, "report");
    equal((await webhook(w, event(refunded, orderId))).status, 200);
    equal(w.db.reports[0].status, "revoked");
    equal(w.db.orders[0].status, "refunded");
    equal((await getReport(w, body.token)).kind, "revoked");
  },
);
