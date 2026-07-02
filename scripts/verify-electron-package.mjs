import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const requireFromRoot = createRequire(path.join(root, "package.json"));
const asar = requireFromRoot("@electron/asar");
const appRoot = path.join(root, "release", "electron", "mac-arm64", "DeerRecall.app");
const resourcesDir = path.join(appRoot, "Contents", "Resources");
const appAsar = path.join(resourcesDir, "app.asar");
const nativeCanvasBinary = path.join(
  resourcesDir,
  "app.asar.unpacked",
  "node_modules",
  "@napi-rs",
  "canvas-darwin-arm64",
  "skia.darwin-arm64.node",
);

const requiredAsarEntries = [
  "/package.json",
  "/desktop/main.cjs",
  "/desktop/preload.cjs",
  "/desktop/resume-parser.cjs",
  "/server/llm-gateway.mjs",
  "/dist/index.html",
  "/dist/styles.css",
  "/dist/motion.js",
  "/dist/app-runtime.js",
  "/dist/deersearch-engine-runtime.js",
  "/dist/vendor/gsap.min.js",
  "/dist/vendor/Flip.min.js",
  "/node_modules/mammoth/package.json",
  "/node_modules/pdf-parse/package.json",
];

function assertExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} missing: ${path.relative(root, filePath)}`);
  }
}

function assertCurrentTarget() {
  if (process.platform !== "darwin" || process.arch !== "arm64") {
    throw new Error("Electron package verification currently expects a macOS arm64 build host.");
  }
}

assertCurrentTarget();
assertExists(appRoot, "Electron app");
assertExists(appAsar, "Electron app.asar");
assertExists(nativeCanvasBinary, "native PDF canvas binary");

const packagedFiles = new Set(asar.listPackage(appAsar));
const missingEntries = requiredAsarEntries.filter((entry) => !packagedFiles.has(entry));
if (missingEntries.length) {
  throw new Error(`Electron app.asar is missing required entries: ${missingEntries.join(", ")}`);
}

console.log("Electron package verified");
