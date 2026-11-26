// One handler per paid-report Function, each (deps) => (Request) => Response.
// Contract: src/lib/orders/contract.ts. Amounts come only from the
// report_settings row through the RPCs; no request carries one.

import {
  emailHint,
  type OrderRequest,
  type Quote,
  validateConfirm,
  validateOrderRequest,
  validateVerify,
} from "../../../../src/lib/orders/contract.ts";
import { codeEmail } from "../../../../src/lib/orders/emails.ts";
import { verifyTurnstile } from "../handler.ts";
import { readJson } from "../http.ts";
import { freeResult, parseProfile, type Profile } from "../report-engine.js";
import { sha256Hex, sixDigitCode } from "./crypto.ts";
import { type LoadedData, loadEngineData, storedEngineData } from "./data.ts";
import { database, type Rpc } from "./db.ts";
import {
  browserEndpoint,
  type Deps,
  fail,
  ok,
  type Reply,
  setting,
} from "./endpoint.ts";
import { prepareReport } from "./issue.ts";
import { issuePaid } from "./paid.ts";
import { createRazorpayOrder, validPaymentSignature } from "./razorpay.ts";
import { sendEmail } from "./resend.ts";

export type { Deps } from "./endpoint.ts";
export { deliverHandler } from "./deliver.ts";
export { getHandler, reviseHandler } from "./stored.ts";
export { webhookHandler } from "./webhook.ts";

/** Resend settings for every email the Functions send. */
export function emailConfig(deps: Deps) {
  return {
    apiKey: setting(deps, "RESEND_API_KEY"),
    from: setting(deps, "REPORT_EMAIL_FROM"),
  };
}

/** GET report-quote: prices, USD availability and the founding count. */
export function quoteHandler(deps: Deps) {
  return browserEndpoint("GET", deps, async () =>
    ok(await database(deps)<Quote>("report_quote")),
  );
}

type FoundingStart =
  | { status: "sent"; claim_id: string }
  | { status: "used" }
  | { status: "full" }
  | { status: "off" }
  | { status: "wait"; seconds: number };

async function startFounding(
  deps: Deps,
  rpc: Rpc,
  order: OrderRequest,
  profile: Profile,
): Promise<Reply> {
  const code = sixDigitCode(deps.randomBytes);
  const started = await rpc<FoundingStart>("founding_start", {
    p: {
      email: order.email,
      code_hash: await sha256Hex(code),
      profile,
      as_of: order.asOf,
      currency: order.currency,
    },
  });
  if (started.status === "used") return fail("founding-used");
  if (started.status === "full" || started.status === "off")
    return fail("founding-full");
  if (started.status === "wait")
    return {
      ...fail("busy"),
      headers: { "Retry-After": String(started.seconds) },
    };
  const sent = await sendEmail(
    emailConfig(deps),
    { to: order.email, ...codeEmail({ code }) },
    deps.fetch,
  );
  if (!sent.ok) {
    // The code never arrived: let the next press resend at once.
    await rpc("founding_unsent", { p_claim_id: started.claim_id });
    return fail("busy");
  }
  return ok({
    kind: "code-sent",
    claimId: started.claim_id,
    emailHint: emailHint(order.email),
  });
}

type OrderCreate =
  | { status: "created" | "existing"; order_id: string; amount: number }
  | { status: "usd-off" }
  | { status: "price-changed"; amount: number };

async function startPaid(
  deps: Deps,
  rpc: Rpc,
  order: OrderRequest,
  profile: Profile,
  loaded: LoadedData,
): Promise<Reply> {
  const amount = await rpc<number | null>("paid_order_amount", {
    p_currency: order.currency,
  });
  if (amount === null) return fail("usd-off");
  const keyId = setting(deps, "RAZORPAY_KEY_ID");
  const created = await createRazorpayOrder(
    { keyId, keySecret: setting(deps, "RAZORPAY_KEY_SECRET") },
    {
      amount,
      currency: order.currency,
      receipt: crypto.randomUUID(),
      notes: { occupation: profile.occupation },
    },
    deps.fetch,
  );
  const stored = await rpc<OrderCreate>("paid_order_create", {
    p: {
      email: order.email,
      currency: order.currency,
      profile,
      as_of: order.asOf,
      razorpay_order_id: created.id,
      amount,
      // What the reader was quoted: the report is issued from it (R10).
      engine_data: storedEngineData(loaded.raw),
    },
  });
  if (stored.status === "usd-off") return fail("usd-off");
  // The founder changed the price between the two calls: press again.
  if (stored.status === "price-changed") return fail("busy");
  return ok({
    kind: "razorpay",
    orderId: created.id,
    keyId,
    amount,
    currency: order.currency,
  });
}

/** POST report-order: a founding code, or a Razorpay order at the settings price. */
export function orderHandler(deps: Deps) {
  return browserEndpoint("POST", deps, async (request, origin) => {
    const order = validateOrderRequest(await readJson(request));
    if (!order) return fail("invalid");
    const rpc = database(deps);
    const site = setting(deps, "REPORT_SITE_URL");
    await verifyTurnstile(
      order.turnstile_token,
      "report",
      origin,
      setting(deps, "TURNSTILE_SECRET_KEY"),
      deps.fetch,
    );
    const profile = parseProfile(order.profile);
    if (!profile) return fail("invalid");
    const loaded = await loadEngineData(site, profile.occupation, deps.fetch);
    if (!loaded) return fail("no-data");
    let free;
    try {
      free = freeResult(loaded.data, profile, order.asOf);
    } catch {
      return fail("invalid");
    }
    if (free.kind !== "stamps") return fail("no-data");
    const quote = await rpc<Quote>("report_quote");
    // `paid`: the reader buys although founding is open (a founding-used email).
    const founding =
      !order.paid && quote.founding.enabled && quote.founding.remaining > 0;
    return founding
      ? await startFounding(deps, rpc, order, profile)
      : await startPaid(deps, rpc, order, profile, loaded);
  });
}

type ClaimSource =
  | { status: "open"; profile: unknown; as_of: string }
  | { status: "expired" | "locked" | "used" };

type FoundingConfirm =
  | { status: "issued"; report_no: string; report_id: string }
  | { status: "wrong"; tries_left: number }
  | { status: "expired" | "locked" | "full" | "used" };

/** A claim that can't issue. `used` (already issued) reads as expired: the code is spent. */
function claimFailure(status: string): Reply {
  if (status === "locked") return fail("locked");
  if (status === "full") return fail("founding-full");
  return fail("expired");
}

/** POST report-verify: checks the emailed code, then claims a place and issues. */
export function verifyHandler(deps: Deps) {
  return browserEndpoint("POST", deps, async (request) => {
    const verify = validateVerify(await readJson(request));
    if (!verify) return fail("invalid");
    const rpc = database(deps);
    const site = setting(deps, "REPORT_SITE_URL");
    const source = await rpc<ClaimSource>("founding_claim_source", {
      p_claim_id: verify.claimId,
    });
    if (source.status !== "open") return claimFailure(source.status);
    const profile = parseProfile(source.profile);
    if (!profile) throw new Error("Stored claim profile unreadable");
    const loaded = await loadEngineData(site, profile.occupation, deps.fetch);
    // The live month isn't usable now (a deploy in progress, or the
    // occupation lost its data since the code was sent): busy, without
    // spending a try. The claim stays open until it expires.
    if (!loaded) throw new Error("Founding claim data unavailable");
    const { token, report } = await prepareReport(
      deps,
      loaded,
      profile,
      source.as_of,
    );
    const result = await rpc<FoundingConfirm>("founding_confirm", {
      p: {
        claim_id: verify.claimId,
        code_hash: await sha256Hex(verify.code),
        report,
      },
    });
    if (result.status === "issued") return ok({ kind: "issued", token });
    if (result.status === "wrong")
      return fail("wrong-code", { triesLeft: result.tries_left });
    return claimFailure(result.status);
  });
}

/**
 * POST report-confirm: Checkout's payment signature, then the issue. When
 * the webhook issued first for this payment, the buyer gets the same token
 * back (ruling R14); `pending` (the link comes by email) only once delivery
 * has cleared the stored token, or for a second payment on the order.
 */
export function confirmHandler(deps: Deps) {
  return browserEndpoint("POST", deps, async (request) => {
    const confirm = validateConfirm(await readJson(request));
    if (!confirm) return fail("invalid");
    const signed = await validPaymentSignature(
      confirm.orderId,
      confirm.paymentId,
      confirm.signature,
      setting(deps, "RAZORPAY_KEY_SECRET"),
    );
    if (!signed) return fail("signature");
    const outcome = await issuePaid(deps, database(deps), {
      orderId: confirm.orderId,
      paymentId: confirm.paymentId,
      wantsToken: true,
    });
    if (outcome.kind === "issued")
      return ok({ kind: "issued", token: outcome.token });
    if (outcome.kind === "existing") return fail("pending");
    return fail("signature");
  });
}
