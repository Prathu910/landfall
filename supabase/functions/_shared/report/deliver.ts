// POST report-deliver, run every 5 minutes by pg_cron (supabase/cron/).
// Renders each due report's PDF and sends its emails: the link email once
// the PDF is ready, or 3 minutes after issue (or at once when Cloudflare
// refuses for the day) saying the PDF follows; then the PDF on its own.
// Every step is marked with report_delivery_mark, guarded by the version,
// and each email carries an idempotency key, so nothing goes out twice.

import {
  pdfFollowEmail,
  reportEmail,
  revisedEmail,
} from "../../../../src/lib/orders/emails.ts";
import type { Currency } from "../../../../src/lib/orders/contract.ts";
import { response } from "../http.ts";
import { constantTimeEqual } from "../read-token.ts";
import { sendAlert } from "./alert.ts";
import { decryptToken } from "./crypto.ts";
import { database, type Rpc } from "./db.ts";
import { type Deps, setting } from "./endpoint.ts";
import { backoff, limitedRetry } from "./delivery-schedule.ts";
import { renderPdf } from "./pdf.ts";
import { sendEmail } from "./resend.ts";

const MINUTE = 60_000;
const BATCH = 10;
/** No new report starts after this: a 60 s render and an email still fit Supabase's 150 s limit. */
const BUDGET_MS = 70_000;
const PDF_WAIT_MS = 3 * MINUTE;
const ALERT_AFTER = 5;
const GIVE_UP_AFTER = 10;

export type DeliveryItem = {
  report_id: string;
  report_no: string;
  version: number;
  email: string;
  name: string;
  token_enc: string | null;
  pdf_status: string;
  email_status: string;
  pdf_attempts: number;
  email_attempts: number;
  link_email_sent: boolean;
  alert_sent: boolean;
  first_issued_at: string;
  issued_at: string;
  next_attempt_at: string;
  email_next_at: string;
  amount: number | null;
  currency: Currency | null;
  payment_id: string | null;
};

type Mark = { report_id: string; version: number; [field: string]: unknown };

const pending = (status: string) => status === "pending" || status === "retry";
const iso = (ms: number) => new Date(ms).toISOString();

type Context = {
  deps: Deps;
  site: string;
  key: string;
  email: { apiKey: string; from: string };
  cloudflare: { accountId: string; token: string };
};

async function openToken(
  item: DeliveryItem,
  key: string,
): Promise<string | null> {
  if (!item.token_enc) return null;
  try {
    return await decryptToken(item.token_enc, key);
  } catch {
    return null;
  }
}

function linkEmail(item: DeliveryItem, link: string, pdfAttached: boolean) {
  if (item.version > 1)
    return revisedEmail({
      reportNo: item.report_no,
      version: item.version,
      link,
      pdfAttached,
    });
  return reportEmail({
    name: item.name,
    reportNo: item.report_no,
    link,
    issuedAt: item.first_issued_at,
    amount: item.amount ?? 0,
    currency: item.currency ?? "INR",
    paymentId: item.payment_id,
    pdfAttached,
  });
}

async function send(
  ctx: Context,
  item: DeliveryItem,
  message: { subject: string; html: string; text: string },
  pdf: Uint8Array | null,
  step: "link" | "pdf",
): Promise<boolean> {
  const sent = await sendEmail(
    ctx.email,
    {
      to: item.email,
      ...message,
      attachment: pdf
        ? { filename: `MigrateLens-${item.report_no}.pdf`, content: pdf }
        : undefined,
      idempotencyKey: `${item.report_id}-v${item.version}-${step}`,
    },
    ctx.deps.fetch,
  );
  return sent.ok;
}

/** No token to build the link from: nothing can be delivered. */
function undeliverable(item: DeliveryItem, mark: Mark): Mark {
  if (pending(item.pdf_status)) mark.pdf_status = "failed";
  if (pending(item.email_status)) mark.email_status = "failed";
  mark.clear_token = true;
  return mark;
}

async function deliverOne(
  ctx: Context,
  item: DeliveryItem,
): Promise<{ mark: Mark; alert: string | null }> {
  const now = ctx.deps.now();
  const mark: Mark = { report_id: item.report_id, version: item.version };
  const token = await openToken(item, ctx.key);
  if (!token)
    return {
      mark: undeliverable(item, mark),
      alert: "its link token is unavailable",
    };
  const link = `${ctx.site}/report/#${token}`;

  const pdfDue =
    pending(item.pdf_status) && Date.parse(item.next_attempt_at) <= now;
  let pdf: Uint8Array | null = null;
  let pdfFailure: "limited" | "failed" | null = null;
  if (pdfDue) {
    const rendered = await renderPdf(ctx.cloudflare, link, ctx.deps.fetch);
    if (rendered.ok) pdf = rendered.pdf;
    else pdfFailure = rendered.reason;
  }

  let pdfSent = false;
  let emailFailed = false;
  if (pending(item.email_status) && !item.link_email_sent) {
    const waitUntil = Date.parse(item.issued_at) + PDF_WAIT_MS;
    const sendNow =
      pdf !== null ||
      pdfFailure === "limited" ||
      item.pdf_status === "failed" ||
      now >= waitUntil;
    const emailDue = pdf !== null || Date.parse(item.email_next_at) <= now;
    if (!sendNow) mark.email_next_at = iso(waitUntil);
    else if (emailDue) {
      if (
        await send(ctx, item, linkEmail(item, link, pdf !== null), pdf, "link")
      ) {
        mark.email_status = "sent";
        mark.link_email_sent = true;
        pdfSent = pdf !== null;
      } else {
        emailFailed = true;
        mark.email_status =
          item.email_attempts + 1 >= GIVE_UP_AFTER ? "failed" : "retry";
        mark.email_next_at = iso(backoff(item.email_attempts, now));
      }
    }
  } else if (pdf) {
    pdfSent = await send(
      ctx,
      item,
      pdfFollowEmail({ reportNo: item.report_no, link }),
      pdf,
      "pdf",
    );
  }

  if (pdfSent) {
    mark.pdf_status = "done";
    mark.pdf_email_sent = true;
  } else if (pdfDue) {
    mark.pdf_status =
      item.pdf_attempts + 1 >= GIVE_UP_AFTER ? "failed" : "retry";
    mark.next_attempt_at = iso(
      pdfFailure === "limited"
        ? limitedRetry(item.pdf_attempts, now)
        : backoff(item.pdf_attempts, now),
    );
  }

  const linkDone =
    item.link_email_sent ||
    mark.link_email_sent === true ||
    mark.email_status === "failed";
  const pdfFinal = ["done", "failed"].includes(
    String(mark.pdf_status ?? item.pdf_status),
  );
  if (linkDone && pdfFinal) mark.clear_token = true;

  let alert: string | null = null;
  if (emailFailed && item.email_attempts + 1 >= ALERT_AFTER)
    alert = `its email failed ${item.email_attempts + 1} times`;
  else if (pdfDue && !pdfSent && item.pdf_attempts + 1 >= ALERT_AFTER)
    alert = `its PDF failed ${item.pdf_attempts + 1} times`;
  return { mark, alert };
}

async function alertOnce(
  ctx: Context,
  item: DeliveryItem,
  mark: Mark,
  problem: string | null,
) {
  if (!problem || item.alert_sent) return;
  const sent = await sendAlert(
    ctx.deps,
    `Delivery problem: ${item.report_no}`,
    `Report ${item.report_no} (version ${item.version}): ${problem}. The report stays readable through its link; report-deliver keeps retrying where it can. Check the Resend and Cloudflare dashboards.`,
    `${item.report_id}-v${item.version}-alert`,
  );
  if (sent) mark.alert_sent = true;
}

/** Runs one batch; answers counts only. */
export async function deliverDue(
  deps: Deps,
): Promise<{ picked: number; handled: number }> {
  const started = deps.now();
  const rpc: Rpc = database(deps);
  const ctx: Context = {
    deps,
    site: setting(deps, "REPORT_SITE_URL").replace(/\/$/, ""),
    key: setting(deps, "REPORT_TOKEN_KEY"),
    email: {
      apiKey: setting(deps, "RESEND_API_KEY"),
      from: setting(deps, "REPORT_EMAIL_FROM"),
    },
    cloudflare: {
      accountId: setting(deps, "CLOUDFLARE_ACCOUNT_ID"),
      token: setting(deps, "CLOUDFLARE_BR_TOKEN"),
    },
  };
  const items = await rpc<DeliveryItem[]>("report_delivery_queue", {
    p_limit: BATCH,
  });
  let handled = 0;
  for (const item of items) {
    // Out of time, or a step threw: end the lease and leave it for the next run.
    let mark: Mark = { report_id: item.report_id, version: item.version };
    if (deps.now() - started < BUDGET_MS) {
      try {
        const outcome = await deliverOne(ctx, item);
        mark = outcome.mark;
        await alertOnce(ctx, item, mark, outcome.alert);
        handled++;
      } catch {
        mark = { report_id: item.report_id, version: item.version };
      }
    }
    await rpc("report_delivery_mark", { p: mark });
  }
  return { picked: items.length, handled };
}

/** Only pg_cron calls this, with the x-deliver-secret header from Vault. */
export function deliverHandler(deps: Deps) {
  return async (request: Request): Promise<Response> => {
    try {
      if (request.method !== "POST")
        return response(405, { error: "Use POST." });
      const expected = setting(deps, "REPORT_DELIVER_SECRET");
      const given = request.headers.get("x-deliver-secret") ?? "";
      await request.body?.cancel();
      if (!constantTimeEqual(given, expected))
        return response(401, { error: "Not allowed." });
      return response(200, await deliverDue(deps));
    } catch {
      return response(500, { error: "Try again." });
    }
  };
}
