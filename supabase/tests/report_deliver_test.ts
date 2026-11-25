import {
  deliverHandler,
  reviseHandler,
} from "../functions/_shared/report/handlers.ts";
import {
  backoff,
  nextReset,
} from "../functions/_shared/report/delivery-schedule.ts";
import {
  browser,
  ENV,
  equal,
  issueFounding,
  PROFILE,
  SITE,
  SUPABASE,
  world,
  type World,
} from "./report_fake.ts";

const MINUTE = 60_000;
const PDF_B64 = btoa("%PDF-1.7 fake");

async function deliver(
  w: World,
  secret: string | null = ENV.REPORT_DELIVER_SECRET,
) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (secret !== null) headers.set("x-deliver-secret", secret);
  const res = await deliverHandler(w.deps)(
    new Request(`${SUPABASE}/functions/v1/report-deliver`, {
      method: "POST",
      headers,
      body: "{}",
    }),
  );
  return { status: res.status, body: await res.json() };
}

/** An issued founding report with its code email cleared away. */
async function issued(w: World): Promise<string> {
  const token = await issueFounding(w);
  w.emails.length = 0;
  return token;
}

const buyerEmails = (w: World) =>
  w.emails.filter((e) => e.to === "buyer@example.com");
const linkEmails = (w: World) =>
  buyerEmails(w).filter((e) => e.key?.endsWith("-link"));

Deno.test("rejects without the deliver secret", async () => {
  const w = world();
  await issued(w);
  const calls = w.rpcCalls.length;
  equal((await deliver(w, null)).status, 401);
  equal((await deliver(w, "deliver-SECRET-not")).status, 401);
  equal((await deliver(w, "")).status, 401);
  const get = await deliverHandler(w.deps)(
    new Request(`${SUPABASE}/functions/v1/report-deliver`),
  );
  equal(get.status, 405);
  equal(w.rpcCalls.length, calls);
  equal(w.pdfCalls.length + w.emails.length, 0);
});

Deno.test("PDF ready: one email with the attachment", async () => {
  const w = world();
  const token = await issued(w);
  const report = w.db.reports[0];
  const { status } = await deliver(w);
  equal(status, 200);
  equal(w.pdfCalls.length, 1);
  equal(w.pdfCalls[0].url, `${SITE}/report/#${token}`);
  equal(w.emails.length, 1);
  const email = w.emails[0];
  equal(email.to, "buyer@example.com");
  equal(email.subject.includes(report.report_no), true);
  equal(email.text.includes(`${SITE}/report/#${token}`), true);
  equal(email.text.includes("The PDF is attached"), true);
  equal(email.attachments, [
    { filename: `MigrateLens-${report.report_no}.pdf`, content: PDF_B64 },
  ]);
  equal(email.key, `${report.id}-v1-link`);
  equal([report.pdf_status, report.email_status], ["done", "sent"]);
  equal([report.link_email_sent, report.pdf_email_sent], [true, true]);
  equal((await deliver(w)).status, 200);
  equal(w.emails.length + w.pdfCalls.length, 2);
});

Deno.test(
  "PDF limited: link email now, PDF email later, never two link emails",
  async () => {
    const w = world();
    await issued(w);
    const report = w.db.reports[0];
    w.state.pdfReplies.push(429);
    await deliver(w);
    equal(linkEmails(w).length, 1);
    equal(w.emails[0].attachments, undefined);
    equal(w.emails[0].text.includes("Your PDF will follow"), true);
    equal(report.pdf_status, "retry");
    equal(report.next_attempt_at, w.clock.now + 15 * MINUTE);
    await deliver(w);
    equal(w.emails.length, 1);
    w.clock.now += 16 * MINUTE;
    await deliver(w);
    equal(linkEmails(w).length, 1);
    equal(w.emails.length, 2);
    equal(w.emails[1].subject.startsWith("The PDF of your PR report"), true);
    equal(w.emails[1].attachments, [
      { filename: `MigrateLens-${report.report_no}.pdf`, content: PDF_B64 },
    ]);
    equal(w.emails[1].key, `${report.id}-v1-pdf`);
    equal(report.pdf_status, "done");
  },
);

Deno.test(
  "PDF limited: three quick retries, then the next 00:05 UTC",
  async () => {
    const w = world();
    await issued(w);
    const report = w.db.reports[0];
    w.state.pdfReplies.push(429, 429, 429, 429);
    for (let run = 0; run < 3; run++) {
      await deliver(w);
      equal(report.next_attempt_at, w.clock.now + 15 * MINUTE);
      w.clock.now = report.next_attempt_at;
    }
    await deliver(w);
    const day = new Date(w.clock.now);
    equal(
      report.next_attempt_at,
      Date.UTC(
        day.getUTCFullYear(),
        day.getUTCMonth(),
        day.getUTCDate() + 1,
        0,
        5,
      ),
    );
    equal(linkEmails(w).length, 1);
  },
);

Deno.test(
  "a PDF failure waits up to 3 minutes before the link email",
  async () => {
    const w = world();
    await issued(w);
    const report = w.db.reports[0];
    const issuedAt = report.issued_at;
    w.state.pdfReplies.push(500);
    await deliver(w);
    equal(w.emails.length, 0);
    equal(report.email_next_at, issuedAt + 3 * MINUTE);
    equal(report.next_attempt_at, w.clock.now + 5 * MINUTE);
    w.clock.now = issuedAt + 3 * MINUTE;
    await deliver(w);
    equal(linkEmails(w).length, 1);
    equal(w.emails[0].attachments, undefined);
    equal(w.pdfCalls.length, 1);
  },
);

Deno.test("email retry backs off and alerts after 5 failures", async () => {
  const w = world();
  const token = await issued(w);
  const report = w.db.reports[0];
  w.state.emailReplies.push(500, 500, 500, 500, 500);
  const gaps = [5, 15, 60, 24 * 60, 24 * 60];
  for (const gap of gaps) {
    await deliver(w);
    equal(report.email_status, "retry");
    equal(report.email_next_at, w.clock.now + gap * MINUTE);
    w.clock.now = report.email_next_at;
  }
  const alerts = w.emails.filter((e) => e.to === "hello@migratelens.com");
  equal(alerts.length, 1);
  equal(report.alert_sent, true);
  const alert = alerts[0];
  equal(alert.text.includes(report.report_no), true);
  for (const secret of [token, "buyer@example.com", PROFILE.name])
    equal(JSON.stringify(alert).includes(secret), false);
  equal(buyerEmails(w).length, 0);
  await deliver(w);
  equal(linkEmails(w).length, 1);
  equal(report.email_status, "sent");
  equal(w.emails.filter((e) => e.to === "hello@migratelens.com").length, 1);
});

Deno.test("token is cleared after full delivery", async () => {
  const w = world();
  await issued(w);
  const report = w.db.reports[0];
  w.state.pdfReplies.push(429);
  await deliver(w);
  equal(report.token_enc === null, false);
  w.clock.now += 16 * MINUTE;
  await deliver(w);
  equal(report.token_enc, null);
  equal(w.db.marks.at(-1)?.clear_token, true);
});

Deno.test("a revision sends the revised email with its new PDF", async () => {
  const w = world();
  const token = await issued(w);
  await deliver(w);
  w.clock.now += 60 * MINUTE;
  await reviseHandler(w.deps)(
    browser("report-revise", {
      token,
      profile: { ...PROFILE, name: "Rahul K" },
    }),
  );
  await deliver(w);
  equal(w.emails.length, 2);
  const revised = w.emails[1];
  equal(revised.subject.includes("(version 2)"), true);
  equal(revised.text.includes("The updated PDF is attached"), true);
  equal(revised.key, `${w.db.reports[0].id}-v2-link`);
  equal(w.pdfCalls.length, 2);
  equal(w.pdfCalls[1].url, `${SITE}/report/#${token}`);
  equal(w.db.reports[0].token_enc, null);
});

Deno.test(
  "an unreadable token fails the delivery and alerts, with no link sent",
  async () => {
    const w = world();
    await issued(w);
    const report = w.db.reports[0];
    report.token_enc = "AAAAAAAAAAAAAAAA.AAAA";
    await deliver(w);
    equal([report.pdf_status, report.email_status], ["failed", "failed"]);
    equal(buyerEmails(w).length, 0);
    equal(w.emails.filter((e) => e.to === "hello@migratelens.com").length, 1);
    equal(w.pdfCalls.length, 0);
  },
);

Deno.test(
  "the retry schedule: 5, 15, 60 minutes then daily; resets at 00:05 UTC",
  () => {
    const t = Date.UTC(2026, 10, 25, 0, 1);
    equal(
      [0, 1, 2, 3, 9].map((n) => (backoff(n, t) - t) / MINUTE),
      [5, 15, 60, 1440, 1440],
    );
    equal(nextReset(t), Date.UTC(2026, 10, 25, 0, 5));
    equal(
      nextReset(Date.UTC(2026, 10, 25, 0, 5)),
      Date.UTC(2026, 10, 26, 0, 5),
    );
    equal(
      nextReset(Date.UTC(2026, 11, 31, 23, 59)),
      Date.UTC(2027, 0, 1, 0, 5),
    );
  },
);
