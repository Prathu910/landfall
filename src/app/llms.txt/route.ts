import { occupationIndex } from "../../components/data/occupation-index";
import { loadManifest } from "../../lib/data/load-server";
import { buildLlmsTxt } from "../../lib/seo/llms-txt";
import { listRecapMonths } from "../../lib/updates/load-server";

export const dynamic = "force-static";

export function GET(): Response {
  const months = [...listRecapMonths()].sort();
  const text = buildLlmsTxt({
    asAt: loadManifest().asAt,
    occupationCount: occupationIndex.filter((e) => e.hasData).length,
    latestRecap: months.at(-1) ?? null,
  });
  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
