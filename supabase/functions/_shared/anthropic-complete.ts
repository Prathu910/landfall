import Anthropic from "npm:@anthropic-ai/sdk@1.12.0";
import type { ReportFacts } from "../../../src/lib/outlook/read-contract.ts";
import { ReadTimeoutError, type Complete, type ReadConfig } from "./read.ts";

// Matches the reader's page, which stops waiting after 6 seconds, so no call
// runs (and bills) after nobody will see it. No retries keeps it inside that.
const TIMEOUT_MS = 6_000;
// Models with server-side refusal fallback. Haiku 5.5 has none, so it gets
// neither the beta nor the parameter.
const FALLBACK_MODELS: readonly string[] = [
  "claude-opus-5-5",
  "claude-sonnet-5-5",
  "claude-fable-5-2",
];

type Params = Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;

export function requestParams(
  system: string,
  facts: ReportFacts,
  config: Extract<ReadConfig, { enabled: true }>,
): Params {
  const params: Params = {
    model: config.model,
    max_tokens: config.maxTokens,
    output_config: { effort: "low" },
    system,
    messages: [{ role: "user", content: JSON.stringify(facts) }],
  };
  if (!FALLBACK_MODELS.includes(config.model)) return params;
  return {
    ...params,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  };
}

/** Production Complete: the official SDK, with server-side refusal fallback where the model has it. */
export const anthropicComplete: Complete = async (system, facts, config) => {
  const client = new Anthropic({
    apiKey: config.apiKey,
    timeout: TIMEOUT_MS,
    maxRetries: 0,
  });
  try {
    const message = await client.beta.messages.create(
      requestParams(system, facts, config),
    );
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
