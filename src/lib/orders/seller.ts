/** Who sells the report: shown on receipts, emails and the legal pages. */
export const SELLER = {
  name: "MigrateLens",
  city: "Ahmedabad",
  country: "India",
  email: "hello@migratelens.com",
} as const;

/** On the checkout, the report page, every email and every legal page. */
export const NOT_ADVICE =
  "Information from published data, not migration advice.";

/** The seller line on the receipt, the emails and the legal pages. */
export const SELLER_LINE = `${SELLER.name}, ${SELLER.city}, ${SELLER.country} · ${SELLER.email}`;
