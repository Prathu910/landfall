import Anthropic from "npm:@anthropic-ai/sdk@1.12.0";
import { ReadTimeoutError, type Complete } from "./read.ts";

// The reader's page gives up after 6 seconds; this bounds the cost of a slow
// call. No retries, so the whole call stays inside the timeout.
const TIMEOUT_MS = 8_000;

/** Production Complete: the official SDK, with server-side refusal fallback. */
export const anthropicComplete: Complete = async (system, facts, config) => {
  const client = new Anthropic({
    apiKey: config.apiKey,
    timeout: TIMEOUT_MS,
    maxRetries: 0,
  });
  try {
    const message = await client.beta.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system,
      messages: [{ role: "user", content: JSON.stringify(facts) }],
    });
    if (message.stop_reason === "refusal") return null;
    // A reply cut off by max_tokens may still pass checkRead mid-sentence.
    if (message.stop_reason !== "end_turn") return "";
    const block = message.content.find((item) => item.type === "text");
    return block?.type === "text" ? block.text : "";
  } catch (error) {
    if (error instanceof Anthropic.APIConnectionTimeoutError)
      throw new ReadTimeoutError();
    throw error;
  }
};
