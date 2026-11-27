import { validEmail } from "../../lib/submissions/contract";
export type SubmissionConfig = {
  url: string;
  siteKey: string;
  privacyEmail: string;
};
/** The Supabase project URL: https, or http on this machine; null otherwise. */
export function supabaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  try {
    const parsed = new URL(url);
    const local =
      parsed.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(parsed.hostname);
    if ((parsed.protocol !== "https:" && !local) || parsed.pathname !== "/")
      return null;
    return url;
  } catch {
    return null;
  }
}

export function configuredSubmissions(): SubmissionConfig | null {
  const url = supabaseUrl();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const privacyEmail = process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? "";
  if (!url || !siteKey || !validEmail(privacyEmail)) return null;
  return { url, siteKey, privacyEmail };
}

/** The checkout needs the Functions and Turnstile, nothing else. */
export function checkoutConfig(): { url: string; siteKey: string } | null {
  const url = supabaseUrl();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  return url && siteKey ? { url, siteKey } : null;
}

/** Second of the two switches for the AI "Our read"; off unless exactly "true". */
export const readEnabled = process.env.NEXT_PUBLIC_READ_ENABLED === "true";
