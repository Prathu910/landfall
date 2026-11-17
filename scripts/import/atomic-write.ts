import { existsSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

export type WriteFile = (path: string, text: string) => void;

const defaultWrite: WriteFile = (path, text) => writeFileSync(path, text);

/**
 * Writes `text` to a temp file beside `path`, then renames it into place. A
 * rename within one directory is atomic, so readers see the old file or the
 * whole new one, never a partial write.
 */
export function writeFileAtomic(
  path: string,
  text: string,
  writeFile: WriteFile = defaultWrite,
): void {
  const temp = join(
    dirname(path),
    `.${basename(path)}.${process.pid}.${Date.now()}.tmp`,
  );
  try {
    writeFile(temp, text);
    renameSync(temp, path);
  } catch (error) {
    if (existsSync(temp)) rmSync(temp);
    throw error;
  }
}
