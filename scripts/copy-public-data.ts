import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stateRuleData } from "../src/components/data/state-rule-data";

const root = process.cwd();
const dataDir = path.join(root, "src", "data");
const source = path.join(dataDir, "occupations");
const publicData = path.join(root, "public", "data");
const target = path.join(publicData, "occupations");

if (!existsSync(source)) {
  console.error(`copy-public-data: missing ${source}`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.log(`copy-public-data: copied ${source} -> ${target}`);

// The server report engine fetches the month's manifest, index and state rules
// from the site, so a monthly deploy moves it without redeploying the function.
for (const file of ["manifest.json", "occupation-index.json"]) {
  cpSync(path.join(dataDir, file), path.join(publicData, file));
}
writeFileSync(
  path.join(publicData, "state-rules.json"),
  JSON.stringify(stateRuleData),
);
console.log(
  `copy-public-data: wrote manifest.json, occupation-index.json and state-rules.json to ${publicData}`,
);
