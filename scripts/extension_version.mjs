import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const version = process.argv[2]?.trim();

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("Usage: node scripts/extension_version.mjs <major.minor.patch>");
  process.exit(1);
}

const root = process.cwd();
const packageJsonPath = path.join(root, "extension", "package.json");
const manifestPath = path.join(root, "extension", "manifest.json");

async function updateJson(filePath) {
  const data = JSON.parse(await readFile(filePath, "utf8"));
  data.version = version;
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

await Promise.all([
  updateJson(packageJsonPath),
  updateJson(manifestPath),
]);

console.log(`Updated extension version to ${version}`);
