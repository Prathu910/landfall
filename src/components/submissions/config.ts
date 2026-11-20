import { validEmail } from "@/lib/submissions/contract";
export type SubmissionConfig = {
  url: string;
  siteKey: string;
  privacyEmail: string;
};
export function configuredSubmissions(): SubmissionConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const privacyEmail = process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? "";
  try {
    const parsed = new URL(url);
    if (
      (parsed.protocol !== "https:" &&
        !(
          parsed.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(parsed.hostname)
        )) ||
      parsed.pathname !== "/" ||
      !siteKey ||
      !validEmail(privacyEmail)
    )
      return null;
    return { url, siteKey, privacyEmail };
  } catch {
    return null;
  }
}
