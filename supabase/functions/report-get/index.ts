import { liveDeps } from "../_shared/report/endpoint.ts";
import { getHandler } from "../_shared/report/handlers.ts";
Deno.serve(getHandler(liveDeps()));
