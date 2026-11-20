import { createHandler } from "../_shared/handler.ts";
Deno.serve(
  createHandler("feedback", { env: (name) => Deno.env.get(name), fetch }),
);
