import {
  orderHandler,
  quoteHandler,
  verifyHandler,
} from "../functions/_shared/report/handlers.ts";
import { decryptToken, sha256Hex } from "../functions/_shared/report/crypto.ts";
import input from "../../src/lib/report-issue/__fixtures__/engine-input-261313.json" with { type: "json" };
import {
  AS_OF,
  browser,
  equal,
  lastCode,
  ORIGIN,
  PROFILE,
  TOKEN_KEY,
  world,
  type World,
} from "./report_fake.ts";

const ORDER = {
  profile: PROFILE,
  email: "Buyer@Example.com",
  currency: "INR",
  consent: true,
  asOf: AS_OF,
  turnstile_token: "turnstile-ok",
};

async function order(w: World, body: unknown = ORDER) {
  const res = await orderHandler(w.deps)(browser("report-order", body));
  return { status: res.status, body: await res.json(), res };
}

async function verify(w: World, claimId: string, code: string) {
  const res = await verifyHandler(w.deps)(
    browser("report-verify", { claimId, code }),
  );
  return { status: res.status, body: await res.json() };
}

function wrongCode(code: string): string {
  return code === "000000" ? "111111" : "000000";
}

Deno.test(
  "quote: GET from the site returns the settings, never cached",
  async () => {
    const w = world();
    const res = await quoteHandler(w.deps)(browser("report-quote"));
    equal(res.status, 200);
    equal(await res.json(), {
      prices: { INR: 69900, USD: null },
      founding: { enabled: true, remaining: 100, limit: 100 },
    });
    equal(res.headers.get("Cache-Control"), "no-store");
    equal(res.headers.get("Access-Control-Allow-Origin"), ORIGIN);
    const foreign = await quoteHandler(w.deps)(
      browser("report-quote", undefined, { origin: "https://evil.test" }),
    );
    equal(foreign.status, 403);
    const post = await quoteHandler(w.deps)(browser("report-quote", {}));
    equal(post.status, 405);
  },
);

Deno.test("founding: sends a code, never a report", async () => {
  const w = world();
  const { status, body } = await order(w);
  equal(status, 200);
  equal(body.kind, "code-sent");
  equal(body.emailHint, "B•••@example.com");
  equal(body.claimId, w.db.claims[0].id);
  equal(w.emails.length, 1);
  equal(w.emails[0].to, "Buyer@example.com");
  const code = lastCode(w);
  equal(w.db.claims[0].code_hash, await sha256Hex(code));
  equal(JSON.stringify(w.db.claims).includes(code), false);
  equal(w.db.reports.length, 0);
  equal(w.razorpayOrders.length, 0);
  equal(w.db.claims[0].email, "Buyer@example.com");
});

Deno.test(
  "founding: a failed code email is busy and can be resent at once",
  async () => {
    const w = world();
    w.state.emailReplies.push(500);
    const first = await order(w);
    equal(first.status, 503);
    equal(first.body, { kind: "error", code: "busy" });
    const again = await order(w);
    equal(again.body.kind, "code-sent");
    equal(w.db.claims.length, 1);
  },
);

Deno.test(
  "founding: a resend inside a minute waits without a new code",
  async () => {
    const w = world();
    await order(w);
    const again = await order(w);
    equal(again.status, 503);
    equal(again.body, { kind: "error", code: "busy" });
    equal(again.res.headers.get("Retry-After"), "60");
    equal(w.emails.length, 1);
  },
);

Deno.test(
  "founding full: creates a Razorpay order at the settings price",
  async () => {
    const w = world();
    w.db.settings.founding_limit = 0;
    const { status, body } = await order(w);
    equal(status, 200);
    equal(body, {
      kind: "razorpay",
      orderId: "order_FAKE1",
      keyId: "rzp_test_KEY",
      amount: 69900,
      currency: "INR",
    });
    equal(w.razorpayOrders.length, 1);
    equal(w.razorpayOrders[0].amount, 69900);
    equal(w.razorpayOrders[0].currency, "INR");
    equal(w.razorpayOrders[0].notes, { occupation: "261313" });
    equal(/^[0-9a-f-]{36}$/.test(String(w.razorpayOrders[0].receipt)), true);
    equal(w.db.orders[0].razorpay_order_id, "order_FAKE1");
    equal(w.db.orders[0].amount, 69900);
    equal(w.emails.length, 0);
  },
);

Deno.test("founding full between quote and claim: founding-full", async () => {
  const w = world();
  // The quote still says open, the claim's own check says full.
  const original = w.db.rpc_founding_start.bind(w.db);
  w.db.rpc_founding_start = () => ({ status: "full" });
  const { status, body } = await order(w);
  equal(status, 200);
  equal(body, { kind: "error", code: "founding-full" });
  w.db.rpc_founding_start = original;
});

Deno.test("founding used: one founding report per email", async () => {
  const w = world();
  const sent = await order(w);
  await verify(w, sent.body.claimId, lastCode(w));
  w.clock.now += 120_000;
  const { body } = await order(w);
  equal(body, { kind: "error", code: "founding-used" });
});

Deno.test("an amount in the request is ignored", async () => {
  const w = world();
  w.db.settings.founding_enabled = false;
  const { body } = await order(w, { ...ORDER, amount: 1, price: 1 });
  equal(body.amount, 69900);
  equal(w.razorpayOrders[0].amount, 69900);
  equal(w.db.orders[0].amount, 69900);
});

Deno.test("USD off is refused", async () => {
  const w = world();
  w.db.settings.founding_enabled = false;
  const { status, body } = await order(w, { ...ORDER, currency: "USD" });
  equal(status, 200);
  equal(body, { kind: "error", code: "usd-off" });
  equal(w.razorpayOrders.length, 0);
  w.db.settings.usd_enabled = true;
  const on = await order(w, { ...ORDER, currency: "USD" });
  equal(on.body.amount, 1400);
  equal(w.razorpayOrders[0].amount, 1400);
});

Deno.test("no-data occupation is refused", async () => {
  const w = world();
  w.site.delete("/data/occupations/261313.json");
  equal((await order(w)).body, { kind: "error", code: "no-data" });
  const stale = world();
  stale.site.set("/data/manifest.json", {
    ...input.data.manifest,
    asAt: "2026-11",
  });
  equal((await order(stale)).body, { kind: "error", code: "no-data" });
  const broken = world();
  broken.site.set("/data/occupations/261313.json", { code: "261313" });
  equal((await order(broken)).body, { kind: "error", code: "no-data" });
  equal(w.emails.length + stale.emails.length + broken.emails.length, 0);
});

Deno.test("an invalid request or profile is invalid", async () => {
  const w = world();
  equal((await order(w, { ...ORDER, consent: false })).status, 400);
  const bad = await order(w, { ...ORDER, profile: { occupation: "261313" } });
  equal(bad.status, 400);
  equal(bad.body, { kind: "error", code: "invalid" });
  equal(w.emails.length, 0);
});

Deno.test(
  "verify issues once and returns a token whose hash was stored",
  async () => {
    const w = world();
    const sent = await order(w);
    const code = lastCode(w);
    const { status, body } = await verify(w, sent.body.claimId, code);
    equal(status, 200);
    equal(body.kind, "issued");
    equal(/^[A-Za-z0-9_-]{43}$/.test(body.token), true);
    equal(w.db.reports.length, 1);
    const report = w.db.reports[0];
    equal(report.token_hash, await sha256Hex(body.token));
    equal(await decryptToken(report.token_enc!, TOKEN_KEY), body.token);
    equal(report.data_as_at, "2026-10");
    equal(report.engine_data, {
      core: input.data.core,
      detail: input.data.detail,
      checkedAt: input.data.manifest.checkedAt,
    });
    equal(
      (report.payload.meta as { reportNo: string }).reportNo,
      report.report_no,
    );
    equal(JSON.stringify(w.rpcCalls).includes(body.token), false);
    const again = await verify(w, sent.body.claimId, code);
    equal(again.body, { kind: "error", code: "expired" });
    equal(w.db.reports.length, 1);
  },
);

Deno.test("wrong code returns tries left", async () => {
  const w = world();
  const sent = await order(w);
  const code = lastCode(w);
  const wrong = wrongCode(code);
  for (const left of [4, 3, 2, 1]) {
    const { status, body } = await verify(w, sent.body.claimId, wrong);
    equal(status, 200);
    equal(body, { kind: "error", code: "wrong-code", triesLeft: left });
  }
  equal((await verify(w, sent.body.claimId, wrong)).body, {
    kind: "error",
    code: "wrong-code",
    triesLeft: 0,
  });
  equal((await verify(w, sent.body.claimId, code)).body, {
    kind: "error",
    code: "locked",
  });
  // Resending can't reset the tries: the locked claim makes the email wait.
  w.clock.now += 120_000;
  equal((await order(w)).body, { kind: "error", code: "busy" });
  equal(w.db.reports.length, 0);
});

Deno.test(
  "verify: an unknown claim is expired, a full offer is founding-full",
  async () => {
    const w = world();
    equal(
      (await verify(w, "5f1d7f36-6a43-4c4b-9a52-0f3b7f9b9c11", "123456")).body,
      { kind: "error", code: "expired" },
    );
    const sent = await order(w);
    w.db.settings.founding_limit = 0;
    equal((await verify(w, sent.body.claimId, lastCode(w))).body, {
      kind: "error",
      code: "founding-full",
    });
    equal((await verify(w, "not-a-uuid", "123456")).status, 400);
  },
);

Deno.test("Turnstile failure returns verification", async () => {
  const w = world();
  w.state.turnstile = { success: false };
  const { status, body } = await order(w);
  equal(status, 403);
  equal(body, { kind: "error", code: "verification" });
  const wrongAction = world();
  wrongAction.state.turnstile = {
    success: true,
    action: "calculation",
    hostname: "migratelens.com",
  };
  equal((await order(wrongAction)).status, 403);
  equal(w.emails.length + w.db.claims.length, 0);
});

Deno.test("site data unavailable returns busy, not invalid", async () => {
  const w = world();
  w.state.siteDown = true;
  const { status, body } = await order(w);
  equal(status, 503);
  equal(body, { kind: "error", code: "busy" });
  const sent = await (async () => {
    w.state.siteDown = false;
    return await order(w);
  })();
  w.state.siteDown = true;
  const verified = await verify(w, sent.body.claimId, lastCode(w));
  equal(verified.status, 503);
  equal(verified.body, { kind: "error", code: "busy" });
  equal(w.db.reports.length, 0);
});

Deno.test("storage down is busy and leaks nothing", async () => {
  const w = world();
  w.state.rpcDown = true;
  const { status, body } = await order(w);
  equal(status, 503);
  equal(body, { kind: "error", code: "busy" });
});
