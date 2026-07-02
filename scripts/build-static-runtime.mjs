import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const assets = [
  "index.html",
  "deersearch-engine-runtime.js",
  "app-runtime.js",
  "motion.js",
  "styles.css",
  "vendor",
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const asset of assets) {
  await cp(path.join(root, asset), path.join(dist, asset), {
    recursive: true,
    filter: (src) => path.basename(src) !== ".DS_Store",
  });
}

console.log(`Built DeerRecall static artifact at ${path.relative(root, dist)}`);
