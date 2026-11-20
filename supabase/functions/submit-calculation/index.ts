import { createHandler } from "../_shared/handler.ts";
Deno.serve(
  createHandler("calculation", { env: (name) => Deno.env.get(name), fetch }),
);
