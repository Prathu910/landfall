import type { OccupationCore } from "@/lib/data/types";
import { TRY_IT_POINTS, buildTryIt } from "@/lib/home/try-it";
import { OccupationCheck } from "./occupation-check";

/** Project the existing calculations to only the fields this client leaf renders. */
export function OccupationCheckPanel({ core }: { core: OccupationCore }) {
  const previews = TRY_IT_POINTS.map((points) => {
    const view = buildTryIt(core, points);
    if (view.kind === "none") return { points, view };
    const { kind, higher, same, note, source } = view;
    return { points, view: { kind, higher, same, note, source } };
  });
  return (
    <OccupationCheck code={core.code} name={core.name} previews={previews} />
  );
}
