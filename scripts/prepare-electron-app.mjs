import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const appDir = path.join(root, "release", "electron-app");
const runtimeDependencyNames = ["mammoth", "pdf-parse"];

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function getRuntimeDependencies(rootPackage) {
  return Object.fromEntries(
    runtimeDependencyNames.map((dependencyName) => [
      dependencyName,
      rootPackage.dependencies[dependencyName],
    ]),
  );
}

function installRuntimeDependencies(dependencies) {
  if (!Object.keys(dependencies).length) return;
  console.log(`Installing Electron runtime dependencies: ${Object.keys(dependencies).join(", ")}`);
  const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(
    npmExecutable,
    [
      "ci",
      "--omit=dev",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--prefer-offline",
    ],
    { cwd: appDir, stdio: "inherit" },
  );
}

function copyPath(fromRoot, toAppDir) {
  console.log(`Copying ${fromRoot}`);
  const source = path.join(root, fromRoot);
  const destination = path.join(appDir, toAppDir);
  mkdirSync(path.dirname(destination), { recursive: true });

  cpSync(source, destination, {
    recursive: true,
    force: true,
    filter: (src) => {
      const name = path.basename(src);
      if (name === ".DS_Store") return false;
      return true;
    },
  });
}

console.log(`Resetting ${path.relative(root, appDir)}`);
rmSync(appDir, { recursive: true, force: true });
mkdirSync(appDir, { recursive: true });

copyPath("desktop", "desktop");
copyPath("server/llm-gateway.mjs", "server/llm-gateway.mjs");
copyPath("dist", "dist");

const rootPackage = readJson(path.join(root, "package.json"));
const appPackage = {
  name: rootPackage.name,
  version: rootPackage.version,
  private: true,
  main: rootPackage.main,
  description: rootPackage.description,
  dependencies: getRuntimeDependencies(rootPackage),
};

writeFileSync(
  path.join(appDir, "package.json"),
  `${JSON.stringify(appPackage, null, 2)}\n`,
);

copyPath("package-lock.json", "package-lock.json");
installRuntimeDependencies(appPackage.dependencies);

console.log(`Prepared Electron app directory at ${path.relative(root, appDir)}`);
