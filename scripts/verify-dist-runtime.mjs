import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const expectedRuntimeAssets = new Set([
  "index.html",
  "deersearch-engine-runtime.js",
  "app-runtime.js",
  "motion.js",
  "styles.css",
  "vendor/gsap.min.js",
  "vendor/Flip.min.js",
]);

async function listRuntimeEntries(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listRuntimeEntries(fullPath, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      files.push(`${relativePath}__NON_FILE__`);
    }
  }

  return files.sort();
}

const actualRuntimeAssets = await listRuntimeEntries(dist);
const missingAssets = [...expectedRuntimeAssets].filter((asset) => !actualRuntimeAssets.includes(asset));
const extraAssets = actualRuntimeAssets.filter((asset) => !expectedRuntimeAssets.has(asset));
const nonFileAssets = actualRuntimeAssets.filter((asset) => asset.endsWith("__NON_FILE__"));

if (missingAssets.length || extraAssets.length || nonFileAssets.length) {
  console.error("Invalid dist runtime assets.");
  console.error("Missing:", missingAssets);
  console.error("Extra:", extraAssets);
  console.error("Non-files:", nonFileAssets);
  process.exitCode = 1;
} else {
  for (const asset of actualRuntimeAssets) {
    const info = await stat(path.join(dist, asset));
    if (!info.isFile() || info.size <= 0) {
      console.error(`Invalid dist asset: ${asset}`);
      process.exitCode = 1;
    }
  }
}

if (!process.exitCode) {
  console.log("dist runtime assets verified");
}
