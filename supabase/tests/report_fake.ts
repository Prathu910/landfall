// A fake of everything the paid-report Functions call, routed by URL: the
// PostgREST RPCs (an in-memory model of the paid-report SQL, which
// postgres_test.py tests for real), Turnstile, Resend, Razorpay, Cloudflare
// Browser Rendering and the site's data files. No network.

import input from "../../src/lib/report-issue/__fixtures__/engine-input-261313.json" with { type: "json" };
import type { Deps } from "../functions/_shared/report/endpoint.ts";

export const ORIGIN = "https://migratelens.com";
export const SITE = "https://site.test";
export const SUPABASE = "https://project.supabase.co";
export const TOKEN_KEY = btoa(
  String.fromCharCode(...new Uint8Array(32).fill(7)),
);
export const ENV: Record<string, string> = {
  ALLOWED_ORIGINS: ORIGIN,
  SUPABASE_URL: SUPABASE,
  SUPABASE_SERVICE_ROLE_KEY: "service-SECRET",
  TURNSTILE_SECRET_KEY: "turnstile-SECRET",
  RAZORPAY_KEY_ID: "rzp_test_KEY",
  RAZORPAY_KEY_SECRET: "rzp_SECRET",
  RAZORPAY_WEBHOOK_SECRET: "whsec_SECRET",
  RESEND_API_KEY: "re_SECRET",
  REPORT_EMAIL_FROM: "MigrateLens <report@migratelens.com>",
  CLOUDFLARE_ACCOUNT_ID: "acct1",
  CLOUDFLARE_BR_TOKEN: "cf_SECRET",
  REPORT_SITE_URL: SITE,
  REPORT_DELIVER_SECRET: "deliver-SECRET",
  REPORT_TOKEN_KEY: TOKEN_KEY,
};
export const PROFILE = input.profile;
export const AS_OF = input.asOf;

export function equal(actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`Expected ${b}, received ${a}`);
}

export async function sha(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const iso = (ms: number) => new Date(ms).toISOString();

type Json = Record<string, unknown>;
export type Claim = {
  id: string;
  email: string;
  code_hash: string;
  tries: number;
  status: "open" | "locked" | "expired" | "issued";
  profile: unknown;
  as_of: string;
  currency: string;
  sent_at: number;
  expires_at: number;
};
export type Order = {
  id: string;
  report_id: string | null;
  kind: "founding" | "paid";
  email: string;
  currency: string;
  amount: number;
  profile: unknown;
  engine_data: unknown;
  as_of: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  status: string;
  failure_reason: string | null;
};
export type Report = {
  id: string;
  token_hash: string;
  token_enc: string | null;
  report_no: string;
  kind: string;
  email: string;
  profile: Json;
  payload: Json;
  engine_data: unknown;
  data_as_at: string;
  status: "issued" | "revoked" | "expired";
  version: number;
  first_issued_at: number;
  issued_at: number;
  expires_at: number;
  pdf_status: string;
  email_status: string;
  next_attempt_at: number;
  email_next_at: number;
  lease_until: number | null;
  pdf_attempts: number;
  email_attempts: number;
  link_email_sent: boolean;
  pdf_email_sent: boolean;
  alert_sent: boolean;
};

export class FakeDb {
  settings = {
    founding_enabled: true,
    founding_limit: 100,
    price_inr: 69900,
    price_usd: 1400,
    usd_enabled: false,
  };
  claims: Claim[] = [];
  orders: Order[] = [];
  reports: Report[] = [];
  rateHits = new Map<string, number>();
  private seq = 0;
  constructor(public clock: { now: number }) {}

  private uuid(): string {
    return crypto.randomUUID();
  }
  private get now() {
    return this.clock.now;
  }
  private foundingCount() {
    return this.orders.filter((o) => o.kind === "founding").length;
  }
  private withMeta(r: Report, payload: Json): Json {
    return {
      ...payload,
      meta: {
        reportNo: r.report_no,
        version: r.version,
        issuedAt: iso(r.issued_at),
        correctableUntil: iso(r.first_issued_at + 7 * DAY),
        revisionsLeft: 4 - r.version,
      },
    };
  }
  private insert(kind: string, email: string, profile: Json, rep: Json) {
    const no = `ML-${iso(this.now).slice(2, 4)}${iso(this.now).slice(5, 7)}-${String(++this.seq).padStart(4, "0")}`;
    const r: Report = {
      id: this.uuid(),
      token_hash: rep.token_hash as string,
      token_enc: rep.token_enc as string,
      report_no: no,
      kind,
      email,
      profile,
      payload: {},
      engine_data: rep.engine_data,
      data_as_at: rep.data_as_at as string,
      status: "issued",
      version: 1,
      first_issued_at: this.now,
      issued_at: this.now,
      expires_at: this.now + 365 * DAY,
      pdf_status: "pending",
      email_status: "pending",
      next_attempt_at: this.now,
      email_next_at: this.now,
      lease_until: null,
      pdf_attempts: 0,
      email_attempts: 0,
      link_email_sent: false,
      pdf_email_sent: false,
      alert_sent: false,
    };
    r.payload = this.withMeta(r, rep.payload as Json);
    this.reports.push(r);
    return r;
  }

  rpc(name: string, args: Json): unknown {
    const handler = (this as unknown as Record<string, (a: Json) => unknown>)[
      `rpc_${name}`
    ];
    if (!handler) throw new Error(`fake has no rpc ${name}`);
    return handler.call(this, args);
  }

  rpc_report_quote() {
    const s = this.settings;
    return {
      prices: { INR: s.price_inr, USD: s.usd_enabled ? s.price_usd : null },
      founding: {
        enabled: s.founding_enabled,
        remaining: Math.max(s.founding_limit - this.foundingCount(), 0),
        limit: s.founding_limit,
      },
    };
  }

  /** One founding place per email whatever its case (ruling R11). */
  private sameEmail(a: string, b: string) {
    return a.toLowerCase() === b.toLowerCase();
  }

  rpc_founding_start({ p }: Json) {
    const a = p as Json;
    const email = a.email as string;
    if (!this.settings.founding_enabled) return { status: "off" };
    if (
      this.orders.some(
        (o) => o.kind === "founding" && this.sameEmail(o.email, email),
      )
    )
      return { status: "used" };
    if (this.foundingCount() >= this.settings.founding_limit)
      return { status: "full" };
    let claim = this.claims.find(
      (c) =>
        this.sameEmail(c.email, email) && ["open", "locked"].includes(c.status),
    );
    if (claim && claim.expires_at <= this.now) {
      claim.status = "expired";
      claim = undefined;
    }
    if (claim) {
      if (claim.status === "locked")
        return {
          status: "wait",
          seconds: Math.ceil((claim.expires_at - this.now) / 1000),
        };
      if (claim.sent_at > this.now - MINUTE)
        return {
          status: "wait",
          seconds: Math.ceil((claim.sent_at + MINUTE - this.now) / 1000),
        };
      Object.assign(claim, {
        email,
        code_hash: a.code_hash,
        sent_at: this.now,
        expires_at: this.now + 10 * MINUTE,
        profile: a.profile,
        as_of: a.as_of,
      });
      return { status: "sent", claim_id: claim.id };
    }
    const fresh: Claim = {
      id: this.uuid(),
      email,
      code_hash: a.code_hash as string,
      tries: 0,
      status: "open",
      profile: a.profile,
      as_of: a.as_of as string,
      currency: (a.currency as string) ?? "INR",
      sent_at: this.now,
      expires_at: this.now + 10 * MINUTE,
    };
    this.claims.push(fresh);
    return { status: "sent", claim_id: fresh.id };
  }

  rpc_founding_unsent({ p_claim_id }: Json) {
    const claim = this.claims.find(
      (c) => c.id === p_claim_id && c.status === "open",
    );
    if (claim) claim.sent_at = this.now - 61_000;
    return null;
  }

  private claimState(claim: Claim | undefined) {
    if (!claim) return { status: "expired" };
    if (claim.status === "issued") return { status: "used" };
    if (claim.status === "locked") return { status: "locked" };
    if (claim.status === "expired" || claim.expires_at <= this.now)
      return { status: "expired" };
    return null;
  }

  rpc_founding_claim_source({ p_claim_id }: Json) {
    const claim = this.claims.find((c) => c.id === p_claim_id);
    return (
      this.claimState(claim) ?? {
        status: "open",
        profile: claim!.profile,
        as_of: claim!.as_of,
      }
    );
  }

  rpc_founding_confirm({ p }: Json) {
    const a = p as Json;
    const claim = this.claims.find((c) => c.id === a.claim_id);
    const state = this.claimState(claim);
    if (state) return state;
    const c = claim!;
    if (c.code_hash !== a.code_hash) {
      c.tries += 1;
      if (c.tries >= 5) {
        c.status = "locked";
        c.expires_at = this.now + 10 * MINUTE;
      }
      return { status: "wrong", tries_left: 5 - c.tries };
    }
    if (
      !this.settings.founding_enabled ||
      this.foundingCount() >= this.settings.founding_limit
    )
      return { status: "full" };
    if (
      this.orders.some(
        (o) => o.kind === "founding" && this.sameEmail(o.email, c.email),
      )
    )
      return { status: "used" };
    const r = this.insert(
      "founding",
      c.email,
      c.profile as Json,
      a.report as Json,
    );
    this.orders.push({
      id: this.uuid(),
      report_id: r.id,
      kind: "founding",
      email: c.email,
      currency: c.currency,
      amount: 0,
      profile: null,
      engine_data: null,
      as_of: c.as_of,
      razorpay_order_id: null,
      razorpay_payment_id: null,
      status: "issued",
      failure_reason: null,
    });
    c.status = "issued";
    c.profile = null;
    return { status: "issued", report_no: r.report_no, report_id: r.id };
  }

  rpc_paid_order_amount({ p_currency }: Json) {
    if (p_currency === "INR") return this.settings.price_inr;
    if (p_currency === "USD" && this.settings.usd_enabled)
      return this.settings.price_usd;
    return null;
  }

  rpc_paid_order_create({ p }: Json) {
    const a = p as Json;
    const amount = this.rpc_paid_order_amount({ p_currency: a.currency });
    if (amount === null) return { status: "usd-off" };
    if ("amount" in a && a.amount !== amount)
      return { status: "price-changed", amount };
    const existing = this.orders.find(
      (o) => o.razorpay_order_id === a.razorpay_order_id,
    );
    if (existing)
      return {
        status: "existing",
        order_id: existing.id,
        amount: existing.amount,
        currency: a.currency,
      };
    const order: Order = {
      id: this.uuid(),
      report_id: null,
      kind: "paid",
      email: a.email as string,
      currency: a.currency as string,
      amount,
      profile: a.profile,
      engine_data: a.engine_data ?? null,
      as_of: a.as_of as string,
      razorpay_order_id: a.razorpay_order_id as string,
      razorpay_payment_id: null,
      status: "created",
      failure_reason: null,
    };
    this.orders.push(order);
    return {
      status: "created",
      order_id: order.id,
      amount,
      currency: a.currency,
    };
  }

  private paidOrder(id: unknown) {
    return this.orders.find(
      (o) => o.razorpay_order_id === id && o.kind === "paid",
    );
  }

  rpc_paid_order_get({ p_razorpay_order_id }: Json) {
    const o = this.paidOrder(p_razorpay_order_id);
    if (!o) return null;
    const { email, currency, amount, profile, engine_data, as_of, status } = o;
    return { email, currency, amount, profile, engine_data, as_of, status };
  }

  rpc_paid_issue({ p }: Json) {
    const a = p as Json;
    const o = this.paidOrder(a.razorpay_order_id);
    if (!o) return { status: "unknown-order" };
    const rep = a.report as Json;
    if (o.report_id) {
      const r = this.reports.find((x) => x.id === o.report_id)!;
      return {
        status: "existing",
        report_id: r.id,
        report_no: r.report_no,
        token_hash_matches: r.token_hash === rep.token_hash,
      };
    }
    if (o.status === "refunded") return { status: "refunded" };
    if (o.status !== "created") return { status: o.status };
    if (a.amount !== o.amount || a.currency !== o.currency) {
      o.status = "failed";
      o.failure_reason = "amount-mismatch";
      return { status: "mismatch" };
    }
    if (
      this.orders.some(
        (x) => x.razorpay_payment_id === a.razorpay_payment_id && x !== o,
      )
    )
      return { status: "mismatch" };
    const r = this.insert("paid", o.email, o.profile as Json, rep);
    Object.assign(o, {
      status: "paid",
      razorpay_payment_id: a.razorpay_payment_id,
      report_id: r.id,
      engine_data: null,
    });
    return {
      status: "issued",
      report_id: r.id,
      report_no: r.report_no,
      token_hash_matches: true,
    };
  }

  rpc_report_refund({ p_payment_id, p_razorpay_order_id }: Json) {
    const o =
      this.orders.find((x) => x.razorpay_payment_id === p_payment_id) ??
      (p_razorpay_order_id ? this.paidOrder(p_razorpay_order_id) : undefined);
    if (!o) return { status: "unknown-payment" };
    o.status = "refunded";
    if (
      !o.razorpay_payment_id &&
      !this.orders.some((x) => x.razorpay_payment_id === p_payment_id)
    )
      o.razorpay_payment_id = p_payment_id as string;
    const r = this.reports.find((x) => x.id === o.report_id);
    if (r) {
      if (r.status === "issued") r.status = "revoked";
      r.token_enc = null;
    }
    return { status: "revoked", report_id: o.report_id };
  }

  rpc_report_delivery_queue({ p_limit }: Json) {
    const due = (status: string, at: number) =>
      ["pending", "retry"].includes(status) && at <= this.now;
    const picked = this.reports
      .filter(
        (r) =>
          r.status === "issued" &&
          (due(r.pdf_status, r.next_attempt_at) ||
            due(r.email_status, r.email_next_at)) &&
          (r.lease_until === null || r.lease_until <= this.now),
      )
      .sort((a, b) => a.first_issued_at - b.first_issued_at)
      .slice(0, p_limit as number);
    return picked.map((r) => {
      r.lease_until = this.now + 10 * MINUTE;
      const o = this.orders.find((x) => x.report_id === r.id);
      return {
        report_id: r.id,
        report_no: r.report_no,
        kind: r.kind,
        version: r.version,
        email: r.email,
        name: (r.profile.name as string) ?? "",
        token_enc: r.token_enc,
        pdf_status: r.pdf_status,
        email_status: r.email_status,
        pdf_attempts: r.pdf_attempts,
        email_attempts: r.email_attempts,
        link_email_sent: r.link_email_sent,
        pdf_email_sent: r.pdf_email_sent,
        alert_sent: r.alert_sent,
        first_issued_at: iso(r.first_issued_at),
        issued_at: iso(r.issued_at),
        next_attempt_at: iso(r.next_attempt_at),
        email_next_at: iso(r.email_next_at),
        amount: o?.amount ?? null,
        currency: o?.currency ?? null,
        payment_id: o?.razorpay_payment_id ?? null,
      };
    });
  }

  marks: Json[] = [];
  rpc_report_delivery_mark({ p }: Json) {
    const a = p as Json;
    this.marks.push(a);
    const r = this.reports.find((x) => x.id === a.report_id);
    if (!r || ("version" in a && a.version !== r.version)) return null;
    if ("pdf_status" in a) {
      r.pdf_status = a.pdf_status as string;
      r.pdf_attempts += 1;
    }
    if ("email_status" in a) {
      r.email_status = a.email_status as string;
      r.email_attempts += 1;
    }
    if ("next_attempt_at" in a)
      r.next_attempt_at = Date.parse(a.next_attempt_at as string);
    if ("email_next_at" in a)
      r.email_next_at = Date.parse(a.email_next_at as string);
    for (const flag of [
      "link_email_sent",
      "pdf_email_sent",
      "alert_sent",
    ] as const)
      if (flag in a) r[flag] = a[flag] as boolean;
    if (a.clear_token === true) r.token_enc = null;
    r.lease_until = null;
    return null;
  }

  rpc_report_rate({ p_key, p_limit }: Json) {
    const key = `${p_key}@${Math.floor(this.now / MINUTE)}`;
    const hits = (this.rateHits.get(key) ?? 0) + 1;
    this.rateHits.set(key, hits);
    return hits <= (p_limit as number);
  }

  private byHash(hash: unknown) {
    return this.reports.find((r) => r.token_hash === hash);
  }

  rpc_report_by_token({ p_token_hash }: Json) {
    const r = this.byHash(p_token_hash);
    if (!r) return { status: "missing" };
    if (r.status === "revoked") return { status: "revoked" };
    if (r.status === "expired" || r.expires_at <= this.now)
      return { status: "expired" };
    return {
      status: "issued",
      payload: r.payload,
      version: r.version,
      profile: r.profile,
      report_no: r.report_no,
    };
  }

  private closed(r: Report, now: number) {
    return (
      r.status !== "issued" ||
      r.expires_at <= now ||
      now >= r.first_issued_at + 7 * DAY
    );
  }

  rpc_report_revise_source({ p_token_hash }: Json) {
    const r = this.byHash(p_token_hash);
    if (!r) return { status: "missing" };
    if (this.closed(r, this.now)) return { status: "closed" };
    if (r.version >= 4) return { status: "limit" };
    return {
      status: "open",
      report_id: r.id,
      report_no: r.report_no,
      version: r.version,
      profile: r.profile,
      engine_data: r.engine_data,
      data_as_at: r.data_as_at,
      first_issued_at: iso(r.first_issued_at),
    };
  }

  rpc_report_revise({ p }: Json) {
    const a = p as Json;
    const r = this.byHash(a.token_hash);
    if (!r) return { status: "missing" };
    if (this.closed(r, this.now)) return { status: "closed" };
    if (r.version >= 4) return { status: "limit" };
    const profile = a.profile as Json | undefined;
    if (profile && profile.occupation !== r.profile.occupation)
      return { status: "occupation-changed" };
    Object.assign(r, {
      version: r.version + 1,
      issued_at: this.now,
      profile: profile ?? r.profile,
      token_enc: (a.token_enc as string) ?? r.token_enc,
      pdf_status: "pending",
      email_status: "pending",
      pdf_attempts: 0,
      email_attempts: 0,
      next_attempt_at: this.now,
      email_next_at: this.now,
      lease_until: null,
      link_email_sent: false,
      pdf_email_sent: false,
      alert_sent: false,
    });
    r.payload = this.withMeta(r, a.payload as Json);
    return {
      status: "revised",
      version: r.version,
      report_no: r.report_no,
      report_id: r.id,
    };
  }
}

type Sent = {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: unknown[];
  key: string | null;
};

/** The whole world one test talks to, plus the deps for a handler. */
export function world() {
  const clock = { now: Date.UTC(2026, 10, 25, 9, 0, 0) };
  const db = new FakeDb(clock);
  const env: Record<string, string> = { ...ENV };
  const site = new Map<string, unknown>([
    ["/data/manifest.json", input.data.manifest],
    ["/data/occupation-index.json", input.data.index],
    ["/data/state-rules.json", input.data.rules],
    ["/data/occupations/261313.json", input.data.core],
    ["/data/occupations/261313.detail.json", input.data.detail],
  ]);
  const state = {
    siteDown: false,
    rpcDown: false,
    turnstile: {
      success: true,
      action: "report",
      hostname: "migratelens.com",
    } as unknown,
    emailReplies: [] as number[],
    pdfReplies: [] as number[],
  };
  const emails: Sent[] = [];
  const razorpayOrders: Json[] = [];
  const rpcCalls: { name: string; args: Json }[] = [];
  const pdfCalls: Json[] = [];
  const urls: string[] = [];
  let orderSeq = 0;
  let randomSeed = 1;

  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    urls.push(url);
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (url.startsWith(`${SUPABASE}/rest/v1/rpc/`)) {
      const name = url.slice(`${SUPABASE}/rest/v1/rpc/`.length);
      rpcCalls.push({ name, args: body });
      if (state.rpcDown)
        return Response.json({ message: "sql" }, { status: 500 });
      return Response.json(db.rpc(name, body));
    }
    if (url === "https://challenges.cloudflare.com/turnstile/v0/siteverify")
      return Response.json(state.turnstile);
    if (url === "https://api.resend.com/emails") {
      const status = state.emailReplies.shift() ?? 200;
      if (status !== 200) return new Response("no", { status });
      const key = new Headers(init?.headers).get("Idempotency-Key");
      emails.push({ ...body, to: body.to[0], key });
      return Response.json({ id: `email_${emails.length}` });
    }
    if (url === "https://api.razorpay.com/v1/orders") {
      razorpayOrders.push(body);
      return Response.json({
        id: `order_FAKE${++orderSeq}`,
        amount: body.amount,
        currency: body.currency,
      });
    }
    if (url.includes("/browser-rendering/pdf")) {
      pdfCalls.push(body);
      const status = state.pdfReplies.shift() ?? 200;
      if (status !== 200) return new Response("no", { status });
      return new Response(new TextEncoder().encode("%PDF-1.7 fake"), {
        headers: { "Content-Type": "application/pdf" },
      });
    }
    if (url.startsWith(SITE)) {
      if (state.siteDown) return new Response("down", { status: 500 });
      const path = url.slice(SITE.length);
      return site.has(path)
        ? Response.json(site.get(path))
        : new Response("missing", { status: 404 });
    }
    throw new Error(`unexpected fetch ${url}`);
  };

  const deps: Deps = {
    env: (name) => env[name],
    fetch: fetcher,
    now: () => clock.now,
    randomBytes: (n) => {
      const bytes = new Uint8Array(n);
      for (let i = 0; i < n; i++) bytes[i] = (randomSeed++ * 37) % 256;
      return bytes;
    },
  };
  return {
    clock,
    db,
    env,
    site,
    state,
    emails,
    razorpayOrders,
    rpcCalls,
    pdfCalls,
    urls,
    deps,
  };
}

export type World = ReturnType<typeof world>;

/** A browser request to a Function, from the allowed origin by default. */
export function browser(
  path: string,
  body?: unknown,
  init: {
    method?: string;
    origin?: string | null;
    headers?: Record<string, string>;
  } = {},
): Request {
  const headers = new Headers(init.headers);
  if (init.origin !== null) headers.set("Origin", init.origin ?? ORIGIN);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  return new Request(`${SUPABASE}/functions/v1/${path}`, {
    method: init.method ?? (body === undefined ? "GET" : "POST"),
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** The 6-digit code in the last email sent. */
export function lastCode(w: World): string {
  const text = w.emails.at(-1)?.text ?? "";
  const match = /\b(\d{6})\b/.exec(text);
  if (!match) throw new Error("no code in the last email");
  return match[1];
}

/** Issues a Founding 100 report through report-order and report-verify; returns its token. */
export async function issueFounding(
  w: World,
  email = "buyer@example.com",
): Promise<string> {
  const { orderHandler, verifyHandler } =
    await import("../functions/_shared/report/handlers.ts");
  const order = await orderHandler(w.deps)(
    browser("report-order", {
      profile: PROFILE,
      email,
      currency: "INR",
      consent: true,
      asOf: AS_OF,
      turnstile_token: "ok",
    }),
  );
  const { claimId } = await order.json();
  const verified = await verifyHandler(w.deps)(
    browser("report-verify", { claimId, code: lastCode(w) }),
  );
  const body = await verified.json();
  if (body.kind !== "issued") throw new Error(JSON.stringify(body));
  return body.token;
}
