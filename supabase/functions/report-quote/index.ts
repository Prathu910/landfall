import { liveDeps } from "../_shared/report/endpoint.ts";
import { quoteHandler } from "../_shared/report/handlers.ts";
Deno.serve(quoteHandler(liveDeps()));
