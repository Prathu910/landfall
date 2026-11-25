// Called only by pg_cron (supabase/cron/20261125000300_report_delivery.sql)
// with the x-deliver-secret header; no browser origin.
import { liveDeps } from "../_shared/report/endpoint.ts";
import { deliverHandler } from "../_shared/report/handlers.ts";
Deno.serve(deliverHandler(liveDeps()));
