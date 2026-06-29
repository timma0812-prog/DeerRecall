const crypto = require("node:crypto");
const fsp = require("node:fs/promises");
const path = require("node:path");

function sanitizePathSegment(segment) {
  const cleaned = String(segment || "")
    .replace(/[\u0000-\u001f<>:"|?*]/g, "_")
    .trim();
  return (cleaned || "untitled").slice(0, 160);
}

function normalizeRelativePath(relativePath, fallbackName = "resume") {
  const rawPath = String(relativePath || fallbackName || "resume");
  const segments = rawPath
    .split(/[\\/]+/)
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .map(sanitizePathSegment);
  return path.join(...(segments.length ? segments : [sanitizePathSegment(fallbackName)]));
}

function toBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  if (typeof value === "string") return Buffer.from(value);
  return null;
}

function makeUniquePath(filePath, usedPaths) {
  let candidate = filePath;
  const extension = path.extname(filePath);
  const base = filePath.slice(0, filePath.length - extension.length);
  let index = 1;
  while (usedPaths.has(candidate)) {
    candidate = `${base}-${index}${extension}`;
    index += 1;
  }
  usedPaths.add(candidate);
  return candidate;
}

async function writeDroppedFilesToFolder({ files, storageRoot, importId }) {
  if (!Array.isArray(files) || !files.length) throw new Error("files is required");
  if (!storageRoot) throw new Error("storageRoot is required");

  const resolvedStorageRoot = path.resolve(storageRoot);
  const resolvedImportId = sanitizePathSegment(importId || `drop_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`);
  const rootPath = path.join(resolvedStorageRoot, resolvedImportId);
  const usedPaths = new Set();
  const paths = [];

  await fsp.mkdir(rootPath, { recursive: true });

  for (const [index, file] of files.entries()) {
    const buffer = toBuffer(file?.buffer);
    if (!buffer) continue;

    const fallbackName = file?.name || `resume-${index + 1}`;
    const relativePath = normalizeRelativePath(file?.relativePath || file?.webkitRelativePath || fallbackName, fallbackName);
    const destinationPath = makeUniquePath(path.resolve(rootPath, relativePath), usedPaths);
    if (destinationPath !== rootPath && !destinationPath.startsWith(`${rootPath}${path.sep}`)) continue;

    await fsp.mkdir(path.dirname(destinationPath), { recursive: true });
    await fsp.writeFile(destinationPath, buffer);
    paths.push(destinationPath);
  }

  return { rootPath, paths };
}

module.exports = {
  normalizeRelativePath,
  writeDroppedFilesToFolder,
};
