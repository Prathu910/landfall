import { liveDeps } from "../_shared/report/endpoint.ts";
import { reviseHandler } from "../_shared/report/handlers.ts";
Deno.serve(reviseHandler(liveDeps()));
