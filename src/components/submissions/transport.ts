import type { SubmissionConfig } from "./config";
export type SubmissionReceipt = {
  id: string;
  /** Only a newly created calculation carries one; kept in memory by the caller. */
  readToken: string | null;
};

export async function sendSubmission(
  kind: "calculation" | "feedback",
  submission: { id: string },
  token: string,
  config: SubmissionConfig,
): Promise<SubmissionReceipt> {
  if (!token)
    throw new Error("Complete the spam verification before trying again.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${config.url}/functions/v1/submit-${kind}`, {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission, turnstile_token: token }),
      signal: controller.signal,
    });
    if (response.status !== 200 && response.status !== 201) {
      const messages: Record<number, string> = {
        400: "Please check your details and try again.",
        403: "Spam verification was not accepted. Please retry verification.",
        409: "This submission changed while it was being saved. Please try again.",
        413: "Your message is too long. Please shorten it and try again.",
        429: "Too many attempts. Please wait a little before trying again.",
      };
      throw new Error(
        messages[response.status] ??
          "Saving is temporarily unavailable. Your answers are still here; please try again.",
      );
    }
    let receipt: unknown;
    try {
      receipt = await response.json();
    } catch {
      receipt = null;
    }
    if (
      !receipt ||
      typeof receipt !== "object" ||
      !("id" in receipt) ||
      receipt.id !== submission.id
    )
      throw new Error(
        "We could not confirm your submission was saved. Please try again.",
      );
    const readToken =
      "read_token" in receipt && typeof receipt.read_token === "string"
        ? receipt.read_token
        : null;
    return { id: submission.id, readToken };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      throw new Error(
        "Saving timed out. Your answers are still here; please try again.",
      );
    if (error instanceof TypeError)
      throw new Error(
        "Check your connection and try again. Your answers are still here.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
