import { formatDate } from "../migration";
import { NOT_ADVICE, SELLER, SELLER_LINE } from "../orders/seller";

/**
 * The legal and contact pages, every paragraph as data (paid report spec,
 * "New and changed pages"). They are drafts for the founder's lawyer review:
 * set LEGAL_REVIEWED to true after it, which hides REVIEW_LINE.
 */
export const LEGAL_UPDATED = "2026-11-25";
export const LEGAL_REVIEWED = false;
export const REVIEW_LINE =
  "Drafted for review: check with your lawyer before relying on this.";
export { NOT_ADVICE, SELLER_LINE };

/** A paragraph, or one with a link inside it ("…see the {refund policy}."). */
export type LegalParagraph =
  | string
  | { before: string; link: { href: string; text: string }; after: string };
export type LegalSection = { heading: string; paragraphs: LegalParagraph[] };
export type LegalSlug =
  "terms" | "refunds" | "delivery" | "contact" | "privacy";
export type LegalPage = {
  slug: LegalSlug;
  title: string;
  /** The breadcrumb and footer name. */
  crumb: string;
  /** The search result snippet. */
  description: string;
  intro: string;
  sections: LegalSection[];
};

export const LEGAL_SLUGS: readonly LegalSlug[] = [
  "terms",
  "refunds",
  "delivery",
  "contact",
  "privacy",
];

const EMAIL = SELLER.email;
const PLACE = `${SELLER.city}, ${SELLER.country}`;
const OMARA = { href: "https://www.mara.gov.au/", text: "OMARA register" };

const terms: LegalPage = {
  slug: "terms",
  title: "Terms of sale",
  crumb: "Terms",
  description: `The terms for the MigrateLens personal PR report: what it is, prices, the Founding 100, corrections, access and the law that governs it.`,
  intro: `These terms cover the personal PR report sold by ${SELLER.name}, ${PLACE}. By claiming or paying for a report you agree to them.`,
  sections: [
    {
      heading: "What the report is",
      paragraphs: [
        "The personal PR report is a digital report built from your answers to the points check and from published SkillSelect and state program data. It covers your points, your outlook for the 189, 190 and 491 visas, the EOIs ahead of you, estimated waits, the state programs checked against you and ways to more points.",
        "It opens on screen as soon as it is issued and is sent to you by email as a PDF with a private link.",
      ],
    },
    {
      heading: "Information, not migration advice",
      paragraphs: [
        `${NOT_ADVICE} ${SELLER.name} is not a registered migration agent. The report does not assess your documents, confirm your eligibility for a visa or promise an invitation. Waits and paces are estimates computed from published history, and Home Affairs and the states can change their rules at any time.`,
        {
          before:
            "For advice on your own case, find a registered migration agent on the",
          link: OMARA,
          after: ".",
        },
      ],
    },
    {
      heading: "Prices and payment",
      paragraphs: [
        "The price is the one shown at checkout, in Indian rupees or US dollars, before you pay. It is a one-off payment with no subscription. Payments are processed by Razorpay; we never see your card or bank details.",
      ],
    },
    {
      heading: "Founding 100",
      paragraphs: [
        "Founding members get the same report free, while founding places last: one per email address. The count shown at checkout is the real number of places left. We confirm your email with a 6-digit code before the report is issued, and a place is yours once it is issued.",
        "We may change the number of founding places or end the offer at any time. A founding report already issued is not affected.",
      ],
    },
    {
      heading: "Corrections",
      paragraphs: [
        "For 7 days after issue you can correct your answers or answer the questions that sharpen your state outlook, up to 3 revisions. Each revision is a new version under the same link and report number, built from the same month of data as the first. After 7 days the report is final.",
      ],
    },
    {
      heading: "Access",
      paragraphs: [
        "You can read your report by its private link for 12 months from issue. Anyone with the link can open it, so keep it private. After 12 months the link says the report has expired.",
        "The report reflects the answers you gave. You are responsible for their accuracy.",
      ],
    },
    {
      heading: "Refunds and liability",
      paragraphs: [
        {
          before: "You can have a full refund within 7 days of issue, as our",
          link: { href: "/refunds/", text: "refund policy" },
          after: " explains.",
        },
        "As far as the law allows, our liability for a report is limited to the amount you paid for it.",
      ],
    },
    {
      heading: "Governing law",
      paragraphs: [
        "These terms are governed by the laws of India. The courts at Ahmedabad, Gujarat have jurisdiction over any dispute about them.",
      ],
    },
  ],
};

const refunds: LegalPage = {
  slug: "refunds",
  title: "Refund policy",
  crumb: "Refunds",
  description:
    "MigrateLens refunds the personal PR report in full within 7 days of issue, with no questions asked.",
  intro:
    "If the report isn't what you wanted, you can have your money back within 7 days, with no questions asked.",
  sections: [
    {
      heading: "7 days, no questions",
      paragraphs: [
        "You can ask for a full refund within 7 days of your report's issue date, for any reason. There are no questions to answer and no forms to fill in.",
      ],
    },
    {
      heading: "How to ask",
      paragraphs: [
        `Write to ${EMAIL} from the email address you used at checkout, and include your report number. It starts with ML and is on your report and your receipt email.`,
      ],
    },
    {
      heading: "What happens next",
      paragraphs: [
        "We refund the full amount to your original payment method through Razorpay. When your bank shows it depends on the bank and the payment method.",
        "Once the refund is processed, your report's private link stops working and says the report was refunded.",
      ],
    },
    {
      heading: "Founding reports and late requests",
      paragraphs: [
        "A founding report is free, so there is nothing to refund. You can still ask us to delete it at any time.",
        "After 7 days the report is final. If you paid and your report was never issued, write to us at any time and we will refund you in full.",
      ],
    },
  ],
};

const delivery: LegalPage = {
  slug: "delivery",
  title: "Delivery policy",
  crumb: "Delivery",
  description:
    "The MigrateLens personal PR report is delivered digitally: on screen at once, then by email with a PDF. Nothing is shipped.",
  intro:
    "The report is a digital product. It is delivered on screen and by email, and nothing is shipped.",
  sections: [
    {
      heading: "On screen at once",
      paragraphs: [
        "Your report opens on screen as soon as your payment is confirmed or your founding place is claimed, usually within seconds.",
      ],
    },
    {
      heading: "By email",
      paragraphs: [
        "An email with your report as a PDF and its private link follows within minutes, to the address you gave at checkout. If the PDF is delayed, the email with the link comes first and the PDF follows, at worst the next day.",
      ],
    },
    {
      heading: "No physical shipping",
      paragraphs: [
        "There is nothing to ship and no delivery charge. The report is available wherever you can open its link.",
      ],
    },
    {
      heading: "If it doesn't arrive",
      paragraphs: [
        `Check your spam folder first. Then write to ${EMAIL} with your report number or your payment ID, and we will send it again. Your report stays readable by its private link at all times.`,
      ],
    },
  ],
};

const contact: LegalPage = {
  slug: "contact",
  title: "Contact us",
  crumb: "Contact",
  description: `Contact MigrateLens at ${EMAIL} about your report, a refund, a correction or your data. We reply within 2 working days.`,
  intro: `Questions about your report, a refund or your data? Write to ${EMAIL}.`,
  sections: [
    {
      heading: "Email",
      paragraphs: [
        `${EMAIL} is our address for everything: your report, refunds, corrections, privacy and deletion requests. Include your report number if you have one.`,
      ],
    },
    {
      heading: "Where we are",
      paragraphs: [`${SELLER.name} is based in ${PLACE}. We work online only.`],
    },
    {
      heading: "When we reply",
      paragraphs: ["We reply within 2 working days."],
    },
    {
      heading: "What we can't help with",
      paragraphs: [
        {
          before: `${NOT_ADVICE} For advice on your own case, find a registered migration agent on the`,
          link: OMARA,
          after: ".",
        },
      ],
    },
  ],
};

const privacy: LegalPage = {
  slug: "privacy",
  title: "Privacy policy",
  crumb: "Privacy",
  description:
    "What MigrateLens collects, why, who processes it and how long we keep it: the free check, the paid report, payments and feedback.",
  intro:
    "What we collect, why, who processes it for us and how long we keep it.",
  sections: [
    {
      heading: "The free points check",
      paragraphs: [
        "Your full profile and points calculation stay in your browser. The free result, your points and your three visa stamps, is calculated on your device and sends us nothing.",
        "Your full answers are held in memory unless you enable “Save my progress on this device”. That option uses browser local storage and excludes your email. Anyone using the same browser may see locally saved answers. “Clear my answers” removes the browser copy.",
      ],
    },
    {
      heading: "When you claim or buy a report",
      paragraphs: [
        "To build your report we send your answers, your email and the currency you chose to our server. We store your email, your answers, the report built from them, its report number and the order. For a founding report we email you a 6-digit code to confirm your address.",
        "Razorpay processes your payment. Your card, UPI or bank details go to Razorpay, not to us; we receive the payment and order IDs, the amount, the currency and whether the payment succeeded.",
      ],
    },
    {
      heading: "Who processes it",
      paragraphs: [
        "Supabase runs our database and server functions. Razorpay processes payments. Cloudflare hosts the site, counts page visits with Web Analytics (no cookies, nothing that identifies you), checks forms for spam with Turnstile, and renders report PDFs. Resend sends our emails.",
        "Access is restricted to the site operator and these services. Hosting and security services may also process connection information and keep ordinary access logs.",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: [
        "Reports, the answers they were built from and your email are kept for 12 months from issue, then deleted. We keep a hashed copy of the link's key and the report's status, so an old link can say the report has expired. Order records (amount, currency, IDs, dates and email) are kept for as long as accounting law requires.",
        "Deletion from backup copies follows the hosting provider's backup retention.",
      ],
    },
    {
      heading: "Feedback and earlier submissions",
      paragraphs: [
        "Feedback stores your message and category, plus an email and calculation summary only if you choose to include them. Please do not include documents or sensitive identifiers. We may use an optional feedback email to respond to that message. An optional feedback-summary handoff uses session storage for up to 15 minutes and is removed when the feedback page reads it.",
        "Earlier versions of the points check asked for an email and a calculation summary (occupation, age band, whether you are in Australia, points totals and the data snapshot) before showing a report. We delete those submissions, and feedback, 180 days after they were submitted.",
      ],
    },
    {
      heading: "Your choices",
      paragraphs: [
        `Write to ${EMAIL} to see what we hold about you or to have it deleted. Deleting a report stops its link working. Clearing answers on your device does not delete records already sent to us.`,
        "Printing or saving your report creates a copy under your control. External source links have their own privacy policies.",
      ],
    },
  ],
};

export const LEGAL_PAGES: Record<LegalSlug, LegalPage> = {
  terms,
  refunds,
  delivery,
  contact,
  privacy,
};

/** Shown only while the AI-written summary is on (READ_ENABLED). */
export const AI_READ_PARAGRAPH =
  "When the AI-written summary is on, your computed results (not your answers, name, email or date of birth) are sent to Anthropic to write your summary. MigrateLens does not store them.";

/** The lines under every page's head: the date, and the review line until reviewed. */
export function legalNotices(reviewed: boolean = LEGAL_REVIEWED): string[] {
  const updated = `Last updated ${formatDate(LEGAL_UPDATED)}`;
  return reviewed ? [updated] : [updated, REVIEW_LINE];
}

function paragraphText(paragraph: LegalParagraph): string {
  if (typeof paragraph === "string") return paragraph;
  return `${paragraph.before} ${paragraph.link.text}${paragraph.after}`;
}

/** Every sentence a page shows, in order: what the copy tests read. */
export function legalPageText(page: LegalPage): string[] {
  return [
    page.title,
    page.intro,
    ...legalNotices(),
    ...page.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs.map(paragraphText),
    ]),
    NOT_ADVICE,
    SELLER_LINE,
  ];
}
