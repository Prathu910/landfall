import type { OccupationCore } from "@/lib/data/types";
import { TRY_IT_POINTS, buildTryIt } from "@/lib/home/try-it";
import { OccupationCheck } from "./occupation-check";

/** Project the existing calculations to only the fields this client leaf renders. */
export function OccupationCheckPanel({
  core,
  listed189,
  figuresFrom,
}: {
  core: OccupationCore;
  /** The federal list's 189 flag; null when it can't be read. */
  listed189: boolean | null;
  /** The data month, for an occupation that has dropped out of the data. */
  figuresFrom?: string;
}) {
  const previews = TRY_IT_POINTS.map((points) => {
    const view = buildTryIt(core, points, listed189);
    if (view.kind === "none") return { points, view };
    const { kind, higher, same, note, source } = view;
    return { points, view: { kind, higher, same, note, source } };
  });
  return (
    <OccupationCheck
      code={core.code}
      name={core.name}
      previews={previews}
      figuresFrom={figuresFrom}
    />
  );
}
