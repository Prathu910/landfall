import { liveDeps } from "../_shared/report/endpoint.ts";
import { verifyHandler } from "../_shared/report/handlers.ts";
Deno.serve(verifyHandler(liveDeps()));
