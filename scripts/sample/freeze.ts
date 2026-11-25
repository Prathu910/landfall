/**
 * Writes the 2026-10 core and detail records of the /sample/ occupations to
 * src/data/sample/2026-10/, regenerated in memory from data/raw/. /sample/
 * reads only these, so monthly imports never change it. Run it only when the
 * founder asks for the sample to be refreshed.
 */
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  isOccupationCore,
  isOccupationDetail,
} from "../../src/lib/data/guards";
import { SAMPLE_CODES } from "../../src/lib/outlook/examples";
import { writeFileAtomic } from "../import/atomic-write";
import { generateFrozenSnapshot } from "../import/frozen-snapshot";
import { readRoundsFile } from "../import/generate-rounds";

const OUT_DIR = join("src", "data", "sample", "2026-10");

function main(): void {
  const data = generateFrozenSnapshot(
    "data/raw",
    readRoundsFile(JSON.parse(readFileSync("src/data/rounds.json", "utf8"))),
  );
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
  const write = (name: string, value: unknown) =>
    writeFileAtomic(join(OUT_DIR, name), JSON.stringify(value));
  for (const code of SAMPLE_CODES) {
    const core = data.cores.find((o) => o.code === code);
    const detail = data.details.find((o) => o.code === code);
    if (!isOccupationCore(core)) {
      throw new Error(`No valid 2026-10 core for sample occupation ${code}`);
    }
    if (!isOccupationDetail(detail)) {
      throw new Error(`No valid 2026-10 detail for sample occupation ${code}`);
    }
    write(`${code}.json`, core);
    write(`${code}.detail.json`, detail);
  }
  const { snapshotId, asAt, checkedAt, sources } = data.manifest;
  write("meta.json", { snapshotId, asAt, checkedAt, sources });
  console.log(`Froze ${SAMPLE_CODES.length} sample occupations in ${OUT_DIR}`);
}

main();
