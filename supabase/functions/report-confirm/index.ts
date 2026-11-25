import { liveDeps } from "../_shared/report/endpoint.ts";
import { confirmHandler } from "../_shared/report/handlers.ts";
Deno.serve(confirmHandler(liveDeps()));
