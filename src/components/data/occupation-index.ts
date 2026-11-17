import index from "../../data/occupation-index.json";
import type { OccupationIndexEntry } from "../../lib/data/types";

/**
 * Code, name and hasData for every occupation: the only multi-occupation data
 * a client component may import. A module-level constant, so its identity is
 * stable for `useOccupationCore`, whose effect depends on the index.
 */
export const occupationIndex: OccupationIndexEntry[] = index;
