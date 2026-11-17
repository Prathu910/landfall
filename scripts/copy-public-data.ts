import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "src", "data", "occupations");
const target = path.join(root, "public", "data", "occupations");

if (!existsSync(source)) {
  console.error(`copy-public-data: missing ${source}`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.log(`copy-public-data: copied ${source} -> ${target}`);
