// Razorpay calls this server to server: no origin allowlist, the
// X-Razorpay-Signature over the raw body is the authentication.
import { liveDeps } from "../_shared/report/endpoint.ts";
import { webhookHandler } from "../_shared/report/handlers.ts";
Deno.serve(webhookHandler(liveDeps()));
