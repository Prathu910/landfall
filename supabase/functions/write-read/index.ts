import { anthropicComplete } from "../_shared/anthropic-complete.ts";
import { createReadHandler } from "../_shared/read.ts";
Deno.serve(
  createReadHandler({
    env: (name) => Deno.env.get(name),
    complete: anthropicComplete,
    now: () => Date.now(),
  }),
);
