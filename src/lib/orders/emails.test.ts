import { describe, expect, it } from "vitest";
import { CHECK_PALETTE } from "../brand/palette";
import { BANNED_COPY } from "../report/copy";
import {
  codeEmail,
  EMAIL_COLOURS,
  pdfFollowEmail,
  reportEmail,
  revisedEmail,
} from "./emails";

const link = "https://migratelens.com/report/#" + "A".repeat(43);
const paid = {
  name: "Aarav",
  reportNo: "ML-2611-0007",
  link,
  issuedAt: "2026-11-25T08:30:00Z",
  amount: 69900,
  currency: "INR" as const,
  paymentId: "pay_TEST1",
  pdfAttached: true,
};
const all = {
  code: codeEmail({ code: "042917" }),
  report: reportEmail(paid),
  reportNoPdf: reportEmail({ ...paid, pdfAttached: false }),
  founding: reportEmail({ ...paid, amount: 0, paymentId: null }),
  usd: reportEmail({ ...paid, amount: 1400, currency: "USD" }),
  pdfFollow: pdfFollowEmail({ reportNo: paid.reportNo, link }),
  revised: revisedEmail({ reportNo: paid.reportNo, version: 2, link }),
};
const visible = (html: string) => html.replace(/<[^>]+>/g, " ");

describe("email copy sweep", () => {
  for (const [name, email] of Object.entries(all)) {
    it(`${name}: no banned copy, contact, refund, not-advice and seller lines`, () => {
      for (const part of [email.subject, email.text, visible(email.html)]) {
        expect(part).not.toMatch(BANNED_COPY);
      }
      for (const part of [email.text, email.html]) {
        expect(part).toContain("hello@migratelens.com");
        expect(part).toContain("not migration advice");
        expect(part).toContain(
          "7-day no-questions refund: reply or write to hello@migratelens.com",
        );
        expect(part).toContain("MigrateLens, Ahmedabad, India");
      }
    });
  }
});

describe("codeEmail", () => {
  it("puts the code in the subject and body, with its expiry", () => {
    expect(all.code.subject).toContain("042917");
    expect(all.code.text).toContain("042917");
    expect(all.code.html).toContain("042917");
    expect(all.code.text).toContain("10 minutes");
  });
});

describe("reportEmail", () => {
  it("carries the link, the report number and the receipt", () => {
    const { text, html, subject } = all.report;
    expect(subject).toContain("ML-2611-0007");
    expect(text).toContain(link);
    expect(html).toContain(`href="${link}"`);
    expect(text).toContain("₹699");
    expect(text).toContain("pay_TEST1");
    expect(text).toContain("25 Nov 2026");
    expect(text).toMatch(/PDF is attached/);
  });
  it("says the PDF will follow when it isn't attached", () => {
    expect(all.reportNoPdf.text).toMatch(/PDF will follow/);
    expect(visible(all.reportNoPdf.html)).toMatch(/PDF will follow/);
    expect(all.reportNoPdf.text).not.toMatch(/PDF is attached/);
  });
  it("shows a founding report as free, without a payment id", () => {
    expect(all.founding.text).toContain("Founding 100");
    expect(all.founding.text).toMatch(/free/i);
    expect(all.founding.text).not.toContain("pay_");
  });
  it("formats US dollars", () => {
    expect(all.usd.text).toContain("US$14");
  });
  it("escapes the reader's name in the HTML", () => {
    const html = reportEmail({ ...paid, name: '<b>"A&B"</b>' }).html;
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;&quot;A&amp;B&quot;&lt;/b&gt;");
  });
});

describe("pdfFollowEmail and revisedEmail", () => {
  it("name the report and link it", () => {
    expect(all.pdfFollow.subject).toContain("ML-2611-0007");
    expect(all.pdfFollow.text).toContain(link);
    expect(all.revised.subject).toContain("ML-2611-0007");
    expect(all.revised.text).toContain("version 2");
    expect(all.revised.text).toContain(link);
  });
});

describe("EMAIL_COLOURS", () => {
  it("are the light check palette's values", () => {
    for (const [key, value] of Object.entries(EMAIL_COLOURS)) {
      expect(value).toBe(CHECK_PALETTE[key as keyof typeof CHECK_PALETTE]);
    }
  });
});
