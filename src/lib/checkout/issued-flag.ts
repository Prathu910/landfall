/**
 * The "just issued" mark the checkout leaves in sessionStorage for /report/,
 * so the issued moment plays once, on arrival from the checkout. The checkout
 * knows only the link token, never the report number, so the key carries a
 * short digest of the token: the token itself is never stored.
 */
export const ISSUED_PREFIX = "ml-issued-";

export async function issuedFlagKey(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const hex = Array.from(digest.slice(0, 8), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return `${ISSUED_PREFIX}${hex}`;
}
