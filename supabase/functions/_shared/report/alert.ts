// A plain operational email to the founder. It names only order ids,
// payment ids or report numbers: never an email address, a profile or a
// link token. Best effort: a failed alert never fails the caller.

import { SELLER } from "../../../../src/lib/orders/seller.ts";
import { type Deps, setting } from "./endpoint.ts";
import { sendEmail } from "./resend.ts";

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendAlert(
  deps: Deps,
  subject: string,
  text: string,
  idempotencyKey: string,
): Promise<boolean> {
  try {
    const sent = await sendEmail(
      {
        apiKey: setting(deps, "RESEND_API_KEY"),
        from: setting(deps, "REPORT_EMAIL_FROM"),
      },
      {
        to: SELLER.email,
        subject: `[MigrateLens] ${subject}`,
        text,
        html: `<p>${escape(text)}</p>`,
        idempotencyKey,
      },
      deps.fetch,
    );
    return sent.ok;
  } catch {
    return false;
  }
}
