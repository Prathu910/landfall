import { liveDeps } from "../_shared/report/endpoint.ts";
import { orderHandler } from "../_shared/report/handlers.ts";
Deno.serve(orderHandler(liveDeps()));
