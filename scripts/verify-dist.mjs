import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const expectedRuntimeAssets = new Set([
  "index.html",
  "deersearch-engine.js",
  "app.js",
  "motion.js",
  "styles.css",
  "vendor/gsap.min.js",
  "vendor/Flip.min.js",
]);

const expectedRuntimeDirectories = new Set(["vendor"]);

async function listRuntimeEntries(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  const directories = [];
  const nonFileAssets = [];

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;

    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      directories.push(relativePath);
      const nested = await listRuntimeEntries(fullPath, relativePath);
      files.push(...nested.files);
      directories.push(...nested.directories);
      nonFileAssets.push(...nested.nonFileAssets);
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      nonFileAssets.push(relativePath);
    }
  }

  return { files, directories, nonFileAssets };
}

let runtimeEntries = { files: [], directories: [], nonFileAssets: [] };
try {
  runtimeEntries = await listRuntimeEntries(dist);
} catch (error) {
  console.error(`Unable to read static artifact directory: ${path.relative(root, dist)}`);
  console.error(error.message);
  process.exitCode = 1;
}

const actualRuntimeAssets = runtimeEntries.files.sort();
const actualRuntimeDirectories = runtimeEntries.directories.sort();
const specialNonFileAssets = runtimeEntries.nonFileAssets.sort();

const missingAssets = [...expectedRuntimeAssets].filter((asset) => !actualRuntimeAssets.includes(asset));
const extraAssets = [
  ...actualRuntimeAssets.filter((asset) => !expectedRuntimeAssets.has(asset)),
  ...actualRuntimeDirectories.filter(
    (asset) => !expectedRuntimeDirectories.has(asset) && !expectedRuntimeAssets.has(asset),
  ),
  ...specialNonFileAssets.filter((asset) => !expectedRuntimeAssets.has(asset)),
].sort();
const nonFileAssets = [
  ...actualRuntimeDirectories.filter((asset) => expectedRuntimeAssets.has(asset)),
  ...specialNonFileAssets.filter((asset) => expectedRuntimeAssets.has(asset)),
].sort();
const emptyAssets = [];

for (const asset of expectedRuntimeAssets) {
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
  console.log(`Verified DeerRecall static artifact: ${actualRuntimeAssets.join(", ")}`);
}
