import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const expectedAssets = new Set([
  "index.html",
  "app.js",
  "styles.css",
]);

let entries = [];

try {
  entries = await readdir(dist, { withFileTypes: true });
} catch (error) {
  console.error(`Unable to read static artifact directory: ${path.relative(root, dist)}`);
  console.error(error.message);
  process.exitCode = 1;
}

const actualAssets = entries
  .map((entry) => entry.name)
  .filter((name) => name !== ".DS_Store")
  .sort();

const missingAssets = [...expectedAssets].filter((asset) => !actualAssets.includes(asset));
const extraAssets = actualAssets.filter((asset) => !expectedAssets.has(asset));
const nonFileAssets = entries
  .filter((entry) => expectedAssets.has(entry.name) && !entry.isFile())
  .map((entry) => entry.name);
const emptyAssets = [];

for (const asset of expectedAssets) {
  if (missingAssets.includes(asset)) continue;

  const assetStat = await stat(path.join(dist, asset));
  if (assetStat.size === 0) {
    emptyAssets.push(asset);
  }
}

if (missingAssets.length || extraAssets.length || nonFileAssets.length || emptyAssets.length) {
  if (missingAssets.length) console.error(`Missing runtime assets: ${missingAssets.join(", ")}`);
  if (extraAssets.length) console.error(`Unexpected runtime assets: ${extraAssets.join(", ")}`);
  if (nonFileAssets.length) console.error(`Runtime assets must be files: ${nonFileAssets.join(", ")}`);
  if (emptyAssets.length) console.error(`Runtime assets are empty: ${emptyAssets.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`Verified DeerRecall static artifact: ${actualAssets.join(", ")}`);
}
