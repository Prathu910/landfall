/**
 * The paid report's emails: pure templates, each an HTML and a plain-text
 * version. Email clients ignore stylesheets and CSS custom properties, so the
 * HTML is one table with inline styles and literal colours (the light check
 * palette, mirrored by a test). Imports carry `.ts` so Deno can load them.
 */
import { CODE_TTL_MINUTES, type Currency } from "./contract.ts";
import { NOT_ADVICE, SELLER, SELLER_LINE } from "./seller.ts";

export type Email = { subject: string; html: string; text: string };

/** `CHECK_PALETTE`'s light values; emails.test.ts keeps them in step. */
export const EMAIL_COLOURS = {
  ink: "#12202c",
  muted: "#52616a",
  sage: "#eef2f0",
  paper: "#ffffff",
  line: "#d5ded8",
  green: "#3b6551",
} as const;

const REFUND = `7-day no-questions refund: reply or write to ${SELLER.email}`;
const FONT = "Arial, Helvetica, sans-serif";
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type Block =
  | { kind: "p"; text: string }
  | { kind: "code"; code: string }
  | { kind: "button"; label: string; href: string }
  | { kind: "rows"; title: string; rows: [string, string][] };

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function blockText(block: Block): string {
  switch (block.kind) {
    case "p":
      return block.text;
    case "code":
      return block.code;
    case "button":
      return `${block.label}: ${block.href}`;
    case "rows":
      return [block.title, ...block.rows.map(([k, v]) => `${k}: ${v}`)].join(
        "\n",
      );
  }
}

function blockHtml(block: Block): string {
  const c = EMAIL_COLOURS;
  switch (block.kind) {
    case "p":
      return `<p style="margin:0 0 16px;font:16px/1.5 ${FONT};color:${c.ink}">${escape(block.text)}</p>`;
    case "code":
      return `<p style="margin:0 0 16px;font:bold 32px/1.2 ${FONT};letter-spacing:6px;color:${c.ink}">${escape(block.code)}</p>`;
    case "button":
      return `<p style="margin:0 0 20px"><a href="${escape(block.href)}" style="display:inline-block;padding:12px 20px;border-radius:6px;background:${c.green};color:${c.paper};font:bold 16px/1.2 ${FONT};text-decoration:none">${escape(block.label)}</a></p>`;
    case "rows": {
      const rows = block.rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 0;border-top:1px solid ${c.line};font:14px/1.4 ${FONT};color:${c.muted}">${escape(k)}</td><td style="padding:6px 0;border-top:1px solid ${c.line};font:14px/1.4 ${FONT};color:${c.ink};text-align:right">${escape(v)}</td></tr>`,
        )
        .join("");
      return `<p style="margin:8px 0 4px;font:bold 14px/1.4 ${FONT};color:${c.ink}">${escape(block.title)}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:collapse">${rows}</table>`;
    }
  }
}

const FOOTER = [NOT_ADVICE, REFUND, SELLER_LINE];

function compose(subject: string, heading: string, blocks: Block[]): Email {
  const c = EMAIL_COLOURS;
  const text = [heading, ...blocks.map(blockText), "--", ...FOOTER].join(
    "\n\n",
  );
  const footer = FOOTER.map(
    (line) =>
      `<p style="margin:0 0 6px;font:13px/1.5 ${FONT};color:${c.muted}">${escape(line)}</p>`,
  ).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(subject)}</title></head><body style="margin:0;padding:0;background:${c.sage}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.sage}"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${c.paper};border:1px solid ${c.line};border-radius:8px"><tr><td style="padding:28px 24px"><p style="margin:0 0 20px;font:bold 15px/1.2 ${FONT};letter-spacing:1px;color:${c.green}">${escape(SELLER.name)}</p><h1 style="margin:0 0 16px;font:bold 22px/1.3 ${FONT};color:${c.ink}">${escape(heading)}</h1>${blocks.map(blockHtml).join("")}</td></tr><tr><td style="padding:16px 24px 24px;border-top:1px solid ${c.line}">${footer}</td></tr></table></td></tr></table></body></html>`;
  return { subject, html, text };
}

/** Smallest unit to display: 69900 INR is "₹699", 1450 USD is "US$14.50". */
function money(amount: number, currency: Currency): string {
  const major = amount / 100;
  const value = Number.isInteger(major) ? String(major) : major.toFixed(2);
  return currency === "INR" ? `₹${value}` : `US$${value}`;
}

/** An ISO timestamp as a UTC date: "25 Nov 2026". */
function day(iso: string): string {
  const date = new Date(iso);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function codeEmail({ code }: { code: string }): Email {
  return compose(`Your MigrateLens code: ${code}`, "Your Founding 100 code", [
    { kind: "code", code },
    {
      kind: "p",
      text: `Type it on the checkout page to claim your free PR report. It expires in ${CODE_TTL_MINUTES} minutes.`,
    },
    {
      kind: "p",
      text: "Didn't ask for it? Ignore this email: nothing happens without the code.",
    },
  ]);
}

export type ReportEmailInput = {
  name: string;
  reportNo: string;
  link: string;
  /** ISO timestamp of the first issue. */
  issuedAt: string;
  /** Smallest unit; 0 for a Founding 100 report. */
  amount: number;
  currency: Currency;
  /** Null for a Founding 100 report. */
  paymentId: string | null;
  pdfAttached: boolean;
};

export function reportEmail(input: ReportEmailInput): Email {
  const name = input.name.trim();
  const rows: [string, string][] = [
    ["Report number", input.reportNo],
    ["Item", "MigrateLens PR report"],
    [
      "Amount",
      input.amount === 0
        ? "Free (Founding 100 place)"
        : `${money(input.amount, input.currency)} (${input.currency})`,
    ],
    ["Date", day(input.issuedAt)],
  ];
  if (input.paymentId) rows.push(["Payment ID", input.paymentId]);
  return compose(
    `Your MigrateLens PR report ${input.reportNo}`,
    name ? `Your PR report is ready, ${name}.` : "Your PR report is ready.",
    [
      {
        kind: "p",
        text: "Read it online at any time with your private link. Keep the link to yourself: anyone who has it can read your report.",
      },
      { kind: "button", label: "Read my report", href: input.link },
      {
        kind: "p",
        text: input.pdfAttached
          ? "The PDF is attached to this email."
          : "Your PDF will follow in a separate email.",
      },
      {
        kind: "p",
        text: "Within 7 days of issue you can correct your answers from the report page.",
      },
      { kind: "rows", title: "Receipt (not a tax invoice)", rows },
    ],
  );
}

export function pdfFollowEmail(input: {
  reportNo: string;
  link: string;
}): Email {
  return compose(
    `The PDF of your PR report ${input.reportNo}`,
    "Here is your report as a PDF.",
    [
      {
        kind: "p",
        text: `The PDF of report ${input.reportNo} is attached. Your private link still opens it online:`,
      },
      { kind: "button", label: "Read my report", href: input.link },
    ],
  );
}

export function revisedEmail(input: {
  reportNo: string;
  version: number;
  link: string;
  /** Whether the new PDF rides along; otherwise it follows. */
  pdfAttached?: boolean;
}): Email {
  return compose(
    `Your PR report ${input.reportNo} is updated (version ${input.version})`,
    `Version ${input.version} of your report is ready.`,
    [
      {
        kind: "p",
        text: `It is built from your corrected answers and the same data month as before, and replaces the earlier version under the same link and report number, now as version ${input.version}.`,
      },
      { kind: "button", label: "Read my report", href: input.link },
      {
        kind: "p",
        text: input.pdfAttached
          ? "The updated PDF is attached to this email."
          : "The updated PDF will follow in a separate email.",
      },
    ],
  );
}
